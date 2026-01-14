/**
 * CSV Import Library for Price History
 * Handles validation, parsing, and database operations with comprehensive error tracking
 */

import { prisma } from '@/lib/db'

export interface CSVRow {
  rowNumber: number
  symbol?: string
  date: string
  open: string
  high: string
  low: string
  close: string
  volume: string
}

export interface ValidationError {
  rowNumber: number
  field: string
  value: string
  error: string
}

export interface ParsedPriceData {
  symbol?: string
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ImportResult {
  totalRows: number
  successRows: number
  failedRows: number
  errors: ValidationError[]
  processedData: ParsedPriceData[]
}

export interface ImportJobUpdate {
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SUCCESS_WITH_ERRORS'
  totalRows?: number
  successRows?: number
  failedRows?: number
  errorSample?: string
  errorFileUrl?: string
  finishedAt?: Date
}

/**
 * Parse CSV content into structured rows
 */
export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: CSVRow[] = []

  // Validate required columns
  const requiredSingleTicker = ['date', 'open', 'high', 'low', 'close', 'volume']
  const requiredMultiTicker = ['symbol', 'date', 'open', 'high', 'low', 'close', 'volume']
  
  const isSingleTicker = requiredSingleTicker.every(col => header.includes(col))
  const isMultiTicker = requiredMultiTicker.every(col => header.includes(col))
  
  if (!isSingleTicker && !isMultiTicker) {
    throw new Error(`CSV must have either single-ticker columns [${requiredSingleTicker.join(', ')}] or multi-ticker columns [${requiredMultiTicker.join(', ')}]`)
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.length !== header.length) {
      continue // Skip malformed rows
    }

    const row: CSVRow = {
      rowNumber: i + 1,
      date: '',
      open: '',
      high: '',
      low: '',
      close: '',
      volume: ''
    }

    // Map values to fields
    header.forEach((col, index) => {
      switch (col) {
        case 'symbol':
          row.symbol = values[index]
          break
        case 'date':
          row.date = values[index]
          break
        case 'open':
          row.open = values[index]
          break
        case 'high':
          row.high = values[index]
          break
        case 'low':
          row.low = values[index]
          break
        case 'close':
          row.close = values[index]
          break
        case 'volume':
          row.volume = values[index]
          break
      }
    })

    rows.push(row)
  }

  return rows
}

/**
 * Normalize date to UTC day (YYYY-MM-DD 00:00:00Z)
 */
export function normalizeDate(dateStr: string): Date {
  // Try common date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  ]

  let parsedDate: Date

  if (formats[0].test(dateStr)) {
    // YYYY-MM-DD
    parsedDate = new Date(dateStr + 'T00:00:00Z')
  } else if (formats[1].test(dateStr)) {
    // MM/DD/YYYY
    const [month, day, year] = dateStr.split('/')
    parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`)
  } else if (formats[2].test(dateStr)) {
    // YYYY/MM/DD
    const [year, month, day] = dateStr.split('/')
    parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`)
  } else if (formats[3].test(dateStr)) {
    // MM-DD-YYYY
    const [month, day, year] = dateStr.split('-')
    parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`)
  } else {
    throw new Error(`Unsupported date format: ${dateStr}. Supported formats: YYYY-MM-DD, MM/DD/YYYY, YYYY/MM/DD, MM-DD-YYYY`)
  }

  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`)
  }

  return parsedDate
}

/**
 * Validate and parse a single CSV row
 */
export function validateAndParseRow(row: CSVRow): { data?: ParsedPriceData; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  // Validate required fields
  if (!row.date) {
    errors.push({ rowNumber: row.rowNumber, field: 'date', value: row.date, error: 'Date is required' })
  }
  if (!row.open) {
    errors.push({ rowNumber: row.rowNumber, field: 'open', value: row.open, error: 'Open price is required' })
  }
  if (!row.high) {
    errors.push({ rowNumber: row.rowNumber, field: 'high', value: row.high, error: 'High price is required' })
  }
  if (!row.low) {
    errors.push({ rowNumber: row.rowNumber, field: 'low', value: row.low, error: 'Low price is required' })
  }
  if (!row.close) {
    errors.push({ rowNumber: row.rowNumber, field: 'close', value: row.close, error: 'Close price is required' })
  }
  if (!row.volume) {
    errors.push({ rowNumber: row.rowNumber, field: 'volume', value: row.volume, error: 'Volume is required' })
  }

  if (errors.length > 0) {
    return { errors }
  }

  try {
    // Parse and validate date
    const date = normalizeDate(row.date)

    // Parse and validate numeric fields
    const open = parseFloat(row.open)
    const high = parseFloat(row.high)
    const low = parseFloat(row.low)
    const close = parseFloat(row.close)
    const volume = parseFloat(row.volume)

    // Numeric validation
    if (isNaN(open) || open < 0) {
      errors.push({ rowNumber: row.rowNumber, field: 'open', value: row.open, error: 'Open must be a non-negative number' })
    }
    if (isNaN(high) || high < 0) {
      errors.push({ rowNumber: row.rowNumber, field: 'high', value: row.high, error: 'High must be a non-negative number' })
    }
    if (isNaN(low) || low < 0) {
      errors.push({ rowNumber: row.rowNumber, field: 'low', value: row.low, error: 'Low must be a non-negative number' })
    }
    if (isNaN(close) || close < 0) {
      errors.push({ rowNumber: row.rowNumber, field: 'close', value: row.close, error: 'Close must be a non-negative number' })
    }
    if (isNaN(volume) || volume < 0) {
      errors.push({ rowNumber: row.rowNumber, field: 'volume', value: row.volume, error: 'Volume must be a non-negative number' })
    }

    if (errors.length > 0) {
      return { errors }
    }

    // OHLC sanity checks
    if (high < Math.max(open, close, low)) {
      errors.push({ rowNumber: row.rowNumber, field: 'high', value: row.high, error: 'High must be >= max(open, close, low)' })
    }
    if (low > Math.min(open, close, high)) {
      errors.push({ rowNumber: row.rowNumber, field: 'low', value: row.low, error: 'Low must be <= min(open, close, high)' })
    }

    if (errors.length > 0) {
      return { errors }
    }

    const data: ParsedPriceData = {
      symbol: row.symbol,
      date,
      open,
      high,
      low,
      close,
      volume
    }

    return { data, errors: [] }

  } catch (error: any) {
    errors.push({ rowNumber: row.rowNumber, field: 'date', value: row.date, error: error.message })
    return { errors }
  }
}

/**
 * Process CSV content and validate all rows
 */
export function processCSV(csvContent: string): ImportResult {
  const rows = parseCSV(csvContent)
  const errors: ValidationError[] = []
  const processedData: ParsedPriceData[] = []

  for (const row of rows) {
    const result = validateAndParseRow(row)
    
    if (result.errors.length > 0) {
      errors.push(...result.errors)
    } else if (result.data) {
      processedData.push(result.data)
    }
  }

  return {
    totalRows: rows.length,
    successRows: processedData.length,
    failedRows: errors.length > 0 ? rows.length - processedData.length : 0,
    errors,
    processedData
  }
}

/**
 * Upsert price history data to database
 */
export async function upsertPriceHistory(
  data: ParsedPriceData[], 
  tickerId?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const item of data) {
    try {
      let targetTickerId = tickerId

      // For multi-ticker CSV, look up ticker by symbol
      if (!targetTickerId && item.symbol) {
        const ticker = await prisma.ticker.findUnique({
          where: { symbol: item.symbol.toUpperCase() }
        })
        
        if (!ticker) {
          failed++
          errors.push(`Ticker not found for symbol: ${item.symbol}`)
          continue
        }
        
        targetTickerId = ticker.id
      }

      if (!targetTickerId) {
        failed++
        errors.push('No ticker ID available for price history record')
        continue
      }

      // Upsert price history record
      await prisma.priceHistory.upsert({
        where: {
          tickerId_date: {
            tickerId: targetTickerId,
            date: item.date
          }
        },
        update: {
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        },
        create: {
          tickerId: targetTickerId,
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        }
      })

      success++
    } catch (error: any) {
      failed++
      errors.push(`Database error for ${item.symbol || 'unknown'} ${item.date.toISOString()}: ${error.message}`)
    }
  }

  return { success, failed, errors }
}

/**
 * Generate error CSV content
 */
export function generateErrorCSV(errors: ValidationError[]): string {
  const header = 'Row Number,Field,Value,Error\n'
  const rows = errors.map(error => 
    `${error.rowNumber},"${error.field}","${error.value}","${error.error}"`
  ).join('\n')
  
  return header + rows
}

/**
 * Update import job status and metrics
 */
export async function updateImportJob(jobId: string, update: ImportJobUpdate): Promise<void> {
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: update.status,
      totalRows: update.totalRows,
      successRows: update.successRows,
      failedRows: update.failedRows,
      errorSample: update.errorSample,
      errorFileUrl: update.errorFileUrl,
      finishedAt: update.finishedAt
    }
  })
}

/**
 * Calculate failure threshold (job fails if >20% of rows are invalid)
 */
export function shouldFailJob(totalRows: number, failedRows: number): boolean {
  if (totalRows === 0) return true
  const failureRate = failedRows / totalRows
  return failureRate > 0.2 // 20% threshold
}