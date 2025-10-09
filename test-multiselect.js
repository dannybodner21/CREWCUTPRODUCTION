// Test multi-select service area logic
require('dotenv').config({ path: '.env.local' });
const { FeeCalculator } = require('./src/lib/fee-calculator/index.ts');

async function testMultiSelect() {
    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const baseInputs = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 100,
        squareFeet: 10000,
        projectValue: 100000,
        meterSize: '6"'
    };

    console.log('Test 1: Empty selection (citywide only)');
    const test1 = await calculator.calculateFees({
        ...baseInputs,
        selectedServiceAreaIds: []
    });
    console.log(`- Total fees: ${test1.fees.length}`);
    console.log(`- One-time: $${test1.oneTimeFees.toFixed(2)}`);
    console.log(`- Monthly: $${test1.monthlyFees.toFixed(2)}\n`);

    // Get available service areas first
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: jurisdictions } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Phoenix city')
        .eq('state_code', 'AZ')
        .single();

    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdictions.id)
        .order('name');

    console.log(`Available service areas: ${serviceAreas.length}`);
    serviceAreas.forEach(sa => console.log(`  - ${sa.name} (${sa.id})`));
    console.log();

    if (serviceAreas.length > 0) {
        console.log('Test 2: Single service area selected');
        const test2 = await calculator.calculateFees({
            ...baseInputs,
            selectedServiceAreaIds: [serviceAreas[0].id]
        });
        console.log(`- Selected: ${serviceAreas[0].name}`);
        console.log(`- Total fees: ${test2.fees.length}`);
        console.log(`- One-time: $${test2.oneTimeFees.toFixed(2)}`);
        console.log(`- Monthly: $${test2.monthlyFees.toFixed(2)}\n`);

        if (serviceAreas.length > 1) {
            console.log('Test 3: Multiple service areas selected');
            const test3 = await calculator.calculateFees({
                ...baseInputs,
                selectedServiceAreaIds: [serviceAreas[0].id, serviceAreas[1].id]
            });
            console.log(`- Selected: ${serviceAreas[0].name}, ${serviceAreas[1].name}`);
            console.log(`- Total fees: ${test3.fees.length}`);
            console.log(`- One-time: $${test3.oneTimeFees.toFixed(2)}`);
            console.log(`- Monthly: $${test3.monthlyFees.toFixed(2)}\n`);
        }
    }
}

testMultiSelect().catch(console.error);
