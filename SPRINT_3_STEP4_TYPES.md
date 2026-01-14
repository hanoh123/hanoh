# Sprint 3 Step 4 - Public News API TypeScript Interfaces

## Overview
This document provides the exact TypeScript interfaces for the public news API endpoints, ensuring type safety and clear contracts.

## Public API Response Types

### File: `types/public-api.ts`

```typescript
/**
 * Public API Response Types
 * These interfaces define the exact shape of public API responses
 */

// Base news item as returned by public APIs (no admin fields)
export interface PublicNewsItem {
  id: string
  headline: string
  summary?: string
  source: string
  url?: string
  imageUrl?: string
  author?: string
  publishedAt: string
}

// News item with ticker information (for timeline)
export interface PublicNewsItemWithTicker extends PublicNewsItem {
  ticker: {
    symbol: string
    name: string
  }
}

// Pagination metadata for cursor-based pagination
export interface CursorPagination {
  hasMore: boolean
  nextCursor: string | null
  limit: number
}

// Ticker information
export interface PublicTicker {
  symbol: string
  name: string
}

// Response for GET /api/public/tickers/[symbol]/news
export interface PublicTickerNewsResponse {
  news: PublicNewsItem[]
  pagination: CursorPagination
  ticker: PublicTicker
}

// Response for GET /api/public/news
export interface PublicNewsTimelineResponse {
  news: PublicNewsItemWithTicker[]
  pagination: CursorPagination
}

// Error response format
export interface PublicApiError {
  error: string
  details?: any
}
```

## API Endpoint Signatures

### GET /api/public/tickers/[symbol]/news

**File**: `app/api/public/tickers/[symbol]/news/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
): Promise<NextResponse<PublicTickerNewsResponse | PublicApiError>>
```

**Query Parameters**:
- `limit?: string` - Number of items to return (default: 10, max: 50)
- `cursor?: string` - Cursor for pagination (news ID)

**Response Example**:
```json
{
  "news": [
    {
      "id": "news-1",
      "headline": "Apple Reports Strong Q4 Earnings",
      "summary": "Revenue beats expectations",
      "source": "Reuters",
      "url": "https://reuters.com/apple-earnings",
      "author": "John Doe",
      "publishedAt": "2024-02-15T10:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "news-1",
    "limit": 10
  },
  "ticker": {
    "symbol": "AAPL",
    "name": "Apple Inc."
  }
}
```

**Excluded Fields** (Admin-only, NOT exposed):
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`
- `urlHash`
- `tickerId`

### GET /api/public/news

**File**: `app/api/public/news/route.ts`

```typescript
export async function GET(
  request: NextRequest
): Promise<NextResponse<PublicNewsTimelineResponse | PublicApiError>>
```

**Query Parameters**:
- `limit?: string` - Number of items to return (default: 20, max: 50)
- `cursor?: string` - Cursor for pagination (news ID)

**Response Example**:
```json
{
  "news": [
    {
      "id": "news-1",
      "headline": "Apple Reports Strong Earnings",
      "summary": "Revenue beats expectations",
      "source": "Reuters",
      "url": "https://reuters.com/apple-earnings",
      "author": "John Doe",
      "publishedAt": "2024-02-15T10:00:00Z",
      "ticker": {
        "symbol": "AAPL",
        "name": "Apple Inc."
      }
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "news-1",
    "limit": 20
  }
}
```

**Excluded Fields** (Admin-only, NOT exposed):
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`
- `urlHash`
- `tickerId` (except within ticker object)

## Ordering Guarantee

Both endpoints guarantee stable ordering:
1. **Primary**: `publishedAt DESC` (newest first)
2. **Tie-breaker**: `id DESC` (for articles with same publishedAt)

This ensures:
- Consistent pagination across requests
- No duplicate or missing items when using cursors
- Predictable ordering for UI rendering

## Security & Data Integrity

### No Authentication Required
- Public endpoints are accessible without authentication
- Rate limiting may be applied (implementation-specific)

### Admin Fields Protection
The following fields are **NEVER** exposed in public APIs:
- `createdBy` - Admin user who created the record
- `updatedBy` - Admin user who last updated the record
- `createdAt` - Internal creation timestamp
- `updatedAt` - Internal update timestamp
- `urlHash` - SHA-256 hash used for deduplication
- `tickerId` - Internal foreign key (except in ticker object)

### Validation
- `limit` parameter is capped at 50 to prevent abuse
- Invalid `cursor` values return appropriate error responses
- Non-existent tickers return 404 status

## Usage in Components

### Ticker News Component
**File**: `components/ticker/ticker-news.tsx`

```typescript
import type { PublicTickerNewsResponse, PublicNewsItem } from '@/types/public-api'

// Component uses PublicTickerNewsResponse for API responses
const data: PublicTickerNewsResponse = await response.json()
```

### News Timeline Component
**File**: `components/home/news-timeline.tsx`

```typescript
import type { PublicNewsTimelineResponse, PublicNewsItemWithTicker } from '@/types/public-api'

// Component uses PublicNewsTimelineResponse for API responses
const data: PublicNewsTimelineResponse = await response.json()
```

## Error Handling

### Error Response Format
```typescript
{
  error: string
  details?: any
}
```

### Common Error Codes
- `400` - Invalid query parameters
- `404` - Ticker not found (ticker-specific endpoint only)
- `500` - Internal server error

## Type Safety Benefits

1. **Compile-time Validation**: TypeScript catches type mismatches before runtime
2. **IDE Autocomplete**: Full IntelliSense support for API responses
3. **Refactoring Safety**: Changes to types are caught across the codebase
4. **Documentation**: Types serve as living documentation
5. **Contract Enforcement**: API responses must match declared types

## Testing

All types are validated in test suite:
**File**: `__tests__/public-news-api.test.tsx`

Tests verify:
- Response shape matches TypeScript interfaces
- Admin fields are properly excluded
- Pagination structure is correct
- Error responses follow defined format
