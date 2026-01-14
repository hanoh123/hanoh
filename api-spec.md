# API Specification - Penny Stocks Tracker

## Authentication
- Uses NextAuth.js with email/password
- Protected routes require valid session
- Admin routes require `role: ADMIN`

## Public Routes

### GET /api/tickers/trending
Get trending tickers by volume/price change
```json
Response: {
  "data": [
    {
      "id": "string",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "currentPrice": 150.25,
      "change24h": 2.50,
      "changePercent24h": 1.69,
      "volume": 50000000,
      "marketCap": 2500000000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### GET /api/tickers/[symbol]
Get detailed ticker information
```json
Response: {
  "ticker": {
    "id": "string",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "currentPrice": 150.25,
    "volume": 50000000,
    "marketCap": 2500000000,
    "float": 15000000000,
    "sharesOutstanding": 16000000000
  },
  "priceHistory": [
    {
      "date": "2024-01-01",
      "open": 148.00,
      "high": 152.00,
      "low": 147.50,
      "close": 150.25,
      "volume": 45000000
    }
  ],
  "catalysts": [
    {
      "id": "string",
      "title": "Q4 Earnings Report",
      "description": "Expected strong iPhone sales",
      "date": "2024-01-15",
      "category": "EARNINGS",
      "impactLevel": "HIGH"
    }
  ]
}
```

### GET /api/tickers/screen
Screen tickers with filters
```json
Query params: {
  "minPrice": 0.01,
  "maxPrice": 10.00,
  "minVolume": 1000000,
  "minMarketCap": 1000000,
  "maxMarketCap": 1000000000,
  "sector": "Technology",
  "minChange": -50,
  "maxChange": 50,
  "page": 1,
  "limit": 50,
  "sortBy": "volume",
  "sortOrder": "desc"
}

Response: {
  "data": [...],
  "pagination": {...}
}
```

## Protected Routes (User)

### GET /api/user/watchlist
Get user's watchlist
```json
Response: {
  "watchlist": [
    {
      "id": "string",
      "ticker": {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "currentPrice": 150.25,
        "changePercent24h": 1.69
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/user/watchlist
Add ticker to watchlist
```json
Request: {
  "tickerId": "string"
}

Response: {
  "success": true,
  "watchlistItem": {...}
}
```

### DELETE /api/user/watchlist/[id]
Remove from watchlist

### GET /api/user/alerts
Get user's alerts

### POST /api/user/alerts
Create new alert
```json
Request: {
  "tickerId": "string",
  "type": "PRICE_ABOVE",
  "priceAbove": 155.00
}
```

## Admin Routes

### GET /api/admin/tickers
Get all tickers with admin details

### POST /api/admin/tickers
Create new ticker
```json
Request: {
  "symbol": "NEWCO",
  "name": "New Company Inc.",
  "sector": "Technology",
  "exchange": "NASDAQ"
}
```

### PUT /api/admin/tickers/[id]
Update ticker information

### POST /api/admin/tickers/import
Bulk import tickers via CSV

### POST /api/admin/catalysts
Create new catalyst
```json
Request: {
  "tickerId": "string",
  "title": "FDA Approval Expected",
  "description": "Phase 3 trial results pending",
  "date": "2024-02-01",
  "category": "FDA_APPROVAL",
  "impactLevel": "HIGH"
}
```

### PUT /api/admin/catalysts/[id]
Update catalyst

### DELETE /api/admin/catalysts/[id]
Delete catalyst

## Data Update Routes

### POST /api/admin/data/update-prices
Trigger price data update (manual or cron)

### GET /api/admin/data/status
Get data update status and last update times