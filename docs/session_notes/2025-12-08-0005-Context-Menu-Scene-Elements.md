# Session Notes: Right-Click Context Menu for Scene Elements

**Date:** 2025-12-08
**Session ID:** 0005
**Topic:** Context Menu for Scene Elements

## Session Summary

Implemented a custom right-click context menu system for scene elements (tokens, lights, walls) to replace the default browser context menu with a VTT-specific menu featuring edit, visibility toggle, and delete options.

## Problems Addressed

- No way to quickly access element actions without opening config modals
- Browser default context menu appeared on right-click
- No quick visibility toggle for tokens
- No confirmation dialog for delete actions

## Solutions Implemented

### 1. SceneContextMenu Component
**File:** `apps/web/src/lib/components/SceneContextMenu.svelte`

A floating context menu component with:
- Position-aware rendering (adjusts to stay on screen)
- SVG icons for each action
- Three menu items:
  - **Edit Properties** - Opens the element's config modal
  - **Toggle Visibility** - Shows eye/eye-off icon based on current state
  - **Delete** - Red text, GM-only for lights/walls
- Closes on click outside or Escape key
- Smooth fade-in animation
- Dark theme styling with CSS variables

### 2. ConfirmDialog Component
**File:** `apps/web/src/lib/components/ConfirmDialog.svelte`

A reusable confirmation dialog with:
- Modal backdrop
- Customizable title, message, and button text
- Danger styling option (red confirm button)
- Focus trap for accessibility
- ARIA attributes for screen readers
- Keyboard support (Escape to cancel, Tab focus cycling)

### 3. SceneCanvas Integration
**File:** `apps/web/src/lib/components/SceneCanvas.svelte`

Modified the canvas to:
- Detect right-click on tokens, lights, and walls
- Show context menu at click position
- Handle menu actions:
  - Edit: Opens TokenConfig/LightingConfig modal
  - Toggle Visibility: Updates token visibility via WebSocket
  - Delete: Shows confirmation dialog, then removes via WebSocket
- Clear selections after delete

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/components/SceneContextMenu.svelte` | Created | Context menu component |
| `apps/web/src/lib/components/ConfirmDialog.svelte` | Created | Confirmation dialog component |
| `apps/web/src/lib/components/SceneCanvas.svelte` | Modified | Integration with context menu |

## Key Implementation Details

### Element Detection
The context menu uses the same element detection logic as left-click:
- **Tokens:** Circular hit test based on token radius
- **Lights:** Small radius hit test on light handle (GM only)
- **Walls:** Uses existing `findWallAtPoint` function (GM only)

### WebSocket Actions
All actions broadcast via existing WebSocket methods:
- `websocket.sendTokenUpdate()` - Visibility toggle
- `websocket.sendTokenRemove()` - Token deletion
- `websocket.sendLightRemove()` - Light deletion
- `websocket.sendWallRemove()` - Wall deletion

### GM Permissions
- Lights and walls only show context menu for GMs
- Delete option only shown for GMs
- Tokens can be edited by all users

## Testing Results

- Dev server compiles without errors
- HMR updates work correctly
- Docker build successful
- All containers running

## Current Status

**Complete.** The context menu feature is fully implemented and deployed.

## How to Use

1. Right-click on any token, light (GM), or wall (GM) in the scene
2. Select an action from the menu:
   - **Edit Properties** - Opens the configuration modal
   - **Make Invisible/Visible** - Toggles visibility (tokens only currently)
   - **Delete** - Removes the element after confirmation

## Future Enhancements

- Add visibility toggle for lights and walls when schema supports it
- Add "Duplicate" option to create copies of elements
- Add "Copy/Paste" functionality
- Consider adding element-specific options (e.g., "Toggle Door" for doors)

## Git Commit

```
feat(web): Add right-click context menu for scene elements

- Create SceneContextMenu component with edit, visibility toggle, and delete options
- Create reusable ConfirmDialog component for delete confirmations
- Integrate context menu with tokens, lights, and walls in SceneCanvas
- Add keyboard support (Escape to close) and click-outside-to-close behavior
- Position adjustment to keep menu visible within viewport
- GM-only access for lights, walls, and delete functionality
```

**Commit:** 3167c32
