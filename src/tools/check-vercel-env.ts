#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

function checkVercelEnvironmentVariables() {
    console.log('🔍 Checking environment variables for Vercel deployment...\n');

    const requiredEnvVars = [
        'DATABASE_URL',
        'KEY_VAULTS_SECRET',
        'NEXT_PUBLIC_SERVICE_MODE',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'NEXT_PUBLIC_ENABLE_NEXT_AUTH',
        'AUTH_GOOGLE_CLIENT_ID'
    ];

    console.log('Required environment variables for Vercel:');
    console.log('==========================================\n');

    requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        const status = value ? '✅ Set' : '❌ Missing';
        const displayValue = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'Not set';
        
        console.log(`${status} ${envVar}: ${displayValue}`);
    });

    console.log('\n🔧 To fix the 500 errors, you need to set these environment variables in Vercel:');
    console.log('1. Go to your Vercel dashboard');
    console.log('2. Select your project (crewcut)');
    console.log('3. Go to Settings > Environment Variables');
    console.log('4. Add all the missing variables above');
    console.log('5. Redeploy the project');

    console.log('\n📋 Copy-paste commands for Vercel CLI (if you have it installed):');
    console.log('===============================================================');
    
    requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        if (value) {
            console.log(`vercel env add ${envVar} "${value}"`);
        }
    });
}

// Run the check
checkVercelEnvironmentVariables();
