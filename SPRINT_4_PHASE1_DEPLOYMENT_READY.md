# Sprint 4 Phase 1 - Deployment Ready

## ✅ Pre-Deployment Verification Complete

### Build Status
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (25/25)
✓ Finalizing page optimization
```

**Build Output Summary:**
- Total Routes: 35 (25 pages + 10 API routes)
- Static Pages: 7
- Dynamic Pages: 28
- Middleware: 74.7 kB
- First Load JS: 82.1 kB (shared)

### Dependencies Status
```
✓ Node.js: v24.13.0
✓ npm: 11.6.2
✓ Prisma Client: v5.22.0 (generated)
✓ Dependencies: 843 packages installed
```

### Git Status
```
✓ Repository initialized
✓ All files staged
✓ Ready for initial commit
```

---

## 🚀 Deployment Instructions

### Step 1: Set Up Production Database (Neon - Free Tier)

1. **Create Neon Account**
   - Go to: https://neon.tech
   - Sign up with GitHub
   - Create new project: `penny-stocks-tracker`
   - Region: Choose closest to your users (e.g., US East, EU West)
   - Postgres version: 16

2. **Copy Connection String**
   - Format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - Save this for Vercel environment variables

### Step 2: Generate Secure Secrets

Run these commands in PowerShell:

```powershell
# Generate NEXTAUTH_SECRET (32 bytes base64)
openssl rand -base64 32

# Generate CRON_SECRET (32 bytes hex)
openssl rand -hex 32
```

**Save these outputs** - you'll need them for Vercel.

### Step 3: Set Up Resend Email Service

1. Go to: https://resend.com
2. Sign up/Login
3. Navigate to: API Keys
4. Create new API key: `penny-stocks-production`
5. Copy the key (starts with `re_`)

### Step 4: Push to GitHub

```powershell
cd C:\Users\hanoh\gamestop

# Configure git (if not already done)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Commit all files
git commit -m "Sprint 4 Phase 1 - Production ready deployment"

# Create GitHub repository at: https://github.com/new
# Repository name: penny-stocks-tracker
# Visibility: Private (recommended) or Public

# Add remote and push
git remote add origin https://github.com/YOUR-USERNAME/penny-stocks-tracker.git
git branch -M main
git push -u origin main
```

### Step 5: Deploy to Vercel

1. **Import Project**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repository: `penny-stocks-tracker`

2. **Configure Build Settings**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Add Environment Variables**

   Click "Environment Variables" and add these:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `DATABASE_URL` | `<your-neon-connection-string>` | Production, Preview |
   | `NEXTAUTH_SECRET` | `<generated-from-step-2>` | Production, Preview |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
   | `NEXTAUTH_URL` | `https://your-app-preview.vercel.app` | Preview |
   | `CRON_SECRET` | `<generated-from-step-2>` | Production, Preview |
   | `RESEND_API_KEY` | `<your-resend-api-key>` | Production, Preview |
   | `NEXT_PUBLIC_APP_VERSION` | `1.3.0` | Production, Preview |

   **Important:**
   - Mark all secrets as "Sensitive" (eye icon)
   - Use different secrets for Production vs Preview
   - Update `NEXTAUTH_URL` after deployment with actual Vercel URL

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Copy your production URL: `https://your-app-xxxxx.vercel.app`

### Step 6: Run Database Migrations

After Vercel deployment succeeds:

```powershell
# Set DATABASE_URL environment variable
$env:DATABASE_URL="<your-neon-connection-string>"

# Run migrations
npx prisma migrate deploy

# Expected output:
# 1 migration found in prisma/migrations
# Applying migration `20231201000000_init`
# The following migration(s) have been applied:
# migrations/
#   └─ 20231201000000_init/
#      └─ migration.sql
# All migrations have been successfully applied.
```

### Step 7: Seed Production Database

```powershell
# Seed initial data (admin user + sample tickers)
npx tsx scripts/seed-production.ts

# Expected output:
# 🌱 Starting production database seed...
# 📝 No users found - creating initial admin user...
# ✅ Created admin user: admin@pennystocks.local
#    ID: <user-id>
#    ⚠️  IMPORTANT: Change password immediately after first login!
# 📝 No tickers found - creating sample tickers...
#    ✅ Created ticker: AAPL
#    ✅ Created ticker: MSFT
#    ✅ Created ticker: GOOGL
# ✅ Created 3 sample tickers
# 📊 Production Database Summary:
#    Users: 1 (1 admin)
#    Tickers: 3
# ✅ Production seed completed successfully!
```

**Default Admin Credentials:**
- Email: `admin@pennystocks.local`
- Password: `ChangeMe123!`

**⚠️ CRITICAL: Change this password immediately after first login!**

### Step 8: Update NEXTAUTH_URL in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `NEXTAUTH_URL` for Production
3. Update value to your actual Vercel URL: `https://your-app-xxxxx.vercel.app`
4. Save and redeploy

### Step 9: Verify Deployment

Run the smoke test:

```powershell
# Set production URL
$env:SMOKE_TEST_URL="https://your-app-xxxxx.vercel.app"
$env:CRON_SECRET="<your-cron-secret>"

# Run smoke test
npx tsx scripts/smoke-prod.ts $env:SMOKE_TEST_URL $env:CRON_SECRET
```

**Expected Output:**
```
🔍 Production Smoke Test
============================================================
Target: https://your-app-xxxxx.vercel.app
Time: 2026-01-14T...

✅ Home page loads (XXXms)
   Home page accessible
✅ Health endpoint (XXXms)
   Version 1.3.0, DB latency XXms
✅ Ticker page loads (XXXms)
   Ticker page accessible
✅ Sign in page loads (XXXms)
   Sign in page accessible
✅ Sign up page loads (XXXms)
   Sign up page accessible
✅ Admin page protection (XXXms)
   Admin page properly protected (redirects)
✅ Cron endpoint rejects missing secret (XXXms)
   Cron endpoint properly protected
✅ Cron endpoint accepts valid secret (XXXms)
   Cron executed: {"evaluated":0,"triggered":0}
✅ Public news API (XXXms)
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

### Step 10: Verify Cron Job Configuration

1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify cron job is listed:
   - Path: `/api/cron/evaluate-alerts`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Status: Active

The cron job will automatically use your `CRON_SECRET` from environment variables.

---

## 📊 Deployment Artifacts

### Production URLs

- **Application**: `https://your-app-xxxxx.vercel.app`
- **Health Check**: `https://your-app-xxxxx.vercel.app/api/health`
- **Admin Panel**: `https://your-app-xxxxx.vercel.app/admin`
- **Public API**: `https://your-app-xxxxx.vercel.app/api/public/news`

### Environment Variables Used (Production)

```
✓ DATABASE_URL (Neon PostgreSQL)
✓ NEXTAUTH_SECRET (32-byte base64)
✓ NEXTAUTH_URL (Vercel production URL)
✓ CRON_SECRET (32-byte hex)
✓ RESEND_API_KEY (Resend API key)
✓ NEXT_PUBLIC_APP_VERSION (1.3.0)
✓ VERCEL_GIT_COMMIT_SHA (auto-set by Vercel)
```

### Database Schema

- **Tables**: 11 (User, Ticker, PriceHistory, Catalyst, News, Watchlist, Alert, AlertEvent, ImportJob, JobLock)
- **Enums**: 6 (UserRole, CatalystCategory, ImpactLevel, AlertType, AlertStatus, JobType, JobStatus)
- **Indexes**: 15 (optimized for queries)
- **Constraints**: 8 (foreign keys, unique constraints)

### Initial Data Seeded

- **Users**: 1 admin user
- **Tickers**: 3 sample tickers (AAPL, MSFT, GOOGL)
- **Catalysts**: 0 (to be added via admin panel)
- **News**: 0 (to be added via admin panel or CSV import)
- **Alerts**: 0 (users create their own)

---

## 🔐 Post-Deployment Security Checklist

- [ ] Change default admin password
- [ ] Verify CRON_SECRET is working (test cron endpoint)
- [ ] Verify admin panel requires authentication
- [ ] Test user registration and email verification
- [ ] Verify watchlist CRUD requires authentication
- [ ] Test alert creation and triggering
- [ ] Verify CSV import functionality (admin only)
- [ ] Check health endpoint returns 200 OK
- [ ] Verify database connection is stable
- [ ] Test email sending (if RESEND_API_KEY configured)

---

## 📈 Next Steps After Deployment

1. **Login as Admin**
   - Go to: `https://your-app-xxxxx.vercel.app/login`
   - Email: `admin@pennystocks.local`
   - Password: `ChangeMe123!`
   - **Immediately change password**

2. **Add Production Tickers**
   - Option A: Use admin panel to add tickers manually
   - Option B: Use CSV import feature (see `CSV_IMPORT_README.md`)

3. **Add Catalysts and News**
   - Navigate to Admin → Catalysts
   - Navigate to Admin → News
   - Add relevant data for your tickers

4. **Test User Flow**
   - Register a new user account
   - Add tickers to watchlist
   - Create price alerts
   - Verify alert emails are sent

5. **Monitor Application**
   - Check health endpoint regularly
   - Monitor Vercel logs for errors
   - Check cron job execution logs
   - Monitor database usage in Neon dashboard

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Issue**: Build fails with Prisma errors
**Solution**: Ensure `DATABASE_URL` is set in Vercel environment variables

### Database Connection Fails

**Issue**: `Can't reach database server`
**Solution**: 
- Verify `DATABASE_URL` includes `?sslmode=require`
- Check Neon database is active (not suspended)
- Verify connection string is correct

### Cron Job Not Working

**Issue**: Alerts not being evaluated
**Solution**:
- Verify `CRON_SECRET` is set in Vercel
- Check cron job is active in Vercel dashboard
- Test cron endpoint manually with curl

### Email Sending Fails

**Issue**: Alert emails not being sent
**Solution**:
- Verify `RESEND_API_KEY` is set and valid
- Check Resend dashboard for API usage
- Verify email domain is verified in Resend

### Admin Login Fails

**Issue**: Cannot login with default credentials
**Solution**:
- Verify database was seeded successfully
- Check user exists in database
- Try resetting password via database

---

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Neon Docs**: https://neon.tech/docs
- **Resend Docs**: https://resend.com/docs

---

## ✅ Deployment Complete

Once all steps are completed and smoke tests pass, your application is live and ready for production use!

**Production URL**: `https://your-app-xxxxx.vercel.app`

**Admin Access**: Login with admin credentials and start managing tickers, catalysts, and news.

**User Access**: Users can register, create watchlists, and set up alerts.

**Monitoring**: Check `/api/health` endpoint for application status.
