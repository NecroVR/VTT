/**
 * Move G key handler INSIDE the handleKeyDown function
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/src/lib/components/SceneCanvas.svelte');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove the G key handler that's outside the function
const outsidePattern = /  \}\n\n    \/\/ 'G' key - toggle grid snapping[\s\S]*?    \}\n\n  function handleContextMenu/;
const withoutOutsideHandler = `  }

  function handleContextMenu`;

if (content.match(outsidePattern)) {
  content = content.replace(outsidePattern, withoutOutsideHandler);
  console.log('✓ Removed G key handler from outside function');
} else {
  console.log('⚠ G key handler not found outside function');
}

// Add it INSIDE handleKeyDown, before the closing brace
const insidePattern = /(      renderWalls\(\); \/\/ renderWalls also renders windows and doors\n      e\.preventDefault\(\);\n    \}\n)(  \})/;
const gKeyHandlerInside = `$1
    // 'G' key - toggle grid snapping
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (gridSnapOverride === null) {
        // First press: override with opposite of campaign setting
        gridSnapOverride = !gridSnap;
      } else {
        // Subsequent presses: toggle between true and false
        gridSnapOverride = !gridSnapOverride;
      }
      console.log(\`Grid snap toggled: \${effectiveGridSnap ? 'ON' : 'OFF'} (override: \${gridSnapOverride}, campaign: \${gridSnap})\`);
      e.preventDefault();
    }
$2`;

if (content.match(insidePattern) && !content.includes("    // 'G' key - toggle grid snapping")) {
  content = content.replace(insidePattern, gKeyHandlerInside);
  console.log('✓ Added G key handler INSIDE handleKeyDown function');
} else if (content.includes("    // 'G' key - toggle grid snapping")) {
  console.log('⚠ G key handler already inside function');
} else {
  console.log('⚠ Pattern not found');
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ G key handler is now in the correct location!');
