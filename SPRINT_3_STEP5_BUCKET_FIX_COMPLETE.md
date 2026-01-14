# Sprint 3 Step 5 - 5-Minute Bucket Fix Complete

## Changes Made

### 1. Schema Update
- **File**: `schema.prisma`
- **Change**: Updated `AlertEvent` model unique constraint from `@@unique([alertId, triggeredAt])` to `@@unique([alertId, timeBucket], name: "alert_event_idempotency_5m")`
- **Field**: `timeBucket Int` field already existed, now properly used for idempotency

### 2. Alerts Engine Implementation
- **File**: `lib/alerts.ts`
- **Changes**:
  - Fixed deprecated `substr()` calls → `substring()`
  - Updated `createAlertEvent()` to use deterministic 5-minute buckets
  - Bucket calculation: `Math.floor(Date.now() / 1000 / 300)` (300 seconds = 5 minutes)
  - `triggeredAt` remains actual evaluation time, `timeBucket` used for idempotency
  - Updated unique constraint lookup to use `alert_event_idempotency_5m`

### 3. Test Updates
- **File**: `__tests__/alerts-idempotency.test.tsx`
- **Changes**:
  - Updated test cases to use `timeBucket` field in mock data
  - Updated unique constraint references to `alert_event_idempotency_5m`
  - Maintained comprehensive test coverage for 5-minute bucket scenarios

### 4. Documentation Update
- **File**: `SPRINT_3_STEP5_PROOF.md`
- **Changes**:
  - Updated proof document to reflect 5-minute bucket implementation
  - Corrected schema examples and code snippets
  - Updated test case examples to show deterministic bucket calculation

## Key Implementation Details

### Deterministic 5-Minute Buckets
```typescript
export function calculateTimeBucket(timestamp?: number): number {
  const now = timestamp || Date.now()
  return Math.floor(now / 1000 / 300) // 300 seconds = 5 minutes
}
```

### Idempotency Logic
- **Bucket Duration**: Exactly 5 minutes (300 seconds)
- **Deterministic**: Same timestamp always produces same bucket number
- **Database Constraint**: `@@unique([alertId, timeBucket])`
- **Retry Behavior**: Retries within same 5-minute window reuse existing AlertEvent

### Benefits of 5-Minute Buckets vs 1-Minute
1. **Longer Retry Window**: Failed alerts can retry for up to 5 minutes using same event
2. **More Robust**: Handles longer SMTP timeouts and temporary service outages
3. **Deterministic**: No dependency on exact timing, purely mathematical calculation
4. **Testable**: Predictable bucket boundaries for comprehensive testing

## Verification

The implementation now correctly:
- ✅ Uses deterministic 5-minute buckets for idempotency
- ✅ Keeps `triggeredAt` as actual evaluation time
- ✅ Uses `timeBucket` for duplicate prevention
- ✅ Allows retries within same 5-minute window to reuse AlertEvent
- ✅ Prevents duplicate emails within 5-minute windows
- ✅ Maintains proper error handling and logging

## Next Steps

The 5-minute bucket implementation is complete and ready for:
1. Database migration (if needed for existing data)
2. Deployment to production
3. Proceeding to Step 6: CSV Price History Ingestion

All alerts engine functionality remains intact with improved idempotency guarantees.