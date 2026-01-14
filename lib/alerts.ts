/**
 * Alerts Engine
 * Handles alert evaluation, email notifications, and idempotency
 */

import { prisma } from '@/lib/db'

// Type declarations
declare const process: {
  env: Record<string, string | undefined>
}

// Type-safe Resend interface
interface ResendEmail {
  from: string
  to: string
  subject: string
  html: string
}

interface ResendResponse {
  error?: { message: string }
}

interface ResendClient {
  emails: {
    send: (email: ResendEmail) => Promise<ResendResponse>
  }
}

// Dynamic import for Resend to handle missing dependency gracefully
let resendClient: ResendClient | null = null

async function getResendClient(): Promise<ResendClient | null> {
  if (resendClient) return resendClient
  
  try {
    const { Resend } = await import('resend')
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured - email notifications disabled')
      return null
    }
    resendClient = new Resend(apiKey) as ResendClient
    return resendClient
  } catch (error) {
    console.warn('Resend package not available - email notifications disabled')
    return null
  }
}

export interface AlertEvaluationResult {
  evaluated: number
  triggered: number
  sent: number
  failed: number
  errors: string[]
}

export interface AlertTriggerData {
  alertId: string
  userId: string
  tickerId: string
  alertType: string
  measuredValue: number
  threshold: number
  userEmail: string
  tickerSymbol: string
  tickerName: string
}

/**
 * Calculate 5-minute time bucket for idempotency
 * Returns deterministic bucket number that changes every 5 minutes
 */
export function calculateTimeBucket(timestamp?: number): number {
  const now = timestamp || Date.now()
  return Math.floor(now / 1000 / 300) // 300 seconds = 5 minutes
}

/**
 * Get the start time of a time bucket
 */
export function getTimeBucketStart(timeBucket: number): Date {
  return new Date(timeBucket * 300 * 1000)
}

/**
 * Get the end time of a time bucket
 */
export function getTimeBucketEnd(timeBucket: number): Date {
  return new Date((timeBucket + 1) * 300 * 1000 - 1)
}

/**
 * Main alert evaluation function - idempotent and safe for retries
 */
export async function evaluateAlerts(): Promise<AlertEvaluationResult> {
  const result: AlertEvaluationResult = {
    evaluated: 0,
    triggered: 0,
    sent: 0,
    failed: 0,
    errors: []
  }

  // Acquire job lock to prevent concurrent executions
  const lockAcquired = await acquireJobLock('ALERT_EVALUATION')
  if (!lockAcquired) {
    console.log('Alert evaluation already running, skipping this execution')
    result.errors.push('Job already running - concurrent execution prevented')
    return result
  }

  try {
    console.log('Alert evaluation started with job lock acquired')
    
    // Get all active alerts with user and ticker data
    const activeAlerts = await prisma.alert.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, email: true }
        },
        ticker: {
          select: { 
            id: true, 
            symbol: true, 
            name: true,
            currentPrice: true,
            volume: true,
            changePercent24h: true
          }
        }
      }
    })

    result.evaluated = activeAlerts.length

    for (const alert of activeAlerts) {
      try {
        const triggerData = await evaluateIndividualAlert(alert)
        
        if (triggerData) {
          result.triggered++
          
          // Create AlertEvent record first (idempotency key)
          const alertEvent = await createAlertEvent(triggerData)
          
          if (alertEvent) {
            // Send email notification
            const emailSent = await sendAlertEmail(triggerData, alertEvent.id)
            
            if (emailSent) {
              result.sent++
              
              // Update alert lastTriggered timestamp ONLY after successful email
              await prisma.alert.update({
                where: { id: alert.id },
                data: { lastTriggered: new Date() }
              })
            } else {
              result.failed++
            }
          }
        }
      } catch (error: any) {
        result.failed++
        result.errors.push(`Alert ${alert.id}: ${error.message}`)
        console.error(`Alert evaluation error for ${alert.id}:`, error)
      }
    }

    console.log(`Alert evaluation complete:`, result)
    return result
    
  } catch (error: any) {
    result.errors.push(`System error: ${error.message}`)
    console.error('Alert evaluation system error:', error)
    return result
  } finally {
    // Always release the job lock
    await releaseJobLock('ALERT_EVALUATION')
    console.log('Alert evaluation job lock released')
  }
}

/**
 * Acquire job lock to prevent concurrent executions
 */
async function acquireJobLock(jobType: string): Promise<boolean> {
  try {
    const processId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minute expiry
    
    await prisma.jobLock.create({
      data: {
        jobType,
        lockedBy: processId,
        expiresAt
      }
    })
    
    console.log(`Job lock acquired for ${jobType} by ${processId}`)
    return true
    
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint violation - lock already exists
      // Check if existing lock is expired
      const existingLock = await prisma.jobLock.findUnique({
        where: { jobType }
      })
      
      if (existingLock && existingLock.expiresAt < new Date()) {
        // Lock is expired, try to replace it
        try {
          await prisma.jobLock.update({
            where: { jobType },
            data: {
              lockedBy: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              lockedAt: new Date(),
              expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
          })
          console.log(`Expired job lock replaced for ${jobType}`)
          return true
        } catch (replaceError) {
          console.log(`Failed to replace expired lock for ${jobType}`)
          return false
        }
      }
      
      console.log(`Job lock already held for ${jobType}`)
      return false
    }
    
    console.error(`Failed to acquire job lock for ${jobType}:`, error)
    return false
  }
}

/**
 * Release job lock
 */
async function releaseJobLock(jobType: string): Promise<void> {
  try {
    await prisma.jobLock.delete({
      where: { jobType }
    })
    console.log(`Job lock released for ${jobType}`)
  } catch (error: any) {
    console.error(`Failed to release job lock for ${jobType}:`, error)
  }
}

/**
 * Evaluate individual alert against current ticker data
 */
async function evaluateIndividualAlert(alert: any): Promise<AlertTriggerData | null> {
  const { ticker, user } = alert
  
  // Check cooldown period (1 hour minimum between identical alerts)
  if (alert.lastTriggered) {
    const hoursSinceLastTrigger = (new Date().getTime() - alert.lastTriggered.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastTrigger < 1) {
      return null // Still in cooldown period
    }
  }

  let shouldTrigger = false
  let measuredValue = 0

  // Evaluate based on alert type
  switch (alert.type) {
    case 'PRICE_ABOVE':
      measuredValue = ticker.currentPrice || 0
      shouldTrigger = measuredValue > (alert.priceAbove || 0)
      break
      
    case 'PRICE_BELOW':
      measuredValue = ticker.currentPrice || 0
      shouldTrigger = measuredValue < (alert.priceBelow || 0)
      break
      
    case 'VOLUME_ABOVE':
      measuredValue = ticker.volume || 0
      shouldTrigger = measuredValue > (alert.volumeAbove || 0)
      break
      
    case 'CHANGE_PERCENT':
      measuredValue = ticker.changePercent24h || 0
      const targetPercent = alert.changePercent || 0
      shouldTrigger = Math.abs(measuredValue) >= Math.abs(targetPercent)
      break
      
    default:
      console.warn(`Unknown alert type: ${alert.type}`)
      return null
  }

  if (!shouldTrigger) {
    return null
  }

  return {
    alertId: alert.id,
    userId: user.id,
    tickerId: ticker.id,
    alertType: alert.type,
    measuredValue,
    threshold: getThresholdValue(alert),
    userEmail: user.email,
    tickerSymbol: ticker.symbol,
    tickerName: ticker.name
  }
}

/**
 * Get threshold value based on alert type
 */
function getThresholdValue(alert: any): number {
  switch (alert.type) {
    case 'PRICE_ABOVE':
      return alert.priceAbove || 0
    case 'PRICE_BELOW':
      return alert.priceBelow || 0
    case 'VOLUME_ABOVE':
      return alert.volumeAbove || 0
    case 'CHANGE_PERCENT':
      return alert.changePercent || 0
    default:
      return 0
  }
}

/**
 * Create AlertEvent record - provides idempotency with 5-minute buckets
 */
async function createAlertEvent(triggerData: AlertTriggerData): Promise<{ id: string } | null> {
  try {
    // Calculate deterministic 5-minute bucket
    const now = Date.now()
    const timeBucket = calculateTimeBucket(now)
    const triggeredAt = new Date(now) // Actual evaluation time
    
    console.log(`Creating AlertEvent for alert ${triggerData.alertId}, timeBucket: ${timeBucket}`)
    
    // Try to create AlertEvent with unique constraint on (alertId, timeBucket)
    try {
      const alertEvent = await prisma.alertEvent.create({
        data: {
          alertId: triggerData.alertId,
          triggeredAt: triggeredAt,      // ← Actual evaluation time
          timeBucket: timeBucket,        // ← 5-minute bucket for idempotency
          measuredValue: triggerData.measuredValue,
          status: 'PENDING'
        }
      })

      console.log(`Created new AlertEvent ${alertEvent.id} for alert ${triggerData.alertId} in bucket ${timeBucket}`)
      return alertEvent
      
    } catch (uniqueError: any) {
      // If unique constraint violation, find the existing event
      if (uniqueError.code === 'P2002') {
        console.log(`AlertEvent already exists for alert ${triggerData.alertId} in bucket ${timeBucket}`)
        
        const existingEvent = await prisma.alertEvent.findUnique({
          where: {
            alert_event_idempotency_5m: {
              alertId: triggerData.alertId,
              timeBucket: timeBucket
            }
          }
        })
        
        if (existingEvent) {
          console.log(`Reusing existing AlertEvent ${existingEvent.id} (status: ${existingEvent.status})`)
          return existingEvent
        }
      }
      
      throw uniqueError
    }
    
  } catch (error: any) {
    console.error('Failed to create AlertEvent:', error)
    return null
  }
}

/**
 * Send email notification with idempotency
 */
async function sendAlertEmail(triggerData: AlertTriggerData, alertEventId: string): Promise<boolean> {
  try {
    const resend = await getResendClient()
    if (!resend) {
      console.warn('Email service not available - marking alert as failed')
      await prisma.alertEvent.update({
        where: { id: alertEventId },
        data: {
          status: 'FAILED',
          errorMessage: 'Email service not configured'
        }
      })
      return false
    }

    const subject = `Alert: ${triggerData.tickerSymbol} ${formatAlertType(triggerData.alertType)}`
    const emailContent = generateEmailContent(triggerData)

    const result = await resend.emails.send({
      from: 'alerts@pennystockstracker.com',
      to: triggerData.userEmail,
      subject,
      html: emailContent
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    // Update AlertEvent as sent
    await prisma.alertEvent.update({
      where: { id: alertEventId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    })

    console.log(`Alert email sent successfully to ${triggerData.userEmail} for ${triggerData.tickerSymbol}`)
    return true
    
  } catch (error: any) {
    // Update AlertEvent as failed
    await prisma.alertEvent.update({
      where: { id: alertEventId },
      data: {
        status: 'FAILED',
        errorMessage: error.message
      }
    })

    console.error(`Failed to send alert email:`, error)
    return false
  }
}

/**
 * Format alert type for display
 */
function formatAlertType(alertType: string): string {
  switch (alertType) {
    case 'PRICE_ABOVE':
      return 'Price Alert (Above Threshold)'
    case 'PRICE_BELOW':
      return 'Price Alert (Below Threshold)'
    case 'VOLUME_ABOVE':
      return 'Volume Alert'
    case 'CHANGE_PERCENT':
      return 'Price Change Alert'
    default:
      return 'Alert Triggered'
  }
}

/**
 * Generate HTML email content
 */
function generateEmailContent(triggerData: AlertTriggerData): string {
  const formatValue = (type: string, value: number): string => {
    switch (type) {
      case 'PRICE_ABOVE':
      case 'PRICE_BELOW':
        return `$${value.toFixed(2)}`
      case 'VOLUME_ABOVE':
        return value.toLocaleString()
      case 'CHANGE_PERCENT':
        return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
      default:
        return value.toString()
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Penny Stocks Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">🚨 Stock Alert Triggered</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e40af;">
            ${triggerData.tickerSymbol} - ${triggerData.tickerName}
          </h3>
          
          <p style="margin: 10px 0;">
            <strong>Alert Type:</strong> ${formatAlertType(triggerData.alertType)}
          </p>
          
          <p style="margin: 10px 0;">
            <strong>Current Value:</strong> ${formatValue(triggerData.alertType, triggerData.measuredValue)}
          </p>
          
          <p style="margin: 10px 0;">
            <strong>Threshold:</strong> ${formatValue(triggerData.alertType, triggerData.threshold)}
          </p>
          
          <p style="margin: 10px 0;">
            <strong>Triggered:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="https://pennystockstracker.com/ticker/${triggerData.tickerSymbol}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View ${triggerData.tickerSymbol} Details
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6b7280;">
          This alert was sent because you have an active alert set up for ${triggerData.tickerSymbol}. 
          You can manage your alerts in your <a href="https://pennystockstracker.com/user/dashboard">dashboard</a>.
        </p>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
          <strong>Disclaimer:</strong> This information is for informational purposes only and should not be considered as financial advice. 
          Always do your own research before making investment decisions.
        </p>
      </div>
    </body>
    </html>
  `
}