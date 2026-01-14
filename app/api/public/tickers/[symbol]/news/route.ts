import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import type { PublicTickerNewsResponse, PublicApiError } from '@/types/public-api'

const newsQuerySchema = z.object({
  limit: z.string().optional().default('10'),
  cursor: z.string().optional(), // News ID for cursor pagination
})

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
): Promise<NextResponse<PublicTickerNewsResponse | PublicApiError>> {
  try {
    const { searchParams } = new URL(request.url)
    const query = newsQuerySchema.parse({
      limit: searchParams.get('limit') || '10',
      cursor: searchParams.get('cursor') || undefined,
    })

    const limit = Math.min(parseInt(query.limit), 50) // Max 50 per request
    const symbol = params.symbol.toUpperCase()

    // Find ticker by symbol
    const ticker = await prisma.ticker.findUnique({
      where: { symbol },
      select: { id: true, symbol: true, name: true }
    })

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      )
    }

    // Build cursor condition for pagination
    const cursorCondition = query.cursor ? {
      OR: [
        { publishedAt: { lt: new Date(await getCursorDate(query.cursor)) } },
        {
          publishedAt: new Date(await getCursorDate(query.cursor)),
          id: { lt: query.cursor }
        }
      ]
    } : {}

    // Fetch news with cursor pagination
    const news = await prisma.news.findMany({
      where: {
        tickerId: ticker.id,
        ...cursorCondition
      },
      select: {
        id: true,
        headline: true,
        summary: true,
        source: true,
        url: true,
        imageUrl: true,
        author: true,
        publishedAt: true,
        // Exclude admin fields: createdAt, updatedAt, createdBy, updatedBy, urlHash
      },
      orderBy: [
        { publishedAt: 'desc' },
        { id: 'desc' } // Tie-breaker for stable ordering
      ],
      take: limit + 1 // Fetch one extra to determine if there are more
    })

    // Determine if there are more results
    const hasMore = news.length > limit
    const results = hasMore ? news.slice(0, limit) : news
    const nextCursor = hasMore ? results[results.length - 1].id : null

    // Map results to match PublicNewsItem type (convert null to undefined)
    const mappedResults = results.map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary ?? undefined,
      source: item.source,
      url: item.url ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
      author: item.author ?? undefined,
      publishedAt: item.publishedAt.toISOString()
    }))

    return NextResponse.json({
      news: mappedResults,
      pagination: {
        hasMore,
        nextCursor,
        limit
      },
      ticker: {
        symbol: ticker.symbol,
        name: ticker.name
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Public ticker news fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get cursor date for pagination
async function getCursorDate(cursorId: string): Promise<string> {
  const cursorNews = await prisma.news.findUnique({
    where: { id: cursorId },
    select: { publishedAt: true }
  })
  
  return cursorNews?.publishedAt.toISOString() || new Date().toISOString()
}