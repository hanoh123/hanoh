/**
 * GET /api/admin/imports
 * List import jobs with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const type = searchParams.get('type') as 'PRICE_HISTORY_CSV' | 'PRICE_HISTORY_API' | 'ALERT_EVALUATION' | null
    const status = searchParams.get('status') as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SUCCESS_WITH_ERRORS' | null

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status

    // Get total count
    const total = await prisma.importJob.count({ where })

    // Get jobs with pagination
    const jobs = await prisma.importJob.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit
    })

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      jobs: jobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        fileName: job.fileName,
        fileSizeBytes: job.fileSizeBytes,
        totalRows: job.totalRows,
        successRows: job.successRows,
        failedRows: job.failedRows,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdBy: job.createdBy,
        duration: job.finishedAt ? 
          Math.round((job.finishedAt.getTime() - job.startedAt.getTime()) / 1000) : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    })

  } catch (error: any) {
    console.error('List imports error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}