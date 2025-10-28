/**
 * Test script for analyzeLocation tool
 *
 * Tests the location analysis capability using OpenStreetMap
 * Run with: npx tsx test-analyze-location.ts
 */

async function testAnalyzeLocation() {
    console.log('🧪 Testing analyzeLocation tool...\n');

    const testCases = [
        {
            name: 'Downtown Phoenix',
            params: {
                address: '123 E Washington St, Phoenix, AZ',
                jurisdiction: 'Phoenix',
                radius: 1
            }
        },
        {
            name: 'Downtown Austin',
            params: {
                address: '701 Congress Ave, Austin, TX',
                jurisdiction: 'Austin',
                radius: 1
            }
        },
        {
            name: 'Denver (2 mile radius)',
            params: {
                address: '1801 California St, Denver, CO',
                jurisdiction: 'Denver',
                radius: 2
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📋 Test: ${testCase.name}`);
        console.log(`📍 Address: ${testCase.params.address}`);
        console.log(`📏 Radius: ${testCase.params.radius} mile(s)`);
        console.log(`${'='.repeat(80)}\n`);

        try {
            const response = await fetch('http://localhost:3010/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'analyzeLocation',
                    params: testCase.params
                })
            });

            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                continue;
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Success!\n');
                const data = result.data;

                console.log(`📌 Coordinates: ${data.coordinates.lat}, ${data.coordinates.lng}`);
                console.log(`🎯 Walkability Score: ${data.walkabilityScore}/100`);
                console.log(`📊 Assessment: ${data.assessment}`);
                console.log(`\n${data.summary}\n`);

                // Show amenities
                if (Object.keys(data.amenities).length > 0) {
                    console.log('📍 Nearby Amenities:');
                    for (const [category, places] of Object.entries(data.amenities)) {
                        console.log(`\n  ${category}:`);
                        (places as any[]).forEach((place, idx) => {
                            console.log(`    ${idx + 1}. ${place.name} - ${place.distanceFormatted}`);
                        });
                    }
                } else {
                    console.log('⚠️  No amenities found in search radius');
                }

                // Show insights
                if (data.insights && data.insights.length > 0) {
                    console.log('\n💡 Insights:');
                    data.insights.forEach((insight: string) => {
                        console.log(`  - ${insight}`);
                    });
                }

            } else {
                console.error('❌ Failed:', result.error);
            }

            // Wait 2 seconds between tests to be nice to OpenStreetMap APIs
            if (testCases.indexOf(testCase) < testCases.length - 1) {
                console.log('\n⏳ Waiting 2 seconds before next test...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

        } catch (error) {
            console.error('💥 Error:', error instanceof Error ? error.message : error);
        }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ All tests completed!');
    console.log(`${'='.repeat(80)}\n`);
}

// Run tests
testAnalyzeLocation().catch(console.error);
