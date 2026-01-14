# Sprint 3 PRD - Admin CRUD + Alerts Engine + Data Ingestion

## Goal
Enable comprehensive admin management capabilities, automated alerts system, and basic data ingestion pipeline with production-grade operational monitoring.

## Epic 1: Admin CRUD Operations

### US3.1: Ticker Management
**As an admin**, I can manage ticker data through a comprehensive interface.

**Acceptance Criteria:**
- ✅ Create new tickers with validation (symbol, name, sector required)
- ✅ Update ticker information (symbol immutable after creation)
- ✅ Search tickers by symbol/name with pagination (50 per page)
- ✅ Soft validation warnings (e.g., unusual market cap, missing sector)
- ✅ Audit trail: createdBy/updatedBy fields populated
- ✅ RBAC: Only ADMIN role can access ticker management
- ✅ Error handling: duplicate symbols, invalid data formats

### US3.2: Catalyst Management  
**As an admin**, I can manage catalyst events tied to specific tickers.

**Acceptance Criteria:**
- ✅ Create catalysts linked to existing tickers
- ✅ Update catalyst details (title, description, date, category, impact)
- ✅ Delete catalysts with confirmation
- ✅ Category validation: EARNINGS, FDA_APPROVAL, PARTNERSHIP, etc.
- ✅ Impact level validation: LOW, MEDIUM, HIGH, CRITICAL
- ✅ Date handling: future dates allowed, timezone awareness
- ✅ Audit trail: createdBy/updatedBy tracking

### US3.3: News Management
**As an admin**, I can manage news articles with deduplication.

**Acceptance Criteria:**
- ✅ Create news articles linked to tickers
- ✅ Update news content (headline, summary, source, URL)
- ✅ Delete news articles
- ✅ Deduplication: prevent duplicate articles via URL hash
- ✅ Source validation: required field with length limits
- ✅ Published date handling with timezone support
- ✅ Audit trail: createdBy/updatedBy tracking

## Epic 2: Alerts Engine

### US3.4: Alert Evaluation System
**As a system**, I can automatically evaluate user alerts and send notifications.

**Acceptance Criteria:**
- ✅ Cron job evaluates all active alerts every 15 minutes
- ✅ Support alert types: PRICE_ABOVE, PRICE_BELOW, VOLUME_ABOVE, CHANGE_PERCENT
- ✅ Anti-spam: 1-hour cooldown between identical alerts
- ✅ Email notifications sent via configured provider
- ✅ Idempotency: no duplicate emails on job retry
- ✅ Error handling: failed emails logged, alerts remain active

### US3.5: Alert Audit Trail
**As an admin**, I can monitor alert system performance and failures.

**Acceptance Criteria:**
- ✅ AlertEvent table logs all alert evaluations
- ✅ Track: alertId, triggeredAt, measuredValue, sentAt, status, errorMessage
- ✅ Status tracking: PENDING, SENT, FAILED
- ✅ Admin dashboard shows alert statistics
- ✅ Failed alert notifications visible to admins
- ✅ Retry mechanism for failed email sends

## Epic 3: Price History Ingestion

### US3.6: CSV Import System
**As an admin**, I can import price history data via CSV upload.

**Acceptance Criteria:**
- ✅ CSV format: symbol, date, open, high, low, close, volume
- ✅ Date validation: YYYY-MM-DD format, UTC day convention
- ✅ Upsert strategy: update existing records, insert new ones
- ✅ Validation: price/volume must be positive numbers
- ✅ Error reporting: invalid rows logged with line numbers
- ✅ Batch processing: handle large files efficiently
- ✅ Audit trail: import job tracking

### US3.7: Data Provider Integration (Alternative)
**As a system**, I can fetch EOD price data from external provider.

**Acceptance Criteria:**
- ✅ Single provider integration (Alpha Vantage or similar)
- ✅ Daily job fetches previous day's data
- ✅ Rate limiting: respect API limits
- ✅ Error handling: API failures, invalid responses
- ✅ Deduplication: prevent duplicate price records
- ✅ Monitoring: job success/failure tracking

## Technical Requirements

### Database Schema Updates
- AlertEvent table with proper indexes
- News deduplication constraints (URL hash)
- Audit fields: createdBy, updatedBy, createdAt, updatedAt
- Optimized indexes for admin queries

### API Security
- All admin routes protected with ADMIN role check
- Input validation with Zod schemas
- Rate limiting on admin endpoints
- Audit logging for all admin actions

### Job Management
- Cron jobs documented for local and production
- Job failure monitoring and alerting
- Idempotency keys for critical operations
- Graceful error handling and recovery

### Performance Requirements
- Admin pagination: max 50 records per page
- Search queries: < 500ms response time
- Alert evaluation: complete cycle < 5 minutes
- CSV import: handle files up to 10MB

## Definition of Done

### A) Documentation
- ✅ Updated API specification with all new routes
- ✅ Job scheduling documentation (local + production)
- ✅ Admin user guide with screenshots
- ✅ Operational runbook for monitoring

### B) Database
- ✅ Prisma migrations applied successfully
- ✅ All constraints and indexes in place
- ✅ Audit trail fields populated correctly
- ✅ Performance tested with sample data

### C) Admin UI
- ✅ Responsive tables with search and pagination
- ✅ Create/edit forms with validation
- ✅ Error messages and success feedback
- ✅ Confirmation dialogs for destructive actions

### D) Jobs & Monitoring
- ✅ Cron jobs configurable and documented
- ✅ Job failure notifications working
- ✅ Idempotency verified through testing
- ✅ Performance metrics available

### E) Testing
- ✅ Admin CRUD tests (one per entity minimum)
- ✅ Alert job idempotency test
- ✅ Price history upsert test
- ✅ Security tests for admin routes
- ✅ Integration tests for job execution

## Success Metrics
- Admin can manage 100+ tickers efficiently
- Alert system processes 1000+ alerts without failures
- Price data ingestion handles daily updates reliably
- Zero security vulnerabilities in admin functions
- Job monitoring provides clear operational visibility