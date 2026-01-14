# Sprint 3 Release Gate - PowerShell Version
# Comprehensive validation for Windows environments

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "SPRINT 3 RELEASE GATE - COMPREHENSIVE VALIDATION" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$Failed = 0

# A) Database Integrity Checks
Write-Host "A) DATABASE INTEGRITY CHECKS" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------"
tsx scripts/release-gate-integrity.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Integrity checks failed" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✅ Integrity checks passed" -ForegroundColor Green
}
Write-Host ""

# B) Load Test
Write-Host "B) LOAD TEST (10k+ rows)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------"
tsx scripts/release-gate-load-test.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Load test failed" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✅ Load test passed" -ForegroundColor Green
}
Write-Host ""

# C) Alerts Validation
Write-Host "C) ALERTS SYSTEM VALIDATION" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------"
tsx scripts/release-gate-alerts.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Alerts validation failed" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✅ Alerts validation passed" -ForegroundColor Green
}
Write-Host ""

# D) Build Gate
Write-Host "D) BUILD GATE - HARD EVIDENCE" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------"

Write-Host "D1) npm run build" -ForegroundColor Cyan
Write-Host "----------------------------------------"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✅ Build passed" -ForegroundColor Green
}
Write-Host ""

Write-Host "D2) npm run lint" -ForegroundColor Cyan
Write-Host "----------------------------------------"
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lint failed" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✅ Lint passed" -ForegroundColor Green
}
Write-Host ""

Write-Host "D3) npx tsc --noEmit" -ForegroundColor Cyan
Write-Host "----------------------------------------"
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript compilation failed" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✅ TypeScript compilation passed" -ForegroundColor Green
}
Write-Host ""

Write-Host "D4) npm test" -ForegroundColor Cyan
Write-Host "----------------------------------------"
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✅ Tests passed" -ForegroundColor Green
}
Write-Host ""

Write-Host "================================================================================" -ForegroundColor Cyan
if ($Failed -eq 0) {
    Write-Host "✅ SPRINT 3 RELEASE GATE: PASSED" -ForegroundColor Green
    Write-Host "Sprint 3 is PRODUCTION-READY" -ForegroundColor Green
} else {
    Write-Host "❌ SPRINT 3 RELEASE GATE: FAILED" -ForegroundColor Red
    Write-Host "Please fix the issues above before releasing" -ForegroundColor Red
}
Write-Host "================================================================================" -ForegroundColor Cyan

exit $Failed