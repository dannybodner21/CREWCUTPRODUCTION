/**
 * Direct test to see square footage savings for Austin
 */

async function testSqFtSavings() {
  console.log('🧪 Testing Square Footage Savings - Austin\n');

  // Test baseline (90,000 sq ft)
  const baseline = {
    action: 'calculateFees',
    params: {
      jurisdictionName: 'Austin',
      projectType: 'Multi-Family',
      numUnits: 100,
      squareFeet: 90000
    }
  };

  console.log('📝 Baseline: 100 units × 900 sq ft/unit = 90,000 sq ft');

  const baselineResponse = await fetch('http://localhost:3010/api/lewis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(baseline),
  });

  const baselineResult = await baselineResponse.json();
  console.log('Debug baseline result:', JSON.stringify(baselineResult, null, 2).substring(0, 500));

  if (!baselineResult.success) {
    console.error('❌ Baseline calculation failed:', baselineResult.error);
    return;
  }

  const baselineFees = baselineResult.data.oneTimeFees;
  console.log(`💰 Baseline Fees: $${Math.round(baselineFees).toLocaleString()}\n`);

  // Test reduced (75,000 sq ft)
  const reduced = {
    action: 'calculateFees',
    params: {
      jurisdictionName: 'Austin',
      projectType: 'Multi-Family',
      numUnits: 100,
      squareFeet: 75000
    }
  };

  console.log('📝 Reduced: 100 units × 750 sq ft/unit = 75,000 sq ft');

  const reducedResponse = await fetch('http://localhost:3010/api/lewis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reduced),
  });

  const reducedResult = await reducedResponse.json();
  const reducedFees = reducedResult.data.oneTimeFees;
  console.log(`💰 Reduced Fees: $${Math.round(reducedFees).toLocaleString()}\n`);

  const savings = baselineFees - reducedFees;
  console.log('─'.repeat(60));
  console.log(`💵 SAVINGS: $${Math.round(savings).toLocaleString()}`);
  console.log(`📉 Reduction: ${((savings / baselineFees) * 100).toFixed(2)}%`);
  console.log('─'.repeat(60));

  if (savings > 1000) {
    console.log('\n✅ Savings > $1,000 - Strategy would be shown');
  } else if (savings > 0) {
    console.log(`\n⚠️  Savings of $${Math.round(savings).toLocaleString()} is below $1,000 threshold - Strategy would be hidden`);
  } else {
    console.log('\n❌ No savings or increased fees - Square footage does not affect fees');
  }

  // Show top fees
  console.log('\n📊 Top Fees (baseline):');
  if (baselineResult.data.breakdown) {
    const topFees = baselineResult.data.breakdown
      .sort((a: any, b: any) => b.cost - a.cost)
      .slice(0, 5);
    topFees.forEach((fee: any, i: number) => {
      console.log(`   ${i + 1}. ${fee.feeName}: $${Math.round(fee.cost).toLocaleString()}`);
    });
  }
}

testSqFtSavings();
