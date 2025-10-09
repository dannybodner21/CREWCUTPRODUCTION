import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  // Get Salt Lake City jurisdiction
  const jurisdictionResult = await supabase
    .from('jurisdictions')
    .select('id, jurisdiction_name')
    .eq('jurisdiction_name', 'Salt Lake City')
    .single();

  if (!jurisdictionResult.data) {
    console.log('❌ Salt Lake City not found');
    return;
  }

  console.log('✅ Found jurisdiction:', jurisdictionResult.data);

  // Check service areas
  const serviceAreasResult = await supabase
    .from('service_areas')
    .select('id, name')
    .eq('jurisdiction_id', jurisdictionResult.data.id);

  console.log(`\n📍 Service areas: ${serviceAreasResult.data?.length || 0}`);
  if (serviceAreasResult.data && serviceAreasResult.data.length > 0) {
    serviceAreasResult.data.forEach(sa => {
      console.log(`   - ${sa.name} (id: ${sa.id})`);
    });
  } else {
    console.log('   (none - all fees should be citywide)');
  }

  // Check fees and their service_area_id values
  const feesResult = await supabase
    .from('fees')
    .select('id, name, service_area_id')
    .eq('jurisdiction_id', jurisdictionResult.data.id)
    .limit(10);

  console.log(`\n💰 Sample fees (first 10 of ${feesResult.data?.length || 0}):`);
  feesResult.data?.forEach(fee => {
    console.log(`   - ${fee.name}`);
    console.log(`     service_area_id: ${fee.service_area_id === null ? 'NULL (citywide)' : fee.service_area_id}`);
  });

  // Count fees by service_area_id
  const allFeesResult = await supabase
    .from('fees')
    .select('service_area_id')
    .eq('jurisdiction_id', jurisdictionResult.data.id);

  const nullCount = allFeesResult.data?.filter(f => f.service_area_id === null).length || 0;
  const nonNullCount = allFeesResult.data?.filter(f => f.service_area_id !== null).length || 0;

  console.log(`\n📊 Fee distribution:`);
  console.log(`   - Citywide (service_area_id = NULL): ${nullCount} fees`);
  console.log(`   - With service_area_id: ${nonNullCount} fees`);
}

test();
