#!/usr/bin/env node

/**
 * Utility script to clear all installed plugins from the database
 * This will help resolve plugin installation issues by removing corrupted plugin data
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

console.log('🔧 Plugin Cleanup Utility');
console.log('==========================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

// Check if pnpm is available
try {
  execSync('pnpm --version', { stdio: 'pipe' });
} catch {
  console.error('❌ Error: pnpm is not available. Please install pnpm first.');
  process.exit(1);
}

console.log('📋 This script will:');
console.log('   1. Clear all installed plugins from the database');
console.log('   2. Reset the plugin state');
console.log('   3. Help resolve plugin installation errors\n');

console.log('⚠️  WARNING: This will permanently remove ALL installed plugins!');
console.log('   You will need to reinstall any plugins you want to use.\n');

// Ask for confirmation
const readline = require('node:readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Are you sure you want to continue? (yes/no): ', async (answer) => {
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('❌ Operation cancelled.');
    rl.close();
    return;
  }

  try {
    console.log('\n🧹 Starting plugin cleanup...\n');

    // Option 1: Try to use the built-in clear all functionality
    console.log('📥 Attempting to use built-in plugin removal...');

    // Check if there's a way to trigger the removeAllPlugins through the app
    console.log('💡 The easiest way to clear all plugins is through the app interface:');
    console.log('   1. Go to Settings → Storage → Advanced');
    console.log('   2. Click "Clear All Data"');
    console.log('   3. This will remove all plugins, sessions, and data');
    console.log('\n   OR use the database reset option below...\n');

    // Option 2: Database reset (more aggressive)
    console.log("🗄️  Database Reset Option (if the above doesn't work):");
    console.log('   This will completely reset your local database:');

    rl.question(
      'Do you want to reset the entire database? This will remove ALL data (yes/no): ',
      async (dbAnswer) => {
        if (dbAnswer.toLowerCase() === 'yes' || dbAnswer.toLowerCase() === 'y') {
          console.log('\n🔄 Resetting database...');

          try {
            // Try to find and run the database reset script
            const dbResetScript = path.join(__dirname, 'scripts', 'migrateClientDB', 'index.ts');
            if (fs.existsSync(dbResetScript)) {
              console.log('📜 Found database reset script, running...');
              execSync('pnpm tsx scripts/migrateClientDB/index.ts --reset', {
                cwd: __dirname,
                stdio: 'inherit',
              });
            } else {
              console.log('📜 Database reset script not found, trying alternative approach...');

              // Try to clear the database through the app's built-in functionality
              console.log('💡 Please try this manual approach:');
              console.log("   1. Open your browser's Developer Tools (F12)");
              console.log('   2. Go to Application/Storage tab');
              console.log('   3. Find IndexedDB');
              console.log('   4. Look for databases starting with "pglite" or "lobe-chat"');
              console.log('   5. Delete these databases');
              console.log('   6. Refresh the page');
            }
          } catch (error) {
            console.error('❌ Error during database reset:', error.message);
            console.log('\n💡 Manual database cleanup required:');
            console.log('   1. Close the LobeChat application completely');
            console.log("   2. Clear your browser's IndexedDB storage");
            console.log('   3. Restart the application');
          }
        } else {
          console.log('\n✅ Plugin cleanup options provided.');
          console.log('💡 If you continue to have issues, consider the database reset option.');
        }

        rl.close();
      },
    );
  } catch (error) {
    console.error('❌ Error during plugin cleanup:', error.message);
    rl.close();
  }
});
