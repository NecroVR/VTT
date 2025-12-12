/**
 * Fix missing <style> opening tag
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/src/lib/components/SceneCanvas.svelte');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find where the styles start (before the grid-snap-indicator class)
const styleStartPattern = /(\{\/if\}\n\n)\n  \.grid-snap-indicator/;

if (content.match(styleStartPattern)) {
  content = content.replace(styleStartPattern, '$1\n<style>\n  .grid-snap-indicator');
  console.log('✓ Added <style> opening tag');
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log('⚠ Pattern not found or already fixed');
}
