/**
 * Inspect actual database schema
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function inspectSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 INSPECTING DATABASE SCHEMA\n');

  // Get one jurisdiction to see all columns
  const { data: jurisdictions } = await supabase
    .from('jurisdictions')
    .select('*')
    .limit(1);

  if (jurisdictions && jurisdictions.length > 0) {
    console.log('📍 JURISDICTIONS TABLE COLUMNS:');
    console.log('─'.repeat(80));
    Object.keys(jurisdictions[0]).forEach(col => {
      console.log(`  • ${col.padEnd(30)} = ${jurisdictions[0][col]}`);
    });
  }

  // Get one fee to see all columns
  const { data: fees } = await supabase
    .from('fees')
    .select('*')
    .limit(1);

  if (fees && fees.length > 0) {
    console.log('\n\n💰 FEES TABLE COLUMNS:');
    console.log('─'.repeat(80));
    Object.keys(fees[0]).forEach(col => {
      const value = fees[0][col];
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
      console.log(`  • ${col.padEnd(30)} = ${displayValue}`);
    });

    // Now query fees for Austin specifically
    console.log('\n\n🔍 SEARCHING FOR AUSTIN FEES...');
    console.log('─'.repeat(80));

    // Try different approaches
    const { data: austinJurisdiction } = await supabase
      .from('jurisdictions')
      .select('*')
      .eq('jurisdiction_name', 'Austin')
      .single();

    if (austinJurisdiction) {
      console.log('Found Austin jurisdiction:');
      console.log(JSON.stringify(austinJurisdiction, null, 2));

      // Now try to find fees
      const jurisdictionIdColumn = Object.keys(austinJurisdiction).find(key =>
        key.toLowerCase().includes('id')
      );

      if (jurisdictionIdColumn) {
        const jurisdictionId = austinJurisdiction[jurisdictionIdColumn];
        console.log(`\nSearching fees with ${jurisdictionIdColumn} = ${jurisdictionId}`);

        const { data: austinFees, error } = await supabase
          .from('fees')
          .select('*')
          .eq(jurisdictionIdColumn, jurisdictionId)
          .limit(5);

        if (error) {
          console.error('Error querying fees:', error);
        } else if (austinFees && austinFees.length > 0) {
          console.log(`\n✅ Found ${austinFees.length} fees for Austin:`);
          austinFees.forEach((fee, i) => {
            console.log(`\n  ${i + 1}. ${fee.fee_name}`);
            console.log(`     applies_to: ${JSON.stringify(fee.applies_to)}`);
            console.log(`     category: ${fee.category}`);
          });
        } else {
          console.log('\n❌ No fees found for Austin');
        }
      }
    }
  } else {
    console.log('\n❌ No fees found in database at all');
  }
}

inspectSchema();
