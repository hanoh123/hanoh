# CSV Import System - Price History Ingestion

## Overview

The CSV Import System provides robust, auditable price history data ingestion with comprehensive validation, error handling, and progress tracking.

## Features

- **Dual CSV Format Support**: Single-ticker and multi-ticker formats
- **Strict Date Normalization**: All dates normalized to UTC daily candles
- **Comprehensive Validation**: OHLC sanity checks, numeric validation, required field validation
- **Upsert Strategy**: Prevents duplicates using (tickerId, date) unique constraint
- **Error Tracking**: Detailed error reports with downloadable CSV
- **Job Auditing**: Complete import job lifecycle tracking
- **Failure Threshold**: Jobs fail if >20% of rows are invalid

## CSV Formats

### Single-Ticker Format
Use when uploading data for a specific ticker (requires Ticker ID):

```csv
date,open,high,low,close,volume
2024-02-15,10.50,11.00,10.25,10.75,1000000
2024-02-16,10.75,11.25,10.50,11.00,1200000
```

### Multi-Ticker Format
Use when uploading data for multiple tickers:

```csv
symbol,date,open,high,low,close,volume
AAPL,2024-02-15,150.00,152.00,149.50,151.00,50000000
MSFT,2024-02-15,400.00,405.00,398.00,402.00,30000000
```

## Date Formats Supported

The system accepts multiple date formats and normalizes them to UTC:

- `YYYY-MM-DD` (recommended)
- `MM/DD/YYYY`
- `YYYY/MM/DD`
- `MM-DD-YYYY`

All dates are normalized to `YYYY-MM-DD 00:00:00Z` for consistent daily candle keys.

## Validation Rules

### Required Fields
- `date`: Must be a valid date in supported format
- `open`, `high`, `low`, `close`: Must be non-negative numbers
- `volume`: Must be non-negative number
- `symbol`: Required for multi-ticker format

### Numeric Validation
- All price fields (`open`, `high`, `low`, `close`) must be >= 0
- Volume must be >= 0
- No null or empty values allowed

### OHLC Sanity Checks
- `high` >= max(`open`, `close`, `low`)
- `low` <= min(`open`, `close`, `high`)

### Business Rules
- Multi-ticker CSV: Symbol must exist in database (no auto-creation)
- Single-ticker CSV: Must provide valid Ticker ID
- Duplicate (tickerId, date) combinations are updated, not duplicated

## API Endpoints

### Upload CSV
```
POST /api/admin/imports/price-history
Content-Type: multipart/form-data

Body:
- file: CSV file
- tickerId: (optional) Required for single-ticker CSV
```

### List Import Jobs
```
GET /api/admin/imports?page=1&limit=20&status=COMPLETED&type=PRICE_HISTORY_CSV
```

### Get Job Details
```
GET /api/admin/imports/{jobId}
```

## Import Job Statuses

- **PENDING**: Job created, not yet started
- **RUNNING**: Currently processing CSV
- **COMPLETED**: Successfully processed all valid rows
- **SUCCESS_WITH_ERRORS**: Completed with some invalid rows (< 20%)
- **FAILED**: Failed due to high error rate (> 20%) or system error

## Error Handling

### Error Threshold
Jobs fail if more than 20% of rows are invalid. This prevents importing datasets with systemic issues.

### Error Reporting
- **Error Sample**: First 10 errors stored in job record
- **Error CSV**: Downloadable CSV with all validation errors
- **Error Details**: Row number, field, value, and specific error message

### Example Error CSV
```csv
Row Number,Field,Value,Error
2,date,,Date is required
3,open,invalid,Open must be a non-negative number
4,high,5.00,High must be >= max(open,close,low)
```

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Prisma CLI

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Access admin panel:
   ```
   http://localhost:3000/admin/imports
   ```

### Testing
Run the comprehensive test suite:

```bash
# All tests
npm test

# CSV import tests only
npm test __tests__/csv-import.test.tsx

# With coverage
npm run test:coverage
```

## Sample Files

The `samples/` directory contains example CSV files:

- `single-ticker-sample.csv`: Valid single-ticker format
- `multi-ticker-sample.csv`: Valid multi-ticker format  
- `invalid-data-sample.csv`: Mixed valid/invalid data for testing

## Database Schema

### ImportJob Model
```prisma
model ImportJob {
  id            String    @id @default(cuid())
  type          JobType   // PRICE_HISTORY_CSV
  status        JobStatus // PENDING/RUNNING/COMPLETED/FAILED/SUCCESS_WITH_ERRORS
  fileName      String?
  fileSizeBytes Int?
  totalRows     Int?
  successRows   Int?
  failedRows    Int?
  errorSample   String?   // JSON array of first 10 errors
  errorFileUrl  String?   // URL to downloadable error CSV
  startedAt     DateTime  @default(now())
  finishedAt    DateTime?
  createdBy     String?   // Admin user ID
}
```

### PriceHistory Model
```prisma
model PriceHistory {
  id        String   @id @default(cuid())
  tickerId  String
  date      DateTime // Normalized to UTC daily candle
  open      Float
  high      Float
  low       Float
  close     Float
  volume    Float
  createdAt DateTime @default(now())
  
  ticker    Ticker   @relation(fields: [tickerId], references: [id])
  
  @@unique([tickerId, date]) // Prevents duplicates
}
```

## Production Considerations

### Performance
- Large CSV files (>10MB) should use background job processing
- Consider implementing file chunking for very large datasets
- Database connection pooling for concurrent imports

### Security
- File size limits (currently handled by Next.js)
- File type validation (CSV only)
- Admin-only access with proper authentication
- Input sanitization and validation

### Monitoring
- Import job metrics and alerting
- Error rate monitoring
- Performance tracking (rows/second)
- Storage usage for error files

### Scalability
- Queue-based processing for production (Redis/Bull)
- Horizontal scaling with job distribution
- Database partitioning for large price history tables

## Troubleshooting

### Common Issues

1. **"Ticker not found" errors**
   - Ensure tickers exist in database before importing multi-ticker CSV
   - Use correct ticker symbols (case-sensitive)

2. **Date parsing errors**
   - Use supported date formats
   - Ensure dates are valid (no Feb 30th, etc.)

3. **OHLC validation failures**
   - Verify high >= max(open, close, low)
   - Verify low <= min(open, close, high)

4. **High failure rate**
   - Check CSV format matches expected columns
   - Validate data quality before upload
   - Use sample files to test format

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=csv-import npm run dev
```

## Support

For issues or questions:
1. Check the error sample in job details
2. Download error CSV for detailed analysis
3. Verify CSV format against samples
4. Check database logs for constraint violations