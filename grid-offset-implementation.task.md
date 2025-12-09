# Task: Implement Grid Offset Settings

## Objective
Add X and Y offset settings for the grid to help align it with background images.

## Requirements
1. Add grid offset settings (gridOffsetX and gridOffsetY) to the admin tab sideboard
2. Settings should appear BELOW the existing grid cell dimensions settings (after line 587 in AdminPanel.svelte)
3. Support positive and negative values
4. Use increment of 1 for adjustments
5. The offsets should affect grid rendering on the canvas

## Files to Modify

### 1. Database Schema
**File**: `D:\Projects\VTT\packages\database\src\schema\scenes.ts`
- Add `gridOffsetX: real('grid_offset_x').notNull().default(0)` after line 23
- Add `gridOffsetY: real('grid_offset_y').notNull().default(0)` after the gridOffsetX line

### 2. TypeScript Types
**File**: `D:\Projects\VTT\packages\shared\src\types\scene.ts`
- Add `gridOffsetX?: number;` after line 18 in the Scene interface
- Add `gridOffsetY?: number;` after the gridOffsetX line
- Add same fields to CreateSceneRequest interface (after line 52)
- Add same fields to UpdateSceneRequest interface (after line 78)

### 3. Admin Panel UI
**File**: `D:\Projects\VTT\apps\web\src\lib\components\campaign\AdminPanel.svelte`

Add reactive variables, local state, handler functions, and UI markup for grid offset controls.
Follow the same pattern as the Grid Cell Dimensions implementation.

### 4. Grid Rendering
**File**: `D:\Projects\VTT\apps\web\src\lib\components\SceneCanvas.svelte`

In the renderGrid function, apply offsets to both square and hex grid rendering.
Ensure negative offsets are handled correctly.

## Database Migration Required
After implementing the code changes, create a migration to add the new columns.

## Testing Steps
1. Rebuild the application: `pnpm run build`
2. Start Docker: `docker-compose up -d --build`
3. Open a campaign with an active scene
4. Go to Admin tab
5. Verify Grid Offset controls appear below Grid Cell Dimensions
6. Test adjusting X and Y offset values
7. Verify grid shifts appropriately on the canvas
8. Test with both positive and negative values
9. Test with both square and hexagonal grids

## Implementation Notes
- Follow the same pattern as the Grid Cell Dimensions implementation
- Use debounced updates to prevent excessive API calls
- Preserve cursor position during input editing
- Ensure offsets work with viewport transformations
- Default values should be 0 (no offset)

## Success Criteria
- Grid offset settings appear in Admin tab UI
- Settings persist when changed
- Grid rendering reflects offset values
- Both positive and negative offsets work correctly
- No errors in browser console
- Docker deployment succeeds
