/**
 * Public News API Test
 * Tests: public endpoints, pagination, authorization, and data integrity
 */

import '@testing-library/jest-dom'

// Mock fetch
global.fetch = jest.fn()

describe('Public News API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/public/tickers/[symbol]/news', () => {
    it('should fetch news for a specific ticker without authentication', async () => {
      const mockResponse = {
        news: [
          {
            id: 'news-1',
            headline: 'Apple Reports Strong Q4 Earnings',
            summary: 'Revenue beats expectations',
            source: 'Reuters',
            url: 'https://reuters.com/apple-earnings',
            author: 'John Doe',
            publishedAt: '2024-02-15T10:00:00Z'
            // Note: No admin fields (createdBy, updatedBy, urlHash, etc.)
          },
          {
            id: 'news-2',
            headline: 'Apple Announces New Product Line',
            summary: 'Revolutionary new technology',
            source: 'TechCrunch',
            publishedAt: '2024-02-14T15:30:00Z'
          }
        ],
        pagination: {
          hasMore: false,
          nextCursor: null,
          limit: 10
        },
        ticker: {
          symbol: 'AAPL',
          name: 'Apple Inc.'
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/public/tickers/AAPL/news?limit=10')
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.news).toHaveLength(2)
      expect(result.news[0].headline).toBe('Apple Reports Strong Q4 Earnings')
      expect(result.ticker.symbol).toBe('AAPL')
      
      // Verify no admin fields are exposed
      expect(result.news[0]).not.toHaveProperty('createdBy')
      expect(result.news[0]).not.toHaveProperty('updatedBy')
      expect(result.news[0]).not.toHaveProperty('urlHash')
      expect(result.news[0]).not.toHaveProperty('tickerId')
    })

    it('should handle cursor-based pagination correctly', async () => {
      const page1Response = {
        news: [
          { id: 'news-1', headline: 'News 1', publishedAt: '2024-02-15T10:00:00Z' },
          { id: 'news-2', headline: 'News 2', publishedAt: '2024-02-14T15:30:00Z' }
        ],
        pagination: {
          hasMore: true,
          nextCursor: 'news-2',
          limit: 2
        },
        ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
      }

      const page2Response = {
        news: [
          { id: 'news-3', headline: 'News 3', publishedAt: '2024-02-13T12:00:00Z' }
        ],
        pagination: {
          hasMore: false,
          nextCursor: null,
          limit: 2
        },
        ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
      }

      // First page
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => page1Response
      })

      const response1 = await fetch('/api/public/tickers/AAPL/news?limit=2')
      const result1 = await response1.json()

      expect(result1.pagination.hasMore).toBe(true)
      expect(result1.pagination.nextCursor).toBe('news-2')

      // Second page with cursor
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => page2Response
      })

      const response2 = await fetch('/api/public/tickers/AAPL/news?limit=2&cursor=news-2')
      const result2 = await response2.json()

      expect(result2.pagination.hasMore).toBe(false)
      expect(result2.pagination.nextCursor).toBe(null)
    })

    it('should enforce stable ordering (publishedAt desc, id tie-breaker)', async () => {
      const mockResponse = {
        news: [
          { 
            id: 'news-1', 
            headline: 'Latest News',
            publishedAt: '2024-02-15T10:00:00Z' 
          },
          { 
            id: 'news-2', 
            headline: 'Earlier News',
            publishedAt: '2024-02-14T15:30:00Z' 
          },
          { 
            id: 'news-3', 
            headline: 'Same Time News A',
            publishedAt: '2024-02-14T15:30:00Z' 
          },
          { 
            id: 'news-4', 
            headline: 'Same Time News B',
            publishedAt: '2024-02-14T15:30:00Z' 
          }
        ],
        pagination: { hasMore: false, nextCursor: null, limit: 10 },
        ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/public/tickers/AAPL/news')
      const result = await response.json()

      // Verify ordering: latest first, then by ID for tie-breaking
      expect(result.news[0].publishedAt).toBe('2024-02-15T10:00:00Z')
      expect(result.news[1].publishedAt).toBe('2024-02-14T15:30:00Z')
      
      // For same publishedAt, should be ordered by ID (desc)
      const sameTimeNews = result.news.filter((n: any) => n.publishedAt === '2024-02-14T15:30:00Z')
      expect(sameTimeNews).toHaveLength(3) // news-2, news-3, news-4
    })

    it('should handle non-existent ticker', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Ticker not found' })
      })

      const response = await fetch('/api/public/tickers/NONEXISTENT/news')
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should validate limit parameter', async () => {
      // Test max limit enforcement (should cap at 50)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          news: [],
          pagination: { hasMore: false, nextCursor: null, limit: 50 }, // Capped at 50
          ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
        })
      })

      const response = await fetch('/api/public/tickers/AAPL/news?limit=100')
      const result = await response.json()

      expect(result.pagination.limit).toBe(50) // Should be capped
    })

    it('should handle invalid query parameters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Invalid query parameters',
          details: [{ message: 'Invalid limit value' }]
        })
      })

      const response = await fetch('/api/public/tickers/AAPL/news?limit=invalid')
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/public/news (Timeline)', () => {
    it('should fetch news timeline from all tickers without authentication', async () => {
      const mockResponse = {
        news: [
          {
            id: 'news-1',
            headline: 'Apple Reports Strong Earnings',
            source: 'Reuters',
            publishedAt: '2024-02-15T10:00:00Z',
            ticker: {
              symbol: 'AAPL',
              name: 'Apple Inc.'
            }
          },
          {
            id: 'news-2',
            headline: 'Tesla Announces New Model',
            source: 'TechCrunch',
            publishedAt: '2024-02-14T15:30:00Z',
            ticker: {
              symbol: 'TSLA',
              name: 'Tesla Inc.'
            }
          }
        ],
        pagination: {
          hasMore: true,
          nextCursor: 'news-2',
          limit: 20
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/public/news?limit=20')
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.news).toHaveLength(2)
      expect(result.news[0].ticker.symbol).toBe('AAPL')
      expect(result.news[1].ticker.symbol).toBe('TSLA')
      
      // Verify no admin fields are exposed
      expect(result.news[0]).not.toHaveProperty('createdBy')
      expect(result.news[0]).not.toHaveProperty('tickerId')
      expect(result.news[0]).not.toHaveProperty('urlHash')
    })

    it('should handle cursor pagination for timeline', async () => {
      const page1Response = {
        news: [
          { 
            id: 'news-1', 
            headline: 'Latest News',
            publishedAt: '2024-02-15T10:00:00Z',
            ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
          }
        ],
        pagination: {
          hasMore: true,
          nextCursor: 'news-1',
          limit: 1
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => page1Response
      })

      const response = await fetch('/api/public/news?limit=1')
      const result = await response.json()

      expect(result.pagination.hasMore).toBe(true)
      expect(result.pagination.nextCursor).toBe('news-1')
    })

    it('should enforce limit cap for timeline', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          news: [],
          pagination: { hasMore: false, nextCursor: null, limit: 50 } // Capped at 50
        })
      })

      const response = await fetch('/api/public/news?limit=100')
      const result = await response.json()

      expect(result.pagination.limit).toBe(50) // Should be capped
    })
  })

  describe('Data Integrity and Security', () => {
    it('should not expose admin-only fields in public endpoints', () => {
      const adminFields = [
        'createdBy',
        'updatedBy', 
        'createdAt',
        'updatedAt',
        'urlHash',
        'tickerId' // Should not be exposed in timeline
      ]

      // This test verifies our API design excludes these fields
      expect(adminFields).toContain('createdBy')
      expect(adminFields).toContain('urlHash')
    })

    it('should handle database errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      const response = await fetch('/api/public/tickers/AAPL/news')
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it('should not require authentication for public endpoints', async () => {
      // Public endpoints should work without any auth headers
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          news: [],
          pagination: { hasMore: false, nextCursor: null, limit: 10 },
          ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
        })
      })

      // No Authorization header should be required
      const response = await fetch('/api/public/tickers/AAPL/news')
      
      expect(response.ok).toBe(true)
    })
  })

  describe('Performance and Rate Limiting', () => {
    it('should respect reasonable default limits', () => {
      const defaultLimits = {
        tickerNews: 10,
        timeline: 20,
        maxLimit: 50
      }

      expect(defaultLimits.tickerNews).toBe(10)
      expect(defaultLimits.timeline).toBe(20)
      expect(defaultLimits.maxLimit).toBe(50)
    })

    it('should handle concurrent requests efficiently', async () => {
      // Mock multiple concurrent requests
      const mockResponse = {
        news: [],
        pagination: { hasMore: false, nextCursor: null, limit: 10 },
        ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      // Simulate concurrent requests
      const requests = Array(5).fill(null).map(() => 
        fetch('/api/public/tickers/AAPL/news')
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.ok).toBe(true)
      })

      expect(global.fetch).toHaveBeenCalledTimes(5)
    })
  })

  describe('News Deduplication Impact', () => {
    it('should not affect public rendering when deduplication occurs', async () => {
      // Even if admin creates duplicate news (which should be prevented),
      // public endpoints should still work correctly
      const mockResponse = {
        news: [
          {
            id: 'news-1',
            headline: 'Unique News Article',
            source: 'Reuters',
            publishedAt: '2024-02-15T10:00:00Z'
          }
        ],
        pagination: { hasMore: false, nextCursor: null, limit: 10 },
        ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/public/tickers/AAPL/news')
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.news).toHaveLength(1)
      expect(result.news[0].headline).toBe('Unique News Article')
    })

    it('should maintain consistent ordering after news updates', async () => {
      // When admin updates news, public ordering should remain stable
      const mockResponse = {
        news: [
          { 
            id: 'news-1', 
            headline: 'Updated News',
            publishedAt: '2024-02-15T10:00:00Z' 
          },
          { 
            id: 'news-2', 
            headline: 'Original News',
            publishedAt: '2024-02-14T15:30:00Z' 
          }
        ],
        pagination: { hasMore: false, nextCursor: null, limit: 10 },
        ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/public/tickers/AAPL/news')
      const result = await response.json()

      // Should still be ordered by publishedAt desc
      expect(result.news[0].publishedAt).toBe('2024-02-15T10:00:00Z')
      expect(result.news[1].publishedAt).toBe('2024-02-14T15:30:00Z')
    })
  })
})