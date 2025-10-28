/**
 * Test script for feasibility report improvements
 *
 * Verifies:
 * 1. Project Specifications section populates correctly
 * 2. Exclusions section only shows what's actually excluded
 * 3. Per-unit breakdown appears when applicable
 * 4. Multi-year projections included
 * 5. Usage assumptions documented
 */

import { FeeCalculator } from '../src/lib/fee-calculator/index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testFeasibilityReport() {
    console.log('═'.repeat(70));
    console.log('  FEASIBILITY REPORT TEST');
    console.log('═'.repeat(70));
    console.log();

    const calculator = new FeeCalculator(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test case: Austin 50-unit multifamily
    const project = {
        jurisdictionName: 'Austin',
        stateCode: 'TX',
        selectedServiceAreaIds: [],
        projectType: 'Multi-Family' as any,
        useSubtype: null,
        numUnits: 50,
        squareFeet: 45000,
        projectValue: 15000000, // $15M project
        meterSize: '2"'
    };

    console.log('🏗️  Test Project:', project);
    console.log();

    try {
        const breakdown = await calculator.calculateFees(project);
        const report = calculator.formatFeasibilityReport(breakdown);

        console.log(report);
        console.log();

        // Validation checks
        console.log('═'.repeat(70));
        console.log('  VALIDATION CHECKS');
        console.log('═'.repeat(70));
        console.log();

        const checks = {
            hasProjectSpecs: report.includes('PROJECT SPECIFICATIONS'),
            hasAllFields: report.includes('Project Type:') &&
                          report.includes('Number of Units:') &&
                          report.includes('Square Footage:') &&
                          report.includes('Project Value:') &&
                          report.includes('Meter Size:'),
            hasPerUnitBreakdown: report.includes('PER-UNIT BREAKDOWN'),
            hasTimeline: report.includes('Fee Timeline:'),
            hasUsageAssumptions: report.includes('Usage Assumptions:'),
            hasMultiYearProjections: report.includes('Multi-Year Projections'),
            hasYear2: report.includes('Year 2 Operating Costs'),
            hasYear3: report.includes('Year 3 Operating Costs'),
            hasYear5: report.includes('Year 5 Operating Costs'),
            hasInclusionsSection: report.includes('What This Report Includes:'),
            hasExclusionsSection: report.includes('What This Report Does NOT Include:'),
            noIncorrectExclusion: !report.includes('Does not include: building permit fees')
        };

        console.log('✓ Project Specifications section:', checks.hasProjectSpecs ? '✅' : '❌');
        console.log('✓ All project fields shown:', checks.hasAllFields ? '✅' : '❌');
        console.log('✓ Per-unit breakdown:', checks.hasPerUnitBreakdown ? '✅' : '❌');
        console.log('✓ Fee timeline included:', checks.hasTimeline ? '✅' : '❌');
        console.log('✓ Usage assumptions included:', checks.hasUsageAssumptions ? '✅' : '❌');
        console.log('✓ Multi-year projections:', checks.hasMultiYearProjections ? '✅' : '❌');
        console.log('✓ Year 2 projection:', checks.hasYear2 ? '✅' : '❌');
        console.log('✓ Year 3 projection:', checks.hasYear3 ? '✅' : '❌');
        console.log('✓ Year 5 projection:', checks.hasYear5 ? '✅' : '❌');
        console.log('✓ Inclusions section:', checks.hasInclusionsSection ? '✅' : '❌');
        console.log('✓ Exclusions section:', checks.hasExclusionsSection ? '✅' : '❌');
        console.log('✓ No incorrect exclusion statement:', checks.noIncorrectExclusion ? '✅' : '❌');

        console.log();

        const allPassed = Object.values(checks).every(v => v === true);

        if (allPassed) {
            console.log('🎉 ALL VALIDATION CHECKS PASSED!');
            console.log('Feasibility report is now production-ready for decision-making.');
        } else {
            console.log('⚠️  Some validation checks failed. Review output above.');
        }

        console.log();
        console.log('═'.repeat(70));

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

testFeasibilityReport().catch(console.error);
