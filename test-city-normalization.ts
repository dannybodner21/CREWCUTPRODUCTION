// Test city name normalization function

function normalizeJurisdictionName(cityName: string): string {
    if (!cityName) return '';

    const normalized = cityName
        .replace(/,\s*[A-Z]{2}\s*$/i, '') // Remove ", TX" or ",CA" etc.
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        .trim();

    console.log(`🔧 City normalization: "${cityName}" -> "${normalized}"`);
    return normalized;
}

console.log('Testing city name normalization:\n');

const testCases = [
    'Austin, TX',
    'Los Angeles, CA',
    'Denver, CO',
    'Phoenix, AZ',
    'Portland, OR',
    'Seattle,WA',           // No space after comma
    'Salt Lake City, UT',
    'Las Vegas,  NV',       // Extra spaces
    'Austin',               // Already normalized
    'Los Angeles',          // Already normalized
    '  Portland  ',         // Extra whitespace
    'San Francisco, CA',
    'Denver,co',            // Lowercase state code
];

console.log('Input -> Output:\n');
testCases.forEach(city => {
    const normalized = normalizeJurisdictionName(city);
    const passed = normalized && !normalized.includes(',');
    console.log(`${passed ? '✅' : '❌'} "${city}" -> "${normalized}"`);
});

console.log('\n\nExpected database matches:');
const expectedMatches = [
    { input: 'Austin, TX', expected: 'Austin' },
    { input: 'Los Angeles, CA', expected: 'Los Angeles' },
    { input: 'Denver, CO', expected: 'Denver' },
    { input: 'Portland, OR', expected: 'Portland' },
];

expectedMatches.forEach(({ input, expected }) => {
    const result = normalizeJurisdictionName(input);
    const match = result === expected;
    console.log(`${match ? '✅' : '❌'} "${input}" -> "${result}" (expected: "${expected}")`);
});
