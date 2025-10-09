/**
 * Test to show seasonal water charge breakdown
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testSeasonalBreakdown() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: jurisdictions } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdictions!.id)
        .in('name', ['Inside City'])
        .single();

    const projectInputs: ProjectInputs = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        selectedServiceAreaIds: [serviceAreas!.id],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 25000,
        projectValue: 5000000,
        meterSize: '3/4"'
    };

    const breakdown = await calculator.calculateFees(projectInputs);

    console.log('\n' + '═'.repeat(70));
    console.log('SEASONAL WATER CHARGE BREAKDOWN');
    console.log('═'.repeat(70) + '\n');

    const waterCharge = breakdown.fees.find(f => f.feeName.includes('Water Volume Charge'));

    if (waterCharge) {
        console.log(`Fee: ${waterCharge.feeName}`);
        console.log(`Monthly Charge: $${waterCharge.calculatedAmount.toFixed(2)}/month`);
        console.log(`\nCalculation: ${waterCharge.calculation}`);
        console.log('\n' + '─'.repeat(70));
        console.log('Note: Actual charges vary by season');
        console.log('  - Winter (Dec-Mar, 4 months): Lower consumption');
        console.log('  - Spring/Fall (Apr-May, Oct-Nov, 4 months): Medium consumption');
        console.log('  - Summer (Jun-Sep, 4 months): Higher consumption');
        console.log('═'.repeat(70));
    }
}

testSeasonalBreakdown().catch(console.error);
