import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const watchlistSchema = z.object({
  tickerId: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: {
        ticker: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ watchlist })
  } catch (error) {
    console.error('Watchlist fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tickerId } = watchlistSchema.parse(body)

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_tickerId: {
          userId: session.user.id,
          tickerId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ticker already in watchlist' },
        { status: 400 }
      )
    }

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        tickerId
      },
      include: {
        ticker: true
      }
    })

    return NextResponse.json({ watchlistItem }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Watchlist add error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}