#!/usr/bin/env tsx

/**
 * Alert Evaluation Cron Job
 * 
 * This script evaluates all active alerts and sends email notifications.
 * Designed to be run every 15 minutes via cron.
 * 
 * Usage:
 *   Local: tsx scripts/evaluate-alerts-cron.ts
 *   Production: node scripts/evaluate-alerts-cron.js (after build)
 */

import { evaluateAlerts } from '../lib/alerts'

async function main() {
  console.log(`[${new Date().toISOString()}] Starting alert evaluation cron job`)
  
  try {
    const result = await evaluateAlerts()
    
    console.log(`[${new Date().toISOString()}] Alert evaluation completed:`, {
      evaluated: result.evaluated,
      triggered: result.triggered,
      sent: result.sent,
      failed: result.failed,
      errorCount: result.errors.length
    })
    
    if (result.errors.length > 0) {
      console.error('Alert evaluation errors:', result.errors)
      process.exit(1) // Exit with error code for monitoring
    }
    
    process.exit(0) // Success
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Alert evaluation cron job failed:`, error)
    process.exit(1) // Exit with error code for monitoring
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection in alert cron job:', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in alert cron job:', error)
  process.exit(1)
})

main()