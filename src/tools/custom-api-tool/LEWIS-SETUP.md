# LEWIS Construction Fee Portal - Universal Setup Guide

## Overview

The LEWIS Construction Fee Portal is a comprehensive calculator and database tool for construction fees across multiple states. This guide covers setting up the portal with real data from your 21 state CSV files.

## What We Have

- **21 State CSV Files** in the `fee_data/` directory
- **Universal CSV Importer** that handles all state formats
- **Database Tables** ready for construction fee data
- **Lewis Portal UI** integrated into the chat interface

## Database Structure

The portal uses 4 main tables:

1. **`cities`** - City information (name, county, state, population)
2. **`webhound_fee_categories`** - Fee category definitions and groupings
3. **`verified_fee_data`** - Main fee data with descriptions and amounts
4. **`detailed_fee_breakdown`** - Detailed fee breakdowns with units

## CSV Data Format

Your CSV files follow this structure:
- **First column**: `location_name` (city/county names)
- **Subsequent columns**: 80+ fee categories (plan_check_fees, permit_issuance_fees, etc.)
- **Data format**: Text descriptions, dollar amounts, percentages, or "N/A"

## Setup Steps

### 1. Environment Variables

Ensure your `.env.local` file contains:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Check Current Data

Before importing, you can check what's currently in your tables:
```bash
# The portal will show current data when you access it
# Or use the check-lewis-tables.ts script (requires TypeScript compilation)
```

### 3. Import All State Data

**⚠️ WARNING: This will DELETE ALL existing Lewis data and replace it with CSV data.**

Run the universal import script:
```bash
# Option 1: Using ts-node (if available)
npx ts-node src/tools/custom-api-tool/run-universal-import.ts

# Option 2: Compile and run
npx tsc src/tools/custom-api-tool/run-universal-import.ts
node src/tools/custom-api-tool/run-universal-import.js

# Option 3: Add to package.json scripts
# "import-lewis": "ts-node src/tools/custom-api-tool/run-universal-import.ts"
# Then run: npm run import-lewis
```

### 4. What the Import Does

The universal importer will:

1. **Clear existing data** from all Lewis tables
2. **Process each CSV file** automatically:
   - Arizona (7,721 locations)
   - Texas (6 locations) 
   - Florida (11 locations)
   - Indiana (15 locations)
   - Ohio (7 locations)
   - Kentucky (14 locations)
   - Pennsylvania (5 locations)
   - North Carolina (7 locations)
   - South Carolina (5 locations)
   - Georgia (5 locations)
   - Alabama (5 locations)
   - New Mexico (6 locations)
   - Alaska (4 locations)
   - Arkansas (11 locations)
   - California (8 locations)
   - Colorado (8 locations)
   - Connecticut (8 locations)
   - Hawaii (5 locations)
   - Delaware (12 locations)
   - Illinois (40 locations)
   - Idaho (7 locations)

3. **Create fee categories** with logical groupings
4. **Parse fee data** to extract amounts, methods, and quality scores
5. **Provide detailed summary** of the import process

### 5. Test the Portal

After import, test the Lewis portal:

1. **Open the chat interface** at http://localhost:3010
2. **Access Lewis tool** in the chat
3. **Select states and cities** to see imported data
4. **View fee calculations** and breakdowns

## Data Quality Features

The importer automatically:

- **Categorizes fees** into logical groups (planning, permits, utilities, etc.)
- **Extracts dollar amounts** and percentages from text
- **Identifies calculation methods** (per sq ft, per acre, tiered pricing)
- **Assigns quality scores** based on data completeness
- **Handles CSV parsing** with proper quote handling

## Troubleshooting

### Import Errors
- Check CSV file format and encoding
- Verify Supabase connection and permissions
- Review error logs for specific issues

### Data Issues
- Some locations may have "N/A" for certain fees
- Text descriptions are preserved for reference
- Quality scores help identify incomplete data

### Performance
- Large imports (like Arizona) may take several minutes
- Progress is shown for each state
- Failed imports don't stop the overall process

## Next Steps

After successful import:

1. **Verify data** in the Lewis portal
2. **Test fee calculations** with different project types
3. **Customize categories** if needed
4. **Add new states** by placing CSV files in `fee_data/`

## Support

If you encounter issues:
1. Check the import logs for specific errors
2. Verify CSV file formats match the expected structure
3. Ensure Supabase tables have the correct schema
4. Review environment variable configuration

---

**Note**: This setup replaces the previous Arizona-specific importer with a universal solution that handles all your state data automatically.
