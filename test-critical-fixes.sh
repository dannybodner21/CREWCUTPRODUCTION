#!/bin/bash

# Test Critical Timeout Fixes
# Run this after deployment to verify all fixes are working

echo "=================================================="
echo "🧪 TESTING CRITICAL TIMEOUT FIXES"
echo "=================================================="

BASE_URL="${1:-http://localhost:3000}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Simple request (should be instant)
echo -e "\n${YELLOW}Test 1: Simple Request (getAvailableJurisdictions)${NC}"
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST "$BASE_URL/api/lewis" \
  -H "Content-Type: application/json" \
  -d '{"action":"getAvailableJurisdictions"}')
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ $DURATION -lt 2000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Completed in ${DURATION}ms (expected <2000ms)"
else
    echo -e "${RED}❌ FAIL${NC} - Took ${DURATION}ms (expected <2000ms)"
fi

# Test 2: Single city calculation
echo -e "\n${YELLOW}Test 2: Single City Calculation (Austin)${NC}"
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST "$BASE_URL/api/lewis" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"calculateFees",
    "params":{
      "jurisdictionName":"Austin",
      "projectType":"Multi-Family Residential",
      "numUnits":50,
      "squareFeet":45000,
      "meterSize":"3/4\""
    }
  }')
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ $DURATION -lt 5000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Completed in ${DURATION}ms (expected <5000ms)"
    # Check if we got fees back
    FEE_COUNT=$(echo "$RESPONSE" | grep -o '"fees":\[' | wc -l)
    if [ "$FEE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ DATA${NC} - Fees returned successfully"
    else
        echo -e "${RED}❌ DATA${NC} - No fees returned: $RESPONSE"
    fi
else
    echo -e "${RED}❌ FAIL${NC} - Took ${DURATION}ms (expected <5000ms)"
fi

# Test 3: Optimize project (parallel scenarios)
echo -e "\n${YELLOW}Test 3: Optimize Project (3 parallel scenarios)${NC}"
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST "$BASE_URL/api/lewis" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"optimizeProject",
    "params":{
      "jurisdiction":"Phoenix",
      "lotSize":3,
      "projectType":"Multi-Family"
    }
  }')
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ $DURATION -lt 15000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Completed in ${DURATION}ms (expected <15000ms)"
    # Check if we got 3 scenarios
    SCENARIO_COUNT=$(echo "$RESPONSE" | grep -o '"name":"' | wc -l)
    if [ "$SCENARIO_COUNT" -ge 3 ]; then
        echo -e "${GREEN}✅ DATA${NC} - All 3 scenarios returned"
    else
        echo -e "${YELLOW}⚠️  DATA${NC} - Only $SCENARIO_COUNT scenarios returned (expected 3)"
    fi
else
    echo -e "${RED}❌ FAIL${NC} - Took ${DURATION}ms (expected <15000ms)"
fi

# Test 4: Check for timeout handling (this should NOT timeout)
echo -e "\n${YELLOW}Test 4: Timeout Configuration Check${NC}"
echo "If maxDuration=60 is working, this should NOT timeout..."
START=$(date +%s%N)
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/lewis" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"calculateFees",
    "params":{
      "jurisdictionName":"Phoenix",
      "projectType":"Multi-Family Residential",
      "numUnits":100,
      "squareFeet":90000,
      "meterSize":"3/4\""
    }
  }')
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" != "504" ]; then
    echo -e "${GREEN}✅ PASS${NC} - No 504 timeout (HTTP $HTTP_CODE) - Completed in ${DURATION}ms"
else
    echo -e "${RED}❌ FAIL${NC} - Got 504 timeout after ${DURATION}ms"
    echo "This suggests maxDuration=60 is NOT working!"
fi

# Summary
echo -e "\n=================================================="
echo -e "${YELLOW}📊 TEST SUMMARY${NC}"
echo "=================================================="
echo "All tests should pass with these characteristics:"
echo "  • Simple requests: <2s"
echo "  • Single city: <5s"
echo "  • Optimize project: <15s (down from 20s+)"
echo "  • No 504 timeouts on any request"
echo ""
echo "Check server logs for detailed timing:"
echo "  • [LEWIS API] timestamps"
echo "  • ✅ [LEWIS API] completed in Xms"
echo "  • ⏱️  [FeeCalculator] timing breakdowns"
echo "=================================================="
