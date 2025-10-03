import { lewisDataService } from './custom-api-tool/lewis-data-service';

async function testWithSampleData() {
    console.log('🧪 Testing Fee Calculator with Sample Data...');

    // Test with a jurisdiction that might have fees with actual rates
    const testCases = [
        {
            city: 'Los Angeles city',
            use: 'residential',
            useSubtype: null, // Remove useSubtype to avoid enum issues
            dwellings: 10,
            resSqft: 1000,
            trips: 0,
            valuation: 500000
        },
        {
            city: 'Chicago city',
            use: 'commercial',
            useSubtype: null, // Remove useSubtype to avoid enum issues
            dwellings: 0,
            resSqft: 5000,
            trips: 0,
            valuation: 2000000
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n🔍 Testing: ${testCase.city} - ${testCase.use}`);

        try {
            const result = await lewisDataService.calculateProjectFeesWithSQL(testCase);

            if (result.success) {
                console.log('✅ Fee calculation successful!');
                console.log(`📊 Grand Total: $${result.data?.grand_total || 0}`);
                console.log(`📋 Line Items: ${result.data?.line_items?.length || 0}`);
                console.log(`🏢 Agencies: ${result.data?.by_agency?.length || 0}`);

                if (result.data?.line_items?.length > 0) {
                    console.log('📝 Sample line items:');
                    result.data.line_items.slice(0, 3).forEach((item: any) => {
                        console.log(`  - ${item.fee}: $${item.amount} (${item.method})`);
                    });
                }
            } else {
                console.error('❌ Fee calculation failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Unexpected error:', error);
        }
    }
}

testWithSampleData().catch(console.error);
