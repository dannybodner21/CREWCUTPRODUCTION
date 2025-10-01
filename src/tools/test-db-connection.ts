#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { getServerDB } from '@/database/core/db-adaptor';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...\n');

    try {
        console.log('Environment variables:');
        console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
        console.log(`- KEY_VAULTS_SECRET: ${process.env.KEY_VAULTS_SECRET ? 'Set' : 'Missing'}`);
        console.log(`- SERVICE_MODE: ${process.env.NEXT_PUBLIC_SERVICE_MODE}`);
        console.log('');

        console.log('Attempting to connect to database...');
        const db = await getServerDB();
        console.log('✅ Database connection successful!');

        // Try a simple query
        console.log('Testing database query...');
        const result = await db.select().from(db.agents).limit(1);
        console.log(`✅ Query successful! Found ${result.length} agents`);

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Run the test
testDatabaseConnection().catch(console.error);
