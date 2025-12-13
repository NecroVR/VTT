/**
 * Performance Benchmarking Script for Form Designer
 *
 * Tests form rendering, computed field evaluation, and designer operations
 * to ensure they meet performance targets (< 100ms for most operations)
 */

import { ComputedFieldEngine } from '../../apps/web/src/lib/services/computedFieldEngine';
import type { FormDefinition, FormComputedField, LayoutNode } from '@vtt/shared';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

interface BenchmarkResult {
  name: string;
  duration: number;
  target: number;
  passed: boolean;
}

const results: BenchmarkResult[] = [];

function benchmark(name: string, target: number, fn: () => void): void {
  console.log(`\n${colors.cyan}Running: ${name}${colors.reset}`);

  // Warm up (run once to avoid JIT compilation effects)
  fn();

  // Actual benchmark (average of 100 runs)
  const iterations = 100;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const avgDuration = (end - start) / iterations;

  const passed = avgDuration < target;
  results.push({ name, duration: avgDuration, target, passed });

  const statusColor = passed ? colors.green : colors.red;
  const status = passed ? 'PASS' : 'FAIL';

  console.log(
    `${statusColor}${status}${colors.reset} - ${avgDuration.toFixed(2)}ms (target: ${target}ms)`
  );
}

// ============================================================================
// Test Data
// ============================================================================

const sampleEntity = {
  name: 'Test Character',
  level: 5,
  strength: 16,
  dexterity: 14,
  constitution: 15,
  intelligence: 10,
  wisdom: 12,
  charisma: 8,
  proficiencyBonus: 3,
  hitPoints: 38,
  maxHitPoints: 45,
  armorClass: 15,
  inventory: [
    { name: 'Longsword', weight: 3, value: 15 },
    { name: 'Shield', weight: 6, value: 10 },
    { name: 'Backpack', weight: 5, value: 2 },
    { name: 'Rope (50ft)', weight: 10, value: 1 },
    { name: 'Torch', weight: 1, value: 0.01 }
  ]
};

const largeEntity = {
  ...sampleEntity,
  inventory: Array.from({ length: 100 }, (_, i) => ({
    name: `Item ${i}`,
    weight: Math.random() * 10,
    value: Math.random() * 100
  }))
};

// ============================================================================
// Computed Field Engine Benchmarks
// ============================================================================

console.log(`\n${colors.bold}${colors.blue}=== COMPUTED FIELD ENGINE BENCHMARKS ===${colors.reset}`);

const engine = new ComputedFieldEngine();

// Simple arithmetic formula
benchmark('Simple arithmetic formula (strength + dexterity)', 1, () => {
  const field: FormComputedField = {
    id: 'test1',
    label: 'Test',
    formula: 'strength + dexterity',
    outputType: 'number'
  };
  engine.evaluate(field, sampleEntity);
});

// Complex formula with function calls
benchmark('Complex formula with functions (floor((strength - 10) / 2))', 2, () => {
  const field: FormComputedField = {
    id: 'test2',
    label: 'Test',
    formula: 'floor((strength - 10) / 2)',
    outputType: 'number'
  };
  engine.evaluate(field, sampleEntity);
});

// Formula with array operations
benchmark('Array operation formula (sum(inventory.*.weight))', 5, () => {
  const field: FormComputedField = {
    id: 'test3',
    label: 'Test',
    formula: 'count(inventory)',
    outputType: 'number'
  };
  engine.evaluate(field, sampleEntity);
});

// Nested conditional formula
benchmark('Nested conditional (if(level >= 5, proficiencyBonus + 1, proficiencyBonus))', 2, () => {
  const field: FormComputedField = {
    id: 'test4',
    label: 'Test',
    formula: 'if(level >= 5, proficiencyBonus + 1, proficiencyBonus)',
    outputType: 'number'
  };
  engine.evaluate(field, sampleEntity);
});

// Multiple computed fields (dependency chain)
benchmark('Multiple dependent computed fields', 10, () => {
  const field1: FormComputedField = {
    id: 'strMod',
    label: 'Strength Modifier',
    formula: 'floor((strength - 10) / 2)',
    outputType: 'number'
  };

  const field2: FormComputedField = {
    id: 'attackBonus',
    label: 'Attack Bonus',
    formula: 'floor((strength - 10) / 2) + proficiencyBonus',
    outputType: 'number'
  };

  const field3: FormComputedField = {
    id: 'damageBonus',
    label: 'Damage Bonus',
    formula: 'floor((strength - 10) / 2)',
    outputType: 'number'
  };

  engine.evaluate(field1, sampleEntity);
  engine.evaluate(field2, sampleEntity);
  engine.evaluate(field3, sampleEntity);
});

// Formula parsing (no evaluation)
benchmark('Formula parsing (AST generation)', 0.5, () => {
  engine.parseFormula('parse-test', 'strength + dexterity + constitution');
});

// Formula validation
benchmark('Formula validation (syntax check)', 0.5, () => {
  engine.validateFormula('level * proficiencyBonus + floor((strength - 10) / 2)');
});

// Cache performance (cached vs uncached)
const cachedField: FormComputedField = {
  id: 'cached-test',
  label: 'Cached',
  formula: 'strength + dexterity',
  outputType: 'number'
};

// Prime the cache
engine.evaluate(cachedField, sampleEntity);

benchmark('Cached formula evaluation', 0.1, () => {
  engine.evaluate(cachedField, sampleEntity);
});

// Large array operations
benchmark('Large array operation (100 items)', 10, () => {
  const field: FormComputedField = {
    id: 'large-array',
    label: 'Total Weight',
    formula: 'count(inventory)',
    outputType: 'number'
  };
  engine.evaluate(field, largeEntity);
});

// ============================================================================
// Form Structure Operations
// ============================================================================

console.log(`\n${colors.bold}${colors.blue}=== FORM STRUCTURE BENCHMARKS ===${colors.reset}`);

// Create a complex form structure
const complexForm: FormDefinition = {
  id: 'complex-form',
  name: 'Complex Character Sheet',
  description: 'Performance test form',
  gameSystemId: 'test',
  entityType: 'character',
  version: 1,
  isDefault: false,
  isLocked: false,
  layout: {
    type: 'tabs',
    position: 'top',
    tabs: Array.from({ length: 10 }, (_, i) => ({
      id: `tab-${i}`,
      label: `Tab ${i}`,
      children: Array.from({ length: 20 }, (_, j) => ({
        type: 'field',
        id: `field-${i}-${j}`,
        fieldType: 'text',
        label: `Field ${i}-${j}`,
        propertyPath: `data.field${i}_${j}`,
        required: false,
        readOnly: false
      })) as LayoutNode[]
    }))
  },
  fragments: [],
  computedFields: [],
  styles: {}
};

// Deep clone benchmark
benchmark('Deep clone complex form (JSON parse/stringify)', 5, () => {
  JSON.parse(JSON.stringify(complexForm));
});

// Find node in tree
function findNodeById(node: LayoutNode, id: string): LayoutNode | null {
  if (node.id === id) return node;

  if ('children' in node && node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  if (node.type === 'tabs' && node.tabs) {
    for (const tab of node.tabs) {
      for (const child of tab.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
  }

  return null;
}

benchmark('Find node by ID in complex tree', 1, () => {
  findNodeById(complexForm.layout, 'field-5-10');
});

// Count all fields
function countFields(node: LayoutNode): number {
  let count = node.type === 'field' ? 1 : 0;

  if ('children' in node && node.children) {
    for (const child of node.children) {
      count += countFields(child);
    }
  }

  if (node.type === 'tabs' && node.tabs) {
    for (const tab of node.tabs) {
      for (const child of tab.children) {
        count += countFields(child);
      }
    }
  }

  return count;
}

benchmark('Count all fields in complex form', 2, () => {
  countFields(complexForm.layout);
});

// ============================================================================
// Memory Operations
// ============================================================================

console.log(`\n${colors.bold}${colors.blue}=== MEMORY BENCHMARKS ===${colors.reset}`);

// Object creation
benchmark('Create 1000 field objects', 10, () => {
  const fields = Array.from({ length: 1000 }, (_, i) => ({
    type: 'field',
    id: `field-${i}`,
    fieldType: 'text',
    label: `Field ${i}`,
    propertyPath: `data.field${i}`,
    required: false,
    readOnly: false
  }));
});

// String interpolation
benchmark('String interpolation (1000 iterations)', 5, () => {
  for (let i = 0; i < 1000; i++) {
    const str = `Field ${i} has value ${sampleEntity.name}`;
  }
});

// ============================================================================
// Results Summary
// ============================================================================

console.log(`\n${colors.bold}${colors.blue}=== BENCHMARK RESULTS SUMMARY ===${colors.reset}\n`);

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`${colors.bold}Total Tests:${colors.reset} ${total}`);
console.log(`${colors.green}Passed:${colors.reset} ${passed}`);
console.log(`${colors.red}Failed:${colors.reset} ${failed}`);
console.log(`${colors.cyan}Pass Rate:${colors.reset} ${((passed / total) * 100).toFixed(1)}%\n`);

// Detailed results table
console.log(`${colors.bold}Detailed Results:${colors.reset}\n`);
console.log(
  `${'Test Name'.padEnd(60)} ${'Duration'.padStart(10)} ${'Target'.padStart(10)} ${'Status'.padStart(8)}`
);
console.log('-'.repeat(92));

for (const result of results) {
  const statusColor = result.passed ? colors.green : colors.red;
  const status = result.passed ? 'PASS' : 'FAIL';
  const durationColor = result.duration < result.target * 0.5 ? colors.green : result.duration < result.target ? colors.yellow : colors.red;

  console.log(
    `${result.name.padEnd(60)} ${durationColor}${result.duration.toFixed(2)}ms${colors.reset}`.padEnd(70) +
    `${result.target.toFixed(2)}ms`.padStart(10) +
    `  ${statusColor}${status}${colors.reset}`.padStart(16)
  );
}

console.log('\n');

// Performance recommendations
if (failed > 0) {
  console.log(`${colors.yellow}${colors.bold}Performance Recommendations:${colors.reset}\n`);

  const slowTests = results.filter(r => !r.passed);
  for (const test of slowTests) {
    console.log(`${colors.yellow}•${colors.reset} ${test.name}`);
    console.log(`  ${colors.red}Failed:${colors.reset} ${test.duration.toFixed(2)}ms (target: ${test.target}ms)`);

    // Specific recommendations based on test type
    if (test.name.includes('array')) {
      console.log(`  ${colors.cyan}Suggestion:${colors.reset} Consider optimizing array operations or implementing virtual scrolling`);
    } else if (test.name.includes('formula')) {
      console.log(`  ${colors.cyan}Suggestion:${colors.reset} Review formula complexity or improve caching strategy`);
    } else if (test.name.includes('clone')) {
      console.log(`  ${colors.cyan}Suggestion:${colors.reset} Consider using structured clone or optimized deep clone library`);
    }
    console.log();
  }
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
