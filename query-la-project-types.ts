/**
 * Query Los Angeles project types since it has fees
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function queryLA() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=' .repeat(80));
  console.log('📊 LOS ANGELES PROJECT TYPE ANALYSIS');
  console.log('='.repeat(80));

  // Get Los Angeles jurisdiction
  const { data: la } = await supabase
    .from('jurisdictions')
    .select('*')
    .eq('jurisdiction_name', 'Los Angeles')
    .single();

  if (!la) {
    console.log('❌ Los Angeles not found');
    return;
  }

  console.log(`\n✅ Found Los Angeles (ID: ${la.id})`);

  // Get ALL fees for Los Angeles
  const { data: fees } = await supabase
    .from('fees')
    .select('*')
    .eq('jurisdiction_id', la.id);

  if (!fees || fees.length === 0) {
    console.log('❌ No fees found for Los Angeles');
    return;
  }

  console.log(`✅ Found ${fees.length} fees for Los Angeles\n`);

  // Analyze applies_to values
  const appliesTo = new Map<string, number>();

  fees.forEach(fee => {
    if (fee.applies_to && Array.isArray(fee.applies_to)) {
      fee.applies_to.forEach((type: string) => {
        appliesTo.set(type, (appliesTo.get(type) || 0) + 1);
      });
    }
  });

  console.log('📋 UNIQUE applies_to VALUES:');
  console.log('─'.repeat(80));

  const sortedTypes = Array.from(appliesTo.entries()).sort((a, b) => b[1] - a[1]);

  sortedTypes.forEach(([type, count]) => {
    console.log(`  ${type.padEnd(50)} ${count.toString().padStart(6)} fees`);
  });

  // Compare with dropdown options
  const dropdownOptions = [
    'Single-Family Residential',
    'Multi-Family Residential',
    'Commercial',
    'Office',
    'Retail',
    'Restaurant/Food Service',
    'Industrial'
  ];

  console.log('\n\n🎯 DROPDOWN OPTION COVERAGE:');
  console.log('─'.repeat(80));

  dropdownOptions.forEach(option => {
    console.log(`\n  "${option}"`);

    // Find matching database values
    const matches: string[] = [];
    sortedTypes.forEach(([dbType]) => {
      const optionLower = option.toLowerCase().replace(/[^a-z]/g, '');
      const dbTypeLower = dbType.toLowerCase().replace(/[^a-z]/g, '');

      if (
        optionLower === dbTypeLower ||
        optionLower.includes(dbTypeLower) ||
        dbTypeLower.includes(optionLower)
      ) {
        matches.push(dbType);
      }
    });

    if (matches.length > 0) {
      console.log(`    ✅ Matches: ${matches.join(', ')}`);
      matches.forEach(match => {
        console.log(`       ${appliesTo.get(match)} fees`);
      });
    } else {
      console.log(`    ❌ No matches found in database`);
    }
  });

  // Show sample fees for each type
  console.log('\n\n📝 SAMPLE FEES BY TYPE:');
  console.log('─'.repeat(80));

  for (const [type] of sortedTypes.slice(0, 10)) {
    console.log(`\n  ${type}:`);
    const sampleFees = fees
      .filter(f => f.applies_to && f.applies_to.includes(type))
      .slice(0, 3);

    sampleFees.forEach(fee => {
      console.log(`    • ${fee.name}`);
    });
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('💡 SUMMARY');
  console.log('='.repeat(80));

  console.log('\n✅ Total fees in Los Angeles:', fees.length);
  console.log('✅ Unique project types (applies_to values):', sortedTypes.length);
  console.log('✅ Dropdown options:', dropdownOptions.length);
  console.log('');
}

queryLA();
