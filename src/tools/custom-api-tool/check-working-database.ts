import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function checkWorkingDatabase() {
    console.log('🔍 Checking Working Supabase Database...\n');

    // Get the working database URL from .env.local
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not found in .env.local');
        return;
    }

    console.log('📊 Database URL found:', databaseUrl.split('@')[1]); // Don't show credentials

    // Parse the database URL to get connection info
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port;
    const database = url.pathname.slice(1); // Remove leading slash

    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${database}\n`);

    // For now, we can't directly connect to PostgreSQL from Node.js without additional packages
    // But we can check what environment variables are available for the working database

    console.log('🔧 Available Environment Variables for Working Database:');
    console.log(`   DATABASE_URL: ${databaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   DATABASE_DRIVER: ${process.env.DATABASE_DRIVER || '❌ Missing'}`);

    // Check if there are any other Supabase-related variables for the working database
    const workingSupabaseUrl = process.env.S3_ENDPOINT?.replace('/storage/v1/s3', '');
    if (workingSupabaseUrl) {
        console.log(`   Working Supabase URL: ${workingSupabaseUrl}`);
    }

    console.log('\n📋 Next Steps:');
    console.log('   1. We need to connect to this working database to see what tables exist');
    console.log('   2. Check if Lewis-related tables are already there');
    console.log('   3. If not, create them with the same structure as the failing database');
    console.log('   4. Update the Lewis tool to use this working database instead');

    console.log('\n⚠️  Note: This script only checks environment variables.');
    console.log('   To actually inspect the database tables, we need to establish a connection.');
}

checkWorkingDatabase();
