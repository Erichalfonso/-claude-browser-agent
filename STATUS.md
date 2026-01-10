# MLS → VLS Homes Syndicator

## Project Status: VLS Automation Complete

**Last Updated:** January 9, 2026

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
| **Sync Engine** | ✅ Complete | Orchestration with VLS/image integration |
| **Image Downloader** | ✅ Complete | Downloads with retry & cleanup |
| **Session Logger** | ✅ Complete | Logs sync history to files |
| **VLS Automation** | ✅ Complete | Puppeteer script for posting listings |
| **Field Mapping** | ✅ Complete | MLS → VLS field translation |
| **MLS API Client** | 🔲 Pending | Waiting for API credentials |

---

## VLS Homes Integration

### Login Flow
```
1. Navigate to https://vlshomes.com/members_mobi/passgen.cfm
2. Enter username and password
3. Click Login button
4. Click Continue on welcome page
5. Arrives at dashboard (brokers.cfm)
```

### Add Listing Flow
```
Step 1 (manform.cfm):
├── Classification: House, Condo, CoOp, Land, Commercial, Rental
├── Type of listing: Exclusive or MLS listed
├── Sale/Rent checkboxes
├── Street: Number, Name, Type
├── Zip code (required)
├── Country
├── Address Display
└── Categories (Short Sale, REO, etc.)

Step 2 (drl.cfm):
├── Sale Price
├── Town (auto-filled from zip)
├── Area, School District
├── Bathrooms: Full, Half
├── Beds, Rooms, Stories
├── Style, Condition, Construct
├── House Sqft, Lot Size
├── Year Built, Taxes
├── Options (Den, Fireplace, Pool, etc.)
├── Property Description
└── Submit

Post-Submit (listmenu.cfm):
├── Success message
├── Upload Main photo option
├── Edit listing options
└── Marketing tools
```

### Form Field Mapping

| MLS Field | VLS Field | Notes |
|-----------|-----------|-------|
| propertyType | classification | RES/CON/COP/LAN/COM/REN |
| address | street_num, street_name, street_type | Parsed from address |
| zip | zip | Required field |
| price | lp (sale price) | |
| bedrooms | beds | Dropdown 0-20+ |
| bathrooms | fbaths, hbaths | Split into full/half |
| sqft | sqft | |
| yearBuilt | yr_blt | |
| lotSize | lot_sz | |
| description | remarks | Textarea |

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
│   │   ├── index.tsx           # React entry
│   │   └── styles.css          # Dark theme
│   │
│   ├── mls/                    # MLS data handling
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── image-downloader.ts # Image fetching
│   │   └── api-client.ts       # [TODO] RESO API client
│   │
│   ├── vls/                    # VLS Homes automation
│   │   ├── poster.ts           # ✅ Puppeteer automation
│   │   └── field-mapping.ts    # ✅ MLS → VLS mapping
│   │
│   └── sync/                   # Sync orchestration
│       ├── engine.ts           # ✅ Main sync logic
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

### After MLS credentials are available

2. Build MLS API client (`src/mls/api-client.ts`)
3. Test end-to-end sync with real data
4. Package as Windows installer (.exe)

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

# Run Electron
npm run electron

# Build + Run
npm run start

# Package as installer
npm run dist
```

---

## Notes

- VLS Homes photo upload page (ask_multiple.cfm) returns 500 errors - may need alternative approach
- Photo upload uses "Upload Main photo" link on listing menu page
- VLS automatically sets Town from zip code
- Session maintained via CFID/CFTOKEN cookies
