import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function test() {
  console.log('🧪 Testing service area matching logic\n');

  // Get Denver jurisdiction
  const { data: jurisdictionData } = await supabase
    .from('jurisdictions')
    .select('state_code, id')
    .eq('jurisdiction_name', 'Denver')
    .single();

  console.log('Denver jurisdiction ID:', jurisdictionData?.id);

  // Get service areas
  const { data: serviceAreas } = await supabase
    .from('service_areas')
    .select('id, name')
    .eq('jurisdiction_id', jurisdictionData!.id);

  console.log('\nAvailable service areas:');
  serviceAreas?.forEach(sa => console.log(`  - ${sa.name} (${sa.id})`));

  // Test matching logic (same as API)
  const searchTerm = 'Inside';
  console.log(`\n🔍 Searching for service areas containing "${searchTerm}":\n`);

  const matchingArea = serviceAreas?.find((sa: any) =>
    sa.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (matchingArea) {
    console.log('✅ MATCH FOUND:');
    console.log('   Name:', matchingArea.name);
    console.log('   ID:', matchingArea.id);
    console.log('\nselectedServiceAreaIds would be:', [matchingArea.id]);
  } else {
    console.log('❌ NO MATCH FOUND');
    console.log('selectedServiceAreaIds would be: []');
    console.log('\n🚨 PROBLEM: Empty array means ALL service areas will be included!');
  }

  // Test with exact match
  const exactSearchTerm = 'Inside Denver';
  console.log(`\n\n🔍 Searching for service areas containing "${exactSearchTerm}":\n`);

  const exactMatch = serviceAreas?.find((sa: any) =>
    sa.name.toLowerCase().includes(exactSearchTerm.toLowerCase())
  );

  if (exactMatch) {
    console.log('✅ MATCH FOUND:');
    console.log('   Name:', exactMatch.name);
    console.log('   ID:', exactMatch.id);
  } else {
    console.log('❌ NO MATCH FOUND');
  }
}

test();
