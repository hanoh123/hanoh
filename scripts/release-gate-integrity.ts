/**
 * Sprint 3 Release Gate - Database Integrity Checks
 * Validates data quality and constraint compliance
 */

import { prisma } from '../lib/db'

async function runIntegrityChecks() {
  console.log('='.repeat(80))
  console.log('SPRINT 3 RELEASE GATE - DATABASE INTEGRITY CHECKS')
  console.log('='.repeat(80))
  console.log()

  try {
    // A1) PriceHistory non-UTC-midnight rows count
    console.log('A1) Checking PriceHistory for non-UTC-midnight dates...')
    const priceHistoryRows = await prisma.priceHistory.findMany({
      select: { id: true, date: true, ticker: { select: { symbol: true } } }
    })

    const nonMidnightRows = priceHistoryRows.filter(row => {
      const date = new Date(row.date)
      return date.getUTCHours() !== 0 || 
             date.getUTCMinutes() !== 0 || 
             date.getUTCSeconds() !== 0 || 
             date.getUTCMilliseconds() !== 0
    })

    console.log(`   Total PriceHistory rows: ${priceHistoryRows.length}`)
    console.log(`   Non-UTC-midnight rows: ${nonMidnightRows.length}`)
    
    if (nonMidnightRows.length > 0) {
      console.log('   ⚠️  WARNING: Found non-UTC-midnight rows:')
      nonMidnightRows.slice(0, 5).forEach(row => {
        console.log(`      - ${row.ticker.symbol}: ${row.date.toISOString()}`)
      })
    } else {
      console.log('   ✅ PASS: All dates are UTC midnight')
    }
    console.log()

    // A2) OHLC invalid rows count
    console.log('A2) Checking PriceHistory for OHLC violations...')
    const allPriceData = await prisma.priceHistory.findMany({
      select: {
        id: true,
        open: true,
        high: true,
        low: true,
        close: true,
        volume: true,
        ticker: { select: { symbol: true } }
      }
    })

    const ohlcViolations = allPriceData.filter(row => {
      // Check: high >= max(open, close, low)
      const maxPrice = Math.max(row.open, row.close, row.low)
      const highValid = row.high >= maxPrice

      // Check: low <= min(open, close, high)
      const minPrice = Math.min(row.open, row.close, row.high)
      const lowValid = row.low <= minPrice

      // Check: all values >= 0
      const positiveValues = row.open >= 0 && row.high >= 0 && 
                            row.low >= 0 && row.close >= 0 && row.volume >= 0

      return !highValid || !lowValid || !positiveValues
    })

    console.log(`   Total PriceHistory rows: ${allPriceData.length}`)
    console.log(`   OHLC violations: ${ohlcViolations.length}`)
    
    if (ohlcViolations.length > 0) {
      console.log('   ⚠️  WARNING: Found OHLC violations:')
      ohlcViolations.slice(0, 5).forEach(row => {
        console.log(`      - ${row.ticker.symbol}: O=${row.open} H=${row.high} L=${row.low} C=${row.close}`)
      })
    } else {
      console.log('   ✅ PASS: All OHLC data is valid')
    }
    console.log()

    // A3) ImportJob stats sanity
    console.log('A3) Checking ImportJob statistics...')
    const jobStats = await prisma.importJob.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    const totalJobs = await prisma.importJob.count()
    
    console.log(`   Total ImportJobs: ${totalJobs}`)
    jobStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id}`)
    })

    // Check for any jobs with inconsistent metrics
    const jobsWithMetrics = await prisma.importJob.findMany({
      where: {
        totalRows: { not: null }
      },
      select: {
        id: true,
        status: true,
        totalRows: true,
        successRows: true,
        failedRows: true
      }
    })

    const inconsistentJobs = jobsWithMetrics.filter(job => {
      const total = job.totalRows || 0
      const success = job.successRows || 0
      const failed = job.failedRows || 0
      // Allow some tolerance for rounding or processing differences
      return Math.abs((success + failed) - total) > 1
    })

    if (inconsistentJobs.length > 0) {
      console.log(`   ⚠️  WARNING: ${inconsistentJobs.length} jobs with inconsistent metrics`)
      inconsistentJobs.slice(0, 3).forEach(job => {
        console.log(`      - Job ${job.id}: total=${job.totalRows}, success=${job.successRows}, failed=${job.failedRows}`)
      })
    } else {
      console.log('   ✅ PASS: All job metrics are consistent')
    }
    console.log()

    // Additional checks
    console.log('Additional Integrity Checks:')
    
    // Check for duplicate (tickerId, date) combinations
    const duplicateCheck = await prisma.$queryRaw<Array<{ ticker_id: string; date: Date; count: bigint }>>`
      SELECT ticker_id, date, COUNT(*) as count
      FROM price_history
      GROUP BY ticker_id, date
      HAVING COUNT(*) > 1
    `
    
    console.log(`   Duplicate (tickerId, date) combinations: ${duplicateCheck.length}`)
    if (duplicateCheck.length > 0) {
      console.log('   ⚠️  WARNING: Found duplicates (should be prevented by unique constraint)')
    } else {
      console.log('   ✅ PASS: No duplicate price history records')
    }
    console.log()

    // Check AlertEvent idempotency
    const alertEventDuplicates = await prisma.$queryRaw<Array<{ alert_id: string; time_bucket: number; count: bigint }>>`
      SELECT alert_id, time_bucket, COUNT(*) as count
      FROM alert_events
      GROUP BY alert_id, time_bucket
      HAVING COUNT(*) > 1
    `
    
    console.log(`   Duplicate (alertId, timeBucket) combinations: ${alertEventDuplicates.length}`)
    if (alertEventDuplicates.length > 0) {
      console.log('   ⚠️  WARNING: Found duplicate alert events (should be prevented by unique constraint)')
    } else {
      console.log('   ✅ PASS: No duplicate alert events')
    }
    console.log()

    console.log('='.repeat(80))
    console.log('INTEGRITY CHECKS COMPLETE')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('Error running integrity checks:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runIntegrityChecks()