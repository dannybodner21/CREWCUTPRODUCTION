#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { getServerDBConfig } from '@/config/db';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

function debugDatabaseConfig() {
    console.log('🔍 Debugging database configuration...\n');

    console.log('Raw environment variables:');
    console.log(`- KEY_VAULTS_SECRET: "${process.env.KEY_VAULTS_SECRET}"`);
    console.log(`- DATABASE_URL: "${process.env.DATABASE_URL}"`);
    console.log(`- NEXT_PUBLIC_SERVICE_MODE: "${process.env.NEXT_PUBLIC_SERVICE_MODE}"`);
    console.log('');

    try {
        console.log('Creating server DB config...');
        const serverDBEnv = getServerDBConfig();
        
        console.log('Parsed server DB config:');
        console.log(`- KEY_VAULTS_SECRET: "${serverDBEnv.KEY_VAULTS_SECRET}"`);
        console.log(`- DATABASE_URL: "${serverDBEnv.DATABASE_URL}"`);
        console.log(`- NEXT_PUBLIC_ENABLED_SERVER_SERVICE: ${serverDBEnv.NEXT_PUBLIC_ENABLED_SERVER_SERVICE}`);
        
        console.log('\nValidation results:');
        console.log(`- KEY_VAULTS_SECRET exists: ${!!serverDBEnv.KEY_VAULTS_SECRET}`);
        console.log(`- DATABASE_URL exists: ${!!serverDBEnv.DATABASE_URL}`);
        
    } catch (error) {
        console.error('❌ Error creating server DB config:', error);
    }
}

// Run the debug
debugDatabaseConfig();
