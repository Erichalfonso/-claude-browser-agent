// Workflow routes - Managing automation workflows

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  website: z.string().url()
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['learning', 'ready', 'active']).optional(),
  recordedActions: z.any().optional(),
  fieldMappings: z.any().optional(),
  successIndicators: z.any().optional()
});

// POST /api/workflows - Create new workflow (start AI learning)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createWorkflowSchema.parse(req.body);

    const workflow = await prisma.workflow.create({
      data: {
        ...data,
        userId: req.userId!,
        status: 'learning'
      }
    });

    res.status(201).json({
      success: true,
      data: { workflow }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create workflow'
    });
  }
});

// GET /api/workflows - List user's workflows
router.get('/', async (req: AuthRequest, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            listings: true,
            automationRuns: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { workflows }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflows'
    });
  }
});

// GET /api/workflows/:id - Get workflow details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const workflowId = parseInt(req.params.id);

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: req.userId
      },
      include: {
        automationRuns: {
          orderBy: { startedAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            listings: true
          }
        }
      }
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: { workflow }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflow'
    });
  }
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const data = updateWorkflowSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: req.userId
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data
    });

    res.json({
      success: true,
      data: { workflow }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update workflow'
    });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const workflowId = parseInt(req.params.id);

    // Verify ownership
    const existing = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: req.userId
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    await prisma.workflow.delete({
      where: { id: workflowId }
    });

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete workflow'
    });
  }
});

// POST /api/workflows/:id/finalize - Convert AI workflow to deterministic
router.post('/:id/finalize', async (req: AuthRequest, res) => {
  try {
    const workflowId = parseInt(req.params.id);

    // Verify ownership
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: req.userId
      }
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    if (workflow.status !== 'learning') {
      return res.status(400).json({
        success: false,
        error: 'Workflow is not in learning mode'
      });
    }

    if (!workflow.recordedActions || !workflow.fieldMappings) {
      return res.status(400).json({
        success: false,
        error: 'Workflow has no recorded actions or field mappings'
      });
    }

    // Update status to 'ready' (deterministic mode)
    const updated = await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: 'ready' }
    });

    res.json({
      success: true,
      data: { workflow: updated },
      message: 'Workflow is now ready for deterministic playback!'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to finalize workflow'
    });
  }
});

export default router;
