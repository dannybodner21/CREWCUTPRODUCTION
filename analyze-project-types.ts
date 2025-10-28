/**
 * Analyze project types in database vs. dropdown
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function analyzeProjectTypes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=' .repeat(80));
  console.log('📋 PROJECT TYPE ANALYSIS');
  console.log('='.repeat(80));

  // Hardcoded dropdown options from CustomLewisPortal.tsx
  const dropdownOptions = [
    'Single-Family Residential',
    'Multi-Family Residential',
    'Commercial',
    'Office',
    'Retail',
    'Restaurant/Food Service',
    'Industrial'
  ];

  console.log('\n🎯 DROPDOWN OPTIONS (CustomLewisPortal.tsx lines 1214-1221):');
  console.log('─'.repeat(80));
  dropdownOptions.forEach((opt, i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${opt}`);
  });

  // Get all jurisdictions
  const { data: jurisdictions } = await supabase
    .from('jurisdictions')
    .select('id, jurisdiction_name, state_code')
    .order('jurisdiction_name');

  if (!jurisdictions || jurisdictions.length === 0) {
    console.log('\n❌ No jurisdictions found');
    return;
  }

  console.log(`\n\n📍 ANALYZING ${jurisdictions.length} JURISDICTIONS:`);
  console.log('─'.repeat(80));

  const targetJurisdictions = ['Austin', 'Phoenix city', 'Los Angeles', 'San Diego', 'Denver', 'Portland'];

  for (const jName of targetJurisdictions) {
    const jurisdiction = jurisdictions.find(j => j.jurisdiction_name === jName);

    if (!jurisdiction) {
      console.log(`\n❌ ${jName} - Not found in database`);
      continue;
    }

    console.log(`\n📍 ${jurisdiction.jurisdiction_name} (${jurisdiction.state_code})`);
    console.log('─'.repeat(80));

    // Get all fees for this jurisdiction
    const { data: fees } = await supabase
      .from('fees')
      .select('id, fee_name, applies_to, category')
      .eq('jurisdiction_id', jurisdiction.id);

    if (!fees || fees.length === 0) {
      console.log('  ⚠️  No fees found');
      continue;
    }

    // Extract unique applies_to values
    const appliesTo = new Set<string>();
    fees.forEach(fee => {
      if (fee.applies_to && Array.isArray(fee.applies_to)) {
        fee.applies_to.forEach((type: string) => appliesTo.add(type));
      }
    });

    const uniqueTypes = Array.from(appliesTo).sort();

    console.log(`  Total Fees: ${fees.length}`);
    console.log(`  Unique applies_to values: ${uniqueTypes.length}`);
    console.log('');
    console.log('  applies_to values found in fees:');
    uniqueTypes.forEach(type => {
      const count = fees.filter(f => f.applies_to && f.applies_to.includes(type)).length;
      console.log(`    • ${type.padEnd(40)} (${count} fees)`);
    });

    // Check which dropdown options are supported
    console.log('');
    console.log('  Dropdown option coverage:');
    dropdownOptions.forEach(option => {
      const matches = uniqueTypes.filter(dbType =>
        dbType.toLowerCase().includes(option.toLowerCase()) ||
        option.toLowerCase().includes(dbType.toLowerCase())
      );

      if (matches.length > 0) {
        console.log(`    ✅ "${option}" → Matches: ${matches.join(', ')}`);
      } else {
        console.log(`    ❌ "${option}" → No matches in database`);
      }
    });
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));

  console.log('\n🎯 Dropdown Options:');
  dropdownOptions.forEach((opt, i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${opt}`);
  });

  console.log('\n💡 Recommendations:');
  console.log('  1. Verify all dropdown options have corresponding fees in the database');
  console.log('  2. Check if database has project types not in the dropdown');
  console.log('  3. Ensure consistent naming between dropdown and database');
  console.log('');
}

analyzeProjectTypes();
