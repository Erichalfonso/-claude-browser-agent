// Automation routes - Running workflows on listings

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// POST /api/automation/start - Start automation run with workflow
router.post('/start', async (req: AuthRequest, res) => {
  try {
    const { workflowId, listingIds } = req.body;

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: 'workflowId is required'
      });
    }

    // Verify workflow ownership and status
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

    if (workflow.status !== 'ready' && workflow.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Workflow is not ready. Complete AI learning phase first.'
      });
    }

    // Get listings to process
    let listings;
    if (listingIds && listingIds.length > 0) {
      // Specific listings
      listings = await prisma.listing.findMany({
        where: {
          id: { in: listingIds },
          userId: req.userId,
          uploadStatus: 'pending'
        }
      });
    } else {
      // All pending listings for this workflow
      listings = await prisma.listing.findMany({
        where: {
          userId: req.userId,
          workflowId: workflowId,
          uploadStatus: 'pending'
        },
        take: 100 // Limit to 100 per run
      });
    }

    if (listings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending listings found'
      });
    }

    // Create automation run
    const automationRun = await prisma.automationRun.create({
      data: {
        userId: req.userId!,
        workflowId,
        runType: 'deterministic',
        status: 'running',
        totalListings: listings.length,
        successfulListings: 0,
        failedListings: 0
      }
    });

    // Mark workflow as active
    if (workflow.status === 'ready') {
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { status: 'active' }
      });
    }

    res.json({
      success: true,
      data: {
        automationRun,
        listingCount: listings.length,
        listingIds: listings.map(l => l.id)
      },
      message: `Started automation run for ${listings.length} listings`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start automation'
    });
  }
});

// GET /api/automation/runs - List automation runs
router.get('/runs', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [runs, total] = await Promise.all([
      prisma.automationRun.findMany({
        where: { userId: req.userId },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              website: true
            }
          }
        }
      }),
      prisma.automationRun.count({
        where: { userId: req.userId }
      })
    ]);

    res.json({
      success: true,
      data: {
        runs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch automation runs'
    });
  }
});

// GET /api/automation/runs/:id - Get run details
router.get('/runs/:id', async (req: AuthRequest, res) => {
  try {
    const runId = parseInt(req.params.id);

    const run = await prisma.automationRun.findFirst({
      where: {
        id: runId,
        userId: req.userId
      },
      include: {
        workflow: true
      }
    });

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Automation run not found'
      });
    }

    // Get associated listings
    const listings = await prisma.listing.findMany({
      where: {
        workflowId: run.workflowId,
        uploadedAt: {
          gte: run.startedAt,
          ...(run.completedAt && { lte: run.completedAt })
        }
      }
    });

    res.json({
      success: true,
      data: {
        run,
        listings
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch automation run'
    });
  }
});

// POST /api/automation/stop/:id - Stop running automation
router.post('/stop/:id', async (req: AuthRequest, res) => {
  try {
    const runId = parseInt(req.params.id);

    const run = await prisma.automationRun.findFirst({
      where: {
        id: runId,
        userId: req.userId
      }
    });

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Automation run not found'
      });
    }

    if (run.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Automation run is not running'
      });
    }

    // Update status to completed (stopped by user)
    const updated = await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorLog: {
          message: 'Stopped by user',
          timestamp: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      data: { run: updated },
      message: 'Automation run stopped'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop automation'
    });
  }
});

// POST /api/automation/update-progress - Update automation run progress (called by extension)
router.post('/update-progress', async (req: AuthRequest, res) => {
  try {
    const { runId, successCount, failCount } = req.body;

    if (!runId) {
      return res.status(400).json({
        success: false,
        error: 'runId is required'
      });
    }

    const run = await prisma.automationRun.findFirst({
      where: {
        id: runId,
        userId: req.userId
      }
    });

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Automation run not found'
      });
    }

    // Update counts
    const updated = await prisma.automationRun.update({
      where: { id: runId },
      data: {
        successfulListings: successCount,
        failedListings: failCount,
        ...(successCount + failCount >= run.totalListings! && {
          status: 'completed',
          completedAt: new Date()
        })
      }
    });

    res.json({
      success: true,
      data: { run: updated }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update progress'
    });
  }
});

export default router;
