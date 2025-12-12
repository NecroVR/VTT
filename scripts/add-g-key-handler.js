/**
 * Add 'G' key handler for grid snap toggle
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/src/lib/components/SceneCanvas.svelte');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Check if handler already exists
if (content.includes("key.toLowerCase() === 'g'")) {
  console.log('⚠ Grid snap key handler already exists');
  process.exit(0);
}

// Find the line with "e.preventDefault();" after the Delete/Backspace handler
// and insert the G key handler before the closing brace of handleKeyDown
const lines = content.split('\n');
let insertIndex = -1;

// Find the Delete/Backspace handler section and its end
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Delete/Backspace - remove selected wall')) {
    // Find the matching closing brace and e.preventDefault()
    let braceCount = 0;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('{')) braceCount++;
      if (lines[j].includes('}')) braceCount--;
      if (braceCount === 0 && lines[j].includes('e.preventDefault();')) {
        insertIndex = j + 1; // Insert after this line
        break;
      }
    }
    break;
  }
}

if (insertIndex === -1) {
  console.error('✗ Could not find insertion point');
  process.exit(1);
}

// Insert the G key handler
const handlerCode = [
  '',
  "    // 'G' key - toggle grid snapping",
  "    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.altKey && !e.metaKey) {",
  "      if (gridSnapOverride === null) {",
  "        // First press: override with opposite of campaign setting",
  "        gridSnapOverride = !gridSnap;",
  "      } else {",
  "        // Subsequent presses: toggle between true and false",
  "        gridSnapOverride = !gridSnapOverride;",
  "      }",
  "      console.log(`Grid snap toggled: \\${effectiveGridSnap ? 'ON' : 'OFF'} (override: \\${gridSnapOverride}, campaign: \\${gridSnap})`);",
  "      e.preventDefault();",
  "    }"
];

lines.splice(insertIndex, 0, ...handlerCode);
content = lines.join('\n');

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Added G key handler for grid snap toggle');
console.log('  Location: After Delete/Backspace handler in handleKeyDown');
