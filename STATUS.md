# MLS → VLS Homes Syndicator

## Project Status: In Development

**Last Updated:** January 7, 2025

---

## Overview

Desktop application that automatically syndicates MLS listings to VLS Homes for a real estate agent. The app fetches listings via MLS API and posts them to VLS Homes using browser automation.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MLS API       │────▶│  Sync Engine     │────▶│  VLS Homes      │
│   (RESO)        │     │  (Orchestrator)  │     │  (Puppeteer)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Electron App    │
                        │  (Desktop UI)    │
                        └──────────────────┘
```

---

## Component Status

| Component | Status | Description |
|-----------|--------|-------------|
| **Electron Shell** | ✅ Complete | Window, tray icon, menus, IPC |
| **React UI** | ✅ Complete | Settings, sync panel, history log |
| **Settings Storage** | ✅ Complete | Encrypted credential storage |
| **Sync Engine** | ⏳ Skeleton | Orchestration logic ready, needs MLS/VLS |
| **Image Downloader** | ✅ Complete | Downloads with retry & cleanup |
| **Session Logger** | ✅ Complete | Logs sync history to files |
| **MLS API Client** | 🔲 Pending | Waiting for API credentials |
| **VLS Automation** | 🔲 Pending | Waiting for site access |

---

## File Structure

```
mls-vls-syndicator/
├── src/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # Secure IPC bridge
│   ├── index.html              # HTML entry
│   │
│   ├── ui/                     # React components
│   │   ├── App.tsx             # Main app with tabs
│   │   ├── Settings.tsx        # Credentials & search criteria
│   │   ├── SyncPanel.tsx       # Sync button & progress
│   │   ├── ResultsLog.tsx      # History viewer
│   │   └── styles.css          # Dark theme
│   │
│   ├── mls/                    # MLS data handling
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── image-downloader.ts # Image fetching
│   │   └── api-client.ts       # [TODO] RESO API client
│   │
│   ├── vls/                    # VLS Homes automation
│   │   ├── poster.ts           # [TODO] Puppeteer script
│   │   └── field-mapping.ts    # [TODO] MLS → VLS mapping
│   │
│   └── sync/                   # Sync orchestration
│       ├── engine.ts           # Main sync logic
│       └── logger.ts           # Session logging
│
├── assets/                     # App icons
├── temp/                       # Downloaded images (temp)
├── logs/                       # Sync session logs
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── STATUS.md                   # This file
```

---

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI components
- **Vite** - Build system
- **TypeScript** - Type safety
- **Puppeteer** - Browser automation (for VLS)
- **electron-store** - Encrypted settings storage

---

## Next Steps

### Immediate (waiting on external dependencies)

1. **Get MLS API access**
   - Contact mom's MLS (Stellar MLS or other Florida MLS)
   - Request RESO Web API credentials
   - Get OAuth2 client ID/secret

2. **Explore VLS Homes**
   - Get login credentials
   - Map the "Add Listing" form fields
   - Build Puppeteer automation

### After dependencies are available

3. Build MLS API client (`src/mls/api-client.ts`)
4. Build VLS poster (`src/vls/poster.ts`)
5. Connect all pieces in sync engine
6. Package as Windows installer (.exe)
7. Test with real data

---

## User Flow (Target)

### First Time Setup
```
1. Install app (double-click .exe)
2. Enter MLS API credentials
3. Enter VLS Homes login
4. Set search criteria (location, price, beds)
5. Save
```

### Regular Use
```
1. Open app
2. Click "Sync Now"
3. App fetches listings from MLS
4. App posts each to VLS Homes
5. See results (posted/skipped/failed)
```

### Automated Mode
```
Enable auto-sync → App syncs every X hours in background
```

---

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Package as installer
npm run dist
```

---

## Notes

- Project was restructured from a Chrome extension to a standalone Electron app
- Previous backend/extension code archived in git history
- Focus is on simplicity for non-technical end user (60-year-old real estate agent)
