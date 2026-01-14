/**
 * POST /api/admin/imports/price-history
 * Upload and process price history CSV files
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { 
  processCSV, 
  upsertPriceHistory, 
  generateErrorCSV,
  updateImportJob,
  shouldFailJob
} from '@/lib/csv-import'

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tickerId = formData.get('tickerId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read file content
    const csvContent = await file.text()
    const fileSizeBytes = file.size

    // Create import job record
    const importJob = await prisma.importJob.create({
      data: {
        type: 'PRICE_HISTORY_CSV',
        status: 'PENDING',
        fileName: file.name,
        fileSizeBytes,
        createdBy: user.id
      }
    })

    // Process CSV asynchronously (in production, use a queue)
    // For now, process synchronously with timeout protection
    try {
      // Update status to RUNNING
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: { status: 'RUNNING' }
      })

      // Parse and validate CSV
      const result = processCSV(csvContent)

      // Check failure threshold (>20% invalid rows = job fails)
      const shouldFail = shouldFailJob(result.totalRows, result.failedRows)

      if (shouldFail) {
        // Generate error report
        const errorSample = JSON.stringify(result.errors.slice(0, 10))
        const errorCSV = generateErrorCSV(result.errors)

        await updateImportJob(importJob.id, {
          status: 'FAILED',
          totalRows: result.totalRows,
          successRows: 0,
          failedRows: result.failedRows,
          errorSample,
          finishedAt: new Date()
        })

        return NextResponse.json({
          success: false,
          jobId: importJob.id,
          message: `Import failed: ${result.failedRows} of ${result.totalRows} rows invalid (>${20}% threshold)`,
          errors: result.errors.slice(0, 10),
          errorCSV
        }, { status: 400 })
      }

      // Upsert valid data to database
      const dbResult = await upsertPriceHistory(result.processedData, tickerId || undefined)

      // Determine final status
      const finalStatus = dbResult.failed > 0 ? 'SUCCESS_WITH_ERRORS' : 'COMPLETED'
      const totalErrors = [...result.errors]
      
      // Add database errors to error list
      dbResult.errors.forEach((error, index) => {
        totalErrors.push({
          rowNumber: result.successRows + index + 1,
          field: 'database',
          value: '',
          error
        })
      })

      // Generate error report if there are errors
      const errorSample = totalErrors.length > 0 ? JSON.stringify(totalErrors.slice(0, 10)) : null
      const errorCSV = totalErrors.length > 0 ? generateErrorCSV(totalErrors) : null

      await updateImportJob(importJob.id, {
        status: finalStatus,
        totalRows: result.totalRows,
        successRows: dbResult.success,
        failedRows: result.failedRows + dbResult.failed,
        errorSample: errorSample || undefined,
        finishedAt: new Date()
      })

      return NextResponse.json({
        success: true,
        jobId: importJob.id,
        status: finalStatus,
        totalRows: result.totalRows,
        successRows: dbResult.success,
        failedRows: result.failedRows + dbResult.failed,
        errors: totalErrors.slice(0, 10),
        errorCSV: errorCSV || undefined
      })

    } catch (error: any) {
      // Update job as failed
      await updateImportJob(importJob.id, {
        status: 'FAILED',
        errorSample: JSON.stringify([{ error: error.message }]),
        finishedAt: new Date()
      })

      return NextResponse.json({
        success: false,
        jobId: importJob.id,
        error: error.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
