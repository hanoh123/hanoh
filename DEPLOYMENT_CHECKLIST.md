# Production Deployment Checklist

Use this checklist to track your deployment progress and ensure nothing is missed.

---

## Pre-Deployment

### Local Validation
- [ ] `npm install` - All dependencies installed
- [ ] `npm run build` - Build succeeds locally
- [ ] `npm test` - All tests passing (87/87)
- [ ] `npx tsc --noEmit` - No TypeScript errors
- [ ] `npm run lint` - No linting errors
- [ ] Git repository up to date

### Account Setup
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Database account created (Neon or Supabase)
- [ ] Resend account created (optional)
- [ ] All account credentials saved securely

---

## Deployment

### Step 1: Generate Secrets
- [ ] `NEXTAUTH_SECRET` generated (`openssl rand -base64 32`)
- [ ] `CRON_SECRET` generated (`openssl rand -hex 32`)
- [ ] Secrets saved securely (password manager)

### Step 2: Database Setup
- [ ] Database created (Neon/Supabase)
- [ ] Connection string copied
- [ ] Connection string includes `?sslmode=require`
- [ ] Connection tested locally (`psql $DATABASE_URL -c "SELECT 1"`)

### Step 3: Vercel Configuration
- [ ] Repository imported to Vercel
- [ ] Environment variables added:
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL` (placeholder initially)
  - [ ] `CRON_SECRET`
  - [ ] `RESEND_API_KEY` (optional)
  - [ ] `NEXT_PUBLIC_APP_VERSION` = `1.3.0`
- [ ] All secrets marked as "Sensitive"
- [ ] Environment scope set to "Production" and "Preview"

### Step 4: Initial Deployment
- [ ] Clicked "Deploy" button
- [ ] Build completed successfully
- [ ] Production URL obtained
- [ ] `NEXTAUTH_URL` updated with real URL
- [ ] Redeployed (if URL was updated)

### Step 5: Database Migration
- [ ] `DATABASE_URL` exported locally
- [ ] `npx prisma generate` executed
- [ ] `npx prisma migrate deploy` executed
- [ ] All migrations applied successfully
- [ ] Migration output saved to `artifacts/migration-output.txt`

### Step 6: Database Seeding
- [ ] Seed strategy chosen (auto-seed or interactive)
- [ ] Seed script executed successfully
- [ ] Admin user created
- [ ] Admin credentials saved securely
- [ ] Seed output saved to `artifacts/seed-output.txt`

---

## Verification

### Basic Functionality
- [ ] Production URL accessible
- [ ] Home page loads without errors
- [ ] `/api/health` returns 200 OK
- [ ] Health response shows `"status":"healthy"` or `"degraded"`
- [ ] Database latency < 100ms (check health response)

### Authentication
- [ ] `/auth/signin` page loads
- [ ] `/auth/signup` page loads
- [ ] Admin login works with created credentials
- [ ] Login redirects to `/admin` dashboard
- [ ] Admin dashboard displays correctly

### Admin Functions
- [ ] `/admin/tickers` accessible
- [ ] Can create test ticker
- [ ] Can edit test ticker
- [ ] Can delete test ticker
- [ ] `/admin/catalysts` accessible
- [ ] `/admin/news` accessible
- [ ] `/admin/imports` accessible

### Cron Configuration
- [ ] Vercel Dashboard → Cron tab shows job
- [ ] Cron path: `/api/cron/evaluate-alerts`
- [ ] Cron schedule: `*/5 * * * *`
- [ ] Cron status: Active
- [ ] Recent execution visible in logs
- [ ] Manual cron test succeeds (with valid secret)
- [ ] Manual cron test fails (without secret)

### Smoke Tests
- [ ] Smoke test script executed
- [ ] All 9 tests passing:
  - [ ] Home page loads
  - [ ] Health endpoint
  - [ ] Ticker page loads
  - [ ] Sign in page loads
  - [ ] Sign up page loads
  - [ ] Admin page protection
  - [ ] Cron endpoint rejects missing secret
  - [ ] Cron endpoint accepts valid secret
  - [ ] Public news API
- [ ] Smoke test output saved to `artifacts/smoke-test-output.txt`

---

## Artifact Collection

### Command Outputs
- [ ] `artifacts/` folder created
- [ ] `artifacts/build-output.txt` - Build output saved
- [ ] `artifacts/migration-output.txt` - Migration output saved
- [ ] `artifacts/seed-output.txt` - Seed output saved
- [ ] `artifacts/health-response.json` - Health response saved
- [ ] `artifacts/smoke-test-output.txt` - Smoke test output saved
- [ ] `artifacts/cron-response.json` - Cron response saved

### Screenshots (Optional)
- [ ] Vercel deployment success screen
- [ ] Vercel environment variables (values hidden)
- [ ] Vercel Cron dashboard
- [ ] Database dashboard (connection count)
- [ ] Resend dashboard (if configured)

---

## Documentation Updates

### New Files Created
- [ ] `SPRINT_4_PHASE1_DEPLOYED.md` - Deployment record with real data
- [ ] `DEPLOYMENT_ARTIFACTS.md` - Renamed from template with real outputs
- [ ] `artifacts/` folder with all outputs

### Files Updated
- [ ] `SPRINT_4_PHASE1_EVIDENCE.md` - Replaced placeholders with real URLs
- [ ] `SPRINT_4_PHASE1_COMPLETE.md` - Added "DEPLOYED" status
- [ ] `README.md` - Added production URL and deployment status
- [ ] All documentation uses real production URL (no placeholders)

---

## Post-Deployment

### Security
- [ ] Default admin password changed (if using seed)
- [ ] Admin email updated to real company email
- [ ] Secrets stored in password manager
- [ ] `.env.local` not committed to git
- [ ] Vercel environment variables marked as sensitive

### Monitoring
- [ ] Vercel Analytics enabled (optional)
- [ ] Cron execution logs reviewed
- [ ] Database performance checked
- [ ] Email delivery tested (if configured)
- [ ] Error tracking configured (optional)

### Data Population
- [ ] Production tickers imported (CSV or manual)
- [ ] Sample catalysts created
- [ ] Sample news items created
- [ ] Sample alerts configured
- [ ] Test watchlist created

---

## Final Verification

### Deployment Complete
- [ ] All checklist items above completed
- [ ] Production URL documented everywhere
- [ ] All artifacts captured and saved
- [ ] All documentation updated
- [ ] No placeholder URLs remain
- [ ] No "expected outputs" remain

### Sprint 4 Phase 1 Success Criteria
- [ ] Application deployed to Vercel with real URL
- [ ] Database migrations applied to production
- [ ] Admin user created and can login
- [ ] Health endpoint returns real healthy response
- [ ] Smoke tests pass with real outputs (9/9)
- [ ] Cron job visible and executing in Vercel
- [ ] All documentation updated with real data
- [ ] Deployment artifacts file created
- [ ] Verification checklist completed
- [ ] Ready for Sprint 4 Phase 2

---

## Rollback Plan (If Needed)

### If Deployment Fails
1. [ ] Check Vercel logs for errors
2. [ ] Verify environment variables
3. [ ] Test database connection
4. [ ] Redeploy from Vercel dashboard
5. [ ] Contact support if needed

### If Database Issues
1. [ ] Verify connection string
2. [ ] Check SSL mode enabled
3. [ ] Test connection with `psql`
4. [ ] Review migration logs
5. [ ] Restore from backup if needed

### If Cron Issues
1. [ ] Verify `vercel.json` committed
2. [ ] Check `CRON_SECRET` set
3. [ ] Redeploy to pick up config
4. [ ] Test endpoint manually
5. [ ] Review Vercel Cron logs

---

## Support Resources

### Documentation
- `DEPLOYMENT_RUNBOOK.md` - Complete deployment guide
- `DEPLOYMENT_QUICK_START.md` - Fast-track guide
- `ENV_VARS.md` - Environment variables reference
- `SPRINT_4_PHASE1_COMPLETE.md` - Infrastructure overview

### Scripts
- `scripts/smoke-prod.ts` - Smoke test script
- `scripts/seed-production.ts` - Production seed
- `scripts/create-admin-user.ts` - Admin bootstrap

### External Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## Notes

**Estimated Time**: 30-45 minutes

**Blockers**: None (all infrastructure ready)

**Dependencies**: User must perform deployment steps

**Next Sprint**: Sprint 4 Phase 2 (Custom domain, enhanced monitoring)

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Production URL**: _______________  
**Database Provider**: _______________  
**Email Provider**: _______________  

---

## Sign-Off

- [ ] Deployment completed successfully
- [ ] All verification steps passed
- [ ] All artifacts captured
- [ ] All documentation updated
- [ ] Ready for production use
- [ ] Sprint 4 Phase 1 COMPLETE

**Signed**: _______________  
**Date**: _______________
