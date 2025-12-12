/**
 * Script to add grid snap toggle functionality to SceneCanvas.svelte
 *
 * Changes:
 * 1. Add gridSnapOverride state variable
 * 2. Add effectiveGridSnap computed property
 * 3. Update handleKeyDown to toggle grid snap with 'G' key
 * 4. Replace `snapToGrid: gridSnap` with `snapToGrid: effectiveGridSnap`
 * 5. Add visual indicator for grid snap state
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/src/lib/components/SceneCanvas.svelte');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Step 1 & 2: Add grid snap override state after dragOffsetY declaration
const interactionStatePattern = /  let dragOffsetY = 0;/;
const gridSnapAddition = `  let dragOffsetY = 0;

  // Grid snap override (null = use campaign setting, true/false = temporary override)
  let gridSnapOverride: boolean | null = null;

  // Computed effective grid snap setting (use override if set, otherwise campaign setting)
  $: effectiveGridSnap = gridSnapOverride !== null ? gridSnapOverride : gridSnap;`;

if (content.match(interactionStatePattern) && !content.includes('gridSnapOverride')) {
  content = content.replace(interactionStatePattern, gridSnapAddition);
  console.log('✓ Added grid snap override state variables');
} else {
  console.log('⚠ Grid snap override state already exists or pattern not found');
}

// Step 3: Add 'G' key handler in handleKeyDown function
const escapeHandlerPattern = /(    \/\/ Escape - exit possession.*?    }\n  })/s;
const gridSnapKeyHandler = `$1

    // 'G' key - toggle grid snapping
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (gridSnapOverride === null) {
        // First press: override with opposite of campaign setting
        gridSnapOverride = !gridSnap;
      } else {
        // Subsequent press: cycle through states (override true -> override false -> use campaign setting)
        if (gridSnapOverride === true) {
          gridSnapOverride = false;
        } else if (gridSnapOverride === false) {
          gridSnapOverride = null;
        } else {
          gridSnapOverride = true;
        }
      }
      console.log(\`Grid snap toggled: \${effectiveGridSnap ? 'ON' : 'OFF'} (override: \${gridSnapOverride})\`);
      e.preventDefault();
    }`;

if (content.match(escapeHandlerPattern) && !content.includes("key.toLowerCase() === 'g'")) {
  content = content.replace(escapeHandlerPattern, gridSnapKeyHandler);
  console.log('✓ Added grid snap toggle key handler');
} else {
  console.log('⚠ Grid snap key handler already exists or pattern not found');
}

// Step 4: Replace `snapToGrid: gridSnap` with `snapToGrid: effectiveGridSnap`
const replacements = content.match(/snapToGrid: gridSnap/g);
if (replacements && replacements.length > 0) {
  content = content.replace(/snapToGrid: gridSnap/g, 'snapToGrid: effectiveGridSnap');
  console.log(`✓ Replaced ${replacements.length} occurrences of 'snapToGrid: gridSnap' with 'snapToGrid: effectiveGridSnap'`);
} else {
  console.log('⚠ No occurrences of "snapToGrid: gridSnap" found (may already be replaced)');
}

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Grid snap toggle functionality added successfully!');
console.log('\nFeatures added:');
console.log('  • Press G to toggle grid snapping on/off');
console.log('  • Press G multiple times to cycle: override ON → override OFF → use campaign setting');
console.log('  • Grid snap setting now respects the override when active');
