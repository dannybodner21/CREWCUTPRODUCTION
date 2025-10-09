/**
 * Test Inside City + Northwest Deer Valley service areas
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testInsideCity() {
    console.log('🧪 Testing Inside City + Northwest Deer Valley\n');
    console.log('═'.repeat(70) + '\n');

    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get service area IDs
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

    console.log('📍 Service Areas:');
    serviceAreas?.forEach(sa => console.log(`  - ${sa.name} (ID: ${sa.id})`));
    console.log('\n' + '─'.repeat(70) + '\n');

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

    console.log('PROJECT INPUTS:');
    console.log('  Units:', projectInputs.numUnits);
    console.log('  Sq Ft:', projectInputs.squareFeet);
    console.log('  Value:', projectInputs.projectValue);
    console.log('  Meter:', projectInputs.meterSize);
    console.log('  Type:', projectInputs.projectType, '-', projectInputs.useSubtype);
    console.log('\n' + '─'.repeat(70) + '\n');

    const breakdown = await calculator.calculateFees(projectInputs);

    console.log('\n' + '═'.repeat(70));
    console.log('RESULTS:');
    console.log('═'.repeat(70) + '\n');

    const oneTimeFees = breakdown.fees.filter(f => !f.isRecurring);
    const monthlyFees = breakdown.fees.filter(f => f.isRecurring);

    console.log(`Total Fees: ${breakdown.fees.length}`);
    console.log(`  One-Time: ${oneTimeFees.length} fees = $${breakdown.oneTimeFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    console.log(`  Monthly: ${monthlyFees.length} fees = $${breakdown.monthlyFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}/month`);
    console.log(`  Annual Operating: $${breakdown.annualOperatingCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}/year`);
    console.log(`  First Year Total: $${breakdown.firstYearTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

    console.log('\n' + '─'.repeat(70));
    console.log('MONTHLY FEES BY SERVICE AREA:');
    console.log('─'.repeat(70) + '\n');

    const monthlyByArea = monthlyFees.reduce((acc, fee) => {
        const area = fee.serviceArea;
        if (!acc[area]) acc[area] = [];
        acc[area].push(fee);
        return acc;
    }, {} as Record<string, typeof monthlyFees>);

    Object.entries(monthlyByArea).forEach(([area, fees]) => {
        const total = fees.reduce((sum, f) => sum + f.calculatedAmount, 0);
        console.log(`${area}: ${fees.length} fees = $${total.toFixed(2)}/month`);
        fees.forEach(fee => {
            console.log(`  - ${fee.feeName}: $${fee.calculatedAmount.toFixed(2)}`);
        });
        console.log();
    });

    console.log('═'.repeat(70));
}

testInsideCity().catch(console.error);
