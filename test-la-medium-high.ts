import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const j = await supabase.from('jurisdictions').select('id').eq('jurisdiction_name', 'Los Angeles').single();
  const jurisdictionId = j.data!.id;

  console.log('🔍 Checking Medium-High Market Area fees...\n');

  // Get service area ID for Medium-High Market Area
  const { data: serviceAreas } = await supabase
    .from('service_areas')
    .select('id, name')
    .eq('jurisdiction_id', jurisdictionId)
    .ilike('name', '%Medium-High%');

  console.log('Service areas found:', serviceAreas);

  if (!serviceAreas || serviceAreas.length === 0) {
    console.log('❌ No Medium-High Market Area found');
    return;
  }

  const serviceAreaId = serviceAreas[0].id;
  console.log(`\n📍 Using service area: ${serviceAreas[0].name} (${serviceAreaId})\n`);

  // Get all fees for this service area
  const { data: fees } = await supabase
    .from('fees')
    .select(`
      id,
      name,
      applies_to,
      use_subtypes,
      service_area_id,
      service_areas (name),
      fee_calculations (
        calc_type,
        rate,
        unit_label
      )
    `)
    .eq('jurisdiction_id', jurisdictionId)
    .eq('is_active', true)
    .eq('service_area_id', serviceAreaId)
    .ilike('name', '%Affordable Housing Linkage%');

  console.log(`Found ${fees?.length} Affordable Housing Linkage fees in Medium-High Market Area\n`);

  fees?.forEach(fee => {
    console.log(`📋 ${fee.name}`);
    console.log(`   applies_to: ${JSON.stringify(fee.applies_to)}`);
    console.log(`   use_subtypes: ${JSON.stringify(fee.use_subtypes)}`);
    console.log(`   service_area: ${fee.service_areas?.name}`);
    const calc = fee.fee_calculations?.[0];
    if (calc) {
      console.log(`   rate: ${calc.rate} ${calc.unit_label}`);
    }
    console.log();
  });

  // Also check for single-family specific fees
  console.log('\n🏠 Checking for single-family specific fees in Medium-High Market Area:\n');
  const { data: singleFamilyFees } = await supabase
    .from('fees')
    .select(`
      id,
      name,
      applies_to,
      use_subtypes,
      service_areas (name),
      fee_calculations (
        calc_type,
        rate,
        unit_label
      )
    `)
    .eq('jurisdiction_id', jurisdictionId)
    .eq('is_active', true)
    .eq('service_area_id', serviceAreaId)
    .ilike('name', '%single%family%');

  console.log(`Found ${singleFamilyFees?.length} single-family fees\n`);

  singleFamilyFees?.forEach(fee => {
    console.log(`📋 ${fee.name}`);
    console.log(`   applies_to: ${JSON.stringify(fee.applies_to)}`);
    console.log(`   use_subtypes: ${JSON.stringify(fee.use_subtypes)}`);
    const calc = fee.fee_calculations?.[0];
    if (calc) {
      console.log(`   rate: ${calc.rate} ${calc.unit_label}`);
    }
    console.log();
  });
}

test();
