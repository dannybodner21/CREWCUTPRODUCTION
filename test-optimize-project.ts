/**
 * Test script for optimizeProject tool
 *
 * Tests the new development advisor capability of LEWIS
 * Run with: npx tsx test-optimize-project.ts
 */

async function testOptimizeProject() {
    console.log('🧪 Testing optimizeProject tool...\n');

    const testCases = [
        {
            name: 'Austin Multi-Family - 3 acres',
            params: {
                jurisdiction: 'Austin',
                lotSize: 3,
                projectType: 'Multi-Family'
            }
        },
        {
            name: 'Phoenix Multi-Family - 5 acres with budget',
            params: {
                jurisdiction: 'Phoenix',
                lotSize: 5,
                projectType: 'Multi-Family',
                budget: 15000000
            }
        },
        {
            name: 'Denver Single-Family - 10 acres',
            params: {
                jurisdiction: 'Denver',
                lotSize: 10,
                projectType: 'Single-Family'
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📋 Test: ${testCase.name}`);
        console.log(`${'='.repeat(80)}\n`);

        try {
            const response = await fetch('http://localhost:3010/api/lewis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'optimizeProject',
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
                console.log(result.data);
            } else {
                console.error('❌ Failed:', result.error);
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
testOptimizeProject().catch(console.error);
