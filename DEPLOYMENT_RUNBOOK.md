# Production Deployment Runbook

Complete guide for deploying Penny Stocks Tracker to production on Vercel with managed PostgreSQL.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Vercel Deployment](#vercel-deployment)
5. [Database Migration](#database-migration)
6. [Production Seed](#production-seed)
7. [Cron Configuration](#cron-configuration)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Smoke Tests](#smoke-tests)
10. [Troubleshooting](#troubleshooting)
11. [Secret Rotation](#secret-rotation)

---

## Pre-Deployment Checklist

### Required Accounts & Services

- [ ] GitHub repository with code
- [ ] Vercel account (free tier sufficient for MVP)
- [ ] Managed PostgreSQL database (Neon, Supabase, or similar)
- [ ] Resend account for email notifications (optional but recommended)

### Local Validation

```bash
# Ensure all tests pass
npm test

# Ensure build succeeds
npm run build

# Ensure linting passes
npm run lint

# Ensure TypeScript compiles
npx tsc --noEmit
```

**Expected**: All commands should complete successfully with zero errors.

---

## Database Setup

### Option 1: Neon (Recommended)

1. **Create Account**: https://neon.tech
2. **Create Project**: "penny-stocks-prod"
3. **Get Connection String**:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. **Save Connection String**: You'll need this for `DATABASE_URL`

### Option 2: Supabase

1. **Create Account**: https://supabase.com
2. **Create Project**: "penny-stocks-prod"
3. **Get Connection String** (from Settings → Database):
   ```
   postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
   ```
4. **Enable Connection Pooling** (recommended for serverless)

### Option 3: Railway

1. **Create Account**: https://railway.app
2. **Create PostgreSQL Database**
3. **Get Connection String** from database settings

### Database Configuration

**Important**: Ensure your connection string includes:
- SSL mode: `?sslmode=require` (for security)
- Connection pooling if available (for performance)

---

## Environment Variables

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

### Required Environment Variables

Create a `.env.production` file locally (DO NOT COMMIT):

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="<output from: openssl rand -base64 32>"
NEXTAUTH_URL="https://your-app.vercel.app"

# Cron Security
CRON_SECRET="<output from: openssl rand -hex 32>"

# Email (optional but recommended)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# App Version
NEXT_PUBLIC_APP_VERSION="1.3.0"
```

### Get Resend API Key (Optional)

1. Create account: https://resend.com
2. Navigate to API Keys
3. Create new API key
4. Copy key (starts with `re_`)

**Note**: If `RESEND_API_KEY` is not set, alerts will be logged but not emailed.

---

## Vercel Deployment

### Step 1: Connect Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the repository: `your-username/penny-stocks-tracker`

### Step 2: Configure Project

**Framework Preset**: Next.js (auto-detected)

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

**Root Directory**: `.` (leave as root)

### Step 3: Set Environment Variables

In Vercel project settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Production, Preview |
| `NEXTAUTH_SECRET` | Generated secret | Production, Preview |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
| `NEXTAUTH_URL` | `https://your-app-git-*.vercel.app` | Preview |
| `CRON_SECRET` | Generated secret | Production, Preview |
| `RESEND_API_KEY` | Your Resend API key | Production, Preview |
| `NEXT_PUBLIC_APP_VERSION` | `1.3.0` | Production, Preview |

**Important**:
- Mark all secrets as "Sensitive" (eye icon)
- Use different secrets for Production vs Preview
- `NEXTAUTH_URL` must match your actual deployment URL

### Step 4: Deploy

Click **Deploy** button.

**Expected Output**:
```
Building...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Deployment completed successfully
URL: https://your-app.vercel.app
```

---

## Database Migration

### Step 1: Install Prisma CLI Locally

```bash
npm install -g prisma
```

### Step 2: Set Production DATABASE_URL

```bash
# Export production database URL
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

**Windows (PowerShell)**:
```powershell
$env:DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### Step 3: Run Production Migration

```bash
# Generate Prisma Client
npx prisma generate

# Deploy migrations to production
npx prisma migrate deploy
```

**Expected Output**:
```
Prisma schema loaded from schema.prisma
Datasource "db": PostgreSQL database "dbname", schema "public" at "host:5432"

5 migrations found in prisma/migrations

Applying migration `20240101000000_init`
Applying migration `20240102000000_add_audit_fields`
Applying migration `20240103000000_add_alert_events`
Applying migration `20240104000000_add_import_jobs`
Applying migration `20240105000000_add_5min_buckets`

The following migrations have been applied:

migrations/
  └─ 20240101000000_init/
  └─ 20240102000000_add_audit_fields/
  └─ 20240103000000_add_alert_events/
  └─ 20240104000000_add_import_jobs/
  └─ 20240105000000_add_5min_buckets/

All migrations have been successfully applied.
```

### Alternative: Prisma DB Push (Development Only)

**⚠️ WARNING**: Only use for development. Production should use migrations.

```bash
npx prisma db push
```

---

## Production Seed

### Option 1: Minimal Safe Seed (Recommended)

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Run production seed
tsx scripts/seed-production.ts
```

**Expected Output**:
```
🌱 Starting production database seed...
⚠️  Production seed is minimal and safe - only creates missing essentials

📝 No users found - creating initial admin user...
✅ Created admin user: admin@pennystocks.local
   ID: clxxx...
   ⚠️  IMPORTANT: Change password immediately after first login!

📝 No tickers found - creating sample tickers...
   ✅ Created ticker: AAPL
   ✅ Created ticker: MSFT
   ✅ Created ticker: GOOGL
✅ Created 3 sample tickers

📊 Production Database Summary:
   Users: 1 (1 admin)
   Tickers: 3

✅ Production seed completed successfully!

🔐 Next Steps:
   1. Login with admin credentials
   2. Change admin password immediately
   3. Add production tickers via admin panel or CSV import
   4. Configure alerts and catalysts as needed
```

### Option 2: Custom Admin User

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Set bootstrap secret (for production safety)
export ADMIN_BOOTSTRAP_SECRET="your-secure-secret"

# Run admin creation script
tsx scripts/create-admin-user.ts
```

**Interactive Prompts**:
```
🔐 Admin User Bootstrap Script
==================================================

Enter ADMIN_BOOTSTRAP_SECRET: ********
✅ Bootstrap secret verified

Admin email: admin@yourcompany.com
Password: ********
Confirm password: ********
✅ Admin user created successfully
   ID: clxxx...
   Email: admin@yourcompany.com
   Role: ADMIN

✅ Operation completed successfully
```

### Default Admin Credentials (if using seed-production.ts)

**Email**: `admin@pennystocks.local`  
**Password**: `ChangeMe123!`

**⚠️ CRITICAL**: Change these immediately after first login!

---

## Cron Configuration

### Vercel Cron (Automatic)

Vercel automatically configures cron jobs from `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/evaluate-alerts",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Schedule**: Every 5 minutes

**Authentication**: Vercel automatically adds `Authorization: Bearer <CRON_SECRET>` header

### Verify Cron Configuration

1. Go to Vercel Dashboard → Your Project → Cron
2. Verify cron job is listed
3. Check execution logs

### Manual Cron Trigger (Testing)

```bash
curl -X GET "https://your-app.vercel.app/api/cron/evaluate-alerts" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response**:
```json
{
  "success": true,
  "timestamp": "2024-02-15T10:30:00.000Z",
  "result": {
    "evaluated": 5,
    "triggered": 2,
    "sent": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

## Post-Deployment Verification

### Step 1: Check Deployment Status

```bash
# Visit your deployment URL
https://your-app.vercel.app
```

**Expected**: Home page loads successfully

### Step 2: Check Health Endpoint

```bash
curl https://your-app.vercel.app/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-15T10:30:00.000Z",
  "version": "1.3.0",
  "commit": "abc1234",
  "checks": {
    "database": {
      "status": "ok",
      "latency": 45
    },
    "email": {
      "configured": true,
      "provider": "resend"
    }
  },
  "environment": "production"
}
```

### Step 3: Test Authentication

1. Navigate to `/auth/signin`
2. Login with admin credentials
3. Verify redirect to `/admin`
4. Verify admin dashboard loads

### Step 4: Test Admin Functions

1. Navigate to `/admin/tickers`
2. Create a test ticker
3. Navigate to `/admin/catalysts`
4. Create a test catalyst
5. Navigate to `/admin/imports`
6. Upload a sample CSV

### Step 5: Verify Cron Execution

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by `/api/cron/evaluate-alerts`
3. Verify cron executes every 5 minutes
4. Check for any errors

---

## Smoke Tests

### Automated Smoke Test

```bash
# Run smoke test against production
tsx scripts/smoke-prod.ts https://your-app.vercel.app YOUR_CRON_SECRET
```

**Expected Output**:
```
🔍 Production Smoke Test
============================================================
Target: https://your-app.vercel.app
Time: 2024-02-15T10:30:00.000Z

✅ Home page loads (234ms)
   Home page accessible
✅ Health endpoint (156ms)
   Version 1.3.0, DB latency 45ms
✅ Ticker page loads (189ms)
   Ticker page accessible
✅ Sign in page loads (145ms)
   Sign in page accessible
✅ Sign up page loads (134ms)
   Sign up page accessible
✅ Admin page protection (123ms)
   Admin page properly protected (redirects)
✅ Cron endpoint rejects missing secret (98ms)
   Cron endpoint properly protected
✅ Cron endpoint accepts valid secret (456ms)
   Cron executed: {"evaluated":5,"triggered":0,"sent":0,"failed":0}
✅ Public news API (178ms)
   Returned 0 news items

============================================================
📊 Test Summary
============================================================
Total Tests: 9
✅ Passed: 9
❌ Failed: 0
⚠️  Warnings: 0

✅ ALL TESTS PASSED
```

### Manual Smoke Test Checklist

- [ ] Home page loads
- [ ] Health endpoint returns 200
- [ ] Ticker page loads (or 404 if no data)
- [ ] Sign in page loads
- [ ] Sign up page loads
- [ ] Admin page redirects to login
- [ ] Cron endpoint rejects invalid secret
- [ ] Cron endpoint accepts valid secret
- [ ] Public API endpoints work

---

## Troubleshooting

### Build Failures

**Error**: `Module not found`
```bash
# Solution: Ensure all dependencies are in package.json
npm install
npm run build
```

**Error**: `TypeScript compilation failed`
```bash
# Solution: Fix TypeScript errors locally first
npx tsc --noEmit
```

### Database Connection Issues

**Error**: `Can't reach database server`
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify SSL mode
# Should include: ?sslmode=require
```

**Error**: `SSL connection required`
```bash
# Add SSL mode to connection string
DATABASE_URL="postgresql://...?sslmode=require"
```

### Authentication Issues

**Error**: `[next-auth][error][JWT_SESSION_ERROR]`
```bash
# Verify NEXTAUTH_SECRET is set
# Verify NEXTAUTH_URL matches deployment URL

# Clear browser cookies and retry
```

**Error**: `Callback URL mismatch`
```bash
# Ensure NEXTAUTH_URL matches exactly:
# Production: https://your-app.vercel.app
# Preview: https://your-app-git-branch.vercel.app
```

### Cron Issues

**Error**: `Unauthorized - Invalid cron secret`
```bash
# Verify CRON_SECRET in Vercel environment variables
# Verify vercel.json cron configuration

# Test manually
curl -X GET "https://your-app.vercel.app/api/cron/evaluate-alerts" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Error**: `Cron not executing`
```bash
# Check Vercel Dashboard → Cron tab
# Verify cron job is listed
# Check execution logs for errors
```

### Email Issues

**Error**: `Email service not configured`
```bash
# Verify RESEND_API_KEY is set in Vercel
# Test Resend API key:
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

---

## Secret Rotation

### Rotating NEXTAUTH_SECRET

**⚠️ WARNING**: Rotating this secret will invalidate all user sessions.

```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update in Vercel environment variables
# 3. Redeploy application
vercel --prod

# 4. All users will need to log in again
```

### Rotating CRON_SECRET

```bash
# 1. Generate new secret
openssl rand -hex 32

# 2. Update in Vercel environment variables
# 3. Vercel automatically updates cron job authentication
# 4. No redeployment needed
```

### Rotating RESEND_API_KEY

```bash
# 1. Create new API key in Resend dashboard
# 2. Update in Vercel environment variables
# 3. Delete old API key in Resend dashboard
# 4. No redeployment needed
```

### Rotating DATABASE_URL (Database Migration)

**⚠️ WARNING**: This requires careful planning and downtime.

```bash
# 1. Create new database
# 2. Run migrations on new database
# 3. Copy data from old to new database
# 4. Update DATABASE_URL in Vercel
# 5. Redeploy application
# 6. Verify functionality
# 7. Decommission old database
```

---

## Production URLs

After deployment, you'll have:

- **Production**: `https://your-app.vercel.app`
- **Preview** (per branch): `https://your-app-git-branch.vercel.app`
- **Health Check**: `https://your-app.vercel.app/api/health`
- **Admin Panel**: `https://your-app.vercel.app/admin`

---

## Deployment Commands Reference

```bash
# Local build test
npm run build

# Deploy to Vercel (via CLI)
vercel --prod

# Run production migration
npx prisma migrate deploy

# Run production seed
tsx scripts/seed-production.ts

# Create admin user
tsx scripts/create-admin-user.ts

# Run smoke tests
tsx scripts/smoke-prod.ts https://your-app.vercel.app CRON_SECRET

# View Vercel logs
vercel logs --prod

# Pull environment variables
vercel env pull .env.local
```

---

## Support & Monitoring

### Vercel Dashboard

- **Deployments**: View deployment history and logs
- **Analytics**: Monitor page views and performance
- **Logs**: Real-time application logs
- **Cron**: View cron execution history

### Database Monitoring

- **Neon**: Dashboard shows connection count, query performance
- **Supabase**: Database health, query logs, connection pooling

### Email Monitoring

- **Resend**: Dashboard shows email delivery status, bounces, opens

---

## Next Steps After Deployment

1. **Change Default Admin Password**
2. **Add Production Tickers** (via CSV import or admin panel)
3. **Configure Alerts** for monitoring
4. **Set Up Custom Domain** (optional, Sprint 4 Phase 2)
5. **Enable Analytics** (Vercel Analytics)
6. **Set Up Error Tracking** (Sentry, optional)
7. **Configure Backups** (database snapshots)

---

**Deployment Runbook Version**: 1.0  
**Last Updated**: February 15, 2024  
**Sprint**: 4 Phase 1