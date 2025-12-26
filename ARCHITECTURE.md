# VLS Listing Automation - Complete System Architecture

## Overview

A SaaS platform for automating real estate listing uploads to VLSHomes.com using AI-powered browser automation that learns workflows and converts them to deterministic scripts.

## Three-Phase Strategy

### Phase 1: AI Learning Mode
- User runs browser agent on VLSHomes.com manually once
- AI observes and records every action (clicks, types, navigation)
- System saves this as a reusable "workflow template"
- Captures selectors, field mappings, and page flow

### Phase 2: Deterministic Playback
- Workflow template replays recorded steps without AI
- User uploads CSV/Excel with listing data
- System processes all listings automatically (fast & cheap)
- No AI API calls needed for subsequent runs

### Phase 3: MLS API Integration
- Backend connects to MLS API (when available)
- Fetches new/updated listings automatically
- Feeds directly into deterministic workflow
- Fully automated end-to-end pipeline

---

## System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│  • Chrome Extension (browser automation)                         │
│  • User Dashboard (React web app)                                │
│  • Login/Signup pages                                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│  • Express.js API Server                                         │
│  • Authentication (JWT)                                          │
│  • Workflow Recording Service                                   │
│  • Workflow Playback Engine                                     │
│  • File Processing (CSV/Excel parser)                           │
│  • MLS API Integration Service                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│  • PostgreSQL Database                                           │
│  • Redis Cache (rate limiting, sessions)                        │
│  • S3/Cloud Storage (listing images)                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                            │
├──────────────────────────────────────────────────────────────────┤
│  • Anthropic API (Claude for AI learning mode)                  │
│  • Stripe API (payments)                                        │
│  • MLS API (future - listing data source)                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, basic, pro, business
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Workflows Table (Saved automation templates)
```sql
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(255), -- e.g., 'vlshomes.com'
  status VARCHAR(50) DEFAULT 'learning', -- learning, ready, active

  -- Recorded actions from AI learning phase
  recorded_actions JSONB, -- Array of {action, selector, value, timestamp}

  -- Field mappings (CSV column → web form field)
  field_mappings JSONB, -- {csv_column: selector, ...}

  -- Success criteria
  success_indicators JSONB, -- How to know upload succeeded

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Listings Table (Uploaded property data)
```sql
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  workflow_id INTEGER REFERENCES workflows(id),

  -- Listing data
  mls_number VARCHAR(100),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  price DECIMAL(12, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  square_feet INTEGER,
  description TEXT,
  listing_data JSONB, -- Full listing details

  -- Upload status
  upload_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  upload_result JSONB, -- Error messages, success confirmation
  uploaded_at TIMESTAMP,

  -- Image URLs
  image_urls TEXT[], -- Array of image URLs

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Automation Runs Table (Track each batch upload)
```sql
CREATE TABLE automation_runs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  workflow_id INTEGER REFERENCES workflows(id),

  run_type VARCHAR(50), -- 'ai_learning', 'deterministic', 'api_sync'
  status VARCHAR(50) DEFAULT 'running', -- running, completed, failed

  total_listings INTEGER,
  successful_listings INTEGER,
  failed_listings INTEGER,

  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_log JSONB
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50), -- basic, pro, business
  status VARCHAR(50), -- active, canceled, past_due
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,

  -- Usage tracking
  monthly_runs_used INTEGER DEFAULT 0,
  monthly_runs_limit INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/signup          - Create new user account
POST   /api/auth/login           - Login (returns JWT)
POST   /api/auth/logout          - Logout
GET    /api/auth/me              - Get current user info
```

### Workflows
```
POST   /api/workflows            - Create new workflow (start AI learning)
GET    /api/workflows            - List user's workflows
GET    /api/workflows/:id        - Get workflow details
PUT    /api/workflows/:id        - Update workflow
DELETE /api/workflows/:id        - Delete workflow
POST   /api/workflows/:id/finalize - Convert AI workflow to deterministic
```

### Listings
```
POST   /api/listings/upload      - Upload CSV/Excel file with listings
GET    /api/listings             - List user's listings
GET    /api/listings/:id         - Get listing details
POST   /api/listings/:id/retry   - Retry failed listing upload
```

### Automation
```
POST   /api/automation/start     - Start automation run with workflow
GET    /api/automation/runs      - List automation runs
GET    /api/automation/runs/:id  - Get run details
POST   /api/automation/stop/:id  - Stop running automation
```

### Extension Communication
```
POST   /api/extension/authenticate     - Extension login
POST   /api/extension/record-action    - Record action during AI learning
POST   /api/extension/get-next-action  - Get next action for deterministic mode
POST   /api/extension/report-result    - Report success/failure
```

### Payments
```
POST   /api/payments/create-checkout   - Create Stripe checkout session
POST   /api/payments/webhook           - Stripe webhook handler
GET    /api/payments/portal            - Get customer portal URL
```

### MLS Integration (Future)
```
POST   /api/mls/connect          - Connect MLS API credentials
GET    /api/mls/sync             - Trigger manual sync
GET    /api/mls/listings         - View synced listings
```

---

## Workflow System Design

### AI Learning Mode Recording

When user runs the extension in "learning mode":

```javascript
// Extension records every action
{
  "workflow_id": "123",
  "actions": [
    {
      "step": 1,
      "action": "navigate",
      "url": "https://vlshomes.com/add-listing",
      "timestamp": "2025-01-15T10:30:00Z"
    },
    {
      "step": 2,
      "action": "click",
      "selector": "button.add-listing-btn",
      "reasoning": "Clicked 'Add Listing' button to start form",
      "screenshot_before": "base64...",
      "timestamp": "2025-01-15T10:30:02Z"
    },
    {
      "step": 3,
      "action": "type",
      "selector": "input[name='address']",
      "value": "{{ADDRESS}}", // Variable placeholder
      "field_label": "Street Address",
      "timestamp": "2025-01-15T10:30:05Z"
    },
    {
      "step": 4,
      "action": "type",
      "selector": "input[name='price']",
      "value": "{{PRICE}}",
      "field_label": "Listing Price",
      "timestamp": "2025-01-15T10:30:08Z"
    },
    {
      "step": 5,
      "action": "upload",
      "selector": "input[type='file']#photos",
      "value": "{{IMAGES}}", // Array placeholder
      "field_label": "Property Photos",
      "timestamp": "2025-01-15T10:30:12Z"
    },
    {
      "step": 6,
      "action": "click",
      "selector": "button[type='submit']",
      "reasoning": "Submit the listing form",
      "timestamp": "2025-01-15T10:30:15Z"
    },
    {
      "step": 7,
      "action": "wait_for",
      "selector": "div.success-message",
      "expected_text": "Listing published successfully",
      "timestamp": "2025-01-15T10:30:18Z"
    }
  ],

  // Field mappings (CSV columns → selectors)
  "field_mappings": {
    "address": "input[name='address']",
    "city": "input[name='city']",
    "price": "input[name='price']",
    "bedrooms": "select[name='bedrooms']",
    "bathrooms": "select[name='bathrooms']",
    "description": "textarea[name='description']",
    "images": "input[type='file']#photos"
  }
}
```

### Deterministic Playback

Once workflow is finalized:

```javascript
// Backend receives CSV with listings
const listings = parseCSV(file);

for (const listing of listings) {
  // Send to extension for deterministic playback
  await runDeterministicWorkflow({
    workflow_id: workflow.id,
    listing_data: listing,
    actions: workflow.recorded_actions // Pre-recorded steps
  });
}

// Extension executes each step without AI
function executeDeterministicStep(action, listingData) {
  // Replace placeholders with actual data
  const value = action.value.replace(/{{(\w+)}}/g, (match, field) => {
    return listingData[field.toLowerCase()];
  });

  // Execute the action
  switch (action.action) {
    case 'click':
      document.querySelector(action.selector).click();
      break;
    case 'type':
      document.querySelector(action.selector).value = value;
      break;
    // ... etc
  }
}
```

---

## MLS API Integration Design

When MLS API access is available:

```javascript
// Backend service polls MLS API
async function syncMLSListings() {
  // 1. Fetch new/updated listings from MLS
  const mlsListings = await mlsAPI.getListings({
    status: 'active',
    updated_since: lastSyncTime
  });

  // 2. Save to database
  for (const mlsListing of mlsListings) {
    await db.listings.upsert({
      mls_number: mlsListing.mls_id,
      address: mlsListing.address,
      price: mlsListing.price,
      // ... map all fields
      listing_data: mlsListing, // Store full MLS data
      upload_status: 'pending'
    });
  }

  // 3. Trigger deterministic workflow for each new listing
  const pendingListings = await db.listings.findMany({
    where: { upload_status: 'pending' }
  });

  for (const listing of pendingListings) {
    await queueWorkflowRun({
      workflow_id: user.default_workflow_id,
      listing_id: listing.id
    });
  }
}

// Cron job runs every 15 minutes
cron.schedule('*/15 * * * *', syncMLSListings);
```

---

## Pricing Tiers

### Free Tier
- 5 listings/month
- 1 workflow
- Manual CSV upload only

### Basic - $19.99/month
- 100 listings/month
- 3 workflows
- CSV upload
- Email support

### Pro - $49.99/month
- 500 listings/month
- 10 workflows
- CSV upload
- MLS API integration
- Priority support

### Business - $99.99/month
- Unlimited listings
- Unlimited workflows
- MLS API integration
- Dedicated support
- Custom integrations

---

## Cost Analysis

### Per-Listing Costs:
- **AI Learning Mode:** ~$0.50/listing (Anthropic API)
- **Deterministic Mode:** ~$0.001/listing (just server compute)

**Why this is profitable:**
- Use AI once to learn the flow
- All subsequent runs use cheap deterministic playback
- 100 listings/month at $19.99 = $0.20/listing revenue
- Cost: $0.001/listing = 99.5% profit margin!

---

## Security Considerations

1. **API Key Storage:** Your Anthropic key stored in environment variables, never exposed
2. **User Authentication:** JWT tokens, bcrypt password hashing
3. **Rate Limiting:** Redis-based rate limiting per user tier
4. **Data Encryption:** All sensitive data encrypted at rest
5. **HTTPS Only:** All communication over TLS
6. **Extension Security:** Backend validates all extension requests

---

## Development Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] Backend API with authentication
- [ ] Workflow recording system
- [ ] Basic deterministic playback
- [ ] Modified Chrome extension
- [ ] Stripe payment integration

### Phase 2: Dashboard (Weeks 5-6)
- [ ] React user dashboard
- [ ] Workflow management UI
- [ ] Listing upload interface
- [ ] Run history and logs

### Phase 3: MLS Integration (Weeks 7-8)
- [ ] MLS API connector
- [ ] Auto-sync system
- [ ] Conflict resolution

### Phase 4: Polish & Launch (Weeks 9-10)
- [ ] Testing and bug fixes
- [ ] Chrome Web Store submission
- [ ] Marketing website
- [ ] Documentation

---

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (database)
- Redis (caching, rate limiting)
- Prisma ORM
- JWT authentication

**Frontend:**
- React + TypeScript
- TailwindCSS
- Chrome Extension (existing)

**Payments:**
- Stripe

**Hosting:**
- Backend: Railway / Render / DigitalOcean
- Database: Railway / Supabase
- Storage: AWS S3 / Cloudflare R2

**External APIs:**
- Anthropic Claude API
- MLS API (future)

---

## Next Steps

1. Set up backend project structure
2. Implement authentication system
3. Build workflow recording service
4. Create deterministic playback engine
5. Modify Chrome extension to connect to backend
6. Integrate Stripe payments
7. Build user dashboard
8. Deploy and test
9. Submit to Chrome Web Store
10. Launch! 🚀
