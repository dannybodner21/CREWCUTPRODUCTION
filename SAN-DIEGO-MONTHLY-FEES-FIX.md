# SAN DIEGO MONTHLY FEES FIX - COMPLETE ✅

## Problem
San Diego has 12 monthly utility charges in the database, all properly configured with:
- `category: "Monthly Services"`
- `unit_label: "per month"`
- `applies_to: ["Residential"]`
- `is_active: true`

But they weren't showing in calculation results.

## Root Cause

**Future-Date Filter (`src/lib/fee-calculator/index.ts:803-825`)**

San Diego monthly utility charges are named with future years:
```
Monthly Utility Charge - Water - 2026
Monthly Utility Charge - Water - 2027
Monthly Utility Charge - Water - 2028
Monthly Utility Charge - Water - 2029
Monthly Utility Charge - Wastewater - 2026
Monthly Utility Charge - Wastewater - 2027
...
```

The fee calculator has a future-date filter that excludes fees with years greater than the current year:

```typescript
const currentYear = new Date().getFullYear();  // 2025
if (feeYear > currentYear) {
    return null;  // Filters out ALL 2026+ fees
}
```

All 12 San Diego monthly fees were filtered out because they're dated 2026-2029.

## Solution

**Updated Future-Date Filter (lines 817-823):**

```typescript
// Allow monthly utility charges for next year (2026) since those are approved future rates
const isMonthlyUtility = feeNameLower.includes('monthly utility charge');
const maxAllowedYear = isMonthlyUtility ? currentYear + 1 : currentYear;

if (feeYear > maxAllowedYear) {
    return null;
}
```

**Logic:**
- Regular fees: Filter if year > current year (2025)
- Monthly utility charges: Filter if year > current year + 1 (2026)

This allows 2026 monthly utility fees (approved next-year rates) while filtering out 2027-2029.

## Test Results

### San Diego - 50-unit Multi-Family Project

**Before Fix:**
```
Total Fees: 11
Monthly Total: $0
Monthly Fees: 0
```

**After Fix:**
```
Total Fees: 14
One-time Total: $1,329,654.14
Monthly Total: $18.10

Monthly Fees: 3
  - Monthly Utility Charge - Wastewater - 2026: $0.80
  - Monthly Utility Charge - Water - 2026: $1.29
  - Monthly Utility Charge - CWA Rate Increase - 2026: $16.01
```

## Files Modified

**`/src/lib/fee-calculator/index.ts`**
- Lines 817-823: Updated future-date filter to allow 2026 monthly utility charges

## How Monthly Fee Detection Works

Monthly fees are identified by checking three fields (`src/lib/fee-calculator/index.ts:1562-1584`):

```typescript
const unitLabelLower = fee.unitLabel?.toLowerCase() || '';
const categoryLower = fee.category?.toLowerCase() || '';
const feeNameLower = fee.feeName?.toLowerCase() || '';

if (!isConnectionFee && (
    unitLabelLower.includes('month') ||
    unitLabelLower.includes('per month') ||
    categoryLower === 'monthly services' ||
    feeNameLower.includes('monthly') ||
    feeNameLower.includes('volume charge')
)) {
    isRecurring = true;
    recurringPeriod = 'month';
}
```

San Diego monthly fees trigger on:
- ✅ `unit_label: "per month"` → `includes('month')`
- ✅ `category: "Monthly Services"` → `=== 'monthly services'`
- ✅ `fee.name: "Monthly Utility Charge..."` → `includes('monthly')`

## Verification

Run the test:
```bash
npx tsx test-san-diego-monthly.ts
```

Expected results:
- 3 monthly fees (all 2026)
- Monthly total: $18.10
- All fees marked `isRecurring: true`

✅ **SAN DIEGO MONTHLY FEES NOW CALCULATING CORRECTLY**
