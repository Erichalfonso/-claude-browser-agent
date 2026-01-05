# Claude Browser Agent - Project Status

## Last Updated: January 5, 2026

---

## COMPLETED

### Backend (Railway Deployed)
- [x] Express server with authentication (JWT)
- [x] User signup/login endpoints
- [x] Workflow CRUD endpoints
- [x] Listings management endpoints
- [x] AI decision endpoint (`/api/extension/ai-decision`) - calls Claude API
- [x] Action recording endpoint for learning mode
- [x] Deterministic playback endpoint (`/api/extension/get-next-action`)
- [x] Workflow scheduling system with cron jobs
- [x] CORS configured for Chrome extension
- [x] Deployed to Railway: `https://claude-browser-agent-production.up.railway.app`

### Chrome Extension
- [x] Manifest V3 setup with side panel
- [x] Popup UI with login/signup
- [x] Chat interface to give commands to AI
- [x] Screenshot capture and send to backend
- [x] DOM inspection for interactive elements
- [x] Action execution (click, type, scroll, navigate, key_press)
- [x] Status overlay on page during automation
- [x] Hot reload for development (`npm run dev`)
- [x] Centralized config (`config.ts`) for backend URL

### AI Agent
- [x] Vision-based reasoning with Claude Sonnet
- [x] Action history tracking to prevent loops
- [x] Retry logic with exponential backoff
- [x] Error handling and reporting to popup

### Dashboard (Web App)
- [x] React + Vite setup
- [x] Login/authentication
- [x] Workflows list page with status badges
- [x] Run workflow page
- [x] Schedule modal for automation timing
- [x] Connected to Railway backend

---

## IN PROGRESS

### Extension Workflow Picker
- [ ] Add tabs to popup (Chat / Workflows)
- [ ] Fetch and display saved workflows in extension
- [ ] "Run" button to execute workflow on current page
- [ ] Integrate with deterministic playback

---

## TODO (Not Started)

### Deterministic Playback
- [ ] Execute recorded actions step-by-step
- [ ] Replace placeholders with listing data
- [ ] Handle dynamic selectors (elements that change)
- [ ] Error recovery during playback

### Listings Management
- [ ] CSV upload in extension (currently dashboard only)
- [ ] View pending listings in extension
- [ ] Mark listings as uploaded

### Workflow Learning Improvements
- [ ] Better selector generation for complex sites
- [ ] Handle iframes and shadow DOM
- [ ] Support file uploads during learning
- [ ] Multi-page workflow support

### Polish & UX
- [ ] Better error messages
- [ ] Progress indicators during automation
- [ ] Workflow editing/tweaking
- [ ] Duplicate workflow functionality

### Production Readiness
- [ ] Rate limiting per user
- [ ] Usage tracking for billing
- [ ] Stripe integration for payments
- [ ] Admin dashboard

---

## Environment Variables (Railway)

| Variable | Status | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Set (auto) | PostgreSQL connection string |
| `JWT_SECRET` | Required | Secret for signing tokens |
| `ANTHROPIC_API_KEY` | Required | Claude API key (sk-ant-api03-...) |
| `STRIPE_SECRET_KEY` | Optional | For payments |
| `STRIPE_WEBHOOK_SECRET` | Optional | For Stripe webhooks |

---

## Quick Start

```bash
# Extension development
cd claude-browser-agent
npm install
npm run dev          # Hot reload enabled
# Load dist/ folder in chrome://extensions

# Dashboard
cd dashboard
npm install
npm run dev          # http://localhost:5173

# Backend (local)
cd backend
npm install
npm run dev          # http://localhost:3000
```

---

## Current Issue Being Worked On

The AI agent is now properly executing actions and tracking history to avoid loops.
Next step: Add workflow picker tab to the extension popup so users can select and run saved workflows directly from the extension.
