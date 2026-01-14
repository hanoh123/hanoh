# Deployment Quick Start Guide

**Goal**: Deploy to production in 30 minutes and capture real artifacts.

---

## Prerequisites

- [ ] GitHub account with repository
- [ ] Terminal with Node.js installed
- [ ] Git repository up to date

---

## Step 1: Create Accounts (10 min)

### Vercel Account
1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Database Account (Choose One)

**Option A: Neon (Recommended)**
1. Go to https://neon.tech
2. Sign up (free tier available)
3. Create project: "penny-stocks-prod"
4. Copy connection string (includes `?sslmode=require`)

**Option B: Supabase**
1. Go to https://supabase.com
2. Sign up (free tier available)
3. Create project: "penny-stocks-prod"
4. Go to Settings → Database → Connection String
5. Copy connection string

### Email Account (Optional)
1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day)
3. Create API key
4. Copy key (starts with `re_`)

---

## Step 2: Generate Secrets (2 min)

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32

# Save both - you'll need them in Step 3
```

---

## Step 3: Deploy to Vercel (10 min)

### 3.1 Import Repository

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `penny-stocks-tracker` repository
4. Click "Import"

### 3.2 Configure Environment Variables

Before clicking "Deploy", add these environment variables:

| Variable | Value | Get From |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://...` | Step 1 (Database) |
| `NEXTAUTH_SECRET` | `<generated>` | Step 2 |
| `NEXTAUTH_URL` | `https://<project-name>.vercel.app` | Will be shown after deploy |
| `CRON_SECRET` | `<generated>` | Step 2 |
| `RESEND_API_KEY` | `re_...` | Step 1 (Email) - Optional |
| `NEXT_PUBLIC_APP_VERSION` | `1.3.0` | Type manually |

**Important**: Mark all secrets as "Sensitive" (click eye icon)

### 3.3 Deploy

1. Click "Deploy" button
2. Wait 2-3 minutes for build
3. **Copy the production URL** (e.g., `https://penny-stocks-tracker-abc123.vercel.app`)
4. **Update `NEXTAUTH_URL`** in environment variables with this URL
5. Redeploy if needed

---

## Step 4: Setup Database (5 min)

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Expected output: "All migrations have been successfully applied"
```

---

## Step 5: Create Admin User (3 min)

**Option A: Quick Seed (Default Credentials)**
```bash
tsx scripts/seed-production.ts
```
- Creates admin: `admin@pennystocks.local` / `ChangeMe123!`
- ⚠️ Change password immediately after login

**Option B: Custom Admin (Recommended)**
```bash
# Set bootstrap secret (optional for production safety)
export ADMIN_BOOTSTRAP_SECRET="$(openssl rand -hex 32)"

# Run interactive script
tsx scripts/create-admin-user.ts

# Follow prompts to enter email and password
```

---

## Step 6: Verify Deployment (5 min)

### 6.1 Test Health Endpoint

```bash
# Replace with your real URL
curl https://your-actual-url.vercel.app/api/health | jq

# Expected: {"status":"healthy",...}
```

### 6.2 Run Smoke Tests

```bash
# Replace with your real URL and CRON_SECRET
tsx scripts/smoke-prod.ts https://your-actual-url.vercel.app YOUR_CRON_SECRET

# Expected: "✅ ALL TESTS PASSED"
```

### 6.3 Manual Verification

1. Visit your production URL
2. Home page should load
3. Click "Sign In"
4. Login with admin credentials
5. Should redirect to `/admin`
6. Try creating a test ticker

---

## Step 7: Capture Artifacts (5 min)

Create a folder for outputs:
```bash
mkdir -p artifacts
```

### 7.1 Save Health Response
```bash
curl https://your-actual-url.vercel.app/api/health | jq > artifacts/health-response.json
```

### 7.2 Save Smoke Test Output
```bash
tsx scripts/smoke-prod.ts https://your-actual-url.vercel.app YOUR_CRON_SECRET > artifacts/smoke-test-output.txt
```

### 7.3 Save Build Output
```bash
npm run build > artifacts/build-output.txt 2>&1
```

### 7.4 Save Migration Output
```bash
# If you saved it earlier
# Otherwise, migrations are already applied
```

### 7.5 Test Cron Endpoint
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-actual-url.vercel.app/api/cron/evaluate-alerts | jq > artifacts/cron-response.json
```

---

## Step 8: Verify Cron Configuration (2 min)

1. Go to Vercel Dashboard
2. Select your project
3. Click "Cron" tab
4. Verify you see:
   - Path: `/api/cron/evaluate-alerts`
   - Schedule: `*/5 * * * *`
   - Status: Active
5. Check "Logs" tab for recent executions

---

## Step 9: Update Documentation (5 min)

### 9.1 Create Deployment Record

Create `SPRINT_4_PHASE1_DEPLOYED.md`:

```markdown
# Sprint 4 Phase 1 - DEPLOYED

**Status**: ✅ DEPLOYED  
**Date**: <today's date>  
**Production URL**: https://your-actual-url.vercel.app  
**Version**: 1.3.0

## Deployment Details

- **Deployed to**: Vercel
- **Database**: Neon/Supabase
- **Admin Created**: Yes
- **Cron Active**: Yes
- **Email Configured**: Yes/No

## Real Artifacts

### Production URL
https://your-actual-url.vercel.app

### Health Response
<paste contents of artifacts/health-response.json>

### Smoke Test Results
<paste contents of artifacts/smoke-test-output.txt>

### Cron Response
<paste contents of artifacts/cron-response.json>

## Verification Checklist

- [x] Deployment successful
- [x] Health endpoint returns 200 OK
- [x] Database connectivity confirmed
- [x] Admin login works
- [x] Cron job executing
- [x] All smoke tests passing (9/9)

## Next Steps

1. Change admin password (if using default)
2. Add production tickers via CSV import
3. Configure alerts
4. Monitor cron execution logs
5. Set up custom domain (Sprint 4 Phase 2)
```

### 9.2 Update README.md

Add to the top of `README.md`:

```markdown
## 🚀 Production Deployment

**Status**: ✅ Live  
**URL**: https://your-actual-url.vercel.app  
**Version**: 1.3.0  
**Last Deployed**: <date>
```

---

## Troubleshooting

### Build Fails in Vercel

**Check**:
- All environment variables set correctly
- `DATABASE_URL` includes `?sslmode=require`
- `NEXTAUTH_URL` matches deployment URL

**Fix**:
- Update environment variables
- Redeploy from Vercel dashboard

### Database Connection Fails

**Check**:
```bash
# Test connection locally
psql $DATABASE_URL -c "SELECT 1"
```

**Fix**:
- Verify connection string format
- Ensure SSL mode is enabled
- Check database is running

### Health Endpoint Returns 500

**Check Vercel Logs**:
1. Go to Vercel Dashboard → Logs
2. Filter by `/api/health`
3. Look for error messages

**Common Issues**:
- Database connection failed
- Missing environment variables
- Prisma client not generated

### Cron Not Executing

**Check**:
1. Vercel Dashboard → Cron tab
2. Verify cron job is listed
3. Check execution logs

**Fix**:
- Verify `vercel.json` is committed
- Redeploy to pick up cron config
- Check `CRON_SECRET` is set

### Smoke Tests Fail

**Run Individual Tests**:
```bash
# Test home page
curl -I https://your-url.vercel.app

# Test health
curl https://your-url.vercel.app/api/health

# Test cron
curl -H "Authorization: Bearer SECRET" \
  https://your-url.vercel.app/api/cron/evaluate-alerts
```

**Fix Based on Failure**:
- 404: Route not deployed correctly
- 500: Check Vercel logs
- 401: Check `CRON_SECRET`

---

## Quick Reference

### Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Dashboard**: https://console.neon.tech
- **Supabase Dashboard**: https://app.supabase.com
- **Resend Dashboard**: https://resend.com/emails

### Important Commands

```bash
# Deploy to Vercel (CLI)
vercel --prod

# View Vercel logs
vercel logs --prod

# Run migrations
npx prisma migrate deploy

# Seed database
tsx scripts/seed-production.ts

# Create admin
tsx scripts/create-admin-user.ts

# Run smoke tests
tsx scripts/smoke-prod.ts <URL> <SECRET>

# Test health
curl <URL>/api/health
```

### Environment Variables

```bash
# Generate secrets
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -hex 32     # CRON_SECRET

# Set locally for testing
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="..."
export NEXTAUTH_URL="http://localhost:3000"
export CRON_SECRET="..."
```

---

## Success Checklist

After completing all steps, verify:

- [ ] Production URL accessible
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] Admin can login
- [ ] Smoke tests pass (9/9)
- [ ] Cron job visible in Vercel dashboard
- [ ] Cron executes every 5 minutes
- [ ] Artifacts captured and saved
- [ ] Documentation updated with real URLs
- [ ] `SPRINT_4_PHASE1_DEPLOYED.md` created

---

## Next Steps

After successful deployment:

1. **Security**:
   - Change default admin password
   - Rotate secrets regularly
   - Enable 2FA on Vercel account

2. **Data**:
   - Import production tickers via CSV
   - Configure price alerts
   - Add catalysts and news

3. **Monitoring**:
   - Set up Vercel Analytics
   - Monitor cron execution logs
   - Check database performance

4. **Sprint 4 Phase 2**:
   - Custom domain setup
   - Enhanced monitoring
   - Performance optimization
   - Backup strategy

---

**Estimated Total Time**: 30-45 minutes

**Questions?** See `DEPLOYMENT_RUNBOOK.md` for detailed explanations.
