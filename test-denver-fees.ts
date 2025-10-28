import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testDenver() {
    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    // Get "Inside Denver" service area
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('id')
        .eq('jurisdiction_name', 'Denver')
        .eq('state_code', 'CO')
        .single();

    const { data: insideDenver } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdiction!.id)
        .eq('name', 'Inside Denver')
        .single();

    console.log(`📍 Selected service area: ${insideDenver?.name || 'None'} (${insideDenver?.id || 'N/A'})\n`);

    const inputs: ProjectInputs = {
        jurisdictionName: 'Denver',
        stateCode: 'CO',
        selectedServiceAreaIds: insideDenver ? [insideDenver.id] : [],
        projectType: 'Multi-Family Residential',
        useSubtype: null,
        numUnits: 50,
        squareFeet: 45000, // 900 sq ft/unit
        projectValue: 8000000, // Typical for 50-unit
        meterSize: '3/4"'
    };

    console.log('🧮 Testing Denver Calculator for 50-unit multifamily (45,000 sqft)\n');

    const breakdown = await calculator.calculateFees(inputs);

    console.log(`Total One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
    console.log(`Total Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}\n`);

    console.log('All fees calculated (sorted by amount):');
    breakdown.fees
        .filter(f => f.calculatedAmount > 0)
        .sort((a, b) => b.calculatedAmount - a.calculatedAmount)
        .forEach((fee, index) => {
            const type = fee.isRecurring ? 'MONTHLY' : 'ONE-TIME';
            console.log(`${index + 1}. [${type}] ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
            if (fee.calculation) {
                console.log(`   Calculation: ${fee.calculation}`);
            }
        });

    console.log('\n\n🔍 Checking for expected fees:\n');

    const checkFee = (name: string, expectedMin?: number) => {
        const fee = breakdown.fees.find(f => f.feeName?.toLowerCase().includes(name.toLowerCase()));
        if (fee && fee.calculatedAmount > 0) {
            const status = expectedMin && fee.calculatedAmount < expectedMin ? '⚠️' : '✅';
            console.log(`${status} ${name}: $${fee.calculatedAmount.toLocaleString()}`);
            if (expectedMin && fee.calculatedAmount < expectedMin) {
                console.log(`   Expected at least: $${expectedMin.toLocaleString()}`);
            }
        } else {
            console.log(`❌ ${name}: NOT FOUND or $0`);
        }
    };

    checkFee('Sewer', 300000); // $6,320/unit × 50 = $316,000
    checkFee('System Development Charge', 50000);
    checkFee('Affordable Housing', 50000);
    checkFee('Building Permit', 5000);
    checkFee('Park', 10000);

    console.log('\n\n📊 Summary:');
    console.log(`Per unit cost: $${Math.round(breakdown.oneTimeFees / inputs.numUnits).toLocaleString()}/unit`);
    console.log(`Total fees should include:`);
    console.log(`  - Sewer fees (major component)`);
    console.log(`  - System Development Charges`);
    console.log(`  - Affordable Housing fees`);
    console.log(`  - Building Permit`);
    console.log(`  - Other impact fees`);
}

testDenver().catch(console.error);
