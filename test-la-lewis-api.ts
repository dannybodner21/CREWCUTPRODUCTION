async function testLAAPI() {
    const baseUrl = 'http://localhost:3010';

    console.log('🧪 Testing LA with serviceArea: "Inside"\n');

    const testPayload = {
        action: 'calculateFees',
        params: {
            jurisdictionName: 'Los Angeles',
            projectType: 'Multi-Family Residential',
            numUnits: 50,
            squareFeet: 45000,
            projectValue: 8000000,
            serviceArea: 'Inside',
            meterSize: '3/4"'
        }
    };

    try {
        const response = await fetch(`${baseUrl}/api/lewis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ API Success!\n');
            console.log('Total One-Time:', result.data.oneTimeFees.toLocaleString());
            console.log('Fee Count:', result.data.fees.length);

            const affordableHousingFees = result.data.fees.filter((f: any) =>
                f.feeName.toLowerCase().includes('affordable') &&
                f.feeName.toLowerCase().includes('housing')
            );

            console.log('\n🏠 Affordable Housing Fees:', affordableHousingFees.length);
            if (affordableHousingFees.length > 0) {
                affordableHousingFees.forEach((f: any) => {
                    console.log(`  ✅ ${f.feeName}: $${Math.round(f.calculatedAmount).toLocaleString()}`);
                });
            } else {
                console.log('  ❌ NO AFFORDABLE HOUSING FEES!');
                console.log('  Problem: serviceArea "Inside" might not match any LA service areas');
            }

            console.log('\n📋 Top 5 Fees:');
            result.data.fees
                .filter((f: any) => f.calculatedAmount > 0 && !f.isRecurring)
                .sort((a: any, b: any) => b.calculatedAmount - a.calculatedAmount)
                .slice(0, 5)
                .forEach((f: any) => {
                    console.log(`  - ${f.feeName}: $${Math.round(f.calculatedAmount).toLocaleString()}`);
                });
        } else {
            console.error('❌ API Error:', result.error);
        }
    } catch (error) {
        console.error('💥 Request failed:', error);
    }
}

testLAAPI();
