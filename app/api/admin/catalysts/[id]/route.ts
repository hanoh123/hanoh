import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const catalystUpdateSchema = z.object({
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
  impactLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
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

    const catalyst = await prisma.catalyst.findUnique({
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

    if (!catalyst) {
      return NextResponse.json(
        { error: 'Catalyst not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ catalyst })
  } catch (error) {
    console.error('Admin catalyst fetch error:', error)
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
    const data = catalystUpdateSchema.parse(body)

    // Check if catalyst exists
    const existingCatalyst = await prisma.catalyst.findUnique({
      where: { id: params.id }
    })

    if (!existingCatalyst) {
      return NextResponse.json(
        { error: 'Catalyst not found' },
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

    const catalyst = await prisma.catalyst.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        date: catalystDate,
        category: data.category,
        impactLevel: data.impactLevel,
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
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Admin catalyst update error:', error)
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

    // Check if catalyst exists
    const catalyst = await prisma.catalyst.findUnique({
      where: { id: params.id },
      include: {
        ticker: {
          select: { symbol: true }
        }
      }
    })

    if (!catalyst) {
      return NextResponse.json(
        { error: 'Catalyst not found' },
        { status: 404 }
      )
    }

    await prisma.catalyst.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Catalyst deleted successfully',
      deletedCatalyst: {
        id: params.id,
        title: catalyst.title,
        ticker: catalyst.ticker.symbol
      }
    })
  } catch (error) {
    console.error('Admin catalyst delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}