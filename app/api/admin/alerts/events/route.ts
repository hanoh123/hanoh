import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const eventsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
  alertId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = eventsQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      status: searchParams.get('status') as any || undefined,
      alertId: searchParams.get('alertId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    })

    const page = parseInt(query.page)
    const limit = Math.min(parseInt(query.limit), 100) // Max 100 per page
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.alertId) {
      where.alertId = query.alertId
    }
    
    if (query.dateFrom || query.dateTo) {
      where.triggeredAt = {}
      if (query.dateFrom) {
        where.triggeredAt.gte = new Date(query.dateFrom)
      }
      if (query.dateTo) {
        where.triggeredAt.lte = new Date(query.dateTo)
      }
    }

    // Get alert events with pagination
    const [events, total] = await Promise.all([
      prisma.alertEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { triggeredAt: 'desc' },
        include: {
          alert: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              },
              ticker: {
                select: {
                  id: true,
                  symbol: true,
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.alertEvent.count({ where })
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin alert events fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}