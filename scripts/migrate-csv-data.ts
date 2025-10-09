#!/usr/bin/env tsx

/**
 * Script to migrate CSV fee data to the new database schema
 * Run with: npx tsx scripts/migrate-csv-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for data migration

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CSVFeeData {
    state_name: string;
    jurisdiction_name: string;
    agency_name: string;
    fee_name: string;
    category: string;
    description: string;
    unit_label: string;
    rate: string;
    formula: string;
    applies_to: string;
    use_subtype: string;
    service_area_name: string;
    source_url: string;
    legal_citation: string;
    effective_date: string;
    fee_category?: string;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

function parseCSV(filePath: string): CSVFeeData[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);

    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row: any = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        return row as CSVFeeData;
    });
}

function mapCalcType(category: string, formula: string): string {
    if (formula && formula.trim()) {
        return 'formula';
    }

    switch (category.toLowerCase()) {
        case 'per_unit':
            return 'per_unit';
        case 'per_sqft':
            return 'per_sqft';
        case 'flat':
            return 'flat';
        case 'percentage':
            return 'percentage';
        default:
            return 'flat'; // Default fallback
    }
}

function parseRate(rateStr: string): number | null {
    if (!rateStr || rateStr.trim() === '') return null;

    const cleaned = rateStr.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
}

function parseAppliesTo(appliesToStr: string): string[] {
    if (!appliesToStr || appliesToStr.trim() === '') return ['All Users'];

    return appliesToStr
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
            // Map common variations to standard types
            const lower = s.toLowerCase();
            if (lower.includes('residential')) return 'Residential';
            if (lower.includes('commercial')) return 'Commercial';
            if (lower.includes('industrial')) return 'Industrial';
            if (lower.includes('mixed')) return 'Mixed-use';
            if (lower.includes('public')) return 'Public';
            return s; // Return as-is if no match
        });
}

function parseUseSubtypes(useSubtypeStr: string): string[] {
    if (!useSubtypeStr || useSubtypeStr.trim() === '') return ['All Users'];

    return useSubtypeStr
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

async function migrateJurisdiction(jurisdictionName: string, stateCode: string, stateName: string) {
    console.log(`📍 Migrating jurisdiction: ${jurisdictionName}, ${stateCode}`);

    // Insert jurisdiction
    const { data: jurisdiction, error: jurError } = await supabase
        .from('jurisdictions')
        .upsert({
            name: jurisdictionName,
            state_code: stateCode,
            state_name: stateName,
            type: 'city',
            kind: 'municipality'
        }, {
            onConflict: 'name,state_code',
            ignoreDuplicates: false
        })
        .select()
        .single();

    if (jurError) {
        console.error(`❌ Error creating jurisdiction ${jurisdictionName}:`, jurError);
        return null;
    }

    console.log(`✅ Created jurisdiction: ${jurisdiction.id}`);
    return jurisdiction;
}

async function migrateAgency(agencyName: string, jurisdictionId: string) {
    // Insert agency
    const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .upsert({
            name: agencyName,
            jurisdiction_id: jurisdictionId
        }, {
            onConflict: 'name,jurisdiction_id',
            ignoreDuplicates: false
        })
        .select()
        .single();

    if (agencyError) {
        console.error(`❌ Error creating agency ${agencyName}:`, agencyError);
        return null;
    }

    return agency;
}

async function migrateFee(csvFee: CSVFeeData, jurisdictionId: string, agencyId: string) {
    const rate = parseRate(csvFee.rate);
    const calcType = mapCalcType(csvFee.category, csvFee.formula);

    const feeData = {
        jurisdiction_id: jurisdictionId,
        agency_id: agencyId,
        name: csvFee.fee_name,
        description: csvFee.description,
        category: csvFee.category,
        calc_type: calcType,
        rate: rate,
        unit_label: csvFee.unit_label || null,
        min_fee: null, // Not in CSV data
        max_fee: null, // Not in CSV data
        formula_display: csvFee.formula || null,
        formula_config: null, // Could be parsed from formula in future
        applies_to: parseAppliesTo(csvFee.applies_to),
        use_subtypes: parseUseSubtypes(csvFee.use_subtype),
        service_area: csvFee.service_area_name || 'Citywide',
        source_url: csvFee.source_url || null,
        legal_citation: csvFee.legal_citation || null,
        effective_date: csvFee.effective_date ? new Date(csvFee.effective_date).toISOString().split('T')[0] : null,
        active: true
    };

    const { data, error } = await supabase
        .from('fees')
        .upsert(feeData, {
            onConflict: 'name,jurisdiction_id,agency_id',
            ignoreDuplicates: false
        })
        .select()
        .single();

    if (error) {
        console.error(`❌ Error creating fee ${csvFee.fee_name}:`, error);
        return null;
    }

    return data;
}

async function migrateCSVFile(filePath: string) {
    console.log(`📄 Processing file: ${filePath}`);

    const csvData = parseCSV(filePath);
    console.log(`   Found ${csvData.length} fee records`);

    // Group by jurisdiction
    const jurisdictionGroups = csvData.reduce((acc, fee) => {
        const key = `${fee.jurisdiction_name}|${fee.state_name}`;
        if (!acc[key]) {
            acc[key] = {
                jurisdictionName: fee.jurisdiction_name,
                stateName: fee.state_name,
                stateCode: fee.state_name === 'Arizona' ? 'AZ' :
                    fee.state_name === 'California' ? 'CA' :
                        fee.state_name === 'Illinois' ? 'IL' :
                            fee.state_name === 'Texas' ? 'TX' :
                                fee.state_name === 'Pennsylvania' ? 'PA' : 'XX',
                fees: []
            };
        }
        acc[key].fees.push(fee);
        return acc;
    }, {} as Record<string, any>);

    // Process each jurisdiction
    for (const [key, group] of Object.entries(jurisdictionGroups)) {
        console.log(`\n🏛️ Processing jurisdiction: ${group.jurisdictionName}, ${group.stateCode}`);

        // Create jurisdiction
        const jurisdiction = await migrateJurisdiction(
            group.jurisdictionName,
            group.stateCode,
            group.stateName
        );

        if (!jurisdiction) continue;

        // Group fees by agency
        const agencyGroups = group.fees.reduce((acc: any, fee: CSVFeeData) => {
            if (!acc[fee.agency_name]) {
                acc[fee.agency_name] = [];
            }
            acc[fee.agency_name].push(fee);
            return acc;
        }, {});

        // Process each agency
        for (const [agencyName, agencyFees] of Object.entries(agencyGroups)) {
            console.log(`  🏢 Processing agency: ${agencyName} (${(agencyFees as CSVFeeData[]).length} fees)`);

            // Create agency
            const agency = await migrateAgency(agencyName, jurisdiction.id);
            if (!agency) continue;

            // Process fees
            let successCount = 0;
            for (const fee of agencyFees as CSVFeeData[]) {
                const migratedFee = await migrateFee(fee, jurisdiction.id, agency.id);
                if (migratedFee) successCount++;
            }

            console.log(`    ✅ Migrated ${successCount}/${(agencyFees as CSVFeeData[]).length} fees`);
        }
    }
}

async function main() {
    console.log('🚀 Starting CSV data migration...\n');

    try {
        // Get all CSV files in the fee_data directory
        const feeDataDir = path.join(process.cwd(), 'fee_data');
        const files = fs.readdirSync(feeDataDir).filter(file => file.endsWith('.csv'));

        console.log(`📁 Found ${files.length} CSV files to process`);

        // Process each file
        for (const file of files) {
            const filePath = path.join(feeDataDir, file);
            await migrateCSVFile(filePath);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Verify data in Supabase dashboard');
        console.log('   2. Run the fee calculator test: npx tsx scripts/test-fee-calculator.ts');
        console.log('   3. Test the Lewis portal fee calculations');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
