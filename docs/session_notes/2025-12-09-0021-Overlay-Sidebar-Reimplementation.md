# Session Notes: Overlay Sidebar Re-implementation

**Date**: 2025-12-09
**Session ID**: 0021
**Topic**: Re-implementing sidebar as overlay with floating window support

---

## Session Summary

Re-implemented the collapsible sidebar feature using an overlay approach (position: fixed) instead of the previous flexbox layout. The previous implementation (commit 3e283c8) broke canvas interactions because sidebar width changes affected the canvas container dimensions, causing coordinate mismatches. The new implementation ensures the canvas size is completely independent of sidebar state.

---

## Problems Addressed

### Primary Issue: Canvas Coordinate Mismatch
- **Root Cause**: Previous sidebar used flexbox layout where canvas had `flex: 1`
- **Symptom**: When sidebar collapsed/expanded, canvas dimensions changed but SceneCanvas only listened to `window.resize`, not container resize
- **Impact**: Token/light selection broke, canvas panning happened instead of element selection

### Solution Approach
1. Use `position: fixed` for sidebar to overlay canvas (not affect layout)
2. Add `ResizeObserver` to SceneCanvas as fallback for container changes
3. Make canvas container `width: 100%` instead of `flex: 1`

---

## Architecture

### Component Structure
```
apps/web/src/lib/components/sidebar/
├── FloatingWindow.svelte      # Draggable/resizable window container
├── OverlaySidebar.svelte      # Main sidebar with dock/undock/collapse
├── SidebarTabBar.svelte       # Tab buttons (horizontal and vertical modes)
├── WindowManager.svelte       # Manages popped-out tab windows
└── index.ts                   # Exports

apps/web/src/lib/components/icons/
├── ChatIcon.svelte
├── GearIcon.svelte
├── ImageIcon.svelte
├── PersonIcon.svelte
├── PopOutIcon.svelte
├── SwordsIcon.svelte
└── index.ts

apps/web/src/lib/stores/
└── sidebar.ts                 # State management for sidebar
```

### State Management (sidebar.ts)
```typescript
interface SidebarState {
  docked: boolean;           // true = fixed to right edge
  collapsed: boolean;        // true = narrow strip with icons
  floatingPosition: { x, y };
  floatingSize: { width, height };
  activeTabId: string;
  poppedOutTabs: Set<string>;
  highestZIndex: number;
}
```

### CSS Strategy
- Sidebar uses `position: fixed` with `z-index: 400`
- Canvas container is `width: 100%` (not affected by sidebar)
- Floating windows use `z-index: 500+`
- Modals use `z-index: 1000+`

---

## Files Created

| File | Purpose |
|------|---------|
| `sidebar/FloatingWindow.svelte` | Reusable draggable/resizable window |
| `sidebar/OverlaySidebar.svelte` | Main sidebar component |
| `sidebar/SidebarTabBar.svelte` | Tab button strip (expanded/collapsed) |
| `sidebar/WindowManager.svelte` | Manages floating tab windows |
| `sidebar/index.ts` | Component exports |
| `stores/sidebar.ts` | Sidebar state management |
| `icons/*.svelte` | Icon components for tabs |

## Files Modified

| File | Changes |
|------|---------|
| `SceneCanvas.svelte` | Added ResizeObserver for container resize detection |
| `+page.svelte` | Switched from TabbedSidebar to OverlaySidebar |

---

## Features Implemented

### 1. Overlay Positioning
- Sidebar floats above canvas with `position: fixed`
- Canvas dimensions unaffected by sidebar state changes
- No more coordinate mismatches

### 2. Docked Mode
- Fixed to right edge of screen
- Can be collapsed to 45px icon strip
- Smooth expand/collapse transitions

### 3. Undocked/Floating Mode
- Sidebar becomes draggable floating window
- Can be moved anywhere on screen
- Position/size persisted to localStorage

### 4. Tab Pop-out
- Individual tabs can be opened in separate windows
- Floating windows are draggable and resizable
- Closing window docks tab back to sidebar
- Multiple tabs can be popped out simultaneously

### 5. ResizeObserver Fallback
- SceneCanvas now observes its container element
- Detects size changes from any source
- Calls `resizeCanvases()` on container resize

### 6. State Persistence
- Docked/collapsed state saved to localStorage
- Floating position/size saved to localStorage
- Popped-out tabs tracked in store

---

## Testing Verification

After implementation, verified:
- [x] Build succeeds without errors
- [x] Docker containers start correctly
- [x] Web app accessible
- [x] Sidebar renders in docked position
- [x] Collapse/expand transitions work
- [x] Canvas layout not affected by sidebar

### User Testing Recommended
- Token selection with sidebar collapsed/expanded
- Light selection (GM only)
- Token/light dragging
- Sidebar undock and re-dock
- Tab pop-out and close
- Canvas panning and zooming
- Context menu positioning

---

## Key Technical Decisions

1. **Overlay vs Flexbox**: Used overlay to completely decouple sidebar from canvas layout
2. **ResizeObserver**: Added as safety net even though overlay shouldn't trigger resizes
3. **Separate WindowManager**: Keeps floating window logic isolated from main sidebar
4. **Store-based State**: Centralized state management for complex sidebar interactions
5. **localStorage Persistence**: User preferences preserved across sessions

---

## Commit Information

**Commit**: bac91b5
**Message**: `feat(ui): Re-implement sidebar as overlay with floating window support`
**Files Changed**: 18 (2081 insertions, 340 deletions)

---

## Current Status

- All features implemented
- Build passing
- Docker deployment successful
- Committed to master branch

---

## Next Steps (Future Sessions)

1. **User Testing**: Test all canvas interactions with new sidebar
2. **Keyboard Shortcuts**: Add Ctrl+B to toggle sidebar collapse
3. **Tab Icons**: Consider custom SVG icons for better visual recognition
4. **Flyout Preview**: Add hover preview for collapsed tabs (optional enhancement)
5. **Multi-monitor**: Handle window positions across multiple monitors

---

## Related Sessions

- `2025-12-09-0019-Collapsible-Sidebar-Implementation.md` - Original implementation (caused issues)
- `2025-12-09-0020-Select-Tool-Bug-Investigation.md` - Investigation and revert
