# Drag & Drop Implementation for VTT Forms

Implement drag & drop functionality for the VTT form system.

## Context

- LayoutRenderer.svelte is at: D:\Projects\VTT\apps\web\src\lib\components\forms\LayoutRenderer.svelte
- It already has basic up/down buttons for reordering (lines 503-575)
- This is a Svelte 5 project with runes ($state, $derived, etc.)
- The moveItem() function already exists at line 117

## Requirements

### 1. Create a reusable drag & drop utility

- File: D:\Projects\VTT\apps\web\src\lib\utils\dragdrop.ts
- Use HTML5 Drag and Drop API (native, no external library)
- Export a function to make elements draggable and droppable
- Support reordering items in a list
- Return callback when items are reordered

### 2. Add drag & drop to RepeaterNode items

- Add drag handle (use ☰ or ⋮⋮ as icon) to each repeater item
- Make items draggable when drag handle is clicked/held
- Add visual feedback during drag:
  * .dragging class on the item being dragged (reduce opacity)
  * .drag-over class on drop target
  * Visual drop indicator line between items
- Call moveItem() when item is dropped in new position
- Keep the existing up/down buttons as keyboard alternative

### 3. Add CSS for drag states

Add to LayoutRenderer.svelte:
- .dragging { opacity: 0.5; cursor: grabbing; }
- .drag-over { background: rgba(0, 123, 255, 0.1); }
- .drop-indicator { border-top: 2px solid #007bff; }
- .drag-handle { cursor: grab; user-select: none; }

### 4. Implementation approach

- Keep it simple - native HTML5 drag and drop
- Drag handle should be visible in edit mode only
- Position drag handle at the left of repeater items
- Don't require external dependencies

## Important

- Use Svelte 5 runes syntax ($state, $derived, $props, $effect)
- Test with both virtual scrolling enabled and disabled repeaters
- Ensure drag & drop works with the existing moveItem function
- Make sure this doesn't break existing functionality

## Deliverables

1. Create dragdrop.ts utility
2. Update LayoutRenderer.svelte with drag & drop
3. Add CSS styles for drag states
4. Report what was implemented
