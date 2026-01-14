import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { generateUrlHash, isValidUrl } from '@/lib/url-utils'

const newsCreateSchema = z.object({
  tickerId: z.string().min(1, 'Ticker is required'),
  headline: z.string().min(1).max(500, 'Headline must be 1-500 characters'),
  summary: z.string().max(2000, 'Summary must be less than 2000 characters').optional(),
  source: z.string().min(1).max(100, 'Source must be 1-100 characters'),
  url: z.string().url('Invalid URL format').optional(),
  imageUrl: z.string().url('Invalid image URL format').optional(),
  author: z.string().max(200, 'Author must be less than 200 characters').optional(),
  publishedAt: z.string().datetime('Invalid date format'),
})

const newsUpdateSchema = newsCreateSchema.omit({ tickerId: true })

const newsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  tickerId: z.string().optional(),
  source: z.string().optional(),
  search: z.string().optional(), // Search in headline
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
    const query = newsQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      tickerId: searchParams.get('tickerId') || undefined,
      source: searchParams.get('source') || undefined,
      search: searchParams.get('search') || undefined,
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
    
    if (query.source) {
      where.source = { contains: query.source, mode: 'insensitive' }
    }
    
    if (query.search) {
      where.headline = { contains: query.search, mode: 'insensitive' }
    }
    
    if (query.dateFrom || query.dateTo) {
      where.publishedAt = {}
      if (query.dateFrom) {
        where.publishedAt.gte = new Date(query.dateFrom)
      }
      if (query.dateTo) {
        where.publishedAt.lte = new Date(query.dateTo)
      }
    }

    // Get news with pagination
    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
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
      prisma.news.count({ where })
    ])

    return NextResponse.json({
      news,
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

    console.error('Admin news fetch error:', error)
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
    const data = newsCreateSchema.parse(body)

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

    // Validate URL if provided
    if (data.url && !isValidUrl(data.url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Generate URL hash for deduplication
    let urlHash: string | null = null
    if (data.url) {
      urlHash = generateUrlHash(data.url)
      
      // Check for existing news with same ticker + URL hash
      const existingNews = await prisma.news.findUnique({
        where: {
          news_ticker_url_unique: {
            tickerId: data.tickerId,
            urlHash: urlHash
          }
        },
        include: {
          ticker: { select: { symbol: true } }
        }
      })

      if (existingNews) {
        return NextResponse.json(
          { 
            error: 'Duplicate article detected',
            details: {
              message: `This URL already exists for ${existingNews.ticker.symbol}`,
              existingId: existingNews.id,
              existingHeadline: existingNews.headline,
              existingPublishedAt: existingNews.publishedAt
            }
          },
          { status: 409 }
        )
      }
    }

    // Validate published date (warn if too far in future)
    const publishedDate = new Date(data.publishedAt)
    const now = new Date()
    const warnings = []
    
    const daysDiff = Math.floor((publishedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 7) {
      warnings.push('Published date is more than 7 days in the future')
    }
    
    if (daysDiff < -365) {
      warnings.push('Published date is more than 1 year in the past')
    }

    const news = await prisma.news.create({
      data: {
        tickerId: data.tickerId,
        headline: data.headline,
        summary: data.summary,
        source: data.source,
        url: data.url,
        urlHash: urlHash,
        imageUrl: data.imageUrl,
        author: data.author,
        publishedAt: publishedDate,
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
      news, 
      warnings: warnings.length > 0 ? warnings : undefined 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Duplicate article detected - this URL already exists for this ticker' },
        { status: 409 }
      )
    }

    console.error('Admin news create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}