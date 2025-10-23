# Debug LEWIS Denver $316k Issue

## Problem
LEWIS compareCities returning $316,064 for Denver instead of expected $818,015

## Changes Made

### 1. Added Debug Logging

**File: `src/tools/custom-api-tool/actions.ts`**
- Line 625-633: Log full params sent to compareCities
- Line 653: Log request payload for each city
- Line 669-675: Log result from API for each city

**File: `src/app/api/lewis/route.ts`**
- Line 235: Log incoming params (JSON)
- Line 264-284: Log service area selection logic
- Line 285-291: Log projectInputs sent to calculator and results

### 2. Added Parameters to compareCities

**File: `src/tools/custom-api-tool/actions.ts` (line 648-649)**
```typescript
serviceArea: params.serviceArea || 'Inside', // Default to "Inside"
meterSize: params.meterSize || '3/4"' // Default to 3/4" meter
```

## Testing Steps

### Test 1: Direct API Call
Run with dev server:
```bash
npm run dev
# In another terminal:
npx tsx test-lewis-api-direct.ts
```

**Expected output:**
```
One-Time Fees: 818,015
✅ MATCH! API returning correct value.
```

**If it shows $316k:**
- Check console logs for "🔍 Service area match result"
- Check if selectedServiceAreaIds is empty array `[]`
- Check feeCount - should be ~5 fees, not ~1-2

### Test 2: LEWIS Chatbot
Ask LEWIS: "Compare Denver 50 units"

**Look for these logs in console:**

```
🔍 compareCities called with full params: {
  projectType: "Multi-Family Residential",
  units: 50,
  sqft: 45000,
  serviceArea: "Inside",  ← Should be present
  meterSize: "3/4""       ← Should be present
}

🔍 Calculating Denver: {
  jurisdictionName: "Denver",
  serviceArea: "Inside",    ← Should be present
  meterSize: "3/4""         ← Should be present
}

🔍 Service area selection: {
  paramsServiceArea: "Inside",
  availableServiceAreas: [
    "Outside City - Total Service",
    "Inside City of Denver",      ← Should match "Inside"
    "Inside Denver",               ← Should match "Inside"
    ...
  ]
}

🔍 Service area match result: {
  searchTerm: "Inside",
  matchedArea: "Inside City of Denver",  ← Should find a match
  matchedId: "1dde61cb-bc88-4142-b269-fe5355b00af0"
}

🔍 Final selectedServiceAreaIds: ["1dde61cb-bc88-4142-b269-fe5355b00af0"]
                                  ↑ Should NOT be empty

🔧 FeeCalculator returned: {
  oneTimeFees: 818015.08,          ← Should be ~818k
  monthlyFees: 0,
  feeCount: 5                      ← Should be ~5 fees
}

🔍 Denver result: {
  oneTimeFees: 818015.08,          ← Should be ~818k
  feeCount: 5
}
```

## Potential Issues

### Issue 1: Service Area Not Matching
**Symptom:** `selectedServiceAreaIds: []` (empty)

**Cause:** Service area name doesn't contain "Inside"

**Fix:** Check what Denver's service area names actually are:
```typescript
console.log('availableServiceAreas:', serviceAreas?.map(sa => sa.name))
```

If they don't contain "Inside", we need to change the default from "Inside" to something that matches.

### Issue 2: Parameters Not Being Sent
**Symptom:** Logs show `serviceArea: undefined` or `meterSize: undefined`

**Cause:** OpenAI not passing optional parameters

**Fix:** Make them required parameters in tool schema, or handle defaults better

### Issue 3: Calculator Still Wrong
**Symptom:** Calculator gets correct params but still returns $316k

**Cause:** Fee filtering logic broken

**Fix:** Check calculator logs to see which fees are being included/excluded

## Expected Denver Fees (50 units, Multi-Family)

1. System Development Charge - Multifamily Residential: $502,000
2. Sewer Permit Fee - Residential (per unit): $316,000
3. Water rates (Inside Denver): ~$15
4. **Total: $818,015**

If showing only $316k, it means:
- ❌ Missing SDC - Multifamily ($502k)
- ❌ Possibly showing all service areas (Outside fees too)
- ❌ Possibly showing tap-specific fees instead of "per unit"

## Next Steps

1. Run test-lewis-api-direct.ts to verify API works
2. If API returns $818k, problem is in LEWIS tool calling
3. If API returns $316k, problem is in calculator or API route
4. Check all console logs for the patterns above
5. Paste the actual log output for analysis
