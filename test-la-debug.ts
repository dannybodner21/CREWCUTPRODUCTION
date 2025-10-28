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

  console.log('🔍 Checking Los Angeles fees...\n');

  // Check service areas
  const { data: serviceAreas } = await supabase
    .from('service_areas')
    .select('id, name')
    .eq('jurisdiction_id', jurisdiction!.id);

  console.log(`Found ${serviceAreas?.length || 0} service areas:`);
  serviceAreas?.forEach(sa => {
    console.log(`  - ${sa.name} (${sa.id})`);
  });
  console.log();

  // Check total fees
  const { data: allFees } = await supabase
    .from('fees')
    .select('id, name, service_area_id, applies_to, use_subtypes')
    .eq('jurisdiction_id', jurisdiction!.id);

  console.log(`Total fees: ${allFees?.length}`);

  const citywideCount = allFees?.filter(f => !f.service_area_id).length || 0;
  const serviceAreaCount = allFees?.filter(f => f.service_area_id).length || 0;

  console.log(`  - Citywide: ${citywideCount}`);
  console.log(`  - Service area specific: ${serviceAreaCount}`);

  // Check for water meter fees
  const { data: waterFees } = await supabase
    .from('fees')
    .select('id, name, service_area_id')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%water%meter%');

  console.log(`\n💧 Water meter fees: ${waterFees?.length}`);
  waterFees?.forEach(f => {
    console.log(`  - ${f.name} (${f.service_area_id ? 'service area' : 'citywide'})`);
  });

  // Check for affordable housing fees
  const { data: housingFees } = await supabase
    .from('fees')
    .select('id, name, use_subtypes')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%affordable%housing%');

  console.log(`\n🏘️  Affordable housing fees: ${housingFees?.length}`);
  housingFees?.forEach(f => {
    console.log(`  - ${f.name}`);
    console.log(`    use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
  });

  // Check for park fees
  const { data: parkFees } = await supabase
    .from('fees')
    .select('id, name, use_subtypes')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%park%');

  console.log(`\n🌳 Park fees: ${parkFees?.length}`);
  parkFees?.forEach(f => {
    console.log(`  - ${f.name}`);
    console.log(`    use_subtypes: ${JSON.stringify(f.use_subtypes)}`);
  });

  // Check for building permit fees
  const { data: buildingFees } = await supabase
    .from('fees')
    .select('id, name')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%building permit%');

  console.log(`\n🏗️  Building permit fees: ${buildingFees?.length}`);
  buildingFees?.forEach(f => {
    console.log(`  - ${f.name}`);
  });

  // Check for sewer fees
  const { data: sewerFees } = await supabase
    .from('fees')
    .select('id, name, fee_calculations(effective_start)')
    .eq('jurisdiction_id', jurisdiction!.id)
    .ilike('name', '%sewer%');

  console.log(`\n🚰 Sewer fees: ${sewerFees?.length}`);
  sewerFees?.forEach(f => {
    console.log(`  - ${f.name}`);
    if (f.fee_calculations && f.fee_calculations.length > 0) {
      const dates = (f.fee_calculations as any[]).map((c: any) => c.effective_start).filter(Boolean);
      if (dates.length > 0) {
        console.log(`    dates: ${dates.join(', ')}`);
      }
    }
  });
}

test();
