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