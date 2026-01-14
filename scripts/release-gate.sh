#!/bin/bash

echo "================================================================================"
echo "SPRINT 3 RELEASE GATE - COMPREHENSIVE VALIDATION"
echo "================================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

echo "A) DATABASE INTEGRITY CHECKS"
echo "--------------------------------------------------------------------------------"
tsx scripts/release-gate-integrity.ts
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Integrity checks failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Integrity checks passed${NC}"
fi
echo ""

echo "B) LOAD TEST (10k+ rows)"
echo "--------------------------------------------------------------------------------"
tsx scripts/release-gate-load-test.ts
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Load test failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Load test passed${NC}"
fi
echo ""

echo "C) ALERTS SYSTEM VALIDATION"
echo "--------------------------------------------------------------------------------"
tsx scripts/release-gate-alerts.ts
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Alerts validation failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Alerts validation passed${NC}"
fi
echo ""

echo "D) BUILD GATE - HARD EVIDENCE"
echo "--------------------------------------------------------------------------------"

echo "D1) npm run build"
echo "----------------------------------------"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Build passed${NC}"
fi
echo ""

echo "D2) npm run lint"
echo "----------------------------------------"
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Lint failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Lint passed${NC}"
fi
echo ""

echo "D3) npx tsc --noEmit"
echo "----------------------------------------"
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ TypeScript compilation passed${NC}"
fi
echo ""

echo "D4) npm test"
echo "----------------------------------------"
npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ Tests passed${NC}"
fi
echo ""

echo "================================================================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ SPRINT 3 RELEASE GATE: PASSED${NC}"
    echo "Sprint 3 is PRODUCTION-READY"
else
    echo -e "${RED}❌ SPRINT 3 RELEASE GATE: FAILED${NC}"
    echo "Please fix the issues above before releasing"
fi
echo "================================================================================"

exit $FAILED