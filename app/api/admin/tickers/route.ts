import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const tickerCreateSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only'),
  name: z.string().min(1).max(200),
  sector: z.string().optional(),
  exchange: z.string().optional(),
  marketCap: z.number().positive().optional(),
  float: z.number().positive().optional(),
  sharesOutstanding: z.number().positive().optional(),
})

const tickerUpdateSchema = z.object({
  name: z.string().min(1).max(200),
  sector: z.string().optional(),
  exchange: z.string().optional(),
  marketCap: z.number().positive().optional(),
  float: z.number().positive().optional(),
  sharesOutstanding: z.number().positive().optional(),
})

const tickerQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  search: z.string().optional(),
  sector: z.string().optional(),
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
    const query = tickerQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      search: searchParams.get('search') || undefined,
      sector: searchParams.get('sector') || undefined,
    })

    const page = parseInt(query.page)
    const limit = Math.min(parseInt(query.limit), 100) // Max 100 per page
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (query.search) {
      where.OR = [
        { symbol: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } }
      ]
    }
    
    if (query.sector) {
      where.sector = query.sector
    }

    // Get tickers with pagination
    const [tickers, total] = await Promise.all([
      prisma.ticker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { symbol: 'asc' },
        include: {
          _count: {
            select: {
              catalysts: true,
              news: true,
              watchlists: true,
              alerts: true,
            }
          }
        }
      }),
      prisma.ticker.count({ where })
    ])

    return NextResponse.json({
      tickers,
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

    console.error('Admin tickers fetch error:', error)
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
    const data = tickerCreateSchema.parse(body)

    // Check if symbol already exists
    const existingTicker = await prisma.ticker.findUnique({
      where: { symbol: data.symbol }
    })

    if (existingTicker) {
      return NextResponse.json(
        { error: 'Ticker with this symbol already exists' },
        { status: 409 }
      )
    }

    // Soft validations (warnings, not errors)
    const warnings = []
    if (data.marketCap && data.marketCap > 1000000000000) {
      warnings.push('Market cap seems unusually high (>$1T)')
    }
    if (data.float && data.sharesOutstanding && data.float > data.sharesOutstanding) {
      warnings.push('Float cannot be greater than shares outstanding')
    }

    const ticker = await prisma.ticker.create({
      data: {
        ...data,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        _count: {
          select: {
            catalysts: true,
            news: true,
            watchlists: true,
            alerts: true,
          }
        }
      }
    })

    return NextResponse.json({ 
      ticker, 
      warnings: warnings.length > 0 ? warnings : undefined 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin ticker create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}