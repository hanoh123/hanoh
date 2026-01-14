/**
 * GET /api/admin/imports/[id]
 * Get detailed information about a specific import job
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get import job details
    const job = await prisma.importJob.findUnique({
      where: { id: params.id }
    })

    if (!job) {
      return NextResponse.json({ error: 'Import job not found' }, { status: 404 })
    }

    // Parse error sample if available
    let errorSample = null
    if (job.errorSample) {
      try {
        errorSample = JSON.parse(job.errorSample)
      } catch (e) {
        errorSample = [{ error: 'Failed to parse error sample' }]
      }
    }

    // Calculate metrics
    const duration = job.finishedAt ? 
      Math.round((job.finishedAt.getTime() - job.startedAt.getTime()) / 1000) : null

    const successRate = job.totalRows ? 
      Math.round((job.successRows || 0) / job.totalRows * 100) : null

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      fileName: job.fileName,
      fileSizeBytes: job.fileSizeBytes,
      totalRows: job.totalRows,
      successRows: job.successRows,
      failedRows: job.failedRows,
      errorSample,
      errorFileUrl: job.errorFileUrl,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      createdBy: job.createdBy,
      duration,
      successRate
    })

  } catch (error: any) {
    console.error('Get import job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}