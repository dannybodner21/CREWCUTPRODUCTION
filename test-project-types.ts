/**
 * Test the new project type configuration
 */

import { getAvailableProjectTypes, isProjectTypeSupported, getProjectTypeMessage, SUPPORTED_PROJECT_TYPES } from './src/lib/project-types-config';

console.log('🧪 TESTING PROJECT TYPE CONFIGURATION\n');
console.log('═'.repeat(80));

// Test 1: Get available types for each jurisdiction
console.log('\n📋 TEST 1: Available Project Types by Jurisdiction');
console.log('─'.repeat(80));

const jurisdictions = Object.keys(SUPPORTED_PROJECT_TYPES);
jurisdictions.forEach(jurisdiction => {
  const types = getAvailableProjectTypes(jurisdiction);
  console.log(`\n${jurisdiction}:`);
  types.forEach((type, i) => {
    console.log(`  ${i + 1}. ${type}`);
  });
});

// Test 2: Check supported vs unsupported types
console.log('\n\n✅ TEST 2: Project Type Support Checks');
console.log('─'.repeat(80));

const testCases = [
  { jurisdiction: 'Phoenix city', projectType: 'Commercial', expected: true },
  { jurisdiction: 'Phoenix city', projectType: 'Industrial', expected: true },
  { jurisdiction: 'Austin', projectType: 'Commercial', expected: false },
  { jurisdiction: 'Austin', projectType: 'Single-Family Residential', expected: true },
  { jurisdiction: 'Denver', projectType: 'Office', expected: false },
  { jurisdiction: 'Los Angeles', projectType: 'Multi-Family Residential', expected: true },
];

testCases.forEach(test => {
  const result = isProjectTypeSupported(test.jurisdiction, test.projectType);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.jurisdiction} + ${test.projectType}: ${result ? 'Supported' : 'Not Supported'}`);
});

// Test 3: Messages
console.log('\n\n💬 TEST 3: User Messages');
console.log('─'.repeat(80));

jurisdictions.forEach(jurisdiction => {
  const message = getProjectTypeMessage(jurisdiction);
  if (message) {
    console.log(`\n${jurisdiction}:`);
    console.log(`  ${message}`);
  } else {
    console.log(`\n${jurisdiction}: No message (has commercial/industrial support)`);
  }
});

// Test 4: Edge cases
console.log('\n\n🔍 TEST 4: Edge Cases');
console.log('─'.repeat(80));

console.log('\nEmpty jurisdiction:');
const emptyTypes = getAvailableProjectTypes('');
console.log(`  Result: ${emptyTypes.length} types (expected: 0)`);

console.log('\nUnknown jurisdiction:');
const unknownTypes = getAvailableProjectTypes('Unknown City');
console.log(`  Result: ${unknownTypes.length} types`);
console.log('  Types:', unknownTypes);

console.log('\n\n═'.repeat(80));
console.log('✨ Testing Complete!');
console.log('═'.repeat(80));
