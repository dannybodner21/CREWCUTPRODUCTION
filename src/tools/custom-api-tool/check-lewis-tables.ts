import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function checkLewisTables() {
  console.log('🔍 Checking current data in Lewis construction fee tables...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log(`   LEWIS_SUPABASE_URL: ${process.env.LEWIS_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   LEWIS_SUPABASE_ANON_KEY: ${process.env.LEWIS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);

  if (!process.env.LEWIS_SUPABASE_URL || !process.env.LEWIS_SUPABASE_ANON_KEY) {
    console.log('\n❌ Missing required Lewis environment variables');
    return;
  }

  try {
    // Import the Lewis data service
    const { lewisDataService } = await import('./lewis-data-service');
    
    console.log('\n📊 Cities Table:');
    const citiesResult = await lewisDataService.getCities();
    if (citiesResult.success && citiesResult.data) {
      console.log(`✅ Found ${citiesResult.data.length} cities`);
      const states = [...new Set(citiesResult.data.map(city => city.state))];
      console.log(`📍 States represented: ${states.join(', ')}`);
    } else {
      console.log('❌ Error fetching cities:', citiesResult.error);
    }

    console.log('\n📊 Fee Categories Table:');
    const categoriesResult = await lewisDataService.getFeeCategories();
    if (categoriesResult.success && categoriesResult.data) {
      console.log(`✅ Found ${categoriesResult.data.length} fee categories`);
      const groups = [...new Set(categoriesResult.data.map(cat => cat.category_group))];
      console.log(`📍 Category groups: ${groups.join(', ')}`);
    } else {
      console.log('❌ Error fetching fee categories:', categoriesResult.error);
    }

    console.log('\n📊 Verified Fee Data Table:');
    const feesResult = await lewisDataService.getFeesByCity(1); // Get fees for first city
    if (feesResult.success && feesResult.data) {
      console.log(`✅ Found ${feesResult.data.length} fees for city ID 1`);
    } else {
      console.log('❌ Error fetching fees:', feesResult.error);
    }

    console.log('\n📊 States Summary:');
    const statesResult = await lewisDataService.getUniqueStates();
    if (statesResult.success && statesResult.data) {
      console.log(`✅ Total unique states: ${statesResult.data.length}`);
      console.log(`📍 States: ${statesResult.data.join(', ')}`);
    } else {
      console.log('❌ Error fetching states:', statesResult.error);
    }

  } catch (error) {
    console.error('💥 Error checking tables:', error);
  }

  console.log('\n✅ Table check completed!');
}

checkLewisTables();
