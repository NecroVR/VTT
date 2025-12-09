#!/usr/bin/env python3
"""
Script to update grid snapping functions to account for grid offsets.
"""

import re

# Read the file
file_path = "D:/Projects/VTT/apps/web/src/lib/components/SceneCanvas.svelte"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for snapToGrid function
snap_to_grid_pattern = r'''  function snapToGrid\(x: number, y: number\): \{ x: number; y: number \} \{
    if \(!gridSnap\) return \{ x, y \};
    const gridSize = scene\.gridSize \?\? 100;
    const cellWidth = scene\.gridWidth \?\? gridSize;
    const cellHeight = scene\.gridHeight \?\? gridSize;
    return \{
      x: Math\.round\(x / cellWidth\) \* cellWidth,
      y: Math\.round\(y / cellHeight\) \* cellHeight,
    \};
  \}'''

snap_to_grid_replacement = '''  function snapToGrid(x: number, y: number): { x: number; y: number } {
    if (!gridSnap) return { x, y };
    const gridSize = scene.gridSize ?? 100;
    const cellWidth = scene.gridWidth ?? gridSize;
    const cellHeight = scene.gridHeight ?? gridSize;
    const offsetX = scene.gridOffsetX ?? 0;
    const offsetY = scene.gridOffsetY ?? 0;
    return {
      x: Math.round((x - offsetX) / cellWidth) * cellWidth + offsetX,
      y: Math.round((y - offsetY) / cellHeight) * cellHeight + offsetY,
    };
  }'''

# Pattern for snapToGridCenter function
snap_to_grid_center_pattern = r'''  function snapToGridCenter\(x: number, y: number\): \{ x: number; y: number \} \{
    const gridSize = scene\.gridSize \?\? 100;
    const cellWidth = scene\.gridWidth \?\? gridSize;
    const cellHeight = scene\.gridHeight \?\? gridSize;
    // Snap to center of cell \(add half grid size after rounding to corner\)
    return \{
      x: Math\.floor\(x / cellWidth\) \* cellWidth \+ cellWidth / 2,
      y: Math\.floor\(y / cellHeight\) \* cellHeight \+ cellHeight / 2,
    \};
  \}'''

snap_to_grid_center_replacement = '''  function snapToGridCenter(x: number, y: number): { x: number; y: number } {
    const gridSize = scene.gridSize ?? 100;
    const cellWidth = scene.gridWidth ?? gridSize;
    const cellHeight = scene.gridHeight ?? gridSize;
    const offsetX = scene.gridOffsetX ?? 0;
    const offsetY = scene.gridOffsetY ?? 0;
    // Snap to center of cell (add half grid size after rounding to corner)
    return {
      x: Math.floor((x - offsetX) / cellWidth) * cellWidth + cellWidth / 2 + offsetX,
      y: Math.floor((y - offsetY) / cellHeight) * cellHeight + cellHeight / 2 + offsetY,
    };
  }'''

# Apply replacements
content_updated = re.sub(snap_to_grid_pattern, snap_to_grid_replacement, content)
content_updated = re.sub(snap_to_grid_center_pattern, snap_to_grid_center_replacement, content_updated)

# Check if changes were made
if content_updated == content:
    print("ERROR: No changes were made. Patterns may not match.")
    # Try to find the functions
    if 'function snapToGrid' in content:
        print("Found snapToGrid function")
        # Get context around it
        idx = content.find('function snapToGrid')
        print(content[idx:idx+500])
    else:
        print("Could not find snapToGrid function")
else:
    print("Changes applied successfully")
    # Write the updated content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content_updated)
    print(f"Updated {file_path}")
