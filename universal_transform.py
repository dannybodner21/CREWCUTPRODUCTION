import csv
import sys
from datetime import datetime

# Mapping for calc_type standardization
CALC_TYPE_MAP = {
    'flat_fee': 'flat_fee',
    'per_unit': 'per_unit',
    'per_square_foot': 'per_square_foot',
    'per_acre': 'per_acre',
    'per_meter_size': 'per_meter_size',
    'formula': 'formula',
    'flat': 'flat_fee',
    'per_sqft': 'per_square_foot',
    'per_sq_ft': 'per_square_foot',
    'per_dwelling_unit': 'per_unit',
    'per_linear_foot': 'per_unit',
    'per_lf': 'per_unit',
    'percentage': 'formula',
    'tiered': 'formula',
    'per_trip': 'per_unit',
    'per_lineal_ft': 'per_unit',
}

def standardize_applies_to(value):
    if not value or value.strip() == '':
        return 'All'

    value = value.strip()
    lower = value.lower()

    if ',' in value or ';' in value:
        parts = value.replace(';', ',').split(',')
        standardized = []
        for part in parts:
            part = part.strip()
            if 'residential' in part.lower():
                standardized.append('Residential')
            elif 'commercial' in part.lower():
                standardized.append('Commercial')
            elif 'industrial' in part.lower():
                standardized.append('Industrial')
        return ';'.join(list(set(standardized))) if standardized else 'All'

    if 'residential' in lower:
        return 'Residential'
    elif 'commercial' in lower:
        return 'Commercial'
    elif 'industrial' in lower:
        return 'Industrial'
    elif 'all' in lower:
        return 'All'
    else:
        if value in ['Residential', 'Commercial', 'Industrial', 'All']:
            return value
        return 'All'

def fix_date(date_str):
    if not date_str or date_str.strip() == '':
        return None

    date_str = date_str.strip()

    if len(date_str) == 4 and date_str.isdigit():
        return f"{date_str}-01-01"

    if len(date_str) == 10 and date_str[4] == '-' and date_str[7] == '-':
        return date_str

    for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y']:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except:
            continue

    return None

def transform_csv(input_file, output_file):
    print(f"Reading {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        input_rows = list(reader)
        input_headers = reader.fieldnames

    print(f"Found {len(input_rows)} rows")

    output_headers = [
        'state_name', 'jurisdiction_name', 'agency_name', 'fee_name',
        'calc_type', 'rate', 'unit_label', 'applies_to', 'use_subtype',
        'min_units', 'max_units', 'min_sqft', 'max_sqft',
        'service_area_name', 'description', 'source_url',
        'legal_citation', 'effective_date'
    ]

    transformed_rows = []

    for i, row in enumerate(input_rows, 1):
        try:
            # Map calc_type
            calc_type_raw = (row.get('calc_type') or row.get('calc_method') or
                           row.get('category') or 'flat_fee').strip().lower()
            calc_type = CALC_TYPE_MAP.get(calc_type_raw, 'per_unit')

            # Get rate - FIXED: Check min_fee FIRST
            rate = None
            if 'min_fee' in row and row['min_fee'].strip():
                rate = row['min_fee'].strip()
            elif 'rate' in row and row['rate'].strip():
                rate = row['rate'].strip()
            elif 'max_fee' in row and row['max_fee'].strip():
                rate = row['max_fee'].strip()

            # Standardize applies_to
            applies_to = standardize_applies_to(row.get('applies_to', 'All'))

            # Fix date
            effective_date = fix_date(row.get('effective_date', ''))

            # Build output row
            new_row = {
                'state_name': row.get('state_name', '').strip(),
                'jurisdiction_name': row.get('jurisdiction_name', '').strip(),
                'agency_name': row.get('agency_name', '').strip(),
                'fee_name': row.get('fee_name', '').strip(),
                'calc_type': calc_type,
                'rate': rate,
                'unit_label': row.get('unit_label', '').strip(),
                'applies_to': applies_to,
                'use_subtype': row.get('use_subtype', '').strip(),
                'min_units': row.get('min_units', '').strip(),
                'max_units': row.get('max_units', '').strip(),
                'min_sqft': row.get('min_sqft', '').strip(),
                'max_sqft': row.get('max_sqft', '').strip(),
                'service_area_name': row.get('service_area_name', 'Citywide').strip(),
                'description': row.get('description', '').strip(),
                'source_url': row.get('source_url', '').strip(),
                'legal_citation': row.get('legal_citation', '').strip(),
                'effective_date': effective_date,
            }

            transformed_rows.append(new_row)

        except Exception as e:
            print(f"⚠️  Error on row {i}: {e}")
            continue

    print(f"Writing {len(transformed_rows)} rows to {output_file}...")

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=output_headers)
        writer.writeheader()
        writer.writerows(transformed_rows)

    print(f"✅ Done! Transformed {len(transformed_rows)} rows")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python universal_transform_v2.py input.csv output.csv")
        sys.exit(1)

    transform_csv(sys.argv[1], sys.argv[2])
