import csv

# Mapping from old category to new calc_type
calc_type_mapping = {
    'flat': 'flat_fee',
    'per_month': 'per_unit',
    'per_eru_per_month': 'per_unit',
    'monthly_service_fee': 'per_meter_size',
    'formula_based': 'formula',
    'per_unit': 'per_unit',
    'per_square_foot': 'per_square_foot',
    'per_sqft': 'per_square_foot',
    'per_acre': 'per_unit',
    'per_month_per_eru': 'per_unit',
    'per_linear_foot': 'per_unit',
    'per_dwelling_unit': 'per_unit',
    'per_fixture_unit': 'per_unit',
    'per_connection_or_unit': 'per_unit',
    'hourly': 'per_unit',
    'per_hour': 'per_unit',
    'annual': 'per_unit',
    'per_kilowatt_hour': 'per_unit',
    'per_cleaning': 'per_unit',
    'per_bale': 'per_unit',
    'per_yard': 'per_unit',
    'per_bag': 'per_unit',
    'per_job': 'per_unit',
    'per_half_day': 'per_unit',
    'per_job_or_annual': 'per_unit',
    'monthly_volumetric': 'per_unit',
    'per_wireless_facility': 'per_unit',
    'per_device': 'per_unit',
    'per_valve': 'per_unit',
    'per_pump': 'per_unit',
    'per_tank': 'per_unit',
    'per_system': 'per_unit',
    'per_sqft_1000': 'per_unit',
    'per_hydrant': 'per_unit',
    'per_amp': 'per_unit',
    'per_meter': 'per_unit',
    'per_horsepower': 'per_unit',
    'per_btu': 'per_unit',
    'per_space': 'per_unit',
    'flat_plus_per_lot': 'formula',
    'flat_plus_per_acre': 'formula',
    'flat_plus_per_unit': 'formula',
    'flat_plus_hourly': 'formula',
    'flat_plus_actual': 'formula',
    'flat_plus_per_btu': 'formula',
    'flat_plus_per_cabinet': 'formula',
    'flat_plus_per_outlet': 'formula',
    'flat_per_month': 'per_unit',
    'percentage': 'formula',
    'percentage_of_value': 'formula',
    'formula': 'formula',
    'tiered_percentage': 'formula',
    'cost_of_work': 'formula',
    'based_on_cost': 'formula',
    'actual_cost': 'formula',
    'building_permit_based': 'formula',
    'regular_fee_schedule': 'formula',
    'postage': 'formula',
    'state_code_based': 'formula',
    'deposit': 'flat_fee',
    'reduction': 'formula',
    'free': 'flat_fee',
    'no_assessment_levied': 'flat_fee',
    'no_charge': 'flat_fee',
    'see_section': 'formula',
    'based_on_readings': 'formula',
    'cost_associated_with_labor_and_testing': 'formula',
    'determined_by_potw': 'formula',
    'contracted_rate': 'formula',
    'doubled': 'formula',
    'monthly_per_unit_flat': 'per_unit',
    'annual_plus_actual': 'formula',
}

# Read input CSV
with open('fee_data/salt_lake_city_fees.csv', 'r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    rows = list(reader)

# Transform rows
transformed_rows = []
for row in rows:
    old_category = row['category']
    calc_type = calc_type_mapping.get(old_category, 'per_unit')  # Default to per_unit if unknown

    # Create new row without fee_category, with calc_type
    new_row = {
        'state_name': row['state_name'],
        'jurisdiction_name': row['jurisdiction_name'],
        'agency_name': row['agency_name'],
        'fee_name': row['fee_name'],
        'calc_type': calc_type,
        'description': row['description'],
        'unit_label': row['unit_label'],
        'rate': row['rate'],
        'formula': row['formula'],
        'applies_to': row['applies_to'],
        'use_subtype': row['use_subtype'],
        'service_area_name': row['service_area_name'],
        'source_url': row['source_url'],
        'legal_citation': row['legal_citation'],
        'effective_date': row['effective_date'],
    }
    transformed_rows.append(new_row)

# Write output CSV
with open('fee_data/salt_lake_city_fees_transformed.csv', 'w', newline='', encoding='utf-8') as outfile:
    fieldnames = ['state_name', 'jurisdiction_name', 'agency_name', 'fee_name', 'calc_type', 'description', 'unit_label', 'rate', 'formula', 'applies_to', 'use_subtype', 'service_area_name', 'source_url', 'legal_citation', 'effective_date']
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(transformed_rows)

print(f"✅ Transformed {len(transformed_rows)} rows")
print("✅ Output saved to: salt_lake_city_fees_transformed.csv")
