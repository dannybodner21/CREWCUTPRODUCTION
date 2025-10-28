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

  console.log('🔍 Checking Affordable Housing Linkage fees by service area...\n');

  const { data: fees } = await supabase
    .from('fees')
    .select(`
      id,
      name,
      applies_to,
      service_area_id,
      service_areas (
        name
      ),
      fee_calculations (
        calc_type,
        rate,
        unit_label
      )
    `)
    .eq('jurisdiction_id', jurisdictionId)
    .eq('is_active', true)
    .ilike('name', '%Affordable Housing Linkage fee - Single-Family%');

  console.log(`Found ${fees?.length} Single-Family Linkage fees\n`);

  // Group by service area
  const byServiceArea = new Map<string, any[]>();
  fees?.forEach(fee => {
    const serviceArea = fee.service_areas?.name || 'CITYWIDE';
    if (!byServiceArea.has(serviceArea)) {
      byServiceArea.set(serviceArea, []);
    }
    byServiceArea.get(serviceArea)!.push(fee);
  });

  Array.from(byServiceArea.entries()).forEach(([serviceArea, fees]) => {
    console.log(`\n📍 ${serviceArea} (${fees.length} fees):`);
    fees.forEach(fee => {
      console.log(`   - ${fee.name}`);
      const calc = fee.fee_calculations?.[0];
      if (calc) {
        console.log(`     rate: ${calc.rate} ${calc.unit_label}`);
      }
    });
  });
}

test();
