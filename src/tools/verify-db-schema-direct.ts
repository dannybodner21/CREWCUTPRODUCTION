#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { createSupabaseAdminClient } from './custom-api-tool/supabase';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function verifyDatabaseSchema() {
    const supabase = createSupabaseAdminClient();

    console.log('🔍 Verifying LEWIS Database Schema...\n');

    try {
        // List of LEWIS-related tables to check
        const lewisTables = [
            'jurisdictions',
            'agencies', 
            'fee_categories',
            'fees',
            'fee_versions',
            'sources',
            'fees_stage',
            'cities',
            'webhound_fee_categories',
            'verified_fee_data',
            'detailed_fee_breakdown',
            'jurisdiction_analytics',
            'ui_demo_fees'
        ];

        console.log('📋 Checking LEWIS-related tables:\n');

        for (const tableName of lewisTables) {
            try {
                // Try to get a sample of data to understand the structure
                const { data, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact' })
                    .limit(1);

                if (error) {
                    console.log(`❌ Table '${tableName}': ${error.message}`);
                    continue;
                }

                console.log(`✅ Table '${tableName}':`);
                console.log(`   Row count: ${count || 0}`);
                
                if (data && data.length > 0) {
                    console.log('   Sample columns:');
                    const sampleRow = data[0];
                    Object.keys(sampleRow).forEach(key => {
                        const value = sampleRow[key];
                        const type = typeof value;
                        const sample = value !== null ? String(value).substring(0, 50) : 'null';
                        console.log(`     - ${key}: ${type} (${sample}${String(value).length > 50 ? '...' : ''})`);
                    });
                } else {
                    console.log('   No data found');
                }

                console.log('');

            } catch (error) {
                console.log(`❌ Error checking table '${tableName}': ${error}`);
            }
        }

        // Try to get all tables by attempting to query them
        console.log('🔍 Attempting to discover all tables...\n');
        
        const potentialTables = [
            'jurisdictions', 'agencies', 'fee_categories', 'fees', 'fee_versions', 'sources',
            'fees_stage', 'cities', 'webhound_fee_categories', 'verified_fee_data', 
            'detailed_fee_breakdown', 'jurisdiction_analytics', 'ui_demo_fees',
            'lewis_jurisdictions', 'lewis_agencies', 'lewis_fees', 'lewis_categories',
            'staged_fees', 'processed_fees', 'fee_data', 'jurisdiction_data'
        ];

        const existingTables: string[] = [];
        
        for (const tableName of potentialTables) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (!error) {
                    existingTables.push(tableName);
                }
            } catch (error) {
                // Table doesn't exist or error accessing it
            }
        }

        if (existingTables.length > 0) {
            console.log('✅ Found existing tables:');
            existingTables.forEach(tableName => {
                console.log(`  - ${tableName}`);
            });
        } else {
            console.log('❌ No LEWIS tables found');
        }

        console.log('\n✅ Database schema verification complete!');

    } catch (error) {
        console.error('💥 Error verifying database schema:', error);
    }
}

// Run the verification
verifyDatabaseSchema().catch(console.error);
