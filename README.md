# Penny Stocks Tracker

A production-grade web application for tracking penny stocks, catalysts, and market opportunities.

## 🚀 Deployment Status

**Infrastructure**: ✅ Production-Ready  
**Deployment**: ⏳ Pending User Action  
**Version**: 1.3.0  
**Sprint**: 4 Phase 1

> **Note**: All deployment infrastructure is complete and tested. Ready to deploy to Vercel in 30 minutes.  
> See `NEXT_STEPS.md` for deployment instructions.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel + Neon/Supabase PostgreSQL
- **Charts**: Recharts
- **Email**: Resend

## Features

- 📈 Real-time penny stock tracking
- 🔍 Advanced stock screener
- 📊 Interactive price charts
- 🚨 Email price alerts
- 📰 Catalyst timeline
- 👤 User watchlists
- 🛡️ Admin content management
- 📱 Mobile-first responsive design

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd penny-stocks-tracker
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/penny_stocks"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Stock Data API (optional for MVP)
STOCK_API_KEY="your-api-key"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed demo data (optional)
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Admin Access
Create admin user:
```bash
npm run create-admin
```

## Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth pages group
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── ticker/            # Ticker detail pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── charts/           # Chart components
│   └── forms/            # Form components
├── lib/                  # Utilities and configurations
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run db:seed      # Seed database with demo data
npm run db:reset     # Reset database
npm run create-admin # Create admin user
```

## Deployment

### Quick Start (30 minutes)
See `DEPLOYMENT_QUICK_START.md` for fast-track deployment guide.

### Comprehensive Guide
See `DEPLOYMENT_RUNBOOK.md` for detailed step-by-step instructions.

### Deployment Checklist
Use `DEPLOYMENT_CHECKLIST.md` to track your deployment progress.

### What's Ready
- ✅ Vercel configuration (`vercel.json`)
- ✅ Database migrations (Prisma)
- ✅ Production seed scripts
- ✅ Health monitoring endpoint
- ✅ Cron automation (alerts every 5 min)
- ✅ Smoke test scripts
- ✅ Complete documentation

### What You Need
1. Vercel account (free tier works)
2. PostgreSQL database (Neon or Supabase)
3. Resend API key (optional, for email alerts)
4. 30-45 minutes to deploy

### After Deployment
Once deployed, update documentation with real URLs and capture artifacts.  
See `NEXT_STEPS.md` for post-deployment steps.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Disclaimer

This application is for informational purposes only and does not constitute financial advice. Always do your own research before making investment decisions.