import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testLewisSupabaseConnection() {
    console.log('🔧 Testing Lewis Supabase Connection...\n');

    // Check environment variables
    console.log('Environment Variables:');
    console.log(`   LEWIS_SUPABASE_URL: ${process.env.LEWIS_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   LEWIS_SUPABASE_ANON_KEY: ${process.env.LEWIS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   LEWIS_SUPABASE_SERVICE_ROLE_KEY: ${process.env.LEWIS_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   LEWIS_DATABASE_URL: ${process.env.LEWIS_DATABASE_URL ? '✅ Set' : '❌ Missing'}`);

    if (!process.env.LEWIS_SUPABASE_URL || !process.env.LEWIS_SUPABASE_ANON_KEY) {
        console.log('\n❌ Missing required Lewis environment variables');
        return;
    }

    try {
        // Test the Lewis data service
        const { lewisDataService } = await import('./lewis-data-service');

        console.log('\n🧪 Testing Lewis Data Service...');

        // Test getStatesCount
        console.log('Testing getStatesCount...');
        const statesResult = await lewisDataService.getUniqueStates();
        console.log('✅ getStatesCount result:', statesResult);

        if (statesResult.success && statesResult.data) {
            console.log(`🎯 Found ${statesResult.data.length} states:`, statesResult.data);
        } else {
            console.log('❌ getStatesCount failed:', statesResult.error);
        }

        // Test getCities
        console.log('\nTesting getCities...');
        const citiesResult = await lewisDataService.getCities();
        console.log('✅ getCities result:', citiesResult);

        if (citiesResult.success && citiesResult.data) {
            console.log(`🎯 Found ${citiesResult.data.length} cities`);
        } else {
            console.log('❌ getCities failed:', citiesResult.error);
        }

    } catch (error) {
        console.error('💥 Error testing Lewis data service:', error);
    }
}

testLewisSupabaseConnection();
