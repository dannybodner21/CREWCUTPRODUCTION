#!/usr/bin/env tsx

/**
 * Complete setup script for the Fee Calculator
 * This script will:
 * 1. Create the database schema
 * 2. Migrate CSV data
 * 3. Test the calculator
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('🚀 Setting up Fee Calculator System...\n');

async function runCommand(command: string, description: string) {
    console.log(`📋 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit', cwd: process.cwd() });
        console.log(`✅ ${description} completed\n`);
    } catch (error) {
        console.error(`❌ ${description} failed:`, error);
        throw error;
    }
}

async function setupDatabase() {
    console.log('🗄️ Database Setup');
    console.log('='.repeat(50));

    console.log('📝 Please run the following SQL in your Supabase SQL Editor:');
    console.log('   (Copy and paste the contents of src/lib/fee-calculator/database-schema.sql)');
    console.log('\n💡 This will create the required tables and views for the fee calculator.');
    console.log('   Press Enter when you have completed this step...');

    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
    });

    await new Promise(resolve => {
        process.stdin.once('data', () => resolve(void 0));
    });
}

async function migrateData() {
    console.log('\n📊 Data Migration');
    console.log('='.repeat(50));

    await runCommand(
        'npx tsx scripts/migrate-csv-data.ts',
        'Migrating CSV data to database'
    );
}

async function testCalculator() {
    console.log('\n🧪 Testing Calculator');
    console.log('='.repeat(50));

    await runCommand(
        'npx tsx scripts/test-fee-calculator.ts',
        'Running fee calculator tests'
    );
}

async function main() {
    try {
        // Step 1: Database setup
        await setupDatabase();

        // Step 2: Migrate data
        await migrateData();

        // Step 3: Test calculator
        await testCalculator();

        console.log('\n🎉 Fee Calculator setup completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Database schema created');
        console.log('   ✅ CSV data migrated');
        console.log('   ✅ Calculator tested');
        console.log('\n🚀 You can now use the fee calculator in your Lewis portal!');

    } catch (error) {
        console.error('\n💥 Setup failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure your Supabase environment variables are set');
        console.log('   2. Verify the database schema was created correctly');
        console.log('   3. Check that the CSV data migration completed successfully');
        process.exit(1);
    }
}

main();
