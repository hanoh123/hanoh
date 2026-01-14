import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { evaluateAlerts } from '@/lib/alerts'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    console.log('Manual alert evaluation triggered by admin:', session.user.email)
    
    const result = await evaluateAlerts()

    return NextResponse.json({
      message: 'Alert evaluation completed',
      result
    })
  } catch (error: any) {
    console.error('Manual alert evaluation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}