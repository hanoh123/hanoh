/**
 * Production Smoke Test Script
 * Validates critical endpoints and functionality
 */

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  duration?: number
}

const results: TestResult[] = []

async function runTest(
  name: string,
  testFn: () => Promise<{ status: 'PASS' | 'FAIL' | 'WARN'; message: string }>
): Promise<void> {
  const start = Date.now()
  
  try {
    const result = await testFn()
    const duration = Date.now() - start
    
    results.push({
      name,
      status: result.status,
      message: result.message,
      duration
    })
    
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
    console.log(`${icon} ${name} (${duration}ms)`)
    if (result.message) {
      console.log(`   ${result.message}`)
    }
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({
      name,
      status: 'FAIL',
      message: error.message,
      duration
    })
    console.log(`❌ ${name} (${duration}ms)`)
    console.log(`   Error: ${error.message}`)
  }
}

async function smokeTest(baseUrl: string, cronSecret?: string) {
  console.log('🔍 Production Smoke Test')
  console.log('='.repeat(60))
  console.log(`Target: ${baseUrl}`)
  console.log(`Time: ${new Date().toISOString()}`)
  console.log()

  // Test 1: Home page
  await runTest('Home page loads', async () => {
    const response = await fetch(baseUrl)
    
    if (response.status === 200) {
      return { status: 'PASS', message: 'Home page accessible' }
    } else {
      return { status: 'FAIL', message: `HTTP ${response.status}` }
    }
  })

  // Test 2: Health endpoint
  await runTest('Health endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/health`)
    
    if (response.status === 200) {
      const data = await response.json()
      
      if (data.status === 'healthy') {
        return { status: 'PASS', message: `Version ${data.version}, DB latency ${data.checks.database.latency}ms` }
      } else if (data.status === 'degraded') {
        return { status: 'WARN', message: `Degraded: ${JSON.stringify(data.checks)}` }
      } else {
        return { status: 'FAIL', message: `Unhealthy: ${JSON.stringify(data.checks)}` }
      }
    } else {
      return { status: 'FAIL', message: `HTTP ${response.status}` }
    }
  })

  // Test 3: Ticker page
  await runTest('Ticker page loads', async () => {
    const response = await fetch(`${baseUrl}/ticker/AAPL`)
    
    if (response.status === 200) {
      return { status: 'PASS', message: 'Ticker page accessible' }
    } else if (response.status === 404) {
      return { status: 'WARN', message: 'Ticker not found (expected if no data seeded)' }
    } else {
      return { status: 'FAIL', message: `HTTP ${response.status}` }
    }
  })

  // Test 4: Auth pages
  await runTest('Sign in page loads', async () => {
    const response = await fetch(`${baseUrl}/auth/signin`)
    
    if (response.status === 200) {
      return { status: 'PASS', message: 'Sign in page accessible' }
    } else {
      return { status: 'FAIL', message: `HTTP ${response.status}` }
    }
  })

  await runTest('Sign up page loads', async () => {
    const response = await fetch(`${baseUrl}/auth/signup`)
    
    if (response.status === 200) {
      return { status: 'PASS', message: 'Sign up page accessible' }
    } else {
      return { status: 'FAIL', message: `HTTP ${response.status}` }
    }
  })

  // Test 5: Admin page (should redirect to login)
  await runTest('Admin page protection', async () => {
    const response = await fetch(`${baseUrl}/admin`, {
      redirect: 'manual'
    })
    
    if (response.status === 307 || response.status === 302) {
      return { status: 'PASS', message: 'Admin page properly protected (redirects)' }
    } else if (response.status === 401 || response.status === 403) {
      return { status: 'PASS', message: 'Admin page properly protected (unauthorized)' }
    } else {
      return { status: 'FAIL', message: `Unexpected status: ${response.status}` }
    }
  })

  // Test 6: Cron endpoint security
  await runTest('Cron endpoint rejects missing secret', async () => {
    const response = await fetch(`${baseUrl}/api/cron/evaluate-alerts`)
    
    if (response.status === 401) {
      return { status: 'PASS', message: 'Cron endpoint properly protected' }
    } else {
      return { status: 'FAIL', message: `Expected 401, got ${response.status}` }
    }
  })

  if (cronSecret) {
    await runTest('Cron endpoint accepts valid secret', async () => {
      const response = await fetch(`${baseUrl}/api/cron/evaluate-alerts`, {
        headers: {
          'Authorization': `Bearer ${cronSecret}`
        }
      })
      
      if (response.status === 200) {
        const data = await response.json()
        return { status: 'PASS', message: `Cron executed: ${JSON.stringify(data.result)}` }
      } else {
        return { status: 'FAIL', message: `HTTP ${response.status}` }
      }
    })
  } else {
    results.push({
      name: 'Cron endpoint accepts valid secret',
      status: 'WARN',
      message: 'Skipped - CRON_SECRET not provided'
    })
    console.log('⚠️  Cron endpoint accepts valid secret')
    console.log('   Skipped - CRON_SECRET not provided')
  }

  // Test 7: Public API
  await runTest('Public news API', async () => {
    const response = await fetch(`${baseUrl}/api/public/news?limit=5`)
    
    if (response.status === 200) {
      const data = await response.json()
      return { status: 'PASS', message: `Returned ${data.news?.length || 0} news items` }
    } else {
      return { status: 'FAIL', message: `HTTP ${response.status}` }
    }
  })

  // Summary
  console.log()
  console.log('='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  const total = results.length
  
  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warned}`)
  console.log()
  
  if (failed > 0) {
    console.log('❌ SMOKE TEST FAILED')
    console.log()
    console.log('Failed tests:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
    process.exit(1)
  } else if (warned > 0) {
    console.log('⚠️  SMOKE TEST PASSED WITH WARNINGS')
    console.log()
    console.log('Warnings:')
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  } else {
    console.log('✅ ALL TESTS PASSED')
  }
  
  console.log()
}

// Parse command line arguments
const args = process.argv.slice(2)
const baseUrl = args[0] || process.env.SMOKE_TEST_URL || 'http://localhost:3000'
const cronSecret = args[1] || process.env.CRON_SECRET

if (!baseUrl) {
  console.error('Usage: tsx scripts/smoke-prod.ts <base-url> [cron-secret]')
  console.error('Example: tsx scripts/smoke-prod.ts https://your-app.vercel.app your-cron-secret')
  process.exit(1)
}

smokeTest(baseUrl, cronSecret).catch(error => {
  console.error('❌ Smoke test failed:', error)
  process.exit(1)
})