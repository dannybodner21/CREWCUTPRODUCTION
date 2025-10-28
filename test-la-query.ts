import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const { data: jurisdiction } = await supabase
    .from('jurisdictions')
    .select('id')
    .eq('jurisdiction_name', 'Los Angeles')
    .single();

  const { data: serviceAreas } = await supabase
    .from('service_areas')
    .select('id, name')
    .eq('jurisdiction_id', jurisdiction!.id);

  const highMarketArea = serviceAreas?.find(sa => sa.name === 'High Market Area');
  const allOtherZones = serviceAreas?.find(sa => sa.name === 'ALL OTHER ZONES');

  console.log('Selected service areas:');
  console.log(`  - High Market Area: ${highMarketArea?.id}`);
  console.log(`  - ALL OTHER ZONES: ${allOtherZones?.id}`);

  // Query fees the same way the calculator does
  const { data: fees } = await supabase
    .from('fees')
    .select('id, name, service_area_id, category, applies_to')
    .eq('jurisdiction_id', jurisdiction!.id)
    .or(`service_area_id.is.null,service_area_id.in.(${[highMarketArea?.id, allOtherZones?.id].filter(Boolean).join(',')})`)
    .eq('is_active', true);

  console.log(`\n📦 Total fees fetched: ${fees?.length}`);

  const citywide = fees?.filter(f => !f.service_area_id) || [];
  const serviceArea = fees?.filter(f => f.service_area_id) || [];

  console.log(`  - Citywide: ${citywide.length}`);
  console.log(`  - Service area specific: ${serviceArea.length}`);

  // Check for park fees specifically
  const parkFees = fees?.filter(f => f.name?.toLowerCase().includes('park fee')) || [];
  console.log(`\n🌳 Park fees found: ${parkFees.length}`);
  parkFees.forEach(f => {
    console.log(`  - ${f.name}`);
    console.log(`    service_area_id: ${f.service_area_id || 'Citywide'}`);
    console.log(`    applies_to: ${JSON.stringify(f.applies_to)}`);
  });
}

test();
