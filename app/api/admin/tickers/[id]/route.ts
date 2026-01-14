import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const tickerUpdateSchema = z.object({
  name: z.string().min(1).max(200),
  sector: z.string().optional(),
  exchange: z.string().optional(),
  marketCap: z.number().positive().optional(),
  float: z.number().positive().optional(),
  sharesOutstanding: z.number().positive().optional(),
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

    const ticker = await prisma.ticker.findUnique({
      where: { id: params.id },
      include: {
        catalysts: {
          orderBy: { date: 'desc' },
          take: 10
        },
        news: {
          orderBy: { publishedAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            catalysts: true,
            news: true,
            watchlists: true,
            alerts: true,
            priceHistory: true,
          }
        }
      }
    })

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticker })
  } catch (error) {
    console.error('Admin ticker fetch error:', error)
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
    const data = tickerUpdateSchema.parse(body)

    // Check if ticker exists
    const existingTicker = await prisma.ticker.findUnique({
      where: { id: params.id }
    })

    if (!existingTicker) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
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

    const ticker = await prisma.ticker.update({
      where: { id: params.id },
      data: {
        ...data,
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
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin ticker update error:', error)
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

    // Check if ticker exists and has dependencies
    const ticker = await prisma.ticker.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            catalysts: true,
            news: true,
            watchlists: true,
            alerts: true,
            priceHistory: true,
          }
        }
      }
    })

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      )
    }

    // Check for dependencies
    const totalDependencies = ticker._count.catalysts + 
                             ticker._count.news + 
                             ticker._count.watchlists + 
                             ticker._count.alerts + 
                             ticker._count.priceHistory

    if (totalDependencies > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete ticker with existing data',
          details: {
            catalysts: ticker._count.catalysts,
            news: ticker._count.news,
            watchlists: ticker._count.watchlists,
            alerts: ticker._count.alerts,
            priceHistory: ticker._count.priceHistory,
          }
        },
        { status: 409 }
      )
    }

    await prisma.ticker.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Ticker deleted successfully' })
  } catch (error) {
    console.error('Admin ticker delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}