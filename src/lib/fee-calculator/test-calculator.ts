/**
 * Comprehensive Test - Full Feasibility Report
 */

import { FeeCalculator, ProjectInputs } from './index';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

async function runComprehensiveTest() {
    console.log('🚀 Lewis Fee Calculator - Comprehensive Test\n');
    console.log('═'.repeat(70) + '\n');

    const calculator = new FeeCalculator(SUPABASE_URL, SUPABASE_KEY);

    // Test: Residential Single Family Development
    console.log('📊 TEST: Residential Single Family Development\n');

    const project: ProjectInputs = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        serviceArea: 'Northwest Deer Valley',
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 10,
        squareFeet: 25000,
        projectValue: 5000000,
        meterSize: '3/4"'
    };

    try {
        const breakdown = await calculator.calculateFees(project);

        // Print the full feasibility report
        console.log(calculator.formatFeasibilityReport(breakdown));

        // Print summary stats
        console.log('\n📈 DETAILED ANALYSIS:\n');
        console.log(`Total Fees Calculated: ${breakdown.fees.length}`);
        console.log(`  - One-Time Fees: ${breakdown.fees.filter(f => !f.isRecurring).length}`);
        console.log(`  - Monthly Fees: ${breakdown.fees.filter(f => f.isRecurring).length}`);

        console.log('\n💰 Cost Per Unit Breakdown:');
        console.log(`  - Development Cost per Unit: $${(breakdown.oneTimeFees / project.numUnits!).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        console.log(`  - Monthly Operating Cost per Unit: $${(breakdown.monthlyFees / project.numUnits!).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        console.log(`  - First Year Total per Unit: $${(breakdown.firstYearTotal / project.numUnits!).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

        console.log('\n📋 Fees by Agency:');
        Object.entries(breakdown.byAgency)
            .sort(([, a], [, b]) => b - a)
            .forEach(([agency, amount]) => {
                console.log(`  ${agency}: $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
            });

        console.log('\n✅ Test Complete!\n');
        console.log('═'.repeat(70));

        // Validation checks
        console.log('\n🔍 VALIDATION CHECKS:\n');

        const hasImpactFees = breakdown.fees.some(f => f.category?.toLowerCase().includes('impact'));
        const hasWaterSewer = breakdown.fees.some(f => f.agencyName.toLowerCase().includes('water'));
        const hasMonthlyFees = breakdown.fees.some(f => f.isRecurring);

        console.log(`✓ Impact Fees: ${hasImpactFees ? '✅ Found' : '❌ Missing'}`);
        console.log(`✓ Water/Sewer Fees: ${hasWaterSewer ? '✅ Found' : '❌ Missing'}`);
        console.log(`✓ Monthly Operating Fees: ${hasMonthlyFees ? '✅ Found' : '❌ Missing'}`);
        console.log(`✓ One-Time Total > $0: ${breakdown.oneTimeFees > 0 ? '✅ Yes' : '❌ No'}`);

        const allPassed = hasImpactFees && hasWaterSewer && hasMonthlyFees && breakdown.oneTimeFees > 0;

        if (allPassed) {
            console.log('\n🎉 ALL VALIDATION CHECKS PASSED!');
            console.log('Phoenix is production-ready for feasibility reports.');
        } else {
            console.log('\n⚠️  Some validation checks failed. Review the output above.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

runComprehensiveTest().catch(console.error);
