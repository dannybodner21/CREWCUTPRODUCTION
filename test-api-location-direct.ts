/**
 * Direct API test for analyzeLocation
 * This bypasses the tool system to test the API route directly
 */

async function testDirect() {
    console.log('🧪 Testing /api/lewis directly with analyzeLocation action\n');

    try {
        console.log('📤 Sending request...');
        const response = await fetch('http://localhost:3010/api/lewis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'analyzeLocation',
                params: {
                    address: '123 E Washington St, Phoenix, AZ',
                    jurisdiction: 'Phoenix',
                    radius: 1
                }
            })
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', response.headers.get('content-type'));

        const text = await response.text();
        console.log('\n📄 Raw response (first 1000 chars):');
        console.log(text.substring(0, 1000));
        console.log('\n');

        // Try to parse as JSON
        try {
            const json = JSON.parse(text);
            console.log('✅ Valid JSON response:');
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('❌ Not valid JSON');
            console.error('Error:', e instanceof Error ? e.message : e);
        }

    } catch (error) {
        console.error('💥 Fetch error:', error);
    }
}

testDirect();
