# Task: Implement Keyboard Navigation for Form Designer

## Overview
Implement comprehensive keyboard navigation support for the Form Designer, including tree navigation, node selection, and global shortcuts.

## Requirements

### 1. Add Navigation Helpers to formDesigner.ts Store

Add these helper functions to the formDesignerStore to support keyboard navigation:

#### Methods to Add:

```typescript
/**
 * Get the next visible node in tree order (depth-first traversal)
 * @param currentNodeId - Current selected node ID
 * @param expandedNodes - Set of expanded node IDs
 * @returns Next node ID or null if at end
 */
getNextVisibleNode(currentNodeId: string, expandedNodes: Set<string>): string | null

/**
 * Get the previous visible node in tree order
 * @param currentNodeId - Current selected node ID
 * @param expandedNodes - Set of expanded node IDs
 * @returns Previous node ID or null if at start
 */
getPrevVisibleNode(currentNodeId: string, expandedNodes: Set<string>): string | null

/**
 * Get the first root node ID
 * @returns First node ID or null if empty
 */
getFirstNode(): string | null

/**
 * Get the last visible node considering expansion state
 * @param expandedNodes - Set of expanded node IDs
 * @returns Last visible node ID or null if empty
 */
getLastVisibleNode(expandedNodes: Set<string>): string | null

/**
 * Get parent node ID
 * @param nodeId - Child node ID
 * @returns Parent node ID or null if root level
 */
getParentNodeId(nodeId: string): string | null

/**
 * Get first child ID of a node
 * @param nodeId - Parent node ID
 * @returns First child ID or null if no children
 */
getFirstChildId(nodeId: string): string | null

/**
 * Check if node has children
 * @param nodeId - Node ID to check
 * @returns True if node has children
 */
hasChildren(nodeId: string): boolean
```

### 2. Implement Global Keyboard Handler in FormDesigner.svelte

Add keyboard event handler for global shortcuts:

**Shortcuts:**
- **Delete/Backspace**: Delete selected node
  - Show confirmation if node has children
  - Only trigger when NOT in text input
- **Enter**: Focus property editor for selected node
  - Switch to 'properties' tab
- **Escape**: Deselect current node

**Safety Checks:**
- Don't trigger on INPUT, TEXTAREA, or contenteditable elements
- Check: `event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA'`
- Also check: `!event.target.isContentEditable`

**Implementation:**
```typescript
$effect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    // Skip if typing in input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable) {
      return;
    }

    // Handle shortcuts...
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
});
```

### 3. Enhance TreeView.svelte with Arrow Key Navigation

**Setup:**
- Add `tabindex="0"` to tree-view-content
- Add keyboard event handler
- Manage focus state

**Arrow Keys:**
- **Down Arrow**: Select next visible node
- **Up Arrow**: Select previous visible node
- **Right Arrow**:
  - Expand if collapsed
  - Select first child if already expanded
- **Left Arrow**:
  - Collapse if expanded
  - Select parent if already collapsed
- **Home**: Select first node
- **End**: Select last visible node

**Focus Management:**
- Scroll selected node into view
- Maintain focus when navigating
- Auto-focus when node selected externally

**Note:** expandedNodes state is at line 14 in TreeView.svelte

### 4. Add Focus Styles

Add CSS for keyboard focus:
```css
.tree-view-content:focus {
  outline: 2px solid var(--primary-color, #007bff);
  outline-offset: -2px;
}

.tree-view-content:focus-visible {
  outline: 2px solid var(--primary-color, #007bff);
}
```

## Files to Modify

1. `apps/web/src/lib/stores/formDesigner.ts` - Add navigation helpers
2. `apps/web/src/lib/components/designer/FormDesigner.svelte` - Global keyboard handler
3. `apps/web/src/lib/components/designer/TreeView.svelte` - Arrow key navigation

## Testing Checklist

- [ ] Down/Up arrows navigate through tree
- [ ] Right/Left arrows expand/collapse and navigate hierarchy
- [ ] Home/End go to first/last node
- [ ] Delete removes selected node
- [ ] Enter focuses property editor
- [ ] Escape deselects
- [ ] Shortcuts don't trigger when typing in inputs
- [ ] Focus indicators are visible
- [ ] Selected node scrolls into view

## Implementation Notes

- Use Svelte 5 syntax ($state, $derived, $effect)
- Maintain TypeScript types
- Don't modify clipboard operations (handled elsewhere)
- Don't modify undo/redo (handled elsewhere)
- Call event.preventDefault() for handled keys
- Consider edge cases (empty tree, single node, etc.)
