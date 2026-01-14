import { NextRequest, NextResponse } from 'next/server'
import { evaluateAlerts } from '@/lib/alerts'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (Vercel cron jobs)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request - invalid secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[${new Date().toISOString()}] Vercel cron: Starting alert evaluation`)
    
    const result = await evaluateAlerts()
    
    console.log(`[${new Date().toISOString()}] Vercel cron: Alert evaluation completed`, {
      evaluated: result.evaluated,
      triggered: result.triggered,
      sent: result.sent,
      failed: result.failed,
      errorCount: result.errors.length
    })
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      result 
    })
    
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Vercel cron: Alert evaluation failed:`, error)
    
    return NextResponse.json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also support POST for external cron services
export async function POST(request: NextRequest) {
  return GET(request)
}