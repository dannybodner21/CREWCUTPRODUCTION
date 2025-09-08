#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { createSupabaseAdminClient } from './custom-api-tool/supabase';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function createJurisdictionAnalyticsTable() {
    const supabase = createSupabaseAdminClient();

    console.log('🏗️  Creating jurisdiction_analytics table...\n');

    try {
        // Create the table
        const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `
        CREATE TABLE IF NOT EXISTS jurisdiction_analytics (
          id SERIAL PRIMARY KEY,
          jurisdiction_name TEXT NOT NULL,
          state_name TEXT NOT NULL,
          total_fee_records INTEGER NOT NULL DEFAULT 0,
          agency_count INTEGER NOT NULL DEFAULT 0,
          fee_category_count INTEGER NOT NULL DEFAULT 0,
          quality_score INTEGER NOT NULL DEFAULT 0,
          completeness_score INTEGER NOT NULL DEFAULT 0,
          records_with_rates INTEGER NOT NULL DEFAULT 0,
          records_with_descriptions INTEGER NOT NULL DEFAULT 0,
          records_with_formulas INTEGER NOT NULL DEFAULT 0,
          records_with_effective_dates INTEGER NOT NULL DEFAULT 0,
          records_with_sources INTEGER NOT NULL DEFAULT 0,
          last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(jurisdiction_name, state_name)
        );
      `
        });

        if (createError) {
            console.error('❌ Error creating table:', createError.message);
            return;
        }

        console.log('✅ jurisdiction_analytics table created successfully');

        // Create indexes for better performance
        const { error: indexError } = await supabase.rpc('exec_sql', {
            sql: `
        CREATE INDEX IF NOT EXISTS idx_jurisdiction_analytics_jurisdiction 
        ON jurisdiction_analytics(jurisdiction_name, state_name);
        
        CREATE INDEX IF NOT EXISTS idx_jurisdiction_analytics_quality 
        ON jurisdiction_analytics(quality_score);
        
        CREATE INDEX IF NOT EXISTS idx_jurisdiction_analytics_completeness 
        ON jurisdiction_analytics(completeness_score);
      `
        });

        if (indexError) {
            console.error('❌ Error creating indexes:', indexError.message);
        } else {
            console.log('✅ Indexes created successfully');
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

createJurisdictionAnalyticsTable();
