import { config } from 'dotenv';
config({ path: '.env.local' });

async function testLewisAPI() {
    console.log('🧪 Testing LEWIS API for Denver with serviceArea parameter\n');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/lewis`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'calculateFees',
            params: {
                jurisdictionName: 'Denver',
                projectType: 'Multi-Family Residential',
                numUnits: 50,
                squareFeet: 45000,
                projectValue: null,
                serviceArea: 'Inside', // Should match "Inside Denver"
                meterSize: '3/4"'
            }
        })
    });

    const result = await response.json();

    if (result.success) {
        console.log('✅ API Success!');
        console.log('One-Time Fees:', result.data.oneTimeFees.toLocaleString());
        console.log('Monthly Fees:', result.data.monthlyFees.toLocaleString());
        console.log('\nTop 5 Fees:');
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
}

testLewisAPI().catch(console.error);
