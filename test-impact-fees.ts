/**
 * Test to show one-time fees breakdown
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testImpactFees() {
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
        .in('name', ['Inside City', 'Northwest Deer Valley'])
        .order('name');

    const insideCityId = serviceAreas?.find(sa => sa.name === 'Inside City')?.id;
    const northwestDeerValleyId = serviceAreas?.find(sa => sa.name === 'Northwest Deer Valley')?.id;

    const projectInputs: ProjectInputs = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        selectedServiceAreaIds: [insideCityId!, northwestDeerValleyId!],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 25000,
        projectValue: 5000000,
        meterSize: '3/4"'
    };

    const breakdown = await calculator.calculateFees(projectInputs);

    console.log('\n' + '═'.repeat(70));
    console.log('ONE-TIME DEVELOPMENT FEES');
    console.log('═'.repeat(70) + '\n');

    const oneTimeFees = breakdown.fees.filter(f => !f.isRecurring);
    oneTimeFees.forEach(fee => {
        console.log(`${fee.feeName} • ${fee.serviceArea}`);
        console.log(`  Category: ${fee.category}`);
        console.log(`  Amount: $${fee.calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        console.log();
    });

    console.log('─'.repeat(70));
    console.log(`TOTAL ONE-TIME FEES: $${breakdown.oneTimeFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    console.log(`Total fees: ${oneTimeFees.length}`);
    console.log('═'.repeat(70));
}

testImpactFees().catch(console.error);
