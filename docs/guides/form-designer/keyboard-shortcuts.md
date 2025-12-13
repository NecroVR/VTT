# Form Designer Keyboard Shortcuts

This guide covers all available keyboard shortcuts in the Form Designer to help you work more efficiently.

## Navigation Shortcuts (Tree View)

When the tree view is focused, you can navigate through your form structure using the keyboard:

### Arrow Keys

- **Down Arrow** - Select the next visible node in the tree
- **Up Arrow** - Select the previous visible node in the tree
- **Right Arrow** - Expand the selected node (if collapsed) or select its first child (if already expanded)
- **Left Arrow** - Collapse the selected node (if expanded) or select its parent (if already collapsed)

### Jump Navigation

- **Home** - Select the first node in the tree
- **End** - Select the last visible node in the tree

### Tips

- Use arrow keys to quickly navigate through your form structure
- The tree view automatically scrolls to keep the selected node visible
- The tree view must be focused (click on it or tab to it) for these shortcuts to work

## Editing Shortcuts

These shortcuts work globally when you're in design mode:

### Node Operations

- **Delete** or **Backspace** - Delete the currently selected node
  - If the node has children, you'll be prompted to confirm
  - This shortcut is disabled when typing in text inputs

- **Enter** - Focus the property editor for the selected node
  - Automatically switches to the Properties tab
  - Moves focus to the first input field in the property panel

- **Escape** - Deselect the currently selected node
  - Clears the selection and property editor

### Undo/Redo

- **Ctrl+Z** (or **Cmd+Z** on Mac) - Undo the last change
- **Ctrl+Y** (or **Cmd+Y** on Mac) - Redo the last undone change
- **Ctrl+Shift+Z** (or **Cmd+Shift+Z** on Mac) - Alternative redo shortcut

### Clipboard Operations

- **Ctrl+C** (or **Cmd+C** on Mac) - Copy the selected node to clipboard
  - Copies the entire node tree (including all children)
  - Shows a success notification when copied
  - Clipboard persists across forms (stored in localStorage)

- **Ctrl+X** (or **Cmd+X** on Mac) - Cut the selected node to clipboard
  - Copies the node and removes it from the layout
  - Can be undone with Ctrl+Z
  - Shows a success notification when cut

- **Ctrl+V** (or **Cmd+V** on Mac) - Paste from clipboard
  - If a node is selected, pastes as a child of the selected node
  - If no node is selected, pastes to the root level
  - Generates new unique IDs for all pasted nodes
  - Shows a notification when pasted
  - Can paste the same node multiple times

## Form Field Navigation (Preview Mode)

When previewing or editing a form in the form renderer:

- **Tab** - Move to the next form field
- **Shift+Tab** - Move to the previous form field

This follows standard HTML form navigation behavior.

## Power User Tips

### Efficient Workflow

1. **Navigate with keyboard** - Use arrow keys to move through the tree quickly
2. **Edit properties** - Press Enter to jump to the property editor
3. **Make changes** - Edit the properties using Tab to move between fields
4. **Exit and continue** - Press Escape to deselect and continue navigating

### Example Workflow

```
1. Click in tree view (or Tab to it)
2. Use Down/Up arrows to find the field you want to edit
3. Press Enter to edit properties
4. Tab through property fields, making changes
5. Press Escape to finish editing
6. Use Down arrow to select the next field
7. Repeat!
```

### Expanding/Collapsing Sections

- To expand a collapsed container: Select it and press Right Arrow
- To collapse an expanded container: Select it and press Left Arrow
- To navigate into a container: Press Right Arrow twice (once to expand, once to select first child)

### Using Copy/Paste Efficiently

Clipboard operations allow you to quickly duplicate form components:

**Duplicate a component within the same form:**
1. Select the node you want to copy
2. Press Ctrl+C to copy
3. Select the parent where you want to paste
4. Press Ctrl+V to paste

**Move a component:**
1. Select the node you want to move
2. Press Ctrl+X to cut
3. Select the destination parent
4. Press Ctrl+V to paste

**Copy components between forms:**
1. Open the first form, select and copy a component (Ctrl+C)
2. Open a different form
3. Press Ctrl+V to paste - the clipboard persists across forms!

**Create variations:**
- Copy a component, paste it, then modify the copy
- This is great for creating similar fields with slight differences
- The system automatically generates new unique IDs for all pasted nodes

## Accessibility

All keyboard shortcuts are designed to be accessible:

- Tree navigation uses proper ARIA attributes (role="tree", role="treeitem")
- Focus indicators clearly show which element has keyboard focus
- Screen reader users will hear proper labels and states

## Troubleshooting

### Shortcuts Not Working?

If keyboard shortcuts aren't responding:

1. **Check focus** - Make sure the tree view or designer is focused (not a text input)
2. **Check mode** - Global editing shortcuts only work in Design mode, not Preview mode
3. **Refresh** - If shortcuts stop working, try refreshing the page
4. **Browser conflicts** - Some browsers may override certain shortcuts

### Preventing Accidental Deletion

The Delete key includes protection against accidental data loss:

- Nodes with children will show a confirmation dialog
- The shortcut is disabled when typing in text fields
- You can always undo with Ctrl+Z

## Summary Reference Card

| Shortcut | Action |
|----------|--------|
| **Tree Navigation** |
| ↓ Down Arrow | Next node |
| ↑ Up Arrow | Previous node |
| → Right Arrow | Expand or enter |
| ← Left Arrow | Collapse or exit |
| Home | First node |
| End | Last node |
| **Editing** |
| Enter | Edit properties |
| Delete / Backspace | Delete node |
| Escape | Deselect |
| **Undo/Redo** |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+Z | Redo (alt) |
| **Clipboard** |
| Ctrl+C | Copy node |
| Ctrl+X | Cut node |
| Ctrl+V | Paste node |

---

*Last updated: 2025-12-12*
