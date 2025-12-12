/**
 * Move G key handler from handleContextMenu to handleKeyDown where it belongs
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/src/lib/components/SceneCanvas.svelte');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove the G key handler from handleContextMenu (it's wrong there - MouseEvent doesn't have .key)
const wrongLocationPattern = /  function handleContextMenu\(e: MouseEvent\) \{\n    e\.preventDefault\(\);\n\n    \/\/ 'G' key - toggle grid snapping[\s\S]*?    \}\n\n    \/\/ Cancel if drawing walls/;
const fixedContextMenu = `  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();

    // Cancel if drawing walls`;

if (content.match(wrongLocationPattern)) {
  content = content.replace(wrongLocationPattern, fixedContextMenu);
  console.log('✓ Removed G key handler from handleContextMenu');
} else {
  console.log('⚠ G key handler not found in handleContextMenu or already removed');
}

// Add it to handleKeyDown in the correct location (after Delete/Backspace handler)
const correctLocationPattern = /(    \/\/ Delete\/Backspace - remove selected wall.*?\n      e\.preventDefault\(\);\n    \}\n  \})/s;
const gKeyHandler = `$1

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
    }`;

if (content.match(correctLocationPattern) && !content.includes("// 'G' key - toggle grid snapping")) {
  content = content.replace(correctLocationPattern, gKeyHandler);
  console.log('✓ Added G key handler to handleKeyDown');
} else {
  console.log('⚠ G key handler already in handleKeyDown or pattern not found');
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ G key handler location fixed!');
