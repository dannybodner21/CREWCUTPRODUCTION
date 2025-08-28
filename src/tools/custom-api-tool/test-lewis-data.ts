import { config } from 'dotenv';
import { resolve } from 'path';
import { lewisDataService } from './lewis-data-service';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testLewisData() {
    console.log('🔍 Testing Lewis Data Service...\n');

    try {
        // Test 1: Get unique states
        console.log('1️⃣ Testing getUniqueStates...');
        const statesResult = await lewisDataService.getUniqueStates();
        if (statesResult.success) {
            console.log(`   ✅ Found ${statesResult.data?.length || 0} states:`, statesResult.data);
        } else {
            console.log(`   ❌ Error:`, statesResult.error);
        }

        // Test 2: Get cities
        console.log('\n2️⃣ Testing getCities...');
        const citiesResult = await lewisDataService.getCities();
        if (citiesResult.success) {
            console.log(`   ✅ Found ${citiesResult.data?.length || 0} cities`);
            if (citiesResult.data && citiesResult.data.length > 0) {
                console.log(`   📍 Sample city:`, citiesResult.data[0]);
            }
        } else {
            console.log(`   ❌ Error:`, citiesResult.error);
        }

        // Test 3: Get fee categories
        console.log('\n3️⃣ Testing getFeeCategories...');
        const categoriesResult = await lewisDataService.getFeeCategories();
        if (categoriesResult.success) {
            console.log(`   ✅ Found ${categoriesResult.data?.length || 0} fee categories`);
        } else {
            console.log(`   ❌ Error:`, categoriesResult.error);
        }

        // Test 4: Get fees for a specific city
        console.log('\n4️⃣ Testing getFeesByCity...');
        if (citiesResult.success && citiesResult.data && citiesResult.data.length > 0) {
            const firstCity = citiesResult.data[0];
            const feesResult = await lewisDataService.getFeesByCity(firstCity.id);
            if (feesResult.success) {
                console.log(`   ✅ Found ${feesResult.data?.length || 0} fees for ${firstCity.name}`);
            } else {
                console.log(`   ❌ Error:`, feesResult.error);
            }
        }

    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

testLewisData();
