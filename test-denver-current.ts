import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testDenverCurrent() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: denver } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    const { data: serviceArea } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', denver!.id)
        .eq('name', 'Inside Denver')
        .single();

    console.log('Testing Denver with service area:', serviceArea?.name, serviceArea?.id);

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const result = await calculator.calculateFees({
        jurisdictionName: 'Denver',
        stateCode: 'CO',
        selectedServiceAreaIds: [serviceArea!.id],
        projectType: 'Multi-Family Residential',
        useSubtype: 'Multifamily',
        numUnits: 50,
        squareFeet: 45000,
        projectValue: undefined,
        meterSize: undefined
    });

    console.log('\n=== RESULT ===');
    console.log('Fees array length:', result.fees.length);
    console.log('One-time total:', result.oneTimeFees);
    console.log('Monthly total:', result.monthlyFees);
    console.log('\nFees with amounts:');
    result.fees.forEach(f => {
        console.log(`  ${f.feeName}: $${f.calculatedAmount} (isRecurring: ${f.isRecurring})`);
    });
}

testDenverCurrent().catch(console.error);
