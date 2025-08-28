import { config } from 'dotenv';
import { resolve } from 'path';
import { lewisDataService } from './lewis-data-service';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testPortalData() {
    console.log('🔍 Testing Portal Data Loading...\n');

    try {
        // Test 1: Load cities (what the Portal calls loadCities)
        console.log('1️⃣ Testing loadCities (Portal loadCities function)...');
        const citiesResult = await lewisDataService.getCities();
        if (citiesResult.success) {
            console.log(`   ✅ Loaded ${citiesResult.data?.length || 0} cities`);
            if (citiesResult.data && citiesResult.data.length > 0) {
                console.log(`   📍 First city: ${citiesResult.data[0].name}, ${citiesResult.data[0].state}`);
            }
        } else {
            console.log(`   ❌ Error:`, citiesResult.error);
        }

        // Test 2: Load fees for a specific city (what the Portal calls loadFeesForCity)
        console.log('\n2️⃣ Testing loadFeesForCity (Portal loadFeesForCity function)...');
        if (citiesResult.success && citiesResult.data && citiesResult.data.length > 0) {
            const firstCity = citiesResult.data[0];
            const feesResult = await lewisDataService.getFeesByCity(firstCity.id);
            if (feesResult.success) {
                console.log(`   ✅ Loaded ${feesResult.data?.length || 0} fees for ${firstCity.name}`);
                if (feesResult.data && feesResult.data.length > 0) {
                    console.log(`   💰 First fee: ${feesResult.data[0].fee_category}`);
                    console.log(`   📝 Description: ${feesResult.data[0].fee_description?.substring(0, 100)}...`);
                }
            } else {
                console.log(`   ❌ Error:`, feesResult.error);
            }
        }

        // Test 3: Get unique states (what the Portal calls getUniqueStates)
        console.log('\n3️⃣ Testing getUniqueStates (Portal getUniqueStates function)...');
        const statesResult = await lewisDataService.getUniqueStates();
        if (statesResult.success) {
            console.log(`   ✅ Found ${statesResult.data?.length || 0} states:`, statesResult.data);
        } else {
            console.log(`   ❌ Error:`, statesResult.error);
        }

        // Test 4: Get fee categories (what the Portal calls getUniqueCategories)
        console.log('\n4️⃣ Testing getFeeCategories (Portal getUniqueCategories function)...');
        const categoriesResult = await lewisDataService.getFeeCategories();
        if (categoriesResult.success) {
            console.log(`   ✅ Found ${categoriesResult.data?.length || 0} fee categories`);
            if (categoriesResult.data && categoriesResult.data.length > 0) {
                console.log(`   📋 First category: ${categoriesResult.data[0].category_display_name} (${categoriesResult.data[0].category_group})`);
            }
        } else {
            console.log(`   ❌ Error:`, categoriesResult.error);
        }

        console.log('\n🎯 Portal Data Loading Test Complete!');
        console.log('   If all tests passed, the Portal should work in the browser.');

    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

testPortalData();
