# Data Layer Architecture

## Current State (Sprint 1)

### Demo Data Location
- **File**: `lib/demo-data.ts`
- **Purpose**: Static demo data for development and testing
- **Contents**:
  - `demoTickers`: 8 sample stock tickers with realistic data
  - `demoCatalysts`: 5 sample catalysts linked to tickers
  - `demoPriceHistory`: 30-day price history for charts
  - `marketOverviewData`: Market statistics

### Usage in Components
```typescript
// Current usage (Sprint 1)
import { demoTickers, demoCatalysts } from '@/lib/demo-data'

// Components directly import and use demo data
const trendingTickers = [...demoTickers].sort((a, b) => b.volume - a.volume)
```

## Migration Plan (Sprint 2/3)

### Database Integration
- **File**: `lib/db.ts` (Prisma client already configured)
- **Schema**: `prisma/schema.prisma` (production-ready schema exists)

### Data Service Layer (To be created)
```typescript
// lib/services/ticker-service.ts (Sprint 2)
export async function getTrendingTickers(limit = 20) {
  return await prisma.ticker.findMany({
    orderBy: { volume: 'desc' },
    take: limit,
    include: { catalysts: true }
  })
}

// lib/services/catalyst-service.ts (Sprint 2)
export async function getLatestCatalysts(limit = 10) {
  return await prisma.catalyst.findMany({
    orderBy: { date: 'desc' },
    take: limit,
    include: { ticker: true }
  })
}
```

### Component Migration Strategy
1. **Sprint 2**: Create service layer functions
2. **Sprint 3**: Replace demo data imports with database queries
3. **Maintain**: Keep demo data for testing and development

### Migration Checklist
- [ ] Create `lib/services/` directory
- [ ] Implement ticker service functions
- [ ] Implement catalyst service functions  
- [ ] Update home page to use database queries
- [ ] Update ticker pages to use database queries
- [ ] Add error handling and loading states
- [ ] Keep demo data for tests and development

## Database Schema Status

### ✅ Ready for Production
- Users (authentication, roles)
- Tickers (stock data, metrics)
- PriceHistory (OHLCV data)
- Catalysts (events, categories)
- Watchlists (user favorites)
- Alerts (price/volume notifications)

### Migration Commands
```bash
# Initialize database
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with demo data
npm run db:seed
```

## Performance Considerations

### Current (Demo Data)
- ✅ Fast initial load (static data)
- ✅ No database queries
- ❌ Not scalable
- ❌ No real-time updates

### Future (Database)
- ✅ Real data with updates
- ✅ Scalable architecture
- ✅ Server-side rendering
- ⚠️ Requires caching strategy

### Caching Strategy (Sprint 3+)
- Redis for frequently accessed data
- Next.js ISR for ticker pages
- Database query optimization
- CDN for static assets