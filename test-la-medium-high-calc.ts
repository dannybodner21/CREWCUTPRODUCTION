/**
 * Test Los Angeles with Medium-High Market Area
 */

import { config } from 'dotenv';
import { FeeCalculator, ProjectInputs } from './src/lib/fee-calculator/index';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testLA() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get Medium-High Market Area ID
    const j = await supabase.from('jurisdictions').select('id').eq('jurisdiction_name', 'Los Angeles').single();
    const jurisdictionId = j.data!.id;

    const { data: serviceAreas } = await supabase
        .from('service_areas')
        .select('id, name')
        .eq('jurisdiction_id', jurisdictionId)
        .ilike('name', '%Medium-High%');

    const mediumHighId = serviceAreas?.[0]?.id;
    console.log(`📍 Medium-High Market Area ID: ${mediumHighId}\n`);

    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    console.log('🧮 Testing Los Angeles with Medium-High Market Area...\n');
    console.log('Project: 10 units, 25,000 sq ft single-family\n');

    const projectInputs: ProjectInputs = {
        jurisdictionName: 'Los Angeles',
        stateCode: 'CA',
        selectedServiceAreaIds: [mediumHighId!],
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 25000,
        projectValue: 2500000,
        meterSize: '3/4"'
    };

    try {
        const breakdown = await calculator.calculateFees(projectInputs);

        console.log('\n✅ Fee Calculation Results:');
        console.log(`   One-Time Fees: $${breakdown.oneTimeFees.toLocaleString()}`);
        console.log(`   Monthly Fees: $${breakdown.monthlyFees.toLocaleString()}`);
        console.log(`   First Year Total: $${breakdown.firstYearTotal.toLocaleString()}`);
        console.log(`   Total Fees Found: ${breakdown.fees.length}`);
        console.log(`   Fees with amounts > 0: ${breakdown.fees.filter(f => f.calculatedAmount > 0).length}`);

        console.log('\n📋 All fees with amounts:');
        breakdown.fees
            .filter(f => f.calculatedAmount > 0)
            .forEach(fee => {
                console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
                console.log(`     ${fee.calcType} @ $${fee.rate}`);
            });

        // Check specifically for Affordable Housing Linkage Fee
        const linkageFees = breakdown.fees.filter(f => f.feeName.includes('Affordable Housing Linkage'));
        console.log(`\n🏠 Affordable Housing Linkage Fees found: ${linkageFees.length}`);
        linkageFees.forEach(fee => {
            console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        });

        // Check for Quimby fees
        const quimbyFees = breakdown.fees.filter(f => f.feeName.includes('Quimby'));
        console.log(`\n🌳 Quimby Fees found: ${quimbyFees.length}`);
        quimbyFees.forEach(fee => {
            console.log(`   - ${fee.feeName}: $${fee.calculatedAmount.toLocaleString()}`);
        });
    } catch (error) {
        console.error('❌ Error calculating fees:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
        }
    }
}

testLA().catch(console.error);
