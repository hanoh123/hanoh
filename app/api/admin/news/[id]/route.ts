import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { generateUrlHash, isValidUrl } from '@/lib/url-utils'

const newsUpdateSchema = z.object({
  headline: z.string().min(1).max(500, 'Headline must be 1-500 characters'),
  summary: z.string().max(2000, 'Summary must be less than 2000 characters').optional(),
  source: z.string().min(1).max(100, 'Source must be 1-100 characters'),
  url: z.string().url('Invalid URL format').optional(),
  imageUrl: z.string().url('Invalid image URL format').optional(),
  author: z.string().max(200, 'Author must be less than 200 characters').optional(),
  publishedAt: z.string().datetime('Invalid date format'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const news = await prisma.news.findUnique({
      where: { id: params.id },
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

    if (!news) {
      return NextResponse.json(
        { error: 'News article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Admin news fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = newsUpdateSchema.parse(body)

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { id: params.id },
      include: {
        ticker: { select: { id: true, symbol: true } }
      }
    })

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News article not found' },
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

    // Generate URL hash for deduplication if URL changed
    let urlHash: string | null = existingNews.urlHash
    if (data.url !== existingNews.url) {
      if (data.url) {
        urlHash = generateUrlHash(data.url)
        
        // Check for existing news with same ticker + URL hash (excluding current record)
        const duplicateNews = await prisma.news.findFirst({
          where: {
            tickerId: existingNews.tickerId,
            urlHash: urlHash,
            id: { not: params.id }
          },
          include: {
            ticker: { select: { symbol: true } }
          }
        })

        if (duplicateNews) {
          return NextResponse.json(
            { 
              error: 'Duplicate article detected',
              details: {
                message: `This URL already exists for ${duplicateNews.ticker.symbol}`,
                existingId: duplicateNews.id,
                existingHeadline: duplicateNews.headline,
                existingPublishedAt: duplicateNews.publishedAt
              }
            },
            { status: 409 }
          )
        }
      } else {
        urlHash = null
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

    const updatedNews = await prisma.news.update({
      where: { id: params.id },
      data: {
        headline: data.headline,
        summary: data.summary,
        source: data.source,
        url: data.url,
        urlHash: urlHash,
        imageUrl: data.imageUrl,
        author: data.author,
        publishedAt: publishedDate,
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
      news: updatedNews, 
      warnings: warnings.length > 0 ? warnings : undefined 
    })
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

    console.error('Admin news update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Check if news exists
    const existingNews = await prisma.news.findUnique({
      where: { id: params.id },
      include: {
        ticker: { select: { symbol: true, name: true } }
      }
    })

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News article not found' },
        { status: 404 }
      )
    }

    await prisma.news.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'News article deleted successfully',
      deletedNews: {
        id: existingNews.id,
        headline: existingNews.headline,
        ticker: existingNews.ticker.symbol
      }
    })
  } catch (error) {
    console.error('Admin news delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}