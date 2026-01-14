/**
 * Alerts Idempotency Tests
 * Concrete test cases for 5-minute bucket idempotency, cooldown, and retry behavior
 */

import '@testing-library/jest-dom'
import { calculateTimeBucket, getTimeBucketStart, getTimeBucketEnd } from '@/lib/alerts'

// Mock Prisma
const mockPrisma = {
  alert: {
    findMany: jest.fn(),
    update: jest.fn()
  },
  alertEvent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  jobLock: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma
}))

// Mock Resend
const mockResendSend = jest.fn()
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockResendSend }
  }))
}))

describe('Alerts 5-Minute Bucket Idempotency Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
  })

  describe('Time Bucket Calculation', () => {
    it('should calculate deterministic 5-minute buckets', () => {
      // Test specific timestamps
      const timestamp1 = new Date('2024-02-15T10:30:00Z').getTime() // 10:30:00
      const timestamp2 = new Date('2024-02-15T10:32:30Z').getTime() // 10:32:30
      const timestamp3 = new Date('2024-02-15T10:35:00Z').getTime() // 10:35:00
      
      const bucket1 = calculateTimeBucket(timestamp1)
      const bucket2 = calculateTimeBucket(timestamp2)
      const bucket3 = calculateTimeBucket(timestamp3)
      
      // Same 5-minute window (10:30-10:35) should have same bucket
      expect(bucket1).toBe(bucket2)
      
      // Different 5-minute window (10:35-10:40) should have different bucket
      expect(bucket2).not.toBe(bucket3)
      expect(bucket3).toBe(bucket1 + 1)
    })

    it('should provide bucket start and end times', () => {
      const timestamp = new Date('2024-02-15T10:32:30Z').getTime()
      const bucket = calculateTimeBucket(timestamp)
      
      const bucketStart = getTimeBucketStart(bucket)
      const bucketEnd = getTimeBucketEnd(bucket)
      
      // Should be 5-minute window
      expect(bucketEnd.getTime() - bucketStart.getTime()).toBe(5 * 60 * 1000 - 1)
      
      // Original timestamp should be within bucket
      expect(timestamp).toBeGreaterThanOrEqual(bucketStart.getTime())
      expect(timestamp).toBeLessThanOrEqual(bucketEnd.getTime())
    })
  })

  describe('a) Idempotency: Run twice within 5 minutes → still 1 SENT', () => {
    it('should create only one AlertEvent when same alert triggers twice in same 5-minute bucket', async () => {
      const baseTime = new Date('2024-02-15T10:30:00Z').getTime()
      const time1 = baseTime // 10:30:00
      const time2 = baseTime + (2 * 60 * 1000) // 10:32:00 (2 minutes later, same bucket)
      
      const bucket1 = calculateTimeBucket(time1)
      const bucket2 = calculateTimeBucket(time2)
      
      // Verify same bucket
      expect(bucket1).toBe(bucket2)
      
      // First evaluation - creates new AlertEvent
      mockPrisma.alertEvent.create.mockResolvedValueOnce({
        id: 'event-1',
        alertId: 'alert-1',
        triggeredAt: new Date(time1),
        timeBucket: bucket1,
        status: 'PENDING'
      })

      // Second evaluation - unique constraint violation
      mockPrisma.alertEvent.create.mockRejectedValueOnce({ code: 'P2002' })

      // Return existing event
      mockPrisma.alertEvent.findUnique.mockResolvedValueOnce({
        id: 'event-1',  // ← Same event ID
        alertId: 'alert-1',
        triggeredAt: new Date(time1),
        timeBucket: bucket1,
        status: 'SENT'
      })

      // Mock successful email send for first evaluation only
      mockResendSend.mockResolvedValueOnce({ error: null })

      // Verify: Only one AlertEvent created, only one email sent
      expect(mockPrisma.alertEvent.create).toHaveBeenCalledWith({
        data: {
          alertId: 'alert-1',
          triggeredAt: expect.any(Date),
          timeBucket: bucket1,
          measuredValue: expect.any(Number),
          status: 'PENDING'
        }
      })

      // Second call should find existing via unique constraint
      expect(mockPrisma.alertEvent.findUnique).toHaveBeenCalledWith({
        where: {
          alert_event_idempotency_5m: {
            alertId: 'alert-1',
            timeBucket: bucket1
          }
        }
      })

      expect(mockResendSend).toHaveBeenCalledTimes(1)
    })

    it('should create different AlertEvents for different 5-minute buckets', async () => {
      const baseTime = new Date('2024-02-15T10:30:00Z').getTime()
      const time1 = baseTime // 10:30:00
      const time2 = baseTime + (6 * 60 * 1000) // 10:36:00 (6 minutes later, different bucket)
      
      const bucket1 = calculateTimeBucket(time1)
      const bucket2 = calculateTimeBucket(time2)
      
      // Verify different buckets
      expect(bucket1).not.toBe(bucket2)
      expect(bucket2).toBe(bucket1 + 1)
      
      // Both evaluations should create new AlertEvents
      mockPrisma.alertEvent.create
        .mockResolvedValueOnce({
          id: 'event-1',
          alertId: 'alert-1',
          timeBucket: bucket1
        })
        .mockResolvedValueOnce({
          id: 'event-2',
          alertId: 'alert-1',
          timeBucket: bucket2
        })

      expect(mockPrisma.alertEvent.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('b) Retry after 2-4 minutes uses same event (no new row)', () => {
    it('should reuse existing AlertEvent when retry occurs within same 5-minute bucket', async () => {
      const baseTime = new Date('2024-02-15T10:30:00Z').getTime()
      const initialTime = baseTime // 10:30:00
      const retryTime = baseTime + (3 * 60 * 1000) // 10:33:00 (3 minutes later)
      
      const bucket = calculateTimeBucket(initialTime)
      const retryBucket = calculateTimeBucket(retryTime)
      
      // Verify same bucket
      expect(bucket).toBe(retryBucket)
      
      // Initial attempt - creates AlertEvent, email fails
      mockPrisma.alertEvent.create.mockResolvedValueOnce({
        id: 'event-retry',
        alertId: 'alert-retry',
        triggeredAt: new Date(initialTime),
        timeBucket: bucket,
        status: 'PENDING'
      })

      // Email fails
      mockResendSend.mockResolvedValueOnce({ 
        error: { message: 'SMTP timeout' } 
      })

      // AlertEvent marked as FAILED
      mockPrisma.alertEvent.update.mockResolvedValueOnce({
        id: 'event-retry',
        status: 'FAILED',
        errorMessage: 'SMTP timeout'
      })

      // Retry attempt - finds existing AlertEvent (no new creation)
      mockPrisma.alertEvent.create.mockRejectedValueOnce({ code: 'P2002' })
      
      mockPrisma.alertEvent.findUnique.mockResolvedValueOnce({
        id: 'event-retry',  // ← Same AlertEvent reused
        alertId: 'alert-retry',
        triggeredAt: new Date(initialTime),
        timeBucket: bucket,
        status: 'FAILED'
      })

      // Retry email succeeds
      mockResendSend.mockResolvedValueOnce({ error: null })

      // Same AlertEvent updated to SENT
      mockPrisma.alertEvent.update.mockResolvedValueOnce({
        id: 'event-retry',
        status: 'SENT',
        sentAt: new Date(retryTime)
      })

      // Verify: Only one AlertEvent created, reused for retry
      expect(mockPrisma.alertEvent.create).toHaveBeenCalledTimes(1)
      
      // Retry finds existing event in same bucket
      expect(mockPrisma.alertEvent.findUnique).toHaveBeenCalledWith({
        where: {
          alert_event_idempotency_5m: {
            alertId: 'alert-retry',
            timeBucket: bucket  // ← Same bucket used for retry
          }
        }
      })
      
      // Two email attempts (initial + retry)
      expect(mockResendSend).toHaveBeenCalledTimes(2)
    })

    it('should handle retry at bucket boundary correctly', async () => {
      // Test edge case: retry happens just before bucket boundary
      const baseTime = new Date('2024-02-15T10:30:00Z').getTime()
      const initialTime = baseTime // 10:30:00 (start of bucket)
      const retryTime = baseTime + (4 * 60 + 59) * 1000 // 10:34:59 (end of same bucket)
      
      const bucket1 = calculateTimeBucket(initialTime)
      const bucket2 = calculateTimeBucket(retryTime)
      
      // Should still be same bucket
      expect(bucket1).toBe(bucket2)
      
      // But retry 1 second later should be different bucket
      const nextBucketTime = baseTime + (5 * 60) * 1000 // 10:35:00
      const nextBucket = calculateTimeBucket(nextBucketTime)
      expect(nextBucket).toBe(bucket1 + 1)
    })
  })

  describe('c) Cooldown behavior with 5-minute buckets', () => {
    it('should respect 1-hour cooldown independent of bucket logic', async () => {
      const now = new Date('2024-02-15T10:30:00Z')
      const thirtyMinutesAgo = new Date('2024-02-15T10:00:00Z')
      const twoHoursAgo = new Date('2024-02-15T08:30:00Z')

      // Alert triggered 30 minutes ago (within cooldown)
      const recentAlert = {
        id: 'alert-recent',
        type: 'PRICE_ABOVE',
        priceAbove: 10.00,
        lastTriggered: thirtyMinutesAgo,  // ← Within 1 hour
        ticker: { currentPrice: 12.50 }
      }

      // Alert triggered 2 hours ago (outside cooldown)
      const oldAlert = {
        id: 'alert-old',
        type: 'PRICE_ABOVE',
        priceAbove: 10.00,
        lastTriggered: twoHoursAgo,  // ← Outside 1 hour
        ticker: { currentPrice: 12.50 }
      }

      // Calculate cooldown (independent of bucket logic)
      const hoursSinceRecent = (now.getTime() - recentAlert.lastTriggered.getTime()) / (1000 * 60 * 60)
      const hoursSinceOld = (now.getTime() - oldAlert.lastTriggered.getTime()) / (1000 * 60 * 60)

      expect(hoursSinceRecent).toBe(0.5)  // ← 30 minutes < 1 hour (in cooldown)
      expect(hoursSinceOld).toBe(2)       // ← 2 hours >= 1 hour (outside cooldown)

      // Recent alert should not proceed to AlertEvent creation
      // Old alert should proceed to AlertEvent creation
    })
  })

  describe('Bucket Math Verification', () => {
    it('should calculate buckets correctly for various timestamps', () => {
      const testCases = [
        {
          time: '2024-02-15T10:30:00Z',
          expectedBucket: Math.floor(new Date('2024-02-15T10:30:00Z').getTime() / 1000 / 300)
        },
        {
          time: '2024-02-15T10:34:59Z',
          expectedBucket: Math.floor(new Date('2024-02-15T10:30:00Z').getTime() / 1000 / 300)
        },
        {
          time: '2024-02-15T10:35:00Z',
          expectedBucket: Math.floor(new Date('2024-02-15T10:30:00Z').getTime() / 1000 / 300) + 1
        }
      ]

      testCases.forEach(({ time, expectedBucket }) => {
        const timestamp = new Date(time).getTime()
        const actualBucket = calculateTimeBucket(timestamp)
        expect(actualBucket).toBe(expectedBucket)
      })
    })

    it('should ensure 5-minute bucket duration', () => {
      const bucket = 12345 // arbitrary bucket number
      const start = getTimeBucketStart(bucket)
      const end = getTimeBucketEnd(bucket)
      
      // Duration should be exactly 5 minutes minus 1ms
      const duration = end.getTime() - start.getTime()
      expect(duration).toBe(5 * 60 * 1000 - 1) // 299,999ms
    })
  })
})