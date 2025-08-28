import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Lewis table schemas based on the failing database
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

async function setupLewisTables() {
    console.log('🔧 Setting up Lewis tables in working database...\n');

    // Get the working Supabase URL from S3_ENDPOINT
    const workingSupabaseUrl = process.env.S3_ENDPOINT?.replace('/storage/v1/s3', '');
    const workingSupabaseAnonKey = process.env.S3_ACCESS_KEY_ID; // This might not be the right key

    if (!workingSupabaseUrl) {
        console.error('❌ Working Supabase URL not found in S3_ENDPOINT');
        return;
    }

    console.log('📊 Working Supabase URL:', workingSupabaseUrl);
    console.log('🔑 Access Key ID:', workingSupabaseAnonKey ? '✅ Set' : '❌ Missing');

    // Note: We need the actual Supabase anon key, not the S3 access key
    console.log('\n⚠️  IMPORTANT: We need the actual Supabase anon key for the working database.');
    console.log('   The S3_ACCESS_KEY_ID is for storage, not database access.');

    console.log('\n📋 Lewis Tables We Need to Create:');
    Object.keys(LEWIS_TABLE_SCHEMAS).forEach(tableName => {
        console.log(`   ✅ ${tableName}`);
    });

    console.log('\n🔍 Next Steps:');
    console.log('   1. Get the Supabase anon key for the working database');
    console.log('   2. Update the Lewis tool to use the working database');
    console.log('   3. Create the Lewis tables in the working database');
    console.log('   4. Import the CSV data into the working database');

    console.log('\n💡 The working database is at:', workingSupabaseUrl);
    console.log('   You need to get the anon key from your partner or Supabase dashboard.');
}

setupLewisTables();
