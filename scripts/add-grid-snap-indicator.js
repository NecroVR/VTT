/**
 * Add visual grid snap indicator to SceneCanvas
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/src/lib/components/SceneCanvas.svelte');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Check if indicator already exists
if (content.includes('grid-snap-indicator')) {
  console.log('⚠ Grid snap indicator already exists');
  process.exit(0);
}

// Find the canvas-controls div with zoom-display and add grid snap indicator after it
const zoomDisplayPattern = /(<div class="canvas-controls">.*?<div class="zoom-display">.*?<\/div>)/s;
const indicatorHTML = `$1
    {#if gridSnapOverride !== null || effectiveGridSnap}
      <div class="grid-snap-indicator" class:active={effectiveGridSnap} class:override={gridSnapOverride !== null}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
        </svg>
        <span>{effectiveGridSnap ? 'Grid Snap ON' : 'Grid Snap OFF'}</span>
        {#if gridSnapOverride !== null}
          <span class="override-badge">Override</span>
        {/if}
      </div>
    {/if}`;

if (content.match(zoomDisplayPattern)) {
  content = content.replace(zoomDisplayPattern, indicatorHTML);
  console.log('✓ Added grid snap indicator HTML');
} else {
  console.error('✗ Could not find canvas-controls section');
  process.exit(1);
}

// Add CSS styles for the indicator
const styleEndPattern = /(<style>[\s\S]*?)(\n<\/style>)/;
const indicatorStyles = `
  .grid-snap-indicator {
    background-color: rgba(0, 0, 0, 0.7);
    color: #999;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s, background-color 0.2s;
  }

  .grid-snap-indicator.active {
    color: #4ade80;
    background-color: rgba(74, 222, 128, 0.1);
  }

  .grid-snap-indicator svg {
    flex-shrink: 0;
  }

  .grid-snap-indicator .override-badge {
    font-size: 10px;
    padding: 2px 6px;
    background-color: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    border-radius: 3px;
    margin-left: 4px;
  }
$2`;

if (content.match(styleEndPattern)) {
  content = content.replace(styleEndPattern, indicatorStyles);
  console.log('✓ Added grid snap indicator CSS');
} else {
  console.error('✗ Could not find style section');
  process.exit(1);
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Grid snap visual indicator added successfully!');
console.log('  • Indicator shows when grid snap is active or overridden');
console.log('  • Green when active, gray when inactive');
console.log('  • "Override" badge when temporary override is active');
