import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const catalystCreateSchema = z.object({
  tickerId: z.string().min(1, 'Ticker is required'),
  title: z.string().min(1).max(200, 'Title must be 1-200 characters'),
  description: z.string().optional(),
  date: z.string().datetime('Invalid date format'),
  category: z.enum([
    'EARNINGS',
    'FDA_APPROVAL', 
    'PARTNERSHIP',
    'ACQUISITION',
    'PRODUCT_LAUNCH',
    'CLINICAL_TRIAL',
    'REGULATORY',
    'INSIDER_BUYING',
    'SHORT_SQUEEZE',
    'OTHER'
  ]),
  impactLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
})

const catalystUpdateSchema = catalystCreateSchema.omit({ tickerId: true })

const catalystQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  tickerId: z.string().optional(),
  category: z.string().optional(),
  impactLevel: z.string().optional(),
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
    const query = catalystQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      tickerId: searchParams.get('tickerId') || undefined,
      category: searchParams.get('category') || undefined,
      impactLevel: searchParams.get('impactLevel') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    })

    const page = parseInt(query.page)
    const limit = Math.min(parseInt(query.limit), 100) // Max 100 per page
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (query.tickerId) {
      where.tickerId = query.tickerId
    }
    
    if (query.category) {
      where.category = query.category
    }
    
    if (query.impactLevel) {
      where.impactLevel = query.impactLevel
    }
    
    if (query.dateFrom || query.dateTo) {
      where.date = {}
      if (query.dateFrom) {
        where.date.gte = new Date(query.dateFrom)
      }
      if (query.dateTo) {
        where.date.lte = new Date(query.dateTo)
      }
    }

    // Get catalysts with pagination
    const [catalysts, total] = await Promise.all([
      prisma.catalyst.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          ticker: {
            select: {
              id: true,
              symbol: true,
              name: true,
            }
          }
        }
      }),
      prisma.catalyst.count({ where })
    ])

    return NextResponse.json({
      catalysts,
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

    console.error('Admin catalysts fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = catalystCreateSchema.parse(body)

    // Verify ticker exists
    const ticker = await prisma.ticker.findUnique({
      where: { id: data.tickerId },
      select: { id: true, symbol: true, name: true }
    })

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      )
    }

    // Validate date (allow future dates, warn for very old dates)
    const catalystDate = new Date(data.date)
    const now = new Date()
    const warnings = []
    
    const daysDiff = Math.floor((catalystDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < -365) {
      warnings.push('Catalyst date is more than 1 year in the past')
    }
    
    if (daysDiff > 730) {
      warnings.push('Catalyst date is more than 2 years in the future')
    }

    const catalyst = await prisma.catalyst.create({
      data: {
        tickerId: data.tickerId,
        title: data.title,
        description: data.description,
        date: catalystDate,
        category: data.category,
        impactLevel: data.impactLevel,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        ticker: {
          select: {
            id: true,
            symbol: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json({ 
      catalyst, 
      warnings: warnings.length > 0 ? warnings : undefined 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin catalyst create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}