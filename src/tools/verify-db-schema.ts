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
                // Get table schema information
                const { data: tableInfo, error: tableError } = await supabase
                    .rpc('exec_sql', {
                        sql: `
                            SELECT 
                                column_name,
                                data_type,
                                is_nullable,
                                column_default,
                                character_maximum_length
                            FROM information_schema.columns 
                            WHERE table_name = '${tableName}'
                            ORDER BY ordinal_position;
                        `
                    });

                if (tableError) {
                    console.log(`❌ Table '${tableName}': ${tableError.message}`);
                    continue;
                }

                if (!tableInfo || tableInfo.length === 0) {
                    console.log(`📭 Table '${tableName}': Does not exist`);
                    continue;
                }

                console.log(`✅ Table '${tableName}':`);
                console.log('   Columns:');
                tableInfo.forEach((col: any) => {
                    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                    const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
                    console.log(`     - ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
                });

                // Get row count
                const { count, error: countError } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (!countError) {
                    console.log(`   Row count: ${count || 0}`);
                }

                console.log('');

            } catch (error) {
                console.log(`❌ Error checking table '${tableName}': ${error}`);
            }
        }

        // Check for any other tables that might be LEWIS-related
        console.log('🔍 Checking for other tables that might be LEWIS-related...\n');
        
        try {
            const { data: allTables, error: allTablesError } = await supabase
                .rpc('exec_sql', {
                    sql: `
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name NOT LIKE 'pg_%'
                        AND table_name NOT LIKE 'nextauth_%'
                        AND table_name NOT LIKE 'oidc_%'
                        AND table_name NOT LIKE 'rbac_%'
                        AND table_name NOT IN (
                            'agents', 'agents_files', 'agents_knowledge_bases', 'agents_to_sessions',
                            'ai_models', 'ai_providers', 'api_keys', 'async_tasks',
                            'document_chunks', 'documents', 'files', 'global_files',
                            'knowledge_base_files', 'knowledge_bases', 'generation_batches',
                            'generation_topics', 'generations', 'message_chunks', 'message_plugins',
                            'message_queries', 'message_query_chunks', 'message_tts', 'message_translates',
                            'messages', 'messages_files', 'nextauth_accounts', 'nextauth_authenticators',
                            'nextauth_sessions', 'nextauth_verificationtokens', 'oauth_handoffs',
                            'oidc_access_tokens', 'oidc_authorization_codes', 'oidc_clients',
                            'oidc_consents', 'oidc_device_codes', 'oidc_grants', 'oidc_interactions',
                            'oidc_refresh_tokens', 'oidc_sessions', 'chunks', 'embeddings',
                            'unstructured_chunks', 'rag_eval_dataset_records', 'rag_eval_datasets',
                            'rag_eval_evaluations', 'rag_eval_evaluation_records', 'sessions',
                            'session_groups', 'threads', 'topic_documents', 'topics',
                            'user_budgets', 'user_subscriptions', 'user_installed_plugins',
                            'user_settings', 'users', 'file_chunks', 'files_to_sessions',
                            'saved_artifacts'
                        )
                        ORDER BY table_name;
                    `
                });

            if (!allTablesError && allTables) {
                console.log('Other tables found:');
                allTables.forEach((table: any) => {
                    console.log(`  - ${table.table_name}`);
                });
            }

        } catch (error) {
            console.log(`❌ Error getting all tables: ${error}`);
        }

        console.log('\n✅ Database schema verification complete!');

    } catch (error) {
        console.error('💥 Error verifying database schema:', error);
    }
}

// Run the verification
verifyDatabaseSchema().catch(console.error);
