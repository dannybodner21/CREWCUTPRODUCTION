import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testLAMonthlyFees() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING LA MONTHLY FEES - 50-UNIT MULTI-FAMILY');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: la } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Los Angeles')
        .eq('state_code', 'CA')
        .single();

    console.log(`\n✅ Los Angeles Jurisdiction ID: ${la?.id}`);

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const result = await calculator.calculateFees({
        jurisdictionName: 'Los Angeles',
        stateCode: 'CA',
        selectedServiceAreaIds: [],
        projectType: 'Residential',
        useSubtype: 'Multifamily',
        numUnits: 50,
        squareFeet: 50000,
        projectValue: undefined,
        meterSize: undefined
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Fees: ${result.fees.length}`);
    console.log(`One-time Total: $${result.oneTimeFees.toLocaleString()}`);
    console.log(`Monthly Total: $${result.monthlyFees.toLocaleString()}`);

    const oneTimeFees = result.fees.filter(f => !f.isRecurring);
    const monthlyFees = result.fees.filter(f => f.isRecurring);

    console.log(`\n✅ One-time Fees: ${oneTimeFees.length}`);
    oneTimeFees.forEach(f => {
        console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`);
    });

    console.log(`\n✅ Monthly Fees: ${monthlyFees.length}`);
    monthlyFees.forEach(f => {
        console.log(`   - ${f.feeName}: $${f.calculatedAmount.toLocaleString()}`);
    });

    // Check for specific fees
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING SPECIFIC MONTHLY FEES');
    console.log('='.repeat(80));

    const waterBaseFee = result.fees.find(f => f.feeName.includes('Monthly Water Base'));
    console.log(`\n"Monthly Water Base Charge": ${waterBaseFee ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (waterBaseFee) {
        console.log(`   Amount: $${waterBaseFee.calculatedAmount.toLocaleString()}`);
        console.log(`   isRecurring: ${waterBaseFee.isRecurring}`);
        console.log(`   Category: ${waterBaseFee.category}`);
    }

    const sewerServiceFee = result.fees.find(f => f.feeName.includes('Sewer Service Charge'));
    console.log(`\n"Sewer Service Charge - Residential Households": ${sewerServiceFee ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (sewerServiceFee) {
        console.log(`   Amount: $${sewerServiceFee.calculatedAmount.toLocaleString()}`);
        console.log(`   isRecurring: ${sewerServiceFee.isRecurring}`);
        console.log(`   Category: ${sewerServiceFee.category}`);
    }

    console.log('\n' + '='.repeat(80));
}

testLAMonthlyFees().catch(console.error);
