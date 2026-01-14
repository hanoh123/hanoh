# Sprint 4 Phase 1 - Production Deployment Steps

## Step 1: Create Production Database (Neon)

1. Go to https://neon.tech
2. Sign up/Login with GitHub
3. Create a new project:
   - Name: `penny-stocks-tracker`
   - Region: Choose closest to your users
   - Postgres version: 16 (latest)
4. Copy the connection string (it will look like):
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: Generate Secrets

Run these commands locally to generate secure secrets:

```powershell
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

Save these values - you'll need them for Vercel.

## Step 3: Set Up Resend Email

1. Go to https://resend.com
2. Sign up/Login
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `re_`)

## Step 4: Push to GitHub

```powershell
cd C:\Users\hanoh\gamestop

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Sprint 4 Phase 1 ready"

# Create GitHub repo at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR-USERNAME/penny-stocks-tracker.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

4. Add Environment Variables:
   ```
   DATABASE_URL=<your-neon-connection-string>
   NEXTAUTH_SECRET=<generated-secret-from-step-2>
   NEXTAUTH_URL=https://your-app.vercel.app
   CRON_SECRET=<generated-secret-from-step-2>
   RESEND_API_KEY=<your-resend-api-key>
   NEXT_PUBLIC_APP_VERSION=1.3.0
   ```

5. Click "Deploy"

## Step 6: Run Database Migrations

After deployment succeeds:

```powershell
# Set DATABASE_URL locally
$env:DATABASE_URL="<your-neon-connection-string>"

# Run migrations
npx prisma migrate deploy

# Seed initial data
npx tsx scripts/seed-production.ts
```

## Step 7: Verify Deployment

1. Visit your Vercel URL
2. Check health endpoint: `https://your-app.vercel.app/api/health`
3. Register first admin user
4. Test login
5. Test cron endpoint (should be protected)

## Step 8: Configure Vercel Cron

The cron is already configured in `vercel.json`. After deployment:

1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify the cron job is listed: `/api/cron/evaluate-alerts` (every 5 minutes)
3. The cron will automatically use your `CRON_SECRET` from environment variables

## Next Steps

After successful deployment, run the smoke test:

```powershell
$env:PROD_URL="https://your-app.vercel.app"
npx tsx scripts/smoke-prod.ts
```
