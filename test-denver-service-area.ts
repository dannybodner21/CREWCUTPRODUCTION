import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testDenverServiceArea() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING DENVER SERVICE AREA SELECTION');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get Denver service area IDs
    const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id)
        .order('name');

    console.log('\n📍 Available Denver Service Areas:');
    serviceAreas?.forEach(sa => {
        console.log(`   ${sa.name} (ID: ${sa.id})`);
    });

    // Find "Inside City of Denver" service area
    const insideCityDenver = serviceAreas?.find(sa => sa.name === 'Inside City of Denver');

    if (!insideCityDenver) {
        console.log('\n❌ "Inside City of Denver" service area not found!');
        return;
    }

    console.log(`\n✅ Found "Inside City of Denver" with ID: ${insideCityDenver.id}`);

    // Test calculation with this service area
    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('\n\n📊 TEST 1: Denver Multi-Family with "Inside City of Denver" service area');
    console.log('-'.repeat(80));

    try {
        const result = await calculator.calculateFees({
            jurisdictionName: 'Denver',
            stateCode: 'CO',
            selectedServiceAreaIds: [insideCityDenver.id], // Select "Inside City of Denver"
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Denver Result:`);
        console.log(`   Selected Service Area: "${insideCityDenver.name}"`);
        console.log(`   Applicable Fees: ${result.fees.length}`);
        console.log(`   One-Time Total: $${result.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Total: $${result.monthlyFees.toLocaleString()}`);

        if (result.fees.length > 0) {
            console.log(`\n   Fee List:`);
            result.fees.forEach((fee, i) => {
                console.log(`   ${i + 1}. ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
            });
        } else {
            console.log('\n❌ NO FEES RETURNED - THIS IS THE BUG!');
        }
    } catch (error) {
        console.error('❌ Denver test failed:', error);
    }

    // Also test with "Inside Denver" service area
    const insideDenver = serviceAreas?.find(sa => sa.name === 'Inside Denver');

    if (insideDenver) {
        console.log('\n\n📊 TEST 2: Denver Multi-Family with "Inside Denver" service area');
        console.log('-'.repeat(80));

        try {
            const result = await calculator.calculateFees({
                jurisdictionName: 'Denver',
                stateCode: 'CO',
                selectedServiceAreaIds: [insideDenver.id],
                projectType: 'Multi-Family Residential',
                useSubtype: 'Multifamily',
                numUnits: 50,
                squareFeet: 45000,
                projectValue: undefined,
                meterSize: undefined
            });

            console.log(`\n✅ Denver Result:`);
            console.log(`   Selected Service Area: "${insideDenver.name}"`);
            console.log(`   Applicable Fees: ${result.fees.length}`);
            console.log(`   One-Time Total: $${result.oneTimeFees.toLocaleString()}`);
            console.log(`   Monthly Total: $${result.monthlyFees.toLocaleString()}`);

            if (result.fees.length > 0) {
                console.log(`\n   Fee List:`);
                result.fees.forEach((fee, i) => {
                    console.log(`   ${i + 1}. ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
                });
            } else {
                console.log('\n❌ NO FEES RETURNED - THIS IS THE BUG!');
            }
        } catch (error) {
            console.error('❌ Denver test failed:', error);
        }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✨ Test Complete');
    console.log('='.repeat(80));
}

testDenverServiceArea().catch(console.error);
