import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import type { PublicNewsTimelineResponse, PublicApiError } from '@/types/public-api'

const newsQuerySchema = z.object({
  limit: z.string().optional().default('20'),
  cursor: z.string().optional(), // News ID for cursor pagination
})

export async function GET(request: NextRequest): Promise<NextResponse<PublicNewsTimelineResponse | PublicApiError>> {
  try {
    const { searchParams } = new URL(request.url)
    const query = newsQuerySchema.parse({
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    })

    const limit = Math.min(parseInt(query.limit), 50) // Max 50 per request

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
      where: cursorCondition,
      select: {
        id: true,
        headline: true,
        summary: true,
        source: true,
        url: true,
        imageUrl: true,
        author: true,
        publishedAt: true,
        ticker: {
          select: {
            symbol: true,
            name: true
          }
        }
        // Exclude admin fields: createdAt, updatedAt, createdBy, updatedBy, urlHash, tickerId
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

    // Map results to match PublicNewsItemWithTicker type (convert null to undefined)
    const mappedResults = results.map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary ?? undefined,
      source: item.source,
      url: item.url ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
      author: item.author ?? undefined,
      publishedAt: item.publishedAt.toISOString(),
      ticker: {
        symbol: item.ticker.symbol,
        name: item.ticker.name
      }
    }))

    return NextResponse.json({
      news: mappedResults,
      pagination: {
        hasMore,
        nextCursor,
        limit
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Public news timeline fetch error:', error)
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