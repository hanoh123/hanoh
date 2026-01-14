# Production Smoke Test Script (PowerShell)
# Validates critical endpoints and functionality

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$CronSecret
)

$results = @()

function Run-Test {
    param(
        [string]$Name,
        [scriptblock]$TestFn
    )
    
    $start = Get-Date
    
    try {
        $result = & $TestFn
        $duration = ((Get-Date) - $start).TotalMilliseconds
        
        $testResult = @{
            Name = $Name
            Status = $result.Status
            Message = $result.Message
            Duration = [math]::Round($duration)
        }
        
        $script:results += $testResult
        
        $icon = if ($result.Status -eq 'PASS') { '✅' } elseif ($result.Status -eq 'WARN') { '⚠️' } else { '❌' }
        Write-Host "$icon $Name ($($testResult.Duration)ms)"
        if ($result.Message) {
            Write-Host "   $($result.Message)"
        }
    }
    catch {
        $duration = ((Get-Date) - $start).TotalMilliseconds
        
        $testResult = @{
            Name = $Name
            Status = 'FAIL'
            Message = $_.Exception.Message
            Duration = [math]::Round($duration)
        }
        
        $script:results += $testResult
        
        Write-Host "❌ $Name ($($testResult.Duration)ms)"
        Write-Host "   Error: $($_.Exception.Message)"
    }
}

Write-Host "🔍 Production Smoke Test" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "Target: $BaseUrl"
Write-Host "Time: $((Get-Date).ToUniversalTime().ToString('o'))"
Write-Host ""

# Test 1: Home page
Run-Test -Name "Home page loads" -TestFn {
    $response = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        return @{ Status = 'PASS'; Message = 'Home page accessible' }
    } else {
        return @{ Status = 'FAIL'; Message = "HTTP $($response.StatusCode)" }
    }
}

# Test 2: Health endpoint
Run-Test -Name "Health endpoint" -TestFn {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
    
    if ($response.status -eq 'healthy') {
        return @{ Status = 'PASS'; Message = "Version $($response.version), DB latency $($response.checks.database.latency)ms" }
    } elseif ($response.status -eq 'degraded') {
        return @{ Status = 'WARN'; Message = "Degraded: $($response.checks | ConvertTo-Json -Compress)" }
    } else {
        return @{ Status = 'FAIL'; Message = "Unhealthy: $($response.checks | ConvertTo-Json -Compress)" }
    }
}

# Test 3: Ticker page
Run-Test -Name "Ticker page loads" -TestFn {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/ticker/AAPL" -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            return @{ Status = 'PASS'; Message = 'Ticker page accessible' }
        } else {
            return @{ Status = 'FAIL'; Message = "HTTP $($response.StatusCode)" }
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            return @{ Status = 'WARN'; Message = 'Ticker not found (expected if no data seeded)' }
        }
        throw
    }
}

# Test 4: Sign in page
Run-Test -Name "Sign in page loads" -TestFn {
    $response = Invoke-WebRequest -Uri "$BaseUrl/auth/signin" -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        return @{ Status = 'PASS'; Message = 'Sign in page accessible' }
    } else {
        return @{ Status = 'FAIL'; Message = "HTTP $($response.StatusCode)" }
    }
}

# Test 5: Sign up page
Run-Test -Name "Sign up page loads" -TestFn {
    $response = Invoke-WebRequest -Uri "$BaseUrl/auth/signup" -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        return @{ Status = 'PASS'; Message = 'Sign up page accessible' }
    } else {
        return @{ Status = 'FAIL'; Message = "HTTP $($response.StatusCode)" }
    }
}

# Test 6: Admin page protection
Run-Test -Name "Admin page protection" -TestFn {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/admin" -MaximumRedirection 0 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -in @(307, 302)) {
            return @{ Status = 'PASS'; Message = 'Admin page properly protected (redirects)' }
        } else {
            return @{ Status = 'FAIL'; Message = "Unexpected status: $($response.StatusCode)" }
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -in @(307, 302, 401, 403)) {
            return @{ Status = 'PASS'; Message = 'Admin page properly protected' }
        }
        throw
    }
}

# Test 7: Cron endpoint security
Run-Test -Name "Cron endpoint rejects missing secret" -TestFn {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/cron/evaluate-alerts" -UseBasicParsing -ErrorAction Stop
        return @{ Status = 'FAIL'; Message = "Expected 401, got $($response.StatusCode)" }
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            return @{ Status = 'PASS'; Message = 'Cron endpoint properly protected' }
        }
        throw
    }
}

# Test 8: Cron endpoint with valid secret
if ($CronSecret) {
    Run-Test -Name "Cron endpoint accepts valid secret" -TestFn {
        $headers = @{
            'Authorization' = "Bearer $CronSecret"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/cron/evaluate-alerts" -Headers $headers -Method Get
        
        if ($response.success) {
            return @{ Status = 'PASS'; Message = "Cron executed: $($response.result | ConvertTo-Json -Compress)" }
        } else {
            return @{ Status = 'FAIL'; Message = "Cron execution failed" }
        }
    }
} else {
    $script:results += @{
        Name = 'Cron endpoint accepts valid secret'
        Status = 'WARN'
        Message = 'Skipped - CRON_SECRET not provided'
    }
    Write-Host "⚠️  Cron endpoint accepts valid secret"
    Write-Host "   Skipped - CRON_SECRET not provided"
}

# Test 9: Public API
Run-Test -Name "Public news API" -TestFn {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/public/news?limit=5" -Method Get
    
    $newsCount = if ($response.news) { $response.news.Count } else { 0 }
    return @{ Status = 'PASS'; Message = "Returned $newsCount news items" }
}

# Summary
Write-Host ""
Write-Host ("=" * 60)
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host ("=" * 60)

$passed = ($results | Where-Object { $_.Status -eq 'PASS' }).Count
$failed = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count
$warned = ($results | Where-Object { $_.Status -eq 'WARN' }).Count
$total = $results.Count

Write-Host "Total Tests: $total"
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warned" -ForegroundColor Yellow
Write-Host ""

if ($failed -gt 0) {
    Write-Host "❌ SMOKE TEST FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed tests:"
    $results | Where-Object { $_.Status -eq 'FAIL' } | ForEach-Object {
        Write-Host "   - $($_.Name): $($_.Message)"
    }
    exit 1
} elseif ($warned -gt 0) {
    Write-Host "⚠️  SMOKE TEST PASSED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Warnings:"
    $results | Where-Object { $_.Status -eq 'WARN' } | ForEach-Object {
        Write-Host "   - $($_.Name): $($_.Message)"
    }
} else {
    Write-Host "✅ ALL TESTS PASSED" -ForegroundColor Green
}

Write-Host ""