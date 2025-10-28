// Test the compareCities validation logic
import { createCustomApiToolActions } from './src/tools/custom-api-tool/actions';

const actions = createCustomApiToolActions();

async function testCompareCities() {
    console.log('🧪 Testing compareCities parameter validation\n');

    // Test 1: Normal case with cities array
    console.log('Test 1: Normal case with cities array');
    try {
        const result1 = await actions.compareCities({
            cities: ['Austin', 'Los Angeles', 'Denver'],
            projectType: 'Multi-Family Residential',
            units: 50,
            sqft: 45000
        });
        console.log('Result:', result1?.substring(0, 100) + '...\n');
    } catch (error) {
        console.error('Error:', error, '\n');
    }

    // Test 2: Missing cities parameter (undefined)
    console.log('Test 2: Missing cities parameter');
    try {
        const result2 = await actions.compareCities({
            projectType: 'Multi-Family Residential',
            units: 50,
            sqft: 45000
        });
        console.log('Result:', result2, '\n');
    } catch (error) {
        console.error('Error:', error, '\n');
    }

    // Test 3: Empty cities array
    console.log('Test 3: Empty cities array');
    try {
        const result3 = await actions.compareCities({
            cities: [],
            projectType: 'Multi-Family Residential',
            units: 50,
            sqft: 45000
        });
        console.log('Result:', result3, '\n');
    } catch (error) {
        console.error('Error:', error, '\n');
    }

    // Test 4: Single city as string (should convert to array)
    console.log('Test 4: Single city as string');
    try {
        const result4 = await actions.compareCities({
            cities: 'Austin',
            projectType: 'Multi-Family Residential',
            units: 50,
            sqft: 45000
        });
        console.log('Result:', result4?.substring(0, 100) + '...\n');
    } catch (error) {
        console.error('Error:', error, '\n');
    }

    // Test 5: Null params
    console.log('Test 5: Null params');
    try {
        const result5 = await actions.compareCities(null);
        console.log('Result:', result5, '\n');
    } catch (error) {
        console.error('Error:', error, '\n');
    }
}

testCompareCities().catch(console.error);
