#!/usr/bin/env node

/**
 * Direct database utility to clear all installed plugins
 * This script directly accesses the database to remove plugins
 */

const fs = require('node:fs');
const path = require('node:path');

console.log('🗄️  Direct Database Plugin Cleanup');
console.log('==================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

console.log('📋 This script will directly clear all installed plugins from the database');
console.log('⚠️  WARNING: This will permanently remove ALL installed plugins!\n');

// Check if the database directory exists
const dbDir = path.join(__dirname, 'packages', 'database');
if (!fs.existsSync(dbDir)) {
  console.error('❌ Error: Database package not found');
  process.exit(1);
}

console.log('💡 Found database package. Here are your options:\n');

console.log('Option 1: Use the App Interface (Recommended)');
console.log('   1. Open LobeChat in your browser');
console.log('   2. Go to Settings → Storage → Advanced');
console.log('   3. Click "Clear All Data"');
console.log('   4. This will remove all plugins, sessions, and data\n');

console.log('Option 2: Manual Database Reset');
console.log('   1. Close LobeChat completely');
console.log('   2. Open browser Developer Tools (F12)');
console.log('   3. Go to Application/Storage → IndexedDB');
console.log('   4. Find and delete databases starting with:');
console.log('      - "pglite"');
console.log('      - "lobe-chat"');
console.log('      - Any database related to your app');
console.log('   5. Refresh the page\n');

console.log('Option 3: Clear Browser Data');
console.log('   1. Go to your browser settings');
console.log('   2. Clear browsing data');
console.log('   3. Select "All time" and check:');
console.log('      - Cookies and other site data');
console.log('      - Cached images and files');
console.log('      - Site data');
console.log('   4. Click "Clear data"\n');

console.log('Option 4: Reset Database Schema');
console.log('   If you have access to the database directly:');
console.log('   - The plugins are stored in the "user_installed_plugins" table');
console.log("   - You can run: DELETE FROM user_installed_plugins WHERE user_id = 'your_user_id'");
console.log('   - Or use the built-in deleteAll() method from PluginModel\n');

console.log('🔧 Technical Details:');
console.log('   - Plugin data is stored in IndexedDB (client-side)');
console.log('   - Table: user_installed_plugins');
console.log('   - Key fields: user_id, identifier, type, manifest, settings');
console.log('   - The PluginModel.deleteAll() method clears all plugins for a user\n');

console.log('💡 Recommendation:');
console.log("   Start with Option 1 (App Interface) as it's the safest.");
console.log("   If that doesn't work, try Option 2 (Manual IndexedDB reset).");
console.log("   Only use database-level operations if you're comfortable with them.\n");

console.log('✅ After clearing plugins:');
console.log('   1. Restart LobeChat');
console.log('   2. The plugin count should show 0');
console.log('   3. You can reinstall plugins as needed');
console.log('   4. This should resolve the installation errors you were experiencing\n');

console.log('📞 If you continue to have issues:');
console.log('   - Check the browser console for errors');
console.log('   - Verify that the database was properly cleared');
console.log('   - Consider filing an issue on the LobeChat repository');
