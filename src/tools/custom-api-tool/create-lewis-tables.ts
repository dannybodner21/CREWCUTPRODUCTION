import { config } from 'dotenv';
import { resolve } from 'path';
import { createSupabaseAdminClient } from './supabase';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Lewis table schemas
const LEWIS_TABLE_SCHEMAS = {
    'webhound_fee_categories': `
        CREATE TABLE IF NOT EXISTS webhound_fee_categories (
            id SERIAL PRIMARY KEY,
            category_key TEXT NOT NULL UNIQUE,
            category_display_name TEXT NOT NULL,
            category_group TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `,

    'cities': `
        CREATE TABLE IF NOT EXISTS cities (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            county TEXT NOT NULL,
            state TEXT DEFAULT 'Arizona',
            population INTEGER,
            last_updated DATE,
            data_source_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `,

    'verified_fee_data': `
        CREATE TABLE IF NOT EXISTS verified_fee_data (
            id SERIAL PRIMARY KEY,
            city_id INTEGER REFERENCES cities(id),
            location_name TEXT NOT NULL,
            fee_category TEXT NOT NULL,
            fee_description TEXT,
            verified_amounts TEXT,
            calculation_methods TEXT,
            source_text TEXT,
            data_quality_score INTEGER DEFAULT 0,
            has_real_amounts BOOLEAN DEFAULT FALSE,
            has_calculations BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `,

    'detailed_fee_breakdown': `
        CREATE TABLE IF NOT EXISTS detailed_fee_breakdown (
            id SERIAL PRIMARY KEY,
            verified_fee_id INTEGER REFERENCES verified_fee_data(id),
            fee_amount NUMERIC,
            fee_unit TEXT,
            development_type TEXT,
            project_size_tier TEXT,
            meter_size TEXT,
            special_conditions TEXT,
            effective_date DATE,
            verification_status TEXT DEFAULT 'verified',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `
};

async function createLewisTables() {
    console.log('🔧 Creating Lewis tables in new Supabase database...\n');

    try {
        const adminClient = createSupabaseAdminClient();

        // Test connection first
        console.log('🔍 Testing connection...');
        const { data: testData, error: testError } = await adminClient
            .from('cities')
            .select('id')
            .limit(1);

        if (testError && testError.message.includes('table')) {
            console.log('✅ Connection working - tables will be created');
        } else if (testError) {
            console.log('⚠️  Connection test result:', testError.message);
        } else {
            console.log('✅ Connection working');
        }

        console.log('\n📋 Creating Lewis tables...\n');

        for (const [tableName, createSQL] of Object.entries(LEWIS_TABLE_SCHEMAS)) {
            try {
                console.log(`🔨 Creating ${tableName}...`);

                // Use raw SQL to create tables
                const { error } = await adminClient.rpc('exec_sql', { sql: createSQL });

                if (error) {
                    // Try alternative approach with direct SQL
                    console.log(`   ⚠️  RPC failed, trying direct approach...`);

                    // For now, just log that we need to create tables manually
                    console.log(`   📝 SQL to create ${tableName}:`);
                    console.log(`   ${createSQL.trim()}`);
                } else {
                    console.log(`   ✅ ${tableName} created successfully`);
                }

            } catch (tableError) {
                console.log(`   ❌ Error creating ${tableName}:`, tableError);
                console.log(`   📝 SQL to create ${tableName}:`);
                console.log(`   ${createSQL.trim()}`);
            }
        }

        console.log('\n📋 Next Steps:');
        console.log('   1. Tables need to be created manually in Supabase dashboard');
        console.log('   2. Or we need to use a different approach to create them');
        console.log('   3. Once tables exist, we can import the CSV data');

    } catch (error) {
        console.error('💥 Failed to create tables:', error);
    }
}

createLewisTables();
