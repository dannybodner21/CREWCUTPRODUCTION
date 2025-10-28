# Project Type Analysis Report

## Executive Summary

**Critical Finding:** Major mismatch between dropdown options and database data.

### Key Findings:

1. **Most jurisdictions have NO fees** in the database (Austin, Phoenix, Denver, San Diego, Portland)
2. **Los Angeles has fees** but only for 2 project types: "Residential" and "All"
3. **Dropdown has 7 options** but only 1-2 are actually supported by database
4. **5 of 7 dropdown options** have no matching fees in the database

---

## Database Analysis Results

### Jurisdictions in Database

| Jurisdiction | Has Fees? | Fee Count | Project Types |
|--------------|-----------|-----------|---------------|
| **Los Angeles** | ✅ Yes | 33 | "Residential", "All" |
| **Austin** | ❌ No | 0 | None |
| **Phoenix city** | ❌ No | 0 | None |
| **San Diego** | ❌ No | 0 | None |
| **Denver** | ❌ No | 0 | None |
| **Portland** | ❌ No | 0 | None |

### Los Angeles Fee Breakdown

**Total Fees:** 33

**Project Types (applies_to values):**
- `Residential`: 32 fees
- `All`: 1 fee

**Sample Residential Fees:**
- Monthly Water Base Charge
- Sewer Service Charge - Single-Family Households (July 2028)
- Sewer Service Charge - Single-Family Households (October 2024)
- Affordable Housing Linkage Fee - Medium-High Market Area
- Multiple monthly utility charges

---

## Dropdown Options vs. Database

**Source:** `src/components/CustomLewisPortal.tsx` (lines 1214-1221)

### Dropdown Options:

```tsx
<Select value={projectType} onChange={setProjectType}>
  <Option value="Single-Family Residential">Single-Family Residential</Option>
  <Option value="Multi-Family Residential">Multi-Family Residential</Option>
  <Option value="Commercial">Commercial</Option>
  <Option value="Office">Office</Option>
  <Option value="Retail">Retail</Option>
  <Option value="Restaurant/Food Service">Restaurant/Food Service</Option>
  <Option value="Industrial">Industrial</Option>
</Select>
```

### Database Coverage:

| Dropdown Option | Database Support | Status |
|----------------|------------------|--------|
| **Single-Family Residential** | ✅ Matches "Residential" | **Working** |
| **Multi-Family Residential** | ✅ Matches "Residential" | **Working** |
| **Commercial** | ❌ No matches | **NOT WORKING** |
| **Office** | ❌ No matches | **NOT WORKING** |
| **Retail** | ❌ No matches | **NOT WORKING** |
| **Restaurant/Food Service** | ❌ No matches | **NOT WORKING** |
| **Industrial** | ❌ No matches | **NOT WORKING** |

---

## Database Schema

### jurisdictions Table

```typescript
{
  id: 'af69fbc1-1eec-4cd2-b279-0ca5083f3984', // UUID
  state_code: 'TX',
  state_name: 'Texas',
  jurisdiction_name: 'Austin',
  jurisdiction_type: null,
  contact_department: null,
  contact_phone: null,
  contact_email: null,
  contact_website: null,
  contact_address: null,
  contact_hours: null
}
```

### fees Table

```typescript
{
  id: '90095cc6-8b90-4a4f-bd0a-e7a58c7101ea', // UUID
  jurisdiction_id: 'd73f0d50-af91-4fa4-8567-7c33c2ce2179', // Foreign key to jurisdictions.id
  agency_id: 'e262d8dc-1bfa-4ba3-a81c-3f28b3151dec',
  service_area_id: null,
  name: 'Monthly Water Base Charge',
  category: null,
  description: 'The Los Angeles Department of Water and Power...',
  applies_to: ["Residential"], // Array of project types
  use_subtypes: null,
  source_url: 'https://...',
  legal_citation: 'Metropolitan Water District...',
  is_active: true
}
```

**Key Field:** `applies_to` is an **array of strings** containing project type names.

---

## Problems Identified

### Problem 1: Empty Jurisdictions

**Impact:** HIGH

**Description:** 5 out of 6 major jurisdictions have NO fees in the database:
- Austin
- Phoenix city
- San Diego
- Denver
- Portland

**Result:** Users selecting these jurisdictions will see $0 fees or errors.

**Solution:** Import fees for these jurisdictions from CSV files (some already exist in `transformed_fees/` directory).

---

### Problem 2: Limited Project Type Support

**Impact:** HIGH

**Description:** Database only has "Residential" and "All" in `applies_to` values.

**Dropdown options with NO database support:**
- Commercial (0 fees)
- Office (0 fees)
- Retail (0 fees)
- Restaurant/Food Service (0 fees)
- Industrial (0 fees)

**Result:** Users selecting Commercial/Office/Retail/Restaurant/Industrial will see $0 fees.

**Solution:** Either:
1. Remove unsupported options from dropdown (short-term)
2. Import commercial/office/retail/industrial fees (long-term)

---

### Problem 3: Naming Inconsistency

**Impact:** MEDIUM

**Description:** Dropdown uses specific names but database uses generic "Residential".

**Examples:**
- Dropdown: "Single-Family Residential" → Database: "Residential"
- Dropdown: "Multi-Family Residential" → Database: "Residential"

**Current handling:** The `FeeCalculator.feeAppliesToProject()` method handles this with fuzzy matching:

```typescript
// From src/lib/fee-calculator/index.ts:1269
private feeAppliesToProject(appliesTo: string[], projectType: string): boolean {
    // Handles cases like "Single Family" in DB matching "Residential" projectType
    const lowerProjectType = projectType.toLowerCase();

    // "Single-Family Residential" matches "Residential"
    if (lowerAppliesTo.includes('single') && lowerProjectType.includes('residential')) {
        return true;
    }

    // "Multi-Family Residential" matches "Residential"
    if (lowerAppliesTo.includes('multi') && lowerProjectType.includes('residential')) {
        return true;
    }
}
```

**This is working correctly** but relies on complex string matching logic.

---

## FeeCalculator Hardcoded Types

**Source:** `src/lib/fee-calculator/index.ts:20`

```typescript
projectType: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed-use' | 'Public';
```

**Also seen in tests:**
```typescript
projectType: 'Multi-Family Residential'  // src/app/api/lewis/route.ts
projectType: 'Single-Family Residential'
```

**Issue:** TypeScript type definition doesn't match dropdown options or database values.

---

## Recommendations

### Immediate Actions (High Priority)

1. **Import Missing Fee Data**
   - Austin fees exist in `transformed_fees/austin_fees_transformed.csv`
   - Import all 5 missing jurisdictions
   - Verify `applies_to` values are populated correctly

2. **Update Dropdown Options**
   - **Option A:** Remove unsupported options (Commercial, Office, Retail, Restaurant/Food Service, Industrial)
   - **Option B:** Add "Coming Soon" indicator to unsupported options
   - **Option C:** Import fee data for all project types

3. **Standardize Project Type Names**
   - Define canonical list of project types
   - Update `applies_to` values in database to match dropdown
   - Document the mapping logic in `FeeCalculator`

### Medium-Term Actions

4. **Create project_types Table**
   ```sql
   CREATE TABLE project_types (
     id UUID PRIMARY KEY,
     name VARCHAR NOT NULL UNIQUE,
     description TEXT,
     is_active BOOLEAN DEFAULT true
   );
   ```

5. **Link Fees to Project Types**
   - Replace `applies_to` array with proper foreign key
   - Create junction table: `fee_project_types`

6. **Add Validation**
   - Validate dropdown options against database
   - Show warning if user selects unsupported project type
   - Add database constraints

### Long-Term Actions

7. **Import Comprehensive Fee Data**
   - Add Commercial fees for all jurisdictions
   - Add Office/Retail/Restaurant fees
   - Add Industrial fees
   - Add Mixed-use fees

8. **Create Admin Interface**
   - Allow adding/editing project types
   - Allow mapping fees to project types
   - Bulk import tool for CSV files

---

## Testing Recommendations

### Test Case 1: Los Angeles Residential
✅ **Should Work**
- Select "Los Angeles"
- Select "Single-Family Residential" or "Multi-Family Residential"
- Should show ~32 fees

### Test Case 2: Los Angeles Commercial
❌ **Will Fail**
- Select "Los Angeles"
- Select "Commercial"
- Will show $0 fees (no commercial fees in database)

### Test Case 3: Austin Any Type
❌ **Will Fail**
- Select "Austin"
- Select any project type
- Will show $0 fees (no Austin fees in database)

### Test Case 4: All Unsupported Types
❌ **Will Fail for ALL Jurisdictions**
- Select any jurisdiction
- Select "Office", "Retail", "Restaurant/Food Service", or "Industrial"
- Will show $0 fees (no fees with these applies_to values)

---

## Files Analyzed

1. `src/components/CustomLewisPortal.tsx` - Dropdown definition
2. `src/lib/fee-calculator/index.ts` - Fee matching logic
3. `src/lib/fee-calculator/types.ts` - TypeScript type definitions
4. Database tables: `jurisdictions`, `fees`

---

## Query Results

### SQL Query (Attempted)

```sql
SELECT
  j.jurisdiction_name,
  pt.project_type_name,
  COUNT(DISTINCT f.fee_id) as fee_count
FROM jurisdictions j
LEFT JOIN fees f ON j.jurisdiction_id = f.jurisdiction_id
LEFT JOIN project_types pt ON f.project_type_id = pt.project_type_id
WHERE j.jurisdiction_name IN (
  'Phoenix city', 'Austin', 'Los Angeles',
  'San Diego', 'Denver', 'Portland'
)
GROUP BY j.jurisdiction_name, pt.project_type_name
ORDER BY j.jurisdiction_name, pt.project_type_name;
```

**Result:** Query failed because there is NO `project_types` table in the database. Project types are stored as strings in the `fees.applies_to` array column.

---

## Conclusion

**Current State:**
- Only Los Angeles has fees (33 total)
- Only "Residential" project types are supported
- 5/6 jurisdictions have no data
- 5/7 dropdown options have no database support

**Recommendation:**
1. **Urgent:** Import Austin, Phoenix, Denver, San Diego, Portland fees
2. **Urgent:** Update dropdown to only show "Single-Family Residential" and "Multi-Family Residential"
3. **Medium:** Create proper project_types table
4. **Long-term:** Import comprehensive commercial/office/retail/industrial fee data

**User Impact:**
- Currently, only Los Angeles + Residential works correctly
- All other combinations will show $0 fees or errors
- Users may think the system is broken
