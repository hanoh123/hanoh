# Alerts Engine Cron Strategy

## Overview

The Alerts Engine evaluates user alerts every 15 minutes and sends email notifications when thresholds are met. The system is designed to be idempotent, fault-tolerant, and suitable for both local development and production deployment.

## Cron Job Configuration

### Local Development

**Method 1: Manual Execution**
```bash
# Run once manually for testing
tsx scripts/evaluate-alerts-cron.ts
```

**Method 2: Local Cron (macOS/Linux)**
```bash
# Edit crontab
crontab -e

# Add this line to run every 15 minutes
*/15 * * * * cd /path/to/your/project && tsx scripts/evaluate-alerts-cron.ts >> logs/alerts-cron.log 2>&1
```

**Method 3: Local Cron (Windows)**
```powershell
# Use Windows Task Scheduler
# Create a new task that runs every 15 minutes:
# Program: node
# Arguments: scripts/evaluate-alerts-cron.js
# Start in: C:\path\to\your\project
```

### Production Deployment

#### Option 1: Vercel Cron Jobs (Recommended)

**File: `vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/cron/evaluate-alerts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**File: `app/api/cron/evaluate-alerts/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { evaluateAlerts } from '@/lib/alerts'

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await evaluateAlerts()
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Cron alert evaluation failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

#### Option 2: External Cron Service

**Using cron-job.org or similar:**
```bash
# URL to call every 15 minutes
POST https://your-domain.com/api/admin/alerts/evaluate
Authorization: Bearer YOUR_ADMIN_API_KEY
```

#### Option 3: Server Cron (VPS/Dedicated)

**Crontab entry:**
```bash
# Run every 15 minutes
*/15 * * * * cd /var/www/your-app && node scripts/evaluate-alerts-cron.js >> /var/log/alerts-cron.log 2>&1
```

## Environment Variables

Required environment variables for the alerts system:

```bash
# Email service (Resend)
RESEND_API_KEY=re_your_api_key_here

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Cron security (production)
CRON_SECRET=your_secure_random_string

# App URL for email links
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Idempotency & Fault Tolerance

### Idempotency Design

1. **AlertEvent Records**: Each alert evaluation creates an AlertEvent record before sending email
2. **Duplicate Prevention**: Recent AlertEvents (within 5 minutes) prevent duplicate processing
3. **Retry Safety**: Job can be safely retried without sending duplicate emails
4. **Cooldown Period**: 1-hour minimum between identical alert triggers

### Error Handling

1. **Individual Alert Failures**: One failed alert doesn't stop processing others
2. **Email Failures**: Marked in AlertEvent with error message for retry
3. **Database Failures**: Logged and reported for monitoring
4. **System Failures**: Exit codes for monitoring systems

### Monitoring

**Success Indicators:**
- Exit code 0
- Log entries with evaluation counts
- AlertEvent records in database

**Failure Indicators:**
- Exit code 1
- Error logs
- AlertEvent records with FAILED status

## Monitoring & Alerting

### Log Analysis

**Success Log Pattern:**
```
[2024-02-15T10:00:00.000Z] Starting alert evaluation cron job
[2024-02-15T10:00:02.150Z] Alert evaluation completed: {
  "evaluated": 25,
  "triggered": 3,
  "sent": 3,
  "failed": 0,
  "errorCount": 0
}
```

**Error Log Pattern:**
```
[2024-02-15T10:00:00.000Z] Starting alert evaluation cron job
Alert evaluation errors: ["Alert alert-123: Email send failed"]
[2024-02-15T10:00:02.150Z] Alert evaluation completed: {
  "evaluated": 25,
  "triggered": 3,
  "sent": 2,
  "failed": 1,
  "errorCount": 1
}
```

### Database Monitoring

**Query to check recent alert activity:**
```sql
SELECT 
  DATE_TRUNC('hour', triggered_at) as hour,
  status,
  COUNT(*) as count
FROM alert_events 
WHERE triggered_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour, status
ORDER BY hour DESC;
```

**Query to find failed alerts:**
```sql
SELECT 
  ae.*,
  a.type as alert_type,
  t.symbol as ticker_symbol,
  u.email as user_email
FROM alert_events ae
JOIN alerts a ON ae.alert_id = a.id
JOIN tickers t ON a.ticker_id = t.id
JOIN users u ON a.user_id = u.id
WHERE ae.status = 'FAILED'
  AND ae.triggered_at >= NOW() - INTERVAL '1 hour'
ORDER BY ae.triggered_at DESC;
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Process alerts in batches to avoid memory issues
2. **Database Indexes**: Ensure proper indexes on alert queries
3. **Email Rate Limiting**: Respect Resend API rate limits
4. **Timeout Handling**: Set reasonable timeouts for email sends

### Scaling Considerations

**Current Capacity:**
- Handles ~1000 active alerts efficiently
- 15-minute evaluation cycle
- 1-hour cooldown prevents spam

**Scaling Options:**
- Reduce evaluation frequency for more alerts
- Implement alert priority levels
- Use message queues for high volume
- Shard alerts by user segments

## Testing Strategy

### Local Testing

**Test Individual Alert:**
```bash
# Create test alert in database
# Run evaluation
tsx scripts/evaluate-alerts-cron.ts

# Check AlertEvent table for results
```

**Test Email Delivery:**
```bash
# Set up test email in Resend
# Create alert with low threshold
# Verify email received and formatted correctly
```

### Production Testing

**Staging Environment:**
- Deploy to staging with test email addresses
- Run cron job manually to verify functionality
- Check logs and database for proper operation

**Production Monitoring:**
- Set up log aggregation (e.g., Datadog, CloudWatch)
- Create alerts for cron job failures
- Monitor AlertEvent success/failure rates

## Security Considerations

### API Security

1. **Cron Endpoint Protection**: Use CRON_SECRET for Vercel cron jobs
2. **Admin API Protection**: Require ADMIN role for manual evaluation
3. **Rate Limiting**: Prevent abuse of evaluation endpoints

### Email Security

1. **Template Validation**: Sanitize all user data in email templates
2. **Link Security**: Use HTTPS for all email links
3. **Unsubscribe**: Include unsubscribe mechanism (future enhancement)

### Data Privacy

1. **Email Logging**: Don't log full email addresses in public logs
2. **Error Messages**: Sanitize error messages to prevent data leaks
3. **Retention**: Consider AlertEvent retention policies

## Troubleshooting Guide

### Common Issues

**Issue: No emails being sent**
- Check RESEND_API_KEY environment variable
- Verify Resend account status and limits
- Check AlertEvent table for FAILED records

**Issue: Duplicate emails**
- Check AlertEvent deduplication logic
- Verify cron job isn't running multiple times
- Check alert cooldown periods

**Issue: Cron job not running**
- Verify cron configuration syntax
- Check system cron service status
- Verify file permissions and paths

**Issue: Database connection errors**
- Check DATABASE_URL environment variable
- Verify database server status
- Check connection pool limits

### Debug Commands

**Check recent AlertEvents:**
```sql
SELECT * FROM alert_events 
WHERE triggered_at >= NOW() - INTERVAL '1 hour'
ORDER BY triggered_at DESC;
```

**Check active alerts:**
```sql
SELECT a.*, t.symbol, u.email 
FROM alerts a
JOIN tickers t ON a.ticker_id = t.id
JOIN users u ON a.user_id = u.id
WHERE a.is_active = true;
```

**Manual alert evaluation (admin only):**
```bash
curl -X POST https://your-domain.com/api/admin/alerts/evaluate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Future Enhancements

### Planned Features

1. **Alert Priorities**: High/Medium/Low priority levels
2. **Multiple Channels**: SMS, push notifications, webhooks
3. **Advanced Conditions**: Complex alert logic (AND/OR conditions)
4. **Alert Templates**: User-customizable email templates
5. **Batch Notifications**: Daily/weekly digest options

### Monitoring Improvements

1. **Metrics Dashboard**: Real-time alert system metrics
2. **Health Checks**: Automated system health monitoring
3. **Performance Analytics**: Alert response time tracking
4. **User Analytics**: Alert effectiveness metrics

This comprehensive cron strategy ensures reliable, scalable, and maintainable alert processing for the Penny Stocks Tracker application.