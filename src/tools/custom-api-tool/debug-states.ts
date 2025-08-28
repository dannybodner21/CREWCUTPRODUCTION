import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function debugStates() {
  console.log('🔍 Debugging getUniqueStates function...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log(`   LEWIS_SUPABASE_URL: ${process.env.LEWIS_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   LEWIS_SUPABASE_ANON_KEY: ${process.env.LEWIS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);

  if (!process.env.LEWIS_SUPABASE_URL || !process.env.LEWIS_SUPABASE_ANON_KEY) {
    console.log('\n❌ Missing required Lewis environment variables');
    return;
  }

  try {
    // Test direct Supabase query first
    console.log('\n🔧 Testing direct Supabase query...');
    const supabase = createClient(
      process.env.LEWIS_SUPABASE_URL!,
      process.env.LEWIS_SUPABASE_ANON_KEY!
    );

    // Get total count
    const { count, error: countError } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count error:', countError);
    } else {
      console.log(`📊 Total cities in database: ${count}`);
    }

    // Get all states with limit
    const { data: allStates, error: statesError } = await supabase
      .from('cities')
      .select('state')
      .order('state');

    if (statesError) {
      console.log('❌ States query error:', statesError);
    } else {
      console.log(`📊 Raw states data length: ${allStates?.length || 0}`);
      
      // Get unique states
      const uniqueStates = [...new Set(allStates?.map(city => city.state).filter(Boolean))];
      console.log(`📍 Unique states found: ${uniqueStates.length}`);
      console.log(`📍 States: ${uniqueStates.join(', ')}`);
    }

    // Test the Lewis data service
    console.log('\n📊 Testing Lewis data service getUniqueStates...');
    const { lewisDataService } = await import('./lewis-data-service');
    const result = await lewisDataService.getUniqueStates();
    
    console.log('Lewis service result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

debugStates();
