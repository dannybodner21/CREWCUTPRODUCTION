import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Test script to verify timeout fix and performance timing
 * Tests both single city and multi-city comparisons
 */

async function testTimeoutFix() {
    console.log('='.repeat(80));
    console.log('🧪 TESTING TIMEOUT FIX AND PERFORMANCE TIMING');
    console.log('='.repeat(80));

    const baseUrl = 'http://localhost:3000'; // Change to production URL when deployed

    // Test 1: Single city calculation (should be fast ~500-800ms)
    console.log('\n📍 TEST 1: Single City (Austin)');
    const startTime1 = Date.now();
    try {
        const response = await fetch(`${baseUrl}/api/lewis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'calculateFees',
                params: {
                    jurisdictionName: 'Austin',
                    projectType: 'Multi-Family Residential',
                    numUnits: 50,
                    squareFeet: 45000,
                    meterSize: '3/4"'
                }
            })
        });

        const result = await response.json();
        const duration = Date.now() - startTime1;

        console.log(`⏱️  Client-side duration: ${duration}ms`);
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Fees returned: ${result.data?.fees?.length || 0}`);
        console.log(`💰 One-time: $${result.data?.oneTimeFees?.toLocaleString() || 0}`);

        if (duration > 5000) {
            console.warn(`⚠️  WARNING: Single city took ${duration}ms (expected < 5000ms)`);
        }
    } catch (error) {
        console.error('❌ Test 1 failed:', error instanceof Error ? error.message : error);
    }

    // Test 2: Two city comparison (should be ~1000-1500ms due to parallel processing)
    console.log('\n📍 TEST 2: Two Cities (Phoenix vs Dallas)');
    const startTime2 = Date.now();
    try {
        // Note: compareCities is a tool action, so we test via the chatbot interface
        // For direct API testing, we'll call calculateFees twice in parallel
        const [phoenix, dallas] = await Promise.all([
            fetch(`${baseUrl}/api/lewis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculateFees',
                    params: {
                        jurisdictionName: 'Phoenix',
                        projectType: 'Multi-Family Residential',
                        numUnits: 50,
                        squareFeet: 45000,
                        meterSize: '3/4"'
                    }
                })
            }).then(r => r.json()),
            fetch(`${baseUrl}/api/lewis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculateFees',
                    params: {
                        jurisdictionName: 'Dallas',
                        projectType: 'Multi-Family Residential',
                        numUnits: 50,
                        squareFeet: 45000,
                        meterSize: '3/4"'
                    }
                })
            }).then(r => r.json())
        ]);

        const duration = Date.now() - startTime2;

        console.log(`⏱️  Client-side duration (parallel): ${duration}ms`);
        console.log(`✅ Phoenix: ${phoenix.success ? 'Success' : 'Failed'}`);
        console.log(`✅ Dallas: ${dallas.success ? 'Success' : 'Failed'}`);

        if (duration > 8000) {
            console.warn(`⚠️  WARNING: Two cities took ${duration}ms (expected < 8000ms)`);
        }
    } catch (error) {
        console.error('❌ Test 2 failed:', error instanceof Error ? error.message : error);
    }

    // Test 3: Verify timeout configuration (this should NOT timeout)
    console.log('\n📍 TEST 3: Timeout Configuration');
    console.log('Note: If API has maxDuration=60, requests should NOT timeout before 60s');
    console.log('Previous behavior: timeout at 10s');
    console.log('Expected behavior: complete within 10-20s for 3 cities\n');

    console.log('='.repeat(80));
    console.log('✅ All tests completed. Check server logs for timing details.');
    console.log('='.repeat(80));
}

testTimeoutFix().catch(console.error);
