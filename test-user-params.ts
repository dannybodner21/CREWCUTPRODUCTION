import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testUserParams() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Phoenix
    const { data: phoenix } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    const { data: phoenixSA } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', phoenix!.id)
        .eq('name', 'Inside City')
        .single();

    // Denver
    const { data: denver } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    const { data: denverSA } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', denver!.id)
        .eq('name', 'Inside Denver')
        .single();

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // USER'S PARAMETERS: 10 units, 10,000 sq ft
    console.log('\n=== PHOENIX: 10 units, 10,000 sq ft ===');
    const phoenixResult = await calculator.calculateFees({
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        selectedServiceAreaIds: [phoenixSA!.id],
        projectType: 'Multi-Family Residential',
        useSubtype: 'Multifamily',
        numUnits: 10,
        squareFeet: 10000,
        projectValue: undefined,
        meterSize: '3/4"'
    });

    console.log('\nPhoenix Result:');
    console.log('Fees:', phoenixResult.fees.length);
    console.log('One-time:', phoenixResult.oneTimeFees);
    console.log('Monthly:', phoenixResult.monthlyFees);
    phoenixResult.fees.forEach(f => {
        console.log(`  ${f.feeName}: $${f.calculatedAmount}`);
    });

    console.log('\n=== DENVER: 10 units, 10,000 sq ft ===');
    const denverResult = await calculator.calculateFees({
        jurisdictionName: 'Denver',
        stateCode: 'CO',
        selectedServiceAreaIds: [denverSA!.id],
        projectType: 'Multi-Family Residential',
        useSubtype: 'Multifamily',
        numUnits: 10,
        squareFeet: 10000,
        projectValue: undefined,
        meterSize: '3/4"'
    });

    console.log('\nDenver Result:');
    console.log('Fees:', denverResult.fees.length);
    console.log('One-time:', denverResult.oneTimeFees);
    console.log('Monthly:', denverResult.monthlyFees);
    denverResult.fees.forEach(f => {
        console.log(`  ${f.feeName}: $${f.calculatedAmount}`);
    });
}

testUserParams().catch(console.error);
