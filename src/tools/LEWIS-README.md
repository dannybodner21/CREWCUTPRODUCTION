# LEWIS CSV Import and Analysis Tools

This directory contains tools for importing and analyzing construction fee data from CSV files into the LEWIS database.

## Files

- **`lewis-csv-import.ts`** - Imports CSV data into LEWIS database tables
- **`lewis-data-analysis.ts`** - Analyzes data quality and completeness
- **`lewis-test-runner.ts`** - Test script for Charlotte CSV data
- **`LEWIS-README.md`** - This documentation

## Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# LEWIS Database Configuration
LEWIS_DB_HOST=your-database-host
LEWIS_DB_PORT=5432
LEWIS_DB_NAME=lewis
LEWIS_DB_USER=your-username
LEWIS_DB_PASSWORD=your-password
```

### 2. Dependencies

Install required packages:

```bash
npm install csv-parse dotenv
```

## Usage

### Test with Charlotte Data

```bash
# Test the import and analysis with Charlotte CSV
tsx src/tools/lewis-test-runner.ts
```

### Import Single CSV

```bash
# Import a specific CSV file
tsx src/tools/lewis-csv-import.ts fee_data/charlotte_city_fees.csv
```

### Analyze Data Quality

```bash
# Analyze data quality for a specific CSV
tsx src/tools/lewis-data-analysis.ts fee_data/charlotte_city_fees.csv
```

### Analyze Multiple CSVs

```typescript
import { LewisDataAnalyzer } from './lewis-data-analysis';

const analyzer = new LewisDataAnalyzer();
const csvFiles = [
  'fee_data/charlotte_city_fees.csv',
  'fee_data/other_jurisdiction.csv',
  // ... more files
];

await analyzer.analyzeMultipleCSVs(csvFiles);
```

## CSV Format

The scripts expect CSV files with these columns:

- `state_name` - State name
- `jurisdiction_name` - City/county name
- `agency_name` - Government department
- `fee_name` - Specific fee name
- `category` - Fee category (Appeal, Zoning, etc.)
- `description` - Fee description
- `unit_label` - Unit of measurement
- `calc_method` - Calculation method (flat, per sq ft, etc.)
- `rate` - Fee amount
- `min_fee`, `max_fee` - Fee range
- `formula` - Calculation formula
- `tier_text` - Tier information
- `applies_to` - What the fee applies to
- `use_subtype` - Use type details
- `service_area_name` - Geographic area
- `source_title` - Source document title
- `source_url` - Source URL
- `source_doc_date` - Document date
- `source_page` - Page number
- `source_section` - Section reference
- `legal_citation` - Legal citation
- `effective_date` - When fee takes effect
- `notes` - Additional notes

## Database Mapping

### Jurisdictions Table
- Maps `state_name` + `jurisdiction_name` to jurisdictions
- Creates proper FIPS codes and geographic hierarchy
- Sets jurisdiction type (municipality, county, etc.)

### Agencies Table
- Maps `agency_name` to agencies per jurisdiction
- Determines agency type (planning, water, sewer, etc.)
- Links to parent jurisdiction

### Fee Categories Table
- Maps `category` to standardized fee categories
- Groups categories (Building, Planning, Infrastructure, etc.)
- Creates normalized category names

### Sources Table
- Tracks data provenance from `source_*` columns
- Records URLs, citations, and retrieval dates
- Links to fee records

### Fees Table
- Main fee data with all relationships
- Includes rates, formulas, effective dates
- Links to jurisdictions, agencies, categories, and sources

## Data Quality Analysis

The analysis script provides:

### Quality Metrics
- **Data Quality Score** (0-100) - Overall data completeness
- **Completeness Score** (0-100) - How much data is filled
- **Rate Coverage** - Percentage of fees with specific amounts
- **Source Coverage** - Percentage of fees with source URLs
- **Description Coverage** - Percentage of fees with descriptions

### Recommendations
- Identifies missing data elements
- Suggests improvements for data quality
- Highlights areas needing attention
- Provides positive feedback for good data

### Jurisdiction Comparison
- Compares data quality across multiple jurisdictions
- Identifies best and worst performing datasets
- Provides overall statistics and averages

## Example Output

```
📊 JURISDICTION ANALYSIS REPORT
==================================================

📍 Jurisdiction: Charlotte city, North Carolina
📈 Total Fee Records: 181
📋 Unique Categories: 8
🏛️  Unique Agencies: 6

📊 DATA QUALITY METRICS
------------------------------
💰 Records with Rates: 181/181 (100%)
📝 Records with Descriptions: 181/181 (100%)
🧮 Records with Formulas: 45/181 (25%)
📅 Records with Effective Dates: 181/181 (100%)
🔗 Records with Sources: 181/181 (100%)

🎯 QUALITY SCORES
--------------------
Data Quality Score: 100/100 🟢
Completeness Score: 85/100 🟢

💡 RECOMMENDATIONS
--------------------
1. 🧮 Limited formula data - consider adding calculation formulas where applicable
2. ✅ Excellent data quality - this jurisdiction has comprehensive fee data
3. 🌟 Great category coverage - comprehensive fee type representation
```

## Next Steps

1. **Configure Database** - Set up your LEWIS database connection
2. **Test Import** - Run the test script with Charlotte data
3. **Import All Data** - Process all 100 jurisdictions
4. **Quality Review** - Use analysis script to identify data gaps
5. **Data Enhancement** - Improve data quality based on recommendations

## Troubleshooting

### Common Issues

1. **Database Connection** - Ensure LEWIS database credentials are correct
2. **CSV Format** - Verify CSV files match expected column structure
3. **File Paths** - Use absolute paths or ensure files are in correct location
4. **Permissions** - Ensure database user has INSERT/UPDATE permissions

### Debug Mode

Add debug logging by setting environment variable:
```bash
DEBUG=lewis:* tsx src/tools/lewis-csv-import.ts
```
