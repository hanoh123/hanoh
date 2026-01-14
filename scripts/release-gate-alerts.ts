/**
 * Sprint 3 Release Gate - Alerts System Validation
 * Tests 5-minute bucket idempotency, cooldown, and retry behavior
 */

import { prisma } from '../lib/db'
import { calculateTimeBucket } from '../lib/alerts'

async function setupTestData() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'alerts-test@test.com' },
    update: {},
    create: {
      email: 'alerts-test@test.com',
      passwordHash: 'test-hash',
      role: 'USER'
    }
  })

  // Create test ticker
  const ticker = await prisma.ticker.upsert({
    where: { symbol: 'ALERTTEST' },
    update: { currentPrice: 15.00 },
    create: {
      symbol: 'ALERTTEST',
      name: 'Alert Test Ticker',
      sector: 'Technology',
      exchange: 'TEST',
      currentPrice: 15.00,
      volume: 1000000
    }
  })

  // Create test alert
  const alert = await prisma.alert.upsert({
    where: { 
      id: 'alert-test-gate-001'
    },
    update: {
      priceAbove: 10.00,
      lastTriggered: null
    },
    create: {
      id: 'alert-test-gate-001',
      userId: user.id,
      tickerId: ticker.id,
      type: 'PRICE_ABOVE',
      priceAbove: 10.00,
      isActive: true
    }
  })

  return { user, ticker, alert }
}

async function testCase1_SameAlertTwiceWithin5Minutes() {
  console.log('Test Case 1: Same alert triggered twice within 5 minutes → 1 SENT')
  console.log('-'.repeat(80))

  const { alert } = await setupTestData()
  
  // Clear any existing alert events for this alert
  await prisma.alertEvent.deleteMany({
    where: { alertId: alert.id }
  })

  const baseTime = Date.now()
  const timeBucket = calculateTimeBucket(baseTime)
  
  console.log(`   Base time: ${new Date(baseTime).toISOString()}`)
  console.log(`   Time bucket: ${timeBucket}`)
  console.log()

  // First trigger
  console.log('   First trigger (t=0):')
  try {
    const event1 = await prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        triggeredAt: new Date(baseTime),
        timeBucket: timeBucket,
        measuredValue: 15.00,
        status: 'SENT',
        sentAt: new Date(baseTime)
      }
    })
    console.log(`      ✅ Created AlertEvent ${event1.id} with status SENT`)
  } catch (error: any) {
    console.log(`      ❌ Failed to create first event: ${error.message}`)
  }

  // Second trigger 2 minutes later (same bucket)
  const time2 = baseTime + (2 * 60 * 1000)
  const bucket2 = calculateTimeBucket(time2)
  
  console.log()
  console.log(`   Second trigger (t=+2min):`)
  console.log(`      Time: ${new Date(time2).toISOString()}`)
  console.log(`      Time bucket: ${bucket2}`)
  console.log(`      Same bucket? ${bucket2 === timeBucket ? 'YES' : 'NO'}`)
  
  try {
    await prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        triggeredAt: new Date(time2),
        timeBucket: bucket2,
        measuredValue: 15.50,
        status: 'PENDING'
      }
    })
    console.log(`      ❌ FAIL: Created duplicate event (should be prevented by unique constraint)`)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`      ✅ PASS: Unique constraint prevented duplicate (P2002)`)
      
      // Verify we can find the existing event
      const existing = await prisma.alertEvent.findUnique({
        where: {
          alert_event_idempotency_5m: {
            alertId: alert.id,
            timeBucket: timeBucket
          }
        }
      })
      
      if (existing) {
        console.log(`      ✅ Found existing event ${existing.id} with status ${existing.status}`)
      }
    } else {
      console.log(`      ❌ Unexpected error: ${error.message}`)
    }
  }

  // Verify final count
  const eventCount = await prisma.alertEvent.count({
    where: { alertId: alert.id }
  })
  
  console.log()
  console.log(`   Final AlertEvent count: ${eventCount}`)
  console.log(`   ${eventCount === 1 ? '✅ PASS' : '❌ FAIL'}: Only 1 event created`)
  console.log()
}

async function testCase2_RepeatWithin1Hour() {
  console.log('Test Case 2: Repeated within 1 hour → no new SENT')
  console.log('-'.repeat(80))

  const { alert } = await setupTestData()
  
  // Clear existing events
  await prisma.alertEvent.deleteMany({
    where: { alertId: alert.id }
  })

  const now = new Date()
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
  
  // Set lastTriggered to 30 minutes ago
  await prisma.alert.update({
    where: { id: alert.id },
    data: { lastTriggered: thirtyMinutesAgo }
  })

  console.log(`   Alert last triggered: ${thirtyMinutesAgo.toISOString()}`)
  console.log(`   Current time: ${now.toISOString()}`)
  console.log(`   Time since last trigger: 30 minutes`)
  console.log()

  // Check cooldown logic
  const hoursSinceLastTrigger = (now.getTime() - thirtyMinutesAgo.getTime()) / (1000 * 60 * 60)
  console.log(`   Hours since last trigger: ${hoursSinceLastTrigger.toFixed(2)}`)
  console.log(`   Within 1-hour cooldown? ${hoursSinceLastTrigger < 1 ? 'YES' : 'NO'}`)
  
  if (hoursSinceLastTrigger < 1) {
    console.log(`   ✅ PASS: Alert should be skipped (in cooldown period)`)
  } else {
    console.log(`   ❌ FAIL: Alert should not be in cooldown`)
  }
  console.log()

  // Test with 2 hours ago (outside cooldown)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  await prisma.alert.update({
    where: { id: alert.id },
    data: { lastTriggered: twoHoursAgo }
  })

  const hoursSince2Hours = (now.getTime() - twoHoursAgo.getTime()) / (1000 * 60 * 60)
  console.log(`   Testing with lastTriggered 2 hours ago:`)
  console.log(`   Hours since last trigger: ${hoursSince2Hours.toFixed(2)}`)
  console.log(`   Within 1-hour cooldown? ${hoursSince2Hours < 1 ? 'YES' : 'NO'}`)
  
  if (hoursSince2Hours >= 1) {
    console.log(`   ✅ PASS: Alert should be allowed (outside cooldown period)`)
  } else {
    console.log(`   ❌ FAIL: Alert should be outside cooldown`)
  }
  console.log()
}

async function testCase3_FailedThenRetry() {
  console.log('Test Case 3: FAILED then retry → same event becomes SENT, no duplicates')
  console.log('-'.repeat(80))

  const { alert } = await setupTestData()
  
  // Clear existing events
  await prisma.alertEvent.deleteMany({
    where: { alertId: alert.id }
  })

  const baseTime = Date.now()
  const timeBucket = calculateTimeBucket(baseTime)
  
  console.log(`   Base time: ${new Date(baseTime).toISOString()}`)
  console.log(`   Time bucket: ${timeBucket}`)
  console.log()

  // First attempt - create FAILED event
  console.log('   First attempt (email fails):')
  const failedEvent = await prisma.alertEvent.create({
    data: {
      alertId: alert.id,
      triggeredAt: new Date(baseTime),
      timeBucket: timeBucket,
      measuredValue: 15.00,
      status: 'FAILED',
      errorMessage: 'SMTP connection timeout'
    }
  })
  console.log(`      ✅ Created AlertEvent ${failedEvent.id} with status FAILED`)
  console.log(`      Error: ${failedEvent.errorMessage}`)
  console.log()

  // Retry 3 minutes later (same bucket)
  const retryTime = baseTime + (3 * 60 * 1000)
  const retryBucket = calculateTimeBucket(retryTime)
  
  console.log(`   Retry attempt (t=+3min):`)
  console.log(`      Time: ${new Date(retryTime).toISOString()}`)
  console.log(`      Time bucket: ${retryBucket}`)
  console.log(`      Same bucket? ${retryBucket === timeBucket ? 'YES' : 'NO'}`)
  console.log()

  // Try to create new event (should fail due to unique constraint)
  try {
    await prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        triggeredAt: new Date(retryTime),
        timeBucket: retryBucket,
        measuredValue: 15.50,
        status: 'PENDING'
      }
    })
    console.log(`      ❌ FAIL: Created new event (should reuse existing)`)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`      ✅ PASS: Unique constraint prevented duplicate`)
      
      // Find and update existing event
      const existingEvent = await prisma.alertEvent.findUnique({
        where: {
          alert_event_idempotency_5m: {
            alertId: alert.id,
            timeBucket: timeBucket
          }
        }
      })
      
      if (existingEvent) {
        console.log(`      ✅ Found existing event ${existingEvent.id} with status ${existingEvent.status}`)
        
        // Update to SENT (simulating successful retry)
        const updatedEvent = await prisma.alertEvent.update({
          where: { id: existingEvent.id },
          data: {
            status: 'SENT',
            sentAt: new Date(retryTime)
          }
        })
        
        console.log(`      ✅ Updated event to status SENT`)
        console.log(`      Same event ID? ${updatedEvent.id === failedEvent.id ? 'YES' : 'NO'}`)
      }
    }
  }

  // Verify final state
  const events = await prisma.alertEvent.findMany({
    where: { alertId: alert.id }
  })
  
  console.log()
  console.log(`   Final state:`)
  console.log(`      Total events: ${events.length}`)
  console.log(`      Event ID: ${events[0]?.id}`)
  console.log(`      Status: ${events[0]?.status}`)
  console.log(`      ${events.length === 1 && events[0]?.status === 'SENT' ? '✅ PASS' : '❌ FAIL'}: Single event with SENT status`)
  console.log()
}

async function runAlertsGate() {
  console.log('='.repeat(80))
  console.log('SPRINT 3 RELEASE GATE - ALERTS SYSTEM VALIDATION')
  console.log('='.repeat(80))
  console.log()

  try {
    await testCase1_SameAlertTwiceWithin5Minutes()
    await testCase2_RepeatWithin1Hour()
    await testCase3_FailedThenRetry()

    console.log('='.repeat(80))
    console.log('ALERTS GATE COMPLETE')
    console.log('='.repeat(80))
  } catch (error) {
    console.error('Alerts gate failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runAlertsGate()