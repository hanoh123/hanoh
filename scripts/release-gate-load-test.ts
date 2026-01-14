/**
 * Sprint 3 Release Gate - Load Test
 * Tests CSV import with 10k+ rows
 */

import { processCSV, upsertPriceHistory } from '../lib/csv-import'
import { prisma } from '../lib/db'

async function generateLargeCSV(rows: number): Promise<string> {
  const lines = ['date,open,high,low,close,volume']
  
  const startDate = new Date('2020-01-01')
  
  for (let i = 0; i < rows; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Generate realistic OHLC data
    const basePrice = 10 + Math.random() * 5
    const open = basePrice
    const close = basePrice + (Math.random() - 0.5) * 2
    const high = Math.max(open, close) + Math.random() * 1
    const low = Math.min(open, close) - Math.random() * 1
    const volume = Math.floor(1000000 + Math.random() * 5000000)
    
    const dateStr = date.toISOString().split('T')[0]
    lines.push(`${dateStr},${open.toFixed(2)},${high.toFixed(2)},${low.toFixed(2)},${close.toFixed(2)},${volume}`)
  }
  
  return lines.join('\n')
}

async function runLoadTest() {
  console.log('='.repeat(80))
  console.log('SPRINT 3 RELEASE GATE - LOAD TEST')
  console.log('='.repeat(80))
  console.log()

  const rowCount = 10000
  console.log(`Generating CSV with ${rowCount.toLocaleString()} rows...`)
  
  const startGen = Date.now()
  const csvContent = await generateLargeCSV(rowCount)
  const genTime = Date.now() - startGen
  
  const csvSizeKB = Buffer.byteLength(csvContent, 'utf8') / 1024
  console.log(`✅ Generated ${csvSizeKB.toFixed(1)} KB CSV in ${genTime}ms`)
  console.log()

  // Get memory before processing
  const memBefore = process.memoryUsage()
  console.log('Memory before processing:')
  console.log(`   RSS: ${(memBefore.rss / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Heap Used: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Heap Total: ${(memBefore.heapTotal / 1024 / 1024).toFixed(2)} MB`)
  console.log()

  // Process CSV
  console.log('Processing CSV...')
  const startProcess = Date.now()
  const result = processCSV(csvContent)
  const processTime = Date.now() - startProcess
  
  console.log(`✅ Processed in ${processTime}ms (${(rowCount / (processTime / 1000)).toFixed(0)} rows/sec)`)
  console.log(`   Total rows: ${result.totalRows}`)
  console.log(`   Success rows: ${result.successRows}`)
  console.log(`   Failed rows: ${result.failedRows}`)
  console.log(`   Errors: ${result.errors.length}`)
  console.log()

  // Get or create a test ticker
  let ticker = await prisma.ticker.findFirst({
    where: { symbol: 'LOADTEST' }
  })

  if (!ticker) {
    console.log('Creating test ticker LOADTEST...')
    ticker = await prisma.ticker.create({
      data: {
        symbol: 'LOADTEST',
        name: 'Load Test Ticker',
        sector: 'Technology',
        exchange: 'TEST'
      }
    })
  }

  // First import - all inserts
  console.log('First import (all inserts)...')
  const startInsert = Date.now()
  const insertResult = await upsertPriceHistory(result.processedData, ticker.id)
  const insertTime = Date.now() - startInsert
  
  console.log(`✅ Inserted in ${insertTime}ms (${(insertResult.success / (insertTime / 1000)).toFixed(0)} rows/sec)`)
  console.log(`   Success: ${insertResult.success}`)
  console.log(`   Failed: ${insertResult.failed}`)
  console.log()

  // Memory after first import
  const memAfterInsert = process.memoryUsage()
  console.log('Memory after first import:')
  console.log(`   RSS: ${(memAfterInsert.rss / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Heap Used: ${(memAfterInsert.heapUsed / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Heap Total: ${(memAfterInsert.heapTotal / 1024 / 1024).toFixed(2)} MB`)
  console.log()

  // Second import - all updates (upsert stability test)
  console.log('Second import (all updates - testing upsert stability)...')
  const startUpdate = Date.now()
  const updateResult = await upsertPriceHistory(result.processedData, ticker.id)
  const updateTime = Date.now() - startUpdate
  
  console.log(`✅ Updated in ${updateTime}ms (${(updateResult.success / (updateTime / 1000)).toFixed(0)} rows/sec)`)
  console.log(`   Success: ${updateResult.success}`)
  console.log(`   Failed: ${updateResult.failed}`)
  console.log()

  // Verify no duplicates created
  const finalCount = await prisma.priceHistory.count({
    where: { tickerId: ticker.id }
  })
  
  console.log('Upsert stability verification:')
  console.log(`   Expected rows: ${insertResult.success}`)
  console.log(`   Actual rows: ${finalCount}`)
  
  if (finalCount === insertResult.success) {
    console.log('   ✅ PASS: Upsert is stable, no duplicates created')
  } else {
    console.log('   ❌ FAIL: Row count mismatch, duplicates may have been created')
  }
  console.log()

  // Memory after second import
  const memAfterUpdate = process.memoryUsage()
  console.log('Memory after second import:')
  console.log(`   RSS: ${(memAfterUpdate.rss / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Heap Used: ${(memAfterUpdate.heapUsed / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Heap Total: ${(memAfterUpdate.heapTotal / 1024 / 1024).toFixed(2)} MB`)
  console.log()

  // Memory delta
  console.log('Memory delta (before → after):')
  console.log(`   RSS: +${((memAfterUpdate.rss - memBefore.rss) / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Heap Used: +${((memAfterUpdate.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`)
  console.log()

  // Performance summary
  console.log('Performance Summary:')
  console.log(`   CSV Generation: ${genTime}ms`)
  console.log(`   CSV Processing: ${processTime}ms`)
  console.log(`   First Import (Insert): ${insertTime}ms`)
  console.log(`   Second Import (Update): ${updateTime}ms`)
  console.log(`   Total Time: ${genTime + processTime + insertTime + updateTime}ms`)
  console.log()

  console.log('='.repeat(80))
  console.log('LOAD TEST COMPLETE')
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

runLoadTest().catch(error => {
  console.error('Load test failed:', error)
  process.exit(1)
})