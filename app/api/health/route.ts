/**
 * Health Check Endpoint
 * Returns application health status, version, and connectivity checks
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  commit?: string
  checks: {
    database: {
      status: 'ok' | 'error'
      latency?: number
      error?: string
    }
    email: {
      configured: boolean
      provider?: string
    }
  }
  environment: string
}

export async function GET() {
  const startTime = Date.now()
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.3.0',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    checks: {
      database: {
        status: 'ok'
      },
      email: {
        configured: false
      }
    },
    environment: process.env.NODE_ENV || 'development'
  }

  // Database connectivity check
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    
    health.checks.database = {
      status: 'ok',
      latency: dbLatency
    }
  } catch (error: any) {
    health.status = 'unhealthy'
    health.checks.database = {
      status: 'error',
      error: error.message
    }
  }

  // Email provider check
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey && resendApiKey.length > 0) {
    health.checks.email = {
      configured: true,
      provider: 'resend'
    }
  }

  // Determine overall status
  if (health.checks.database.status === 'error') {
    health.status = 'unhealthy'
  } else if (!health.checks.email.configured) {
    health.status = 'degraded'
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`
    }
  })
}