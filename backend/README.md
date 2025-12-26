# VLS Automation Backend

Backend server for the VLS listing automation SaaS platform. Manages workflows, user authentication, payments, and coordinates AI-powered browser automation.

## Overview

This backend enables a unique three-phase automation strategy:

1. **AI Learning Mode** - Browser agent learns the upload flow once using Claude AI
2. **Deterministic Playback** - Replays learned workflow without AI (fast & cheap)
3. **MLS API Integration** - Automatically syncs listings from MLS and uploads to VLS

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** JWT tokens
- **Payments:** Stripe
- **AI:** Anthropic Claude API
- **File Processing:** CSV/Excel parsing

---

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Anthropic API key
- Stripe account (for payments)

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/vls_automation"
JWT_SECRET="your-super-secret-jwt-key"
ANTHROPIC_API_KEY="sk-ant-..."
STRIPE_SECRET_KEY="sk_test_..."
PORT=3000
```

### 4. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

---

## API Documentation

### Authentication

All endpoints except `/health`, `/api/auth/signup`, and `/api/auth/login` require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Health Check
```http
GET /health
```

#### Auth
```http
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

#### Workflows
```http
POST   /api/workflows              # Create workflow (start AI learning)
GET    /api/workflows              # List workflows
GET    /api/workflows/:id          # Get workflow details
PUT    /api/workflows/:id          # Update workflow
DELETE /api/workflows/:id          # Delete workflow
POST   /api/workflows/:id/finalize # Convert AI → deterministic
```

#### Listings
```http
POST /api/listings/upload          # Upload CSV/Excel with listings
GET  /api/listings                 # List listings
GET  /api/listings/:id             # Get listing details
POST /api/listings/:id/retry       # Retry failed upload
```

#### Automation
```http
POST /api/automation/start            # Start automation run
GET  /api/automation/runs             # List runs
GET  /api/automation/runs/:id         # Get run details
POST /api/automation/stop/:id         # Stop run
POST /api/automation/update-progress  # Update progress (extension)
```

#### Extension Communication
```http
POST /api/extension/authenticate     # Extension login
POST /api/extension/record-action    # Record action (AI learning)
POST /api/extension/get-next-action  # Get next action (deterministic)
POST /api/extension/report-result    # Report success/failure
POST /api/extension/ai-decision      # Get AI decision for current state
```

#### Payments
```http
POST /api/payments/create-checkout  # Create Stripe checkout
POST /api/payments/webhook          # Stripe webhook
GET  /api/payments/portal           # Customer portal URL
```

---

## How It Works

### Phase 1: AI Learning Mode

1. User creates a new workflow targeting VLSHomes.com
2. Extension runs in "learning mode" with Claude AI
3. For each action (click, type, etc.), extension calls `/api/extension/ai-decision`
4. Claude analyzes screenshot + page state, decides next action
5. Extension records each action via `/api/extension/record-action`
6. Actions stored in database with placeholder variables (e.g., `{{ADDRESS}}`)

**Example recorded workflow:**
```json
{
  "actions": [
    {
      "step": 1,
      "action": "click",
      "selector": "button.add-listing",
      "reasoning": "Click 'Add Listing' button"
    },
    {
      "step": 2,
      "action": "type",
      "selector": "input[name='address']",
      "value": "{{ADDRESS}}",
      "field_label": "Street Address"
    },
    {
      "step": 3,
      "action": "type",
      "selector": "input[name='price']",
      "value": "{{PRICE}}",
      "field_label": "Listing Price"
    },
    {
      "step": 4,
      "action": "click",
      "selector": "button[type='submit']",
      "reasoning": "Submit form"
    }
  ],
  "fieldMappings": {
    "address": "input[name='address']",
    "price": "input[name='price']"
  }
}
```

### Phase 2: Deterministic Playback

1. User uploads CSV file with 100 listings
2. Backend parses CSV, creates listing records in database
3. User starts automation run via `/api/automation/start`
4. Extension requests next action via `/api/extension/get-next-action`
5. Backend replaces placeholders with actual listing data:
   - `{{ADDRESS}}` → "123 Main St"
   - `{{PRICE}}` → "299000"
6. Extension executes action (no AI needed!)
7. Repeats for all steps, then moves to next listing
8. Extension reports result via `/api/extension/report-result`

**Cost comparison:**
- AI Learning: ~$0.50 per listing (one time)
- Deterministic: ~$0.001 per listing (every subsequent run)
- **Savings: 99.8%!**

### Phase 3: MLS API Integration (Future)

1. Backend cron job polls MLS API every 15 minutes
2. Fetches new/updated listings
3. Creates listing records in database
4. Automatically queues for deterministic workflow
5. Fully automated end-to-end!

---

## Database Schema

### Users
- Email, password, subscription tier
- Stripe customer ID

### Workflows
- Name, description, target website
- Recorded actions (JSON)
- Field mappings (JSON)
- Status: learning → ready → active

### Listings
- Property data (address, price, beds, baths, etc.)
- Upload status: pending → processing → completed/failed
- Associated workflow ID

### Automation Runs
- Tracks each batch upload
- Success/failure counts
- Error logs

### Subscriptions
- Stripe subscription info
- Usage tracking (runs per month)
- Plan limits

---

## Pricing Tiers

Configured in `src/routes/payments.ts`:

| Tier | Price/month | Listings/month | Workflows |
|------|-------------|----------------|-----------|
| Free | $0 | 5 | 1 |
| Basic | $19.99 | 100 | 3 |
| Pro | $49.99 | 500 | 10 |
| Business | $99.99 | Unlimited | Unlimited |

---

## Development

### Watch Mode

```bash
npm run dev
```

Auto-reloads on file changes.

### Build for Production

```bash
npm run build
npm start
```

### Database Migrations

After changing `prisma/schema.prisma`:

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push to database
```

### View Database

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`

---

## Deployment

### Recommended Platforms

**Option 1: Railway**
1. Connect GitHub repo
2. Add PostgreSQL database
3. Set environment variables
4. Deploy!

**Option 2: Render**
1. Create new Web Service
2. Add PostgreSQL database
3. Set build command: `npm run build`
4. Set start command: `npm start`

**Option 3: DigitalOcean App Platform**
1. Connect repo
2. Add managed PostgreSQL
3. Configure build/run commands

### Environment Variables

Required in production:
- `DATABASE_URL`
- `JWT_SECRET` (strong random string!)
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`
- `EXTENSION_ID`

---

## Security

✅ **Password Hashing:** bcrypt with 10 rounds
✅ **JWT Tokens:** 7-day expiration
✅ **Rate Limiting:** 100 requests per 15 minutes
✅ **CORS:** Restricted to frontend + extension
✅ **Input Validation:** Zod schemas on all inputs
✅ **SQL Injection Protection:** Prisma ORM parameterization

---

## Testing

### Manual API Testing

Use `curl` or Postman:

```bash
# Create account
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create workflow (use token from login)
curl -X POST http://localhost:3000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"VLS Upload","website":"https://vlshomes.com"}'
```

---

## Troubleshooting

### "Can't reach database server"
- Check PostgreSQL is running: `pg_isready`
- Verify `DATABASE_URL` in `.env`

### "ANTHROPIC_API_KEY is not valid"
- Get key from https://console.anthropic.com/
- Make sure it starts with `sk-ant-`

### "Stripe webhook verification failed"
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/payments/webhook`
- Get webhook secret: `stripe listen --print-secret`

---

## Next Steps

1. ✅ Backend API complete
2. ⏳ Modify Chrome extension to connect to backend
3. ⏳ Build React dashboard for workflow management
4. ⏳ Set up Stripe products and prices
5. ⏳ Deploy to production
6. ⏳ Chrome Web Store submission

---

## Support

For issues or questions:
- Check server logs in console
- Use Prisma Studio to inspect database
- Enable debug logging: `NODE_ENV=development`

---

## License

MIT
