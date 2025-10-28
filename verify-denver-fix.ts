import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function verifyDenverFix() {
    console.log('='.repeat(80));
    console.log('✅ VERIFYING DENVER FIX');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get Denver service area ID
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
        .eq('name', 'Inside Denver')
        .single();

    console.log('\n📍 Service Area: "Inside Denver"');
    console.log(`   ID: ${serviceAreas?.id}`);

    // Count fees in this area
    const { count: feeCount } = await supabase
        .from('fees')
        .select('*', { count: 'exact', head: true })
        .eq('service_area_id', serviceAreas!.id);

    console.log(`   Total Fees: ${feeCount}`);

    // Test calculation
    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('\n\n📊 TESTING: Denver Multi-Family with "Inside Denver" service area');
    console.log('-'.repeat(80));

    try {
        const result = await calculator.calculateFees({
            jurisdictionName: 'Denver',
            stateCode: 'CO',
            selectedServiceAreaIds: [serviceAreas!.id],
            projectType: 'Multi-Family Residential',
            useSubtype: 'Multifamily',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: undefined,
            meterSize: undefined
        });

        console.log(`\n✅ Denver Result:`);
        console.log(`   Selected Service Area: "Inside Denver"`);
        console.log(`   Applicable Fees: ${result.fees.length}`);
        console.log(`   One-Time Total: $${result.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Total: $${result.monthlyFees.toLocaleString()}`);

        console.log(`\n   Fee List:`);
        result.fees.forEach((fee, i) => {
            const type = fee.isRecurring ? '[MONTHLY]' : '[ONE-TIME]';
            console.log(`   ${i + 1}. ${type} ${fee.feeName} - $${fee.calculatedAmount.toLocaleString()}`);
        });

        // Verify we have BOTH development and monthly fees
        const hasMonthlyFees = result.fees.some(f => f.isRecurring);
        const hasOneTimeFees = result.fees.some(f => !f.isRecurring);

        console.log('\n\n📋 Verification:');
        console.log(`   Has Monthly Utility Fees: ${hasMonthlyFees ? '✅ YES' : '❌ NO'}`);
        console.log(`   Has One-Time Development Fees: ${hasOneTimeFees ? '✅ YES' : '❌ NO'}`);

        if (hasMonthlyFees && hasOneTimeFees) {
            console.log('\n✅ SUCCESS: Users can now get BOTH development and monthly fees!');
        } else {
            console.log('\n❌ PROBLEM: Still missing some fee types');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ Verification Complete');
    console.log('='.repeat(80));
}

verifyDenverFix().catch(console.error);
