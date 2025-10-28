import csv
from datetime import datetime

# Mapping from calc_method to calc_type
calc_type_mapping = {
    'per_sqft': 'per_square_foot',
    'per_square_foot': 'per_square_foot',
    'flat': 'flat_fee',
    'flat_fee': 'flat_fee',
    'per_unit': 'per_unit',
    'per_dwelling_unit': 'per_unit',
    'per_meter': 'per_unit',
    'per_acre': 'per_unit',
    'percentage': 'formula',
    'tiered': 'formula',
    'formula': 'formula',
    'varies': 'formula',
}

def fix_date(date_str):
    """Convert various date formats to YYYY-MM-DD"""
    if not date_str or date_str.strip() == '':
        return None

    date_str = date_str.strip()

    # If it's just a year like "2023", make it Jan 1 of that year
    if len(date_str) == 4 and date_str.isdigit():
        return f"{date_str}-01-01"

    # Try parsing common formats
    try:
        # Try YYYY-MM-DD first
        datetime.strptime(date_str, '%Y-%m-%d')
        return date_str
    except:
        pass

    try:
        # Try MM/DD/YYYY
        dt = datetime.strptime(date_str, '%m/%d/%Y')
        return dt.strftime('%Y-%m-%d')
    except:
        pass

    # Default to None if can't parse
    return None

# Read input CSV
with open('fee_data/city_of_los_angeles_fees.csv', 'r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    rows = list(reader)

# Transform rows
transformed_rows = []
for row in rows:
    calc_method = row.get('calc_method', '')
    calc_type = calc_type_mapping.get(calc_method, 'per_unit')

    # Create new row for fees_staging
    new_row = {
        'state_name': row['state_name'],
        'jurisdiction_name': row['jurisdiction_name'],
        'agency_name': row['agency_name'],
        'fee_name': row['fee_name'],
        'calc_type': calc_type,
        'description': row['description'],
        'unit_label': row['unit_label'],
        'rate': row['rate'],
        'formula': row.get('formula', ''),
        'applies_to': row['applies_to'],
        'use_subtype': row['use_subtype'],
        'service_area_name': row['service_area_name'],
        'source_url': row['source_url'],
        'legal_citation': row.get('legal_citation', ''),
        'effective_date': fix_date(row.get('effective_date', '')),
    }
    transformed_rows.append(new_row)

# Write output CSV
with open('fee_data/city_of_los_angeles_fees_transformed.csv', 'w', newline='', encoding='utf-8') as outfile:
    fieldnames = ['state_name', 'jurisdiction_name', 'agency_name', 'fee_name', 'calc_type',
                  'description', 'unit_label', 'rate', 'formula', 'applies_to', 'use_subtype',
                  'service_area_name', 'source_url', 'legal_citation', 'effective_date']
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(transformed_rows)

print(f"✅ Transformed {len(transformed_rows)} rows")
print("✅ Output saved to: fee_data/city_of_los_angeles_fees_transformed.csv")
