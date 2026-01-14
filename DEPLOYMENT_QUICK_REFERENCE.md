# Deployment Quick Reference Card

## 🎯 One-Page Deployment Guide

### Prerequisites
- ✅ Node.js v24.13.0 installed
- ✅ npm 11.6.2 installed
- ✅ Git initialized
- ✅ Build successful locally

---

## 🚀 5-Step Deployment

### 1️⃣ Create Neon Database (2 min)
```
1. Go to: https://neon.tech
2. Sign up → Create project: "penny-stocks-tracker"
3. Copy connection string
```

### 2️⃣ Generate Secrets (1 min)
```powershell
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -hex 32     # CRON_SECRET
```

### 3️⃣ Get Resend API Key (2 min)
```
1. Go to: https://resend.com
2. Sign up → API Keys → Create new key
3. Copy key (starts with re_)
```

### 4️⃣ Push to GitHub (2 min)
```powershell
git commit -m "Production ready"
git remote add origin https://github.com/YOUR-USERNAME/penny-stocks-tracker.git
git push -u origin main
```

### 5️⃣ Deploy to Vercel (5 min)
```
1. Go to: https://vercel.com/new
2. Import GitHub repo
3. Add environment variables (see below)
4. Click Deploy
```

---

## 🔐 Environment Variables

Copy these into Vercel:

```env
DATABASE_URL=<neon-connection-string>
NEXTAUTH_SECRET=<generated-base64-secret>
NEXTAUTH_URL=https://your-app.vercel.app
CRON_SECRET=<generated-hex-secret>
RESEND_API_KEY=<resend-api-key>
NEXT_PUBLIC_APP_VERSION=1.3.0
```

---

## 🗄️ Post-Deployment Database Setup

```powershell
# Set DATABASE_URL
$env:DATABASE_URL="<neon-connection-string>"

# Run migrations
npx prisma migrate deploy

# Seed data
npx tsx scripts/seed-production.ts
```

**Default Admin:**
- Email: `admin@pennystocks.local`
- Password: `ChangeMe123!`

---

## ✅ Verify Deployment

```powershell
# Run smoke test
$env:SMOKE_TEST_URL="https://your-app.vercel.app"
$env:CRON_SECRET="<your-cron-secret>"
npx tsx scripts/smoke-prod.ts $env:SMOKE_TEST_URL $env:CRON_SECRET
```

**Expected**: All 9 tests pass ✅

---

## 📍 Important URLs

- **App**: `https://your-app.vercel.app`
- **Health**: `https://your-app.vercel.app/api/health`
- **Admin**: `https://your-app.vercel.app/admin`
- **Login**: `https://your-app.vercel.app/login`

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check `DATABASE_URL` is set in Vercel |
| DB connection fails | Add `?sslmode=require` to connection string |
| Cron not working | Verify `CRON_SECRET` in Vercel env vars |
| Email fails | Check `RESEND_API_KEY` is valid |
| Can't login | Run seed script again |

---

## 📞 Need Help?

- Full guide: `SPRINT_4_PHASE1_DEPLOYMENT_READY.md`
- Detailed steps: `DEPLOYMENT_STEPS.md`
- Environment vars: `ENV_VARS.md`
- Runbook: `DEPLOYMENT_RUNBOOK.md`

---

**Total Time**: ~15 minutes from start to deployed app 🚀
