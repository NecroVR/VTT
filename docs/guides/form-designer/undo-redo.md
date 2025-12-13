# Undo/Redo System - Form Designer

## Overview

The Form Designer includes a comprehensive undo/redo system that tracks all changes to your form design. This allows you to experiment freely, knowing you can always revert to previous states.

## Features

- **Unlimited Undo/Redo**: Navigate through your entire design history (up to 50 steps by default)
- **Keyboard Shortcuts**: Quick access with familiar shortcuts
- **Visual History Panel**: See all your changes in chronological order
- **Smart Navigation**: Jump to any point in history with a single click

## Keyboard Shortcuts

### Undo
- **Windows/Linux**: `Ctrl + Z`
- **macOS**: `Cmd + Z`

### Redo
- **Windows/Linux**: `Ctrl + Y` or `Ctrl + Shift + Z`
- **macOS**: `Cmd + Shift + Z`

**Note**: Keyboard shortcuts only work in Design mode, not in Preview mode.

## Using the History Panel

### Opening the History Panel

Click the "History" button in the toolbar to open the history panel. You can also close it at any time by:
- Clicking the X button
- Pressing the `Esc` key
- Clicking outside the panel

### Understanding the History Timeline

The history panel shows your form's timeline in three sections:

1. **Past Changes** (normal opacity)
   - Changes that have already been made
   - You can click any item to undo to that point

2. **Current State** (highlighted in blue)
   - Indicates where you are in the history timeline
   - Shows "Current state" label

3. **Future Changes** (faded appearance)
   - Changes that have been undone
   - You can click any item to redo to that point

### Navigating History

**To undo to a specific point**:
1. Open the history panel
2. Click on any past change
3. All changes after that point will be undone

**To redo to a specific point**:
1. Open the history panel
2. Click on any future change (grayed out)
3. Changes will be reapplied up to that point

### History Panel Information

At the bottom of the panel, you'll see:
- Number of undo steps available
- Number of redo steps available
- "Clear History" button to reset the timeline

## What Gets Tracked

The undo/redo system tracks all design operations including:

- Adding fields and components
- Deleting elements
- Moving components
- Updating properties
- Changing styles
- Pasting elements
- Fragment operations

**Not tracked**:
- Form name changes (tracked separately)
- Mode switches (Design/Preview)
- Panel state (open/closed)

## Configuration

### History Depth

By default, the system stores up to 50 undo/redo steps. This limit prevents excessive memory usage while still providing ample history.

The system automatically removes the oldest changes when this limit is reached, keeping the most recent history available.

## Tips and Best Practices

### Save Regularly

While undo/redo provides great flexibility during editing, remember to save your work regularly:
- Click the "Save" button in the toolbar
- Changes are only persisted to the database when you save
- The undo/redo history is cleared after a successful save

### Clearing History

Use the "Clear History" button in the history panel when:
- You want to start fresh after making major changes
- You want to free up memory (for very large forms)
- You've saved and want to reset your working state

**Warning**: Clearing history cannot be undone!

### Working with Large Forms

For complex forms with many elements:
- The undo system stores complete form snapshots
- Each operation creates a new snapshot
- Consider saving periodically to clear history and free memory

## Troubleshooting

### Keyboard Shortcuts Not Working

1. **Check mode**: Shortcuts only work in Design mode, not Preview mode
2. **Check focus**: Ensure the designer has focus (click somewhere in the designer first)
3. **Browser conflicts**: Some browser extensions may intercept keyboard shortcuts

### History Panel Not Showing Changes

If you don't see recent changes in the history panel:
- Verify you made trackable changes (see "What Gets Tracked" above)
- Try closing and reopening the panel
- Check that you didn't clear the history

### Can't Undo/Redo

If the undo/redo buttons are disabled:
- **Undo disabled**: You're at the beginning of history (no previous changes)
- **Redo disabled**: You're at the current state (no undone changes available)
- **After save**: History is cleared when you save successfully

## Technical Details

### How It Works

The undo/redo system uses a **snapshot-based approach**:

1. Before each operation, the current form state is saved
2. The operation is applied to create a new state
3. The previous state is stored in the undo stack
4. When you undo, the system restores the previous snapshot

### Memory Considerations

- Each snapshot stores a complete copy of the form definition
- The default limit of 50 steps balances usability with memory usage
- Saving the form clears the history to free memory
- Very large forms may want to save more frequently

### Undo/Redo Stack Behavior

- **New operations**: Add to undo stack, clear redo stack
- **Undo**: Moves current state to redo stack, restores from undo stack
- **Redo**: Moves current state to undo stack, restores from redo stack
- **Save**: Clears both stacks (starting fresh after successful save)

## Future Enhancements

Planned improvements to the undo/redo system:

- **Named snapshots**: Ability to bookmark specific states
- **Operation descriptions**: More detailed descriptions of what changed
- **Configurable depth**: Allow users to adjust the history limit
- **Diff view**: Visual comparison between states
- **Persistent history**: Save undo history with the form (optional)

## Related Documentation

- [Keyboard Shortcuts Guide](./keyboard-shortcuts.md) - Complete list of all keyboard shortcuts
- [Form Designer Overview](../../FORM_DESIGNER_GUIDE.md) - Main designer documentation
- [Performance Guide](./performance.md) - Optimizing large forms

## Feedback

Found an issue with the undo/redo system? Have suggestions for improvement?
Please open an issue on our GitHub repository or contact support.
