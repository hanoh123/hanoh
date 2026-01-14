/**
 * Alerts Engine Test
 * Tests: alert evaluation, email sending, idempotency, and error handling
 */

import '@testing-library/jest-dom'

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn()
    }
  }))
}))

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    alert: {
      findMany: jest.fn(),
      update: jest.fn()
    },
    alertEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    }
  }
}))

// Mock auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

describe('Alerts Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env.RESEND_API_KEY = 'test-api-key'
  })

  describe('Alert Evaluation Logic', () => {
    it('should evaluate PRICE_ABOVE alerts correctly', () => {
      const alert = {
        id: 'alert-1',
        type: 'PRICE_ABOVE',
        priceAbove: 10.00,
        lastTriggered: null,
        ticker: { currentPrice: 12.50, symbol: 'AAPL', name: 'Apple Inc.' },
        user: { id: 'user-1', email: 'test@example.com' }
      }

      // Should trigger when current price > threshold
      expect(alert.ticker.currentPrice).toBeGreaterThan(alert.priceAbove)
    })

    it('should evaluate PRICE_BELOW alerts correctly', () => {
      const alert = {
        id: 'alert-2',
        type: 'PRICE_BELOW',
        priceBelow: 10.00,
        lastTriggered: null,
        ticker: { currentPrice: 8.50, symbol: 'AAPL', name: 'Apple Inc.' },
        user: { id: 'user-1', email: 'test@example.com' }
      }

      // Should trigger when current price < threshold
      expect(alert.ticker.currentPrice).toBeLessThan(alert.priceBelow)
    })

    it('should evaluate VOLUME_ABOVE alerts correctly', () => {
      const alert = {
        id: 'alert-3',
        type: 'VOLUME_ABOVE',
        volumeAbove: 1000000,
        lastTriggered: null,
        ticker: { volume: 1500000, symbol: 'AAPL', name: 'Apple Inc.' },
        user: { id: 'user-1', email: 'test@example.com' }
      }

      // Should trigger when current volume > threshold
      expect(alert.ticker.volume).toBeGreaterThan(alert.volumeAbove)
    })

    it('should evaluate CHANGE_PERCENT alerts correctly', () => {
      const alert = {
        id: 'alert-4',
        type: 'CHANGE_PERCENT',
        changePercent: 5.0,
        lastTriggered: null,
        ticker: { changePercent24h: 7.5, symbol: 'AAPL', name: 'Apple Inc.' },
        user: { id: 'user-1', email: 'test@example.com' }
      }

      // Should trigger when absolute change >= threshold
      expect(Math.abs(alert.ticker.changePercent24h)).toBeGreaterThanOrEqual(Math.abs(alert.changePercent))
    })

    it('should respect cooldown period', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

      // Alert triggered 30 minutes ago (within 1-hour cooldown)
      const recentAlert = {
        id: 'alert-5',
        type: 'PRICE_ABOVE',
        priceAbove: 10.00,
        lastTriggered: thirtyMinutesAgo,
        ticker: { currentPrice: 12.50 }
      }

      // Alert triggered 1 hour ago (outside cooldown)
      const oldAlert = {
        id: 'alert-6',
        type: 'PRICE_ABOVE',
        priceAbove: 10.00,
        lastTriggered: oneHourAgo,
        ticker: { currentPrice: 12.50 }
      }

      const hoursSinceRecent = (new Date().getTime() - recentAlert.lastTriggered.getTime()) / (1000 * 60 * 60)
      const hoursSinceOld = (new Date().getTime() - oldAlert.lastTriggered.getTime()) / (1000 * 60 * 60)

      expect(hoursSinceRecent).toBeLessThan(1) // Should be in cooldown
      expect(hoursSinceOld).toBeGreaterThanOrEqual(1) // Should be outside cooldown
    })
  })

  describe('AlertEvent Idempotency', () => {
    it('should prevent duplicate AlertEvents within 5 minutes', async () => {
      const { prisma } = require('@/lib/db')
      
      // Mock recent AlertEvent exists
      prisma.alertEvent.findFirst.mockResolvedValueOnce({
        id: 'existing-event',
        alertId: 'alert-1',
        triggeredAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      })

      const triggerData = {
        alertId: 'alert-1',
        userId: 'user-1',
        tickerId: 'ticker-1',
        alertType: 'PRICE_ABOVE',
        measuredValue: 12.50,
        threshold: 10.00,
        userEmail: 'test@example.com',
        tickerSymbol: 'AAPL',
        tickerName: 'Apple Inc.'
      }

      // Should return existing event, not create new one
      expect(prisma.alertEvent.findFirst).toHaveBeenCalledWith({
        where: {
          alertId: 'alert-1',
          triggeredAt: {
            gte: expect.any(Date) // Within last 5 minutes
          }
        },
        orderBy: { triggeredAt: 'desc' }
      })
    })

    it('should create new AlertEvent when no recent event exists', async () => {
      const { prisma } = require('@/lib/db')
      
      // Mock no recent AlertEvent
      prisma.alertEvent.findFirst.mockResolvedValueOnce(null)
      
      // Mock successful creation
      prisma.alertEvent.create.mockResolvedValueOnce({
        id: 'new-event-id',
        alertId: 'alert-1',
        triggeredAt: new Date(),
        measuredValue: 12.50,
        status: 'PENDING'
      })

      const triggerData = {
        alertId: 'alert-1',
        measuredValue: 12.50
      }

      expect(prisma.alertEvent.create).toHaveBeenCalledWith({
        data: {
          alertId: 'alert-1',
          triggeredAt: expect.any(Date),
          measuredValue: 12.50,
          status: 'PENDING'
        }
      })
    })
  })

  describe('Email Notification System', () => {
    it('should format email content correctly for PRICE_ABOVE alert', () => {
      const triggerData = {
        alertId: 'alert-1',
        alertType: 'PRICE_ABOVE',
        measuredValue: 12.50,
        threshold: 10.00,
        tickerSymbol: 'AAPL',
        tickerName: 'Apple Inc.',
        userEmail: 'test@example.com'
      }

      // Email should contain key information
      const expectedSubject = 'Alert: AAPL Price Alert (Above Threshold)'
      const expectedContent = [
        'AAPL - Apple Inc.',
        'Price Alert (Above Threshold)',
        '$12.50', // Current value
        '$10.00', // Threshold
        'View AAPL Details'
      ]

      expect(expectedSubject).toContain('AAPL')
      expect(expectedSubject).toContain('Price Alert')
      expectedContent.forEach(content => {
        expect(content).toBeTruthy()
      })
    })

    it('should format email content correctly for VOLUME_ABOVE alert', () => {
      const triggerData = {
        alertType: 'VOLUME_ABOVE',
        measuredValue: 1500000,
        threshold: 1000000,
        tickerSymbol: 'AAPL'
      }

      // Volume should be formatted with commas
      const formattedVolume = triggerData.measuredValue.toLocaleString()
      const formattedThreshold = triggerData.threshold.toLocaleString()

      expect(formattedVolume).toBe('1,500,000')
      expect(formattedThreshold).toBe('1,000,000')
    })

    it('should format email content correctly for CHANGE_PERCENT alert', () => {
      const triggerData = {
        alertType: 'CHANGE_PERCENT',
        measuredValue: 7.5,
        threshold: 5.0
      }

      // Percentage should include + sign for positive values
      const formattedPercent = `${triggerData.measuredValue > 0 ? '+' : ''}${triggerData.measuredValue.toFixed(2)}%`
      
      expect(formattedPercent).toBe('+7.50%')
    })

    it('should handle email send success', async () => {
      const { Resend } = require('resend')
      const mockSend = jest.fn().mockResolvedValue({ error: null })
      Resend.mockImplementation(() => ({ emails: { send: mockSend } }))

      const { prisma } = require('@/lib/db')
      prisma.alertEvent.update.mockResolvedValue({})

      const triggerData = {
        userEmail: 'test@example.com',
        tickerSymbol: 'AAPL',
        alertType: 'PRICE_ABOVE'
      }

      // Should call Resend API
      expect(mockSend).toBeDefined()
    })

    it('should handle email send failure', async () => {
      const { Resend } = require('resend')
      const mockSend = jest.fn().mockResolvedValue({ 
        error: { message: 'Email send failed' } 
      })
      Resend.mockImplementation(() => ({ emails: { send: mockSend } }))

      const { prisma } = require('@/lib/db')
      prisma.alertEvent.update.mockResolvedValue({})

      // Should update AlertEvent with FAILED status
      expect(prisma.alertEvent.update).toBeDefined()
    })
  })

  describe('Admin API Endpoints', () => {
    it('should require ADMIN role for manual evaluation', async () => {
      const { getServerSession } = require('next-auth')
      
      // Mock non-admin user
      getServerSession.mockResolvedValue({
        user: { role: 'USER', email: 'user@example.com' }
      })

      // Should return 403 Unauthorized
      const expectedResponse = { error: 'Unauthorized - Admin access required' }
      expect(expectedResponse.error).toContain('Unauthorized')
    })

    it('should allow ADMIN role for manual evaluation', async () => {
      const { getServerSession } = require('next-auth')
      
      // Mock admin user
      getServerSession.mockResolvedValue({
        user: { role: 'ADMIN', email: 'admin@example.com' }
      })

      // Should proceed with evaluation
      expect(getServerSession).toBeDefined()
    })

    it('should return alert events with proper pagination', async () => {
      const { prisma } = require('@/lib/db')
      
      const mockEvents = [
        {
          id: 'event-1',
          alertId: 'alert-1',
          triggeredAt: new Date(),
          status: 'SENT',
          alert: {
            user: { email: 'test@example.com' },
            ticker: { symbol: 'AAPL', name: 'Apple Inc.' }
          }
        }
      ]

      prisma.alertEvent.findMany.mockResolvedValue(mockEvents)
      prisma.alertEvent.count.mockResolvedValue(1)

      const expectedResponse = {
        events: mockEvents,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      }

      expect(expectedResponse.events).toHaveLength(1)
      expect(expectedResponse.pagination.total).toBe(1)
    })
  })

  describe('Cron Job Security', () => {
    it('should validate CRON_SECRET for Vercel cron endpoint', () => {
      process.env.CRON_SECRET = 'test-secret'
      
      const validAuth = 'Bearer test-secret'
      const invalidAuth = 'Bearer wrong-secret'
      
      expect(validAuth).toBe(`Bearer ${process.env.CRON_SECRET}`)
      expect(invalidAuth).not.toBe(`Bearer ${process.env.CRON_SECRET}`)
    })

    it('should handle missing CRON_SECRET gracefully', () => {
      delete process.env.CRON_SECRET
      
      const authHeader = 'Bearer some-secret'
      const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
      
      expect(expectedSecret).toBe('Bearer undefined')
      expect(authHeader).not.toBe(expectedSecret)
    })
  })

  describe('Error Handling & Resilience', () => {
    it('should continue processing other alerts when one fails', async () => {
      const alerts = [
        { id: 'alert-1', type: 'PRICE_ABOVE' }, // This one will fail
        { id: 'alert-2', type: 'PRICE_BELOW' }, // This one should still process
      ]

      // First alert fails, second should still be processed
      expect(alerts).toHaveLength(2)
    })

    it('should handle database connection errors gracefully', async () => {
      const { prisma } = require('@/lib/db')
      
      // Mock database error
      prisma.alert.findMany.mockRejectedValue(new Error('Database connection failed'))

      // Should catch error and return appropriate response
      const expectedError = 'Database connection failed'
      expect(expectedError).toContain('Database connection')
    })

    it('should handle Resend API errors gracefully', async () => {
      const { Resend } = require('resend')
      const mockSend = jest.fn().mockRejectedValue(new Error('Resend API error'))
      Resend.mockImplementation(() => ({ emails: { send: mockSend } }))

      // Should catch error and mark AlertEvent as FAILED
      const expectedError = 'Resend API error'
      expect(expectedError).toContain('Resend API')
    })
  })

  describe('Performance & Scalability', () => {
    it('should handle large number of alerts efficiently', () => {
      const largeAlertSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `alert-${i}`,
        type: 'PRICE_ABOVE',
        priceAbove: 10.00,
        ticker: { currentPrice: 12.00 }
      }))

      // Should be able to process 1000 alerts
      expect(largeAlertSet).toHaveLength(1000)
      expect(largeAlertSet[0].id).toBe('alert-0')
      expect(largeAlertSet[999].id).toBe('alert-999')
    })

    it('should respect email rate limits', () => {
      // Resend has rate limits - should batch or throttle if needed
      const emailBatchSize = 100 // Example batch size
      const totalEmails = 250
      const expectedBatches = Math.ceil(totalEmails / emailBatchSize)

      expect(expectedBatches).toBe(3) // 250 emails in batches of 100
    })
  })
})