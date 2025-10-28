/**
 * Test script to directly call the LEWIS API calculateFees action
 * This bypasses LEWIS chatbot and tests the API directly
 */

async function testAPI() {
    const baseUrl = 'http://localhost:3010';

    console.log('🧪 Testing /api/lewis calculateFees endpoint directly\n');

    const testPayload = {
        action: 'calculateFees',
        params: {
            jurisdictionName: 'Denver',
            projectType: 'Multi-Family Residential',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: null,
            serviceArea: 'Inside',
            meterSize: '3/4"'
        }
    };

    console.log('📤 Sending request:', JSON.stringify(testPayload, null, 2));

    try {
        const response = await fetch(`${baseUrl}/api/lewis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        console.log('\n📥 Response status:', response.status);

        const result = await response.json();

        if (result.success) {
            console.log('\n✅ API Success!');
            console.log('One-Time Fees:', result.data.oneTimeFees.toLocaleString());
            console.log('Monthly Fees:', result.data.monthlyFees.toLocaleString());
            console.log('Fee Count:', result.data.fees.length);
            console.log('\nTop 5 Fees:');
            result.data.fees
                .filter((f: any) => f.calculatedAmount > 0 && !f.isRecurring)
                .sort((a: any, b: any) => b.calculatedAmount - a.calculatedAmount)
                .slice(0, 5)
                .forEach((f: any) => {
                    console.log(`  - ${f.feeName}: $${Math.round(f.calculatedAmount).toLocaleString()}`);
                });

            console.log('\n🎯 Expected: $818,015');
            console.log('🎯 Actual:', result.data.oneTimeFees.toLocaleString());

            if (Math.abs(result.data.oneTimeFees - 818015) < 100) {
                console.log('✅ MATCH! API returning correct value.');
            } else {
                console.log('❌ MISMATCH! API returning incorrect value.');
            }
        } else {
            console.error('\n❌ API Error:', result.error);
        }
    } catch (error) {
        console.error('\n💥 Request failed:', error);
        console.log('\n⚠️  Make sure dev server is running: npm run dev');
    }
}

testAPI();
