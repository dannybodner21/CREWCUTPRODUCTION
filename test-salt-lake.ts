/**
 * Test Salt Lake City fee calculation
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testSaltLake() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('🔍 Checking if Salt Lake City exists in database...');

    const { data: jurisdiction, error: jError } = await supabase
        .from('jurisdictions')
        .select('id, jurisdiction_name, state_code')
        .eq('jurisdiction_name', 'Salt Lake City')
        .eq('state_code', 'UT')
        .single();

    if (jError || !jurisdiction) {
        console.error('❌ Salt Lake City not found in database:', jError);
        return;
    }

    console.log('✅ Found jurisdiction:', jurisdiction);

    console.log('\n🔍 Checking for service areas...');
    const { data: serviceAreas, error: saError } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction.id);

    if (saError) {
        console.error('❌ Error fetching service areas:', saError);
        return;
    }

    console.log('✅ Found service areas:', serviceAreas);

    console.log('\n🔍 Checking for fees...');
    const { data: fees, error: fError } = await supabase
        .from('fees')
        .select('id, name, category')
        .eq('jurisdiction_id', jurisdiction.id)
        .limit(5);

    if (fError) {
        console.error('❌ Error fetching fees:', fError);
        return;
    }

    console.log('✅ Found fees (showing first 5):');
    fees?.forEach(fee => {
        console.log(`   - ${fee.name}: ${fee.category}`);
    });

    console.log('\n🧮 Testing fee calculation...');

    const projectInputs: ProjectInputs = {
        jurisdictionName: 'Salt Lake City',
        stateCode: 'UT',
        selectedServiceAreaIds: serviceAreas?.map(sa => sa.id) || [],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 1,
        squareFeet: 2000,
        projectValue: 500000,
        meterSize: '3/4"'
    };

    try {
        const breakdown = await calculator.calculateFees(projectInputs);

        console.log('\n✅ Fee Calculation Results:');
        console.log('   One-Time Fees:', breakdown.oneTimeFees);
        console.log('   Monthly Fees:', breakdown.monthlyFees);
        console.log('   Total Fees Found:', breakdown.fees.length);
        console.log('   Fees with amounts > 0:', breakdown.fees.filter(f => f.calculatedAmount > 0).length);

        if (breakdown.fees.length > 0) {
            console.log('\n   Sample fees:');
            breakdown.fees.slice(0, 5).forEach(fee => {
                console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toFixed(2)}`);
            });
        }
    } catch (error) {
        console.error('❌ Error calculating fees:', error);
    }
}

testSaltLake().catch(console.error);
