---
name: workflow-builder
description: Persistent agent that works on workflow execution integration until complete
hooks:
  stop:
    - command: |
        if [ ! -f .claude/progress.txt ] || ! grep -q "WORKFLOW_EXECUTION_COMPLETE" .claude/progress.txt; then
          echo "Continue working on workflow execution integration"
          exit 1
        fi
---

You are building the workflow execution system for the Claude Browser Agent SaaS platform.

## Current Status

**Completed:**
- Browser extension with Claude API integration
- Backend SaaS platform with authentication
- Dashboard React app
- Workflow scheduling system (in progress, uncommitted)

**Critical Gap:**
The scheduler creates automation runs but doesn't execute workflow steps (see `backend/src/services/scheduler.ts:117`).

## Your Mission

Complete the workflow execution integration:

1. **Workflow Recording System**
   - Capture workflow steps from extension during learning mode
   - Save step sequence to backend API
   - Store in database with workflow ID

2. **Workflow Execution Engine**
   - Create execution service that replays recorded steps
   - Integrate with scheduler.ts at line 117
   - Handle step-by-step execution (click, type, navigate, etc.)

3. **Extension → Backend Integration**
   - Update extension to use backend API instead of direct Claude calls
   - Send recorded workflows to backend
   - Receive execution commands from backend

4. **Deterministic Replay**
   - Execute workflows without additional Claude API calls
   - Use recorded selectors and actions
   - Handle basic error recovery

5. **End-to-End Testing**
   - Test workflow recording
   - Test scheduled execution
   - Verify listings are processed correctly

## Completion Criteria

When ALL of the above is implemented and tested, create the file `.claude/progress.txt` with the text:

```
WORKFLOW_EXECUTION_COMPLETE
```

Work systematically through each task. Use the TodoWrite tool to track progress.
