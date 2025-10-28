// Test the "per 1,000 sq ft" calculation
const testCases = [
    { unitLabel: 'per 1,000 square feet', rate: 532, sqft: 2500, expected: 1330 },
    { unitLabel: 'per 1000 square feet', rate: 532, sqft: 2500, expected: 1330 },
    { unitLabel: 'per square foot', rate: 532, sqft: 2500, expected: 1330000 },
];

testCases.forEach(test => {
    const unitLabelLower = test.unitLabel.toLowerCase();
    const divisor = (unitLabelLower.includes('1,000') || unitLabelLower.includes('1000')) ? 1000 : 1;
    const sqftUnits = test.sqft / divisor;
    const amount = test.rate * sqftUnits;

    console.log(`Unit Label: "${test.unitLabel}"`);
    console.log(`  Divisor: ${divisor}`);
    console.log(`  Calculation: $${test.rate} × (${test.sqft} / ${divisor}) = $${amount}`);
    console.log(`  Expected: $${test.expected}`);
    console.log(`  Result: ${amount === test.expected ? '✅ PASS' : '❌ FAIL'}`);
    console.log();
});
