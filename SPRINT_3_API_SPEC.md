# Sprint 3 API Specification

## Admin Ticker Management

### GET /api/admin/tickers
Get paginated list of tickers with search and filtering.

**Authorization**: ADMIN role required

**Query Parameters**:
```typescript
{
  page?: string = "1"           // Page number
  limit?: string = "50"         // Items per page (max 100)
  search?: string               // Search by symbol or name
  sector?: string               // Filter by sector
}
```

**Response**:
```typescript
{
  tickers: Array<{
    id: string
    symbol: string
    name: string
    sector?: string
    exchange?: string
    marketCap?: number
    float?: number
    sharesOutstanding?: number
    currentPrice?: number
    volume?: number
    change24h?: number
    changePercent24h?: number
    createdAt: string
    updatedAt: string
    _count: {
      catalysts: number
      news: number
      watchlists: number
      alerts: number
    }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

**Error Codes**:
- `403`: Unauthorized - Admin access required
- `400`: Validation failed
- `500`: Internal server error

### POST /api/admin/tickers
Create a new ticker.

**Authorization**: ADMIN role required

**Request Body**:
```typescript
{
  symbol: string              // 1-10 chars, uppercase letters only
  name: string                // 1-200 chars, required
  sector?: string             // Optional sector
  exchange?: string           // Optional exchange
  marketCap?: number          // Optional, must be positive
  float?: number              // Optional, must be positive
  sharesOutstanding?: number  // Optional, must be positive
}
```

**Response**:
```typescript
{
  ticker: TickerObject
  warnings?: string[]         // Soft validation warnings
}
```

**Error Codes**:
- `403`: Unauthorized - Admin access required
- `409`: Ticker with this symbol already exists
- `400`: Validation failed
- `500`: Internal server error

### GET /api/admin/tickers/[id]
Get detailed ticker information.

**Authorization**: ADMIN role required

**Response**:
```typescript
{
  ticker: TickerObject & {
    catalysts: Array<CatalystObject>  // Last 10
    news: Array<NewsObject>           // Last 10
    _count: {
      catalysts: number
      news: number
      watchlists: number
      alerts: number
      priceHistory: number
    }
  }
}
```

**Error Codes**:
- `403`: Unauthorized - Admin access required
- `404`: Ticker not found
- `500`: Internal server error

### PUT /api/admin/tickers/[id]
Update ticker information (symbol immutable).

**Authorization**: ADMIN role required

**Request Body**:
```typescript
{
  name: string                // 1-200 chars, required
  sector?: string             // Optional sector
  exchange?: string           // Optional exchange
  marketCap?: number          // Optional, must be positive
  float?: number              // Optional, must be positive
  sharesOutstanding?: number  // Optional, must be positive
}
```

**Response**:
```typescript
{
  ticker: TickerObject
  warnings?: string[]         // Soft validation warnings
}
```

**Error Codes**:
- `403`: Unauthorized - Admin access required
- `404`: Ticker not found
- `400`: Validation failed
- `500`: Internal server error

### DELETE /api/admin/tickers/[id]
Delete ticker (only if no dependencies).

**Authorization**: ADMIN role required

**Response**:
```typescript
{
  message: string
}
```

**Error Codes**:
- `403`: Unauthorized - Admin access required
- `404`: Ticker not found
- `409`: Cannot delete ticker with existing data
- `500`: Internal server error

## Admin Catalyst Management

### GET /api/admin/catalysts
Get paginated list of catalysts.

**Authorization**: ADMIN role required

**Query Parameters**:
```typescript
{
  page?: string = "1"
  limit?: string = "50"
  tickerId?: string           // Filter by ticker
  category?: CatalystCategory // Filter by category
  impactLevel?: ImpactLevel   // Filter by impact level
  dateFrom?: string           // ISO date string
  dateTo?: string             // ISO date string
}
```

### POST /api/admin/catalysts
Create new catalyst.

**Authorization**: ADMIN role required

**Request Body**:
```typescript
{
  tickerId: string            // Must exist
  title: string               // 1-200 chars
  description?: string        // Optional description
  date: string                // ISO date string
  category: CatalystCategory  // Enum value
  impactLevel: ImpactLevel    // Enum value
}
```

### PUT /api/admin/catalysts/[id]
Update catalyst.

### DELETE /api/admin/catalysts/[id]
Delete catalyst.

## Admin News Management

### GET /api/admin/news
Get paginated list of news articles.

**Authorization**: ADMIN role required

### POST /api/admin/news
Create news article with deduplication.

**Authorization**: ADMIN role required

**Request Body**:
```typescript
{
  tickerId: string            // Must exist
  headline: string            // 1-500 chars
  summary?: string            // Optional summary
  source: string              // 1-100 chars
  url?: string                // Optional URL (used for deduplication)
  publishedAt: string         // ISO date string
}
```

**Deduplication**: If URL provided, SHA-256 hash stored in `urlHash` field with unique constraint.

### PUT /api/admin/news/[id]
Update news article.

### DELETE /api/admin/news/[id]
Delete news article.

## Alert System APIs

### POST /api/admin/alerts/evaluate
Manually trigger alert evaluation (for testing).

**Authorization**: ADMIN role required

**Response**:
```typescript
{
  evaluated: number           // Number of alerts evaluated
  triggered: number           // Number of alerts triggered
  sent: number                // Number of emails sent
  failed: number              // Number of failed sends
  errors: string[]            // Error messages if any
}
```

### GET /api/admin/alerts/events
Get alert event history.

**Authorization**: ADMIN role required

**Query Parameters**:
```typescript
{
  page?: string = "1"
  limit?: string = "50"
  status?: AlertStatus        // Filter by status
  alertId?: string            // Filter by specific alert
  dateFrom?: string           // ISO date string
  dateTo?: string             // ISO date string
}
```

**Response**:
```typescript
{
  events: Array<{
    id: string
    alertId: string
    triggeredAt: string
    measuredValue: number
    sentAt?: string
    status: AlertStatus
    errorMessage?: string
    alert: {
      id: string
      type: AlertType
      user: { email: string }
      ticker: { symbol: string }
    }
  }>
  pagination: PaginationObject
}
```

## Data Import APIs

### POST /api/admin/import/price-history
Import price history via CSV.

**Authorization**: ADMIN role required

**Request**: Multipart form data with CSV file

**CSV Format**:
```csv
symbol,date,open,high,low,close,volume
AAPL,2024-01-15,150.00,152.50,149.75,151.25,45000000
```

**Response**:
```typescript
{
  jobId: string               // Import job ID for tracking
  totalRows: number           // Total rows in CSV
  validRows: number           // Valid rows to process
  errors: Array<{
    row: number
    error: string
  }>
}
```

### GET /api/admin/import/jobs
Get import job history.

**Authorization**: ADMIN role required

### GET /api/admin/import/jobs/[id]
Get specific import job status.

**Authorization**: ADMIN role required

**Response**:
```typescript
{
  job: {
    id: string
    type: JobType
    status: JobStatus
    fileName?: string
    totalRows?: number
    processedRows?: number
    errorRows?: number
    errorMessage?: string
    startedAt: string
    completedAt?: string
    createdBy?: string
  }
}
```

## Error Response Format

All API endpoints return errors in consistent format:

```typescript
{
  error: string               // Human-readable error message
  details?: any               // Additional error details
  code?: string               // Error code for programmatic handling
}
```

## Rate Limiting

- Admin endpoints: 100 requests per minute per user
- Import endpoints: 10 requests per minute per user
- Alert evaluation: 1 request per minute per user

## Audit Trail

All admin operations include audit fields:
- `createdBy`: User ID who created the record
- `updatedBy`: User ID who last updated the record
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

## Validation Rules

### Ticker Validation
- Symbol: 1-10 uppercase letters only, unique
- Name: 1-200 characters, required
- Numeric fields: Must be positive if provided
- Soft warnings: Market cap > $1T, Float > Shares Outstanding

### Catalyst Validation
- Title: 1-200 characters, required
- Date: Must be valid ISO date
- Category: Must be valid enum value
- Impact Level: Must be valid enum value

### News Validation
- Headline: 1-500 characters, required
- Source: 1-100 characters, required
- URL: Must be valid URL if provided
- Deduplication: URL hash must be unique

### Alert Validation
- Threshold values: Must be positive numbers
- Alert type: Must match provided threshold fields
- Cooldown: Minimum 1 hour between identical alerts