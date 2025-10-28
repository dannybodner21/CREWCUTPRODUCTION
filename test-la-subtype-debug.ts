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

  // Get service area IDs
  const { data: serviceAreas } = await supabase
    .from('service_areas')
    .select('id, name')
    .eq('jurisdiction_id', jurisdictionId);

  const mediumHighId = serviceAreas?.find(s => s.name.includes('Medium-High'))?.id;
  const citywideId = null; // citywide has service_area_id = null

  console.log('🔍 Checking ALL Affordable Housing Linkage fees...\n');

  // Get all Affordable Housing Linkage fees (citywide + medium-high)
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
    .ilike('name', '%Affordable Housing Linkage%')
    .or(`service_area_id.is.null,service_area_id.eq.${mediumHighId}`);

  console.log(`Found ${fees?.length} Affordable Housing Linkage fees\n`);

  fees?.forEach(fee => {
    const calc = fee.fee_calculations?.[0];
    console.log(`📋 ${fee.name}`);
    console.log(`   service_area: ${fee.service_areas?.name || 'CITYWIDE'}`);
    console.log(`   applies_to: ${JSON.stringify(fee.applies_to)}`);
    console.log(`   use_subtypes: ${JSON.stringify(fee.use_subtypes)}`);
    if (calc) {
      console.log(`   rate: $${calc.rate}/sq ft`);
    }

    // Simulate matching logic
    const projectType = 'Residential';
    const useSubtype = 'Single Family';

    // Check applies_to
    const appliesToMatch = fee.applies_to?.some((a: string) => a.toLowerCase() === 'residential');

    // Check use_subtypes
    let subtypeMatch = false;
    if (!fee.use_subtypes || fee.use_subtypes.length === 0) {
      subtypeMatch = true; // No filter = matches all
    } else {
      subtypeMatch = fee.use_subtypes.some((st: string) => {
        const normalized = st.toLowerCase().replace(/[^a-z]/g, '');
        return normalized === 'singlefamily' || normalized.includes('single');
      });
    }

    console.log(`   ✓ Type Match: ${appliesToMatch}, Subtype Match: ${subtypeMatch}`);
    console.log(`   → ${appliesToMatch && subtypeMatch ? '✅ SHOULD SHOW' : '❌ SHOULD FILTER'}`);
    console.log();
  });
}

test();
