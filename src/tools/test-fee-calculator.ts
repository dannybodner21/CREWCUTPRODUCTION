import { lewisDataService } from './custom-api-tool/lewis-data-service';

async function testFeeCalculator() {
    console.log('🧪 Testing Fee Calculator API...');

    try {
        // Test with sample data
        const result = await lewisDataService.calculateProjectFeesWithSQL({
            city: 'Los Angeles',
            use: 'residential',
            useSubtype: 'multifamily',
            dwellings: 10,
            resSqft: 1000,
            trips: 0,
            valuation: 500000
        });

        if (result.success) {
            console.log('✅ Fee calculation successful!');
            console.log('📊 Result:', JSON.stringify(result.data, null, 2));
        } else {
            console.error('❌ Fee calculation failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testFeeCalculator().catch(console.error);
