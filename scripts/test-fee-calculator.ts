#!/usr/bin/env tsx

/**
 * Script to test the Fee Calculator
 * Run with: npx tsx scripts/test-fee-calculator.ts
 */

import { testCalculator } from '../src/lib/fee-calculator/test-calculator';

async function main() {
    console.log('🧪 Running Fee Calculator Tests...\n');

    try {
        await testCalculator();
        console.log('\n🎉 All tests completed!');
    } catch (error) {
        console.error('\n💥 Test script failed:', error);
        process.exit(1);
    }
}

main();
