async function testAPIDetailed() {
    const baseUrl = 'http://localhost:3010';

    console.log('🧪 Testing /api/lewis calculateFees - DETAILED\n');

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
            console.log('Total Monthly:', result.data.monthlyFees.toLocaleString());
            console.log('Fee Count:', result.data.fees.length);

            console.log('\n📋 ALL FEES RETURNED:\n');
            result.data.fees
                .sort((a: any, b: any) => b.calculatedAmount - a.calculatedAmount)
                .forEach((f: any, i: number) => {
                    const type = f.isRecurring ? '[MONTHLY]' : '[ONE-TIME]';
                    console.log(`${i + 1}. ${type} ${f.feeName}: $${Math.round(f.calculatedAmount).toLocaleString()}`);
                    if (f.calculation) {
                        console.log(`   → ${f.calculation}`);
                    }
                });

            console.log('\n🔍 CHECKING FOR MISSING FEES:');
            const hasSewer = result.data.fees.some((f: any) => f.feeName.toLowerCase().includes('sewer'));
            const hasSDC = result.data.fees.some((f: any) => f.feeName.toLowerCase().includes('system development'));
            const hasSDCMultifamily = result.data.fees.some((f: any) =>
                f.feeName.toLowerCase().includes('system development') &&
                f.feeName.toLowerCase().includes('multifamily')
            );

            console.log(hasSewer ? '✅ Sewer fee present' : '❌ Sewer fee MISSING');
            console.log(hasSDC ? '✅ SDC present' : '❌ SDC MISSING');
            console.log(hasSDCMultifamily ? '✅ SDC Multifamily present' : '❌ SDC Multifamily MISSING');

            if (!hasSDCMultifamily) {
                console.log('\n🚨 PROBLEM: System Development Charge - Multifamily is missing!');
                console.log('This fee should be $502,000 (10,040 × 50 units)');
                console.log('Without it, total is ~$316k instead of ~$818k');
            }
        } else {
            console.error('❌ API Error:', result.error);
        }
    } catch (error) {
        console.error('💥 Request failed:', error);
    }
}

testAPIDetailed();
