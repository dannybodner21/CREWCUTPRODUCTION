# CRITICAL BUG FIX: Feasibility Report Project Specifications

## Problem
The Project Specifications section in the PDF feasibility report showed all N/A values, making the report completely useless for decision-making.

## Root Cause
**File:** `src/app/api/lewis/route.ts` (lines 196-221)

The `calculateProjectFees` API action was NOT including the `project` field in the response sent back to the frontend.

### Data Flow Analysis:

1. **Calculator → API Route (CORRECT):**
   ```typescript
   const breakdown = await calculator.calculateFees(projectInputs);
   // breakdown contains:
   // - fees
   // - oneTimeFees
   // - monthlyFees
   // - project ← THIS EXISTS
   ```

2. **API Route → Frontend (BUG HERE):**
   ```typescript
   const response = {
     fees: breakdown.fees.map(...),
     byCategory: breakdown.byCategory,
     byAgency: breakdown.byAgency,
     // project: breakdown.project  ← MISSING!
   };
   ```

3. **Frontend → PDF Component:**
   ```typescript
   <PDFDownloadButton breakdown={calculatedFees} />
   ```

4. **PDF Component:**
   ```typescript
   const project = breakdown?.project || {};  // Always empty object!
   // Result: All fields show N/A
   ```

## The Fix

**File:** `src/app/api/lewis/route.ts` (line 215)

Added the missing `project` field to the API response:

```typescript
const response = {
  totalFees: breakdown.firstYearTotal,
  oneTimeFees: breakdown.oneTimeFees,
  monthlyFees: breakdown.monthlyFees,
  annualOperatingCosts: breakdown.annualOperatingCosts,
  firstYearTotal: breakdown.firstYearTotal,
  fees: breakdown.fees.map(fee => ({...})),
  byCategory: breakdown.byCategory,
  byAgency: breakdown.byAgency,
  project: breakdown.project, // ← CRITICAL FIX: Include project inputs for PDF report
  perUnitCosts: projectInputs.numUnits ? {...} : null
};
```

## What This Fixes

The `breakdown.project` object contains:
```typescript
{
  jurisdictionName: "Phoenix",
  stateCode: "AZ",
  projectType: "Single-Family Residential",
  useSubtype: null,
  numUnits: 10,
  squareFeet: 25000,
  projectValue: 4000000,
  meterSize: "3/4 inch",
  selectedServiceAreaIds: [...]
}
```

## Before vs. After

### Before (Bug):
```
PROJECT SPECIFICATIONS
  Project Type:     N/A
  Use Subtype:      N/A
  Jurisdiction:     N/A, undefined
  Service Area:     N/A
  Number of Units:  N/A
  Square Footage:   N/A
  Project Value:    N/A
  Meter Size:       N/A
```

### After (Fixed):
```
PROJECT SPECIFICATIONS
  Project Type:     Single-Family Residential
  Use Subtype:      Not specified
  Jurisdiction:     Phoenix, AZ
  Service Area:     Deer Valley
  Number of Units:  10
  Square Footage:   25,000 sq ft
  Project Value:    $4,000,000
  Meter Size:       3/4 inch
```

## Impact

This was a **Priority 1** bug because:
1. The Project Specifications section is THE MOST IMPORTANT section
2. Without project context, the report is completely useless
3. Users cannot identify what project the fees are for
4. Makes the entire PDF worthless for decision-making

## Why This Happened

The API route was manually constructing a response object and cherry-picking fields from the `breakdown` object. The `project` field was overlooked because:
1. The UI doesn't directly display `breakdown.project` (it uses separate state variables)
2. Only the PDF component needs this field
3. No error was thrown (the PDF just showed N/A for missing data)

## Testing

To verify the fix:
1. Open the LEWIS portal
2. Select a jurisdiction (e.g., Phoenix)
3. Enter project details (units, square footage, etc.)
4. Click "Calculate Fees"
5. Fill out the feasibility report form
6. Click "Download Feasibility Report PDF"
7. Open PDF and check Page 4 "Project Specifications" section

**Expected:** All project fields should be populated with the values entered in the calculator.

## Related Files

- **Bug Fixed:** `src/app/api/lewis/route.ts` (line 215)
- **PDF Component:** `src/components/FeasibilityReportPDF.tsx` (line 194 - reads `breakdown.project`)
- **Frontend UI:** `src/components/CustomLewisPortal.tsx` (line 1745 - passes `calculatedFees` to PDF button)

## Status

✅ **FIXED** - One-line change adds `project: breakdown.project` to API response
