/**
 * Test enhanced optimizeFees API endpoint
 *
 * This test verifies the 5 new strategies are working:
 * 1. Reduce unit count (for >50 units)
 * 2. Reduce square footage to 750 sq ft
 * 3. Alternative service area
 * 4. Phased development with actual calculations
 * 5. Value engineering advice
 */

async function testOptimizeFees() {
  console.log('🧪 Testing Enhanced optimizeFees API\n');

  // Test case: 100-unit multifamily project in Austin
  // This should trigger multiple strategies
  const testCase = {
    action: 'optimizeFees',
    params: {
      jurisdiction: 'Austin',
      projectType: 'Multi-Family',
      units: 100,
      squareFeet: 90000, // 900 sq ft/unit
      currentServiceArea: 'Inside'
    }
  };

  console.log('📝 Test Case:');
  console.log(`   Jurisdiction: ${testCase.params.jurisdiction}`);
  console.log(`   Project Type: ${testCase.params.projectType}`);
  console.log(`   Units: ${testCase.params.units}`);
  console.log(`   Square Feet: ${testCase.params.squareFeet.toLocaleString()}`);
  console.log(`   Avg sq ft/unit: ${testCase.params.squareFeet / testCase.params.units}\n`);

  try {
    const response = await fetch('http://localhost:3010/api/lewis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Operation failed:', result.error);
      return;
    }

    const data = result.data;

    console.log('✅ API Response:\n');
    console.log(`📊 Jurisdiction: ${data.jurisdiction}`);
    console.log(`📊 Project: ${data.projectSpecs.units} units, ${data.projectSpecs.squareFeet.toLocaleString()} sq ft`);
    console.log(`📊 Avg Unit Size: ${data.projectSpecs.avgSqFtPerUnit} sq ft/unit`);
    console.log(`📊 Baseline Fees: $${Math.round(data.baselineFees).toLocaleString()}\n`);

    console.log('💡 Strategies Found:', data.strategies.length);
    console.log('─'.repeat(80));

    data.strategies.forEach((strategy: any, index: number) => {
      console.log(`\n${index + 1}. ${strategy.strategy}`);

      if (typeof strategy.savings === 'number') {
        console.log(`   💰 Savings: $${strategy.savingsFormatted}`);
        console.log(`   💵 New Total: $${strategy.newTotalFormatted}`);
        const percent = ((strategy.savings / data.baselineFees) * 100).toFixed(1);
        console.log(`   📉 Reduction: ${percent}%`);
      } else {
        console.log(`   💰 Benefit: ${strategy.savingsFormatted}`);
      }

      console.log(`   ⚖️  Feasibility: ${strategy.feasibility}`);
      console.log(`   🔄 Trade-off: ${strategy.tradeoff}`);
    });

    console.log('\n' + '─'.repeat(80));

    if (data.totalPotentialSavings > 0) {
      console.log(`\n💵 TOTAL POTENTIAL SAVINGS: $${Math.round(data.totalPotentialSavings).toLocaleString()}`);
      const totalPercent = ((data.totalPotentialSavings / data.baselineFees) * 100).toFixed(1);
      console.log(`📉 Total Reduction: ${totalPercent}%\n`);
    }

    console.log('📋 Additional Recommendations:');
    data.recommendations.forEach((rec: string) => {
      console.log(`   - ${rec}`);
    });

    // Verify expected strategies
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Strategy Verification:\n');

    const strategyNames = data.strategies.map((s: any) => s.strategy);

    const checks = [
      { name: 'Reduce unit count', exists: strategyNames.some((s: string) => s.includes('Reduce from')), expected: true },
      { name: 'Reduce square footage', exists: strategyNames.some((s: string) => s.includes('Reduce unit size')), expected: true },
      { name: 'Alternative service area', exists: strategyNames.some((s: string) => s.includes('Outside City')), expected: false }, // May or may not exist
      { name: 'Phased development', exists: strategyNames.some((s: string) => s.includes('Two-phase')), expected: true },
      { name: 'Value engineering', exists: strategyNames.some((s: string) => s.includes('Value engineering')), expected: true }
    ];

    checks.forEach(check => {
      const status = check.exists ? '✅' : (check.expected ? '❌' : '⚠️');
      console.log(`${status} ${check.name}: ${check.exists ? 'Found' : 'Not found'} ${check.expected ? '' : '(optional)'}`);
    });

    console.log('\n✨ Test Complete!');

  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

testOptimizeFees();
