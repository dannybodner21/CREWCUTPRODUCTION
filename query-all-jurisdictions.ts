/**
 * Query all jurisdictions to see exact names
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function queryJurisdictions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Querying all jurisdictions...\n');

  // Get all jurisdictions
  const { data: jurisdictions, error } = await supabase
    .from('jurisdictions')
    .select('*')
    .order('jurisdiction_name');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!jurisdictions || jurisdictions.length === 0) {
    console.log('❌ No jurisdictions found');
    return;
  }

  console.log(`📊 Found ${jurisdictions.length} jurisdictions:\n`);

  // Show first 20 jurisdictions with details
  jurisdictions.slice(0, 20).forEach((j, i) => {
    console.log(`${(i + 1).toString().padStart(3)}. ${j.jurisdiction_name}`);
    console.log(`     ID: ${j.jurisdiction_id || 'N/A'}`);
    console.log(`     State: ${j.state_code || 'N/A'}`);
    console.log(`     Type: ${j.jurisdiction_type || 'N/A'}`);
    console.log('');
  });

  // Now get project types
  console.log('\n📋 ALL PROJECT TYPES IN DATABASE:');
  console.log('─'.repeat(80));

  const { data: projectTypes } = await supabase
    .from('project_types')
    .select('*')
    .order('project_type_name');

  if (projectTypes) {
    projectTypes.forEach((pt, i) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${pt.project_type_name} (ID: ${pt.project_type_id})`);
    });
  } else {
    console.log('  ❌ No project types found');
  }

  console.log('\n✅ Query complete!\n');
}

queryJurisdictions();
