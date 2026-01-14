import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the watchlist item belongs to the user
    const watchlistItem = await prisma.watchlist.findUnique({
      where: { id: params.id }
    })

    if (!watchlistItem || watchlistItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      )
    }

    await prisma.watchlist.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Removed from watchlist' })
  } catch (error) {
    console.error('Watchlist remove error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}