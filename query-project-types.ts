/**
 * Query database to show available project types for all 6 jurisdictions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function queryProjectTypes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Querying project types for 6 major jurisdictions...\n');

  const query = `
    SELECT
      j.jurisdiction_name,
      pt.project_type_name,
      COUNT(DISTINCT f.fee_id) as fee_count
    FROM jurisdictions j
    LEFT JOIN fees f ON j.jurisdiction_id = f.jurisdiction_id
    LEFT JOIN project_types pt ON f.project_type_id = pt.project_type_id
    WHERE j.jurisdiction_name IN (
      'Phoenix city',
      'Austin',
      'Los Angeles',
      'San Diego',
      'Denver',
      'Portland'
    )
    GROUP BY j.jurisdiction_name, pt.project_type_name
    ORDER BY j.jurisdiction_name, pt.project_type_name
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query_text: query });

  if (error) {
    console.error('❌ Error executing query:', error);
    console.log('\n⚠️  Trying alternative query method...\n');

    // Alternative: Query tables separately and join in JavaScript
    const jurisdictions = ['Phoenix city', 'Austin', 'Los Angeles', 'San Diego', 'Denver', 'Portland'];

    for (const jurisdictionName of jurisdictions) {
      console.log(`\n📍 ${jurisdictionName}`);
      console.log('─'.repeat(80));

      // Get jurisdiction
      const { data: jurisdiction } = await supabase
        .from('jurisdictions')
        .select('jurisdiction_id, jurisdiction_name')
        .eq('jurisdiction_name', jurisdictionName)
        .single();

      if (!jurisdiction) {
        console.log('  ❌ Jurisdiction not found');
        continue;
      }

      // Get fees for this jurisdiction with project types
      const { data: fees } = await supabase
        .from('fees')
        .select('fee_id, fee_name, project_type_id')
        .eq('jurisdiction_id', jurisdiction.jurisdiction_id);

      if (!fees || fees.length === 0) {
        console.log('  ❌ No fees found');
        continue;
      }

      // Get project types
      const { data: projectTypes } = await supabase
        .from('project_types')
        .select('project_type_id, project_type_name');

      // Group fees by project type
      const feesByType = new Map<string, number>();

      fees.forEach(fee => {
        const projectType = projectTypes?.find(pt => pt.project_type_id === fee.project_type_id);
        const typeName = projectType?.project_type_name || 'NULL';

        feesByType.set(typeName, (feesByType.get(typeName) || 0) + 1);
      });

      // Display results
      const sortedTypes = Array.from(feesByType.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      sortedTypes.forEach(([typeName, count]) => {
        console.log(`  ${typeName.padEnd(40)} ${count.toString().padStart(6)} fees`);
      });
    }

    console.log('\n' + '='.repeat(80));

    // Show all available project types in database
    console.log('\n📋 ALL PROJECT TYPES IN DATABASE:');
    console.log('─'.repeat(80));

    const { data: allProjectTypes } = await supabase
      .from('project_types')
      .select('project_type_id, project_type_name')
      .order('project_type_name');

    if (allProjectTypes) {
      allProjectTypes.forEach((pt, i) => {
        console.log(`  ${(i + 1).toString().padStart(2)}. ${pt.project_type_name} (ID: ${pt.project_type_id})`);
      });
    }

    console.log('\n✅ Query complete!\n');
    return;
  }

  if (data) {
    console.log('Query results:');
    console.table(data);
  }
}

queryProjectTypes();
