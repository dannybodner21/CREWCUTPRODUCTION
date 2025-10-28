import { config } from 'dotenv';
config({ path: '.env.local' });

import { FeeCalculator } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

async function testSanDiegoMonthlyFees() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING SAN DIEGO MONTHLY FEES - 50-UNIT MULTI-FAMILY');
    console.log('='.repeat(80));

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: sd } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'San Diego')
        .eq('state_code', 'CA')
        .single();

    console.log(`\n✅ San Diego Jurisdiction ID: ${sd?.id}`);

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const result = await calculator.calculateFees({
        jurisdictionName: 'San Diego',
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
    console.log('🔍 CHECKING FOR MONTHLY FEES');
    console.log('='.repeat(80));

    const monthlyInName = result.fees.filter(f => f.feeName.toLowerCase().includes('monthly'));
    console.log(`\nFees with "Monthly" in name: ${monthlyInName.length}`);
    monthlyInName.forEach(f => {
        console.log(`   - ${f.feeName}`);
        console.log(`     Amount: $${f.calculatedAmount.toLocaleString()}`);
        console.log(`     isRecurring: ${f.isRecurring}`);
    });

    console.log('\n' + '='.repeat(80));
}

testSanDiegoMonthlyFees().catch(console.error);
