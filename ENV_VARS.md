# Environment Variables Reference

Complete reference for all environment variables used in the Penny Stocks Tracker application.

## Required Variables

### Database

| Variable | Description | Required | Example Value | Where Used |
|----------|-------------|----------|---------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | `postgresql://user:pass@host:5432/dbname` | Prisma, all DB operations |

### Authentication

| Variable | Description | Required | Example Value | Where Used |
|----------|-------------|----------|---------------|------------|
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | ✅ Yes | `openssl rand -base64 32` | NextAuth, session management |
| `NEXTAUTH_URL` | Canonical URL of the application | ✅ Yes (Prod) | `https://your-app.vercel.app` | NextAuth, OAuth callbacks |

### Email Provider

| Variable | Description | Required | Example Value | Where Used |
|----------|-------------|----------|---------------|------------|
| `RESEND_API_KEY` | Resend API key for email notifications | ⚠️ Optional | `re_xxxxxxxxxxxx` | Alerts engine, email notifications |

### Cron Security

| Variable | Description | Required | Example Value | Where Used |
|----------|-------------|----------|---------------|------------|
| `CRON_SECRET` | Secret token for cron endpoint authentication | ✅ Yes (Prod) | `openssl rand -hex 32` | Cron endpoints protection |

### Application Metadata

| Variable | Description | Required | Example Value | Where Used |
|----------|-------------|----------|---------------|------------|
| `NEXT_PUBLIC_APP_VERSION` | Application version for health checks | ❌ Optional | `1.3.0` | Health endpoint, monitoring |
| `VERCEL_GIT_COMMIT_SHA` | Git commit SHA (auto-set by Vercel) | ❌ Auto | `abc123...` | Health endpoint, debugging |

---

## Environment-Specific Configuration

### Development (.env.local)

```env
# Database (local PostgreSQL or Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pennystocks_dev"

# NextAuth
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional in dev - gracefully disabled if missing)
# RESEND_API_KEY="re_dev_key"

# Cron (optional in dev)
CRON_SECRET="dev-cron-secret"

# App Version
NEXT_PUBLIC_APP_VERSION="1.3.0-dev"
```

### Production (Vercel Environment Variables)

```env
# Database (Neon, Supabase, or other managed Postgres)
DATABASE_URL="postgresql://user:password@host.region.provider.com:5432/dbname?sslmode=require"

# NextAuth (CRITICAL - use strong secrets)
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="https://your-app.vercel.app"

# Email (required for alerts)
RESEND_API_KEY="re_prod_xxxxxxxxxxxx"

# Cron Security (CRITICAL)
CRON_SECRET="<generate with: openssl rand -hex 32>"

# App Version (auto-set by Vercel)
NEXT_PUBLIC_APP_VERSION="1.3.0"
# VERCEL_GIT_COMMIT_SHA is auto-set by Vercel
```

---

## Generating Secure Secrets

### NEXTAUTH_SECRET
```bash
# Generate a secure random secret
openssl rand -base64 32

# Example output:
# 8xKj9mP2nQ4rS6tU8vW0xY2zA4bC6dE8fG0hI2jK4lM=
```

### CRON_SECRET
```bash
# Generate a secure hex secret
openssl rand -hex 32

# Example output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## Variable Validation

### Startup Validation

The application validates critical environment variables on startup:

```typescript
// lib/env-validation.ts
const requiredEnvVars = {
  development: ['DATABASE_URL', 'NEXTAUTH_SECRET'],
  production: ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'CRON_SECRET']
}
```

### Runtime Checks

- **Database**: Connection tested on first query
- **Email**: Gracefully disabled if `RESEND_API_KEY` missing (logs warning)
- **Cron**: Rejects requests without valid `CRON_SECRET`

---

## Security Best Practices

### 1. Never Commit Secrets
```gitignore
# Already in .gitignore
.env
.env.local
.env.production
.env*.local
```

### 2. Rotate Secrets Regularly
- **NEXTAUTH_SECRET**: Rotate every 90 days (invalidates all sessions)
- **CRON_SECRET**: Rotate every 30 days (update cron job config)
- **RESEND_API_KEY**: Rotate if compromised

### 3. Use Different Secrets Per Environment
- Never use development secrets in production
- Use Vercel's environment variable management
- Enable "Sensitive" flag for all secrets in Vercel

### 4. Principle of Least Privilege
- Database user should have minimal required permissions
- Use read-only replicas for analytics if needed
- Separate admin operations from public API

---

## Vercel Configuration

### Setting Environment Variables in Vercel

1. **Via Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add each variable with appropriate scope (Production/Preview/Development)
   - Mark sensitive variables as "Sensitive"

2. **Via Vercel CLI**:
   ```bash
   # Set production variable
   vercel env add DATABASE_URL production
   
   # Set preview variable
   vercel env add DATABASE_URL preview
   
   # Pull environment variables locally
   vercel env pull .env.local
   ```

3. **Scopes**:
   - **Production**: Only production deployments
   - **Preview**: Branch preview deployments
   - **Development**: Local development with `vercel dev`

---

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify SSL mode for managed databases
# Should include: ?sslmode=require
```

### NextAuth Session Issues

**Error**: `[next-auth][error][JWT_SESSION_ERROR]`
```bash
# Verify NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET

# Verify NEXTAUTH_URL matches deployment URL
echo $NEXTAUTH_URL

# Clear browser cookies and retry
```

### Cron Authentication Failures

**Error**: `Unauthorized - Invalid cron secret`
```bash
# Verify CRON_SECRET matches in both:
# 1. Vercel environment variables
# 2. Vercel Cron configuration (vercel.json)

# Test cron endpoint
curl -X GET "https://your-app.vercel.app/api/cron/evaluate-alerts" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Email Sending Failures

**Error**: `Email service not configured`
```bash
# Verify RESEND_API_KEY is set
echo $RESEND_API_KEY

# Test Resend API key
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json"
```

---

## Environment Variable Checklist

### Pre-Deployment Checklist

- [ ] `DATABASE_URL` set with production database
- [ ] `NEXTAUTH_SECRET` generated with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` matches Vercel deployment URL
- [ ] `CRON_SECRET` generated with `openssl rand -hex 32`
- [ ] `RESEND_API_KEY` obtained from Resend dashboard
- [ ] All secrets marked as "Sensitive" in Vercel
- [ ] Different secrets used for Production vs Preview
- [ ] `.env.local` added to `.gitignore`
- [ ] No secrets committed to git repository

### Post-Deployment Verification

- [ ] Health endpoint returns 200 OK
- [ ] Database connectivity confirmed
- [ ] Authentication flow works (register/login)
- [ ] Admin access functional
- [ ] Cron endpoint protected (rejects invalid secret)
- [ ] Email alerts functional (if RESEND_API_KEY set)

---

## Reference Links

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Resend API Documentation](https://resend.com/docs/api-reference/introduction)
- [OpenSSL Random Generation](https://www.openssl.org/docs/man1.1.1/man1/rand.html)