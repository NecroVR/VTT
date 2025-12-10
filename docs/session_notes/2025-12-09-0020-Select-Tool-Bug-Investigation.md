# Session Notes: Select Tool Bug Investigation

**Date**: 2025-12-09
**Session ID**: 0020
**Topic**: Investigating and fixing select tool / token selection bug

## Session Summary

User reported that selecting "select" from the tool menu prevented selection and movement of lights and tokens. Investigation revealed the issue was caused by the collapsible sidebar feature introduced in commit `3e283c8`.

## Problems Addressed

### Primary Issue: Token/Light Selection Not Working
- **Symptom**: After clicking "select" from the tool menu, tokens and lights could not be selected or moved - the entire map would pan instead
- **Initial Investigation**: Added debug logging to `handleMouseDown` in SceneCanvas.svelte
- **Finding**: Debug logs showed `activeTool: select` and `isGM: true` were correct, ruling out tool state issues

### Secondary Issue: Sidebar Affecting Canvas Layout
- **Symptom**: Collapsing/expanding the sidebar caused the map to stretch or compress horizontally
- **Root Cause**: The sidebar's width changes affected the flexbox layout, but SceneCanvas only listened to `window.resize` events, not container resize events

## Root Cause Analysis

The collapsible sidebar feature (commit `3e283c8`) introduced several issues:

1. **Layout Changes**: When the sidebar collapsed from 350px to 45px, the canvas container expanded via `flex: 1`, but the canvas element didn't properly resize
2. **Coordinate Mismatch**: The canvas rendering and mouse coordinate transformations became misaligned because the canvas dimensions didn't match the container
3. **No ResizeObserver**: SceneCanvas only uses `window.addEventListener('resize', resizeCanvases)` - it doesn't detect when its container changes size due to sibling element changes

## Solution Applied

Reverted the collapsible sidebar changes:
```bash
git checkout HEAD~1 -- apps/web/src/lib/components/campaign/TabbedSidebar.svelte apps/web/src/routes/campaign/[id]/+page.svelte
```

This restored the simpler, non-collapsible sidebar that doesn't cause layout issues.

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/lib/components/campaign/TabbedSidebar.svelte` | Reverted to pre-collapse version |
| `apps/web/src/routes/campaign/[id]/+page.svelte` | Reverted to pre-collapse version |
| `apps/web/src/lib/components/SceneCanvas.svelte` | Removed debug logging |

## Testing Results

After reverting:
- Token selection: Working
- Light selection: Working
- Token/light movement: Working
- Context menu: Working
- Map layout: Stable, not affected by sidebar

## Next Steps: Re-implementing Collapsible Sidebar

When re-implementing the collapsible sidebar feature, the following must be addressed:

1. **Add ResizeObserver to SceneCanvas**: Instead of only listening to window resize, use a ResizeObserver on the canvas container to detect size changes from any source

```javascript
// In SceneCanvas.svelte onMount:
const resizeObserver = new ResizeObserver(() => {
  resizeCanvases();
});
resizeObserver.observe(container);

// In onDestroy:
resizeObserver.disconnect();
```

2. **Consider using CSS `position: absolute` for sidebar**: This would overlay the sidebar on top of the canvas rather than affecting the flex layout

3. **Test thoroughly**: After any sidebar changes, verify:
   - Token selection works
   - Light selection works (GM only)
   - Dragging tokens/lights works
   - Context menu appears at correct position
   - Canvas coordinates are accurate after resize

## Key Learnings

1. **Canvas coordinate systems are fragile**: Any change to the canvas container's size requires the canvas to recalculate its dimensions and coordinate transformations
2. **Flexbox layout changes can break canvas interaction**: When using `flex: 1` on a canvas container, sibling width changes affect the canvas
3. **Debug logging can be diagnostic**: The console.log statements helped confirm that tool state was correct, narrowing down the issue to canvas/coordinate problems
4. **Window resize != container resize**: Components that depend on their container size should use ResizeObserver, not window resize events

## Current Status

- Select tool working correctly
- All canvas interactions restored
- Collapsible sidebar feature removed (needs proper re-implementation)
- No uncommitted changes that need to be committed

## Pending User Action

None - system is functional. Collapsible sidebar can be re-implemented in a future session with proper ResizeObserver support.
