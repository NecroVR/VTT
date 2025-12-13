# Session Notes: JSON Editor Implementation

**Date**: 2025-12-12
**Session ID**: 0086
**Topic**: Form Designer Phase 3.10 - JSON View/Editor Component

---

## Session Summary

Implemented the JSON View/Editor component for the Form Designer, allowing advanced users to directly edit form definitions as JSON. This provides an alternative to the visual editor for precise control, bulk operations, and learning how forms work.

---

## What Was Implemented

### 1. JsonEditor Component (`apps/web/src/lib/components/designer/JsonEditor.svelte`)

Created a new Svelte component with the following features:

#### Core Functionality
- **JSON Editing**: Large textarea with monospace font and dark theme styling
- **Line Numbers**: Visual line numbers for navigation
- **Syntax Validation**: Comprehensive JSON parsing and structure validation
- **Format/Prettify**: Button to format JSON with proper indentation (2 spaces)
- **Auto-sync Mode**: Optional real-time synchronization with visual editor
- **Apply/Discard**: Explicit control over when changes sync

#### Validation System
The component validates both syntax and structure:
- **JSON Syntax**: Catches parsing errors with detailed messages
- **Required Fields**: Validates presence of id, name, layout
- **Node Structure**: Recursively validates all layout nodes
  - Checks for required id and type fields
  - Validates children arrays
  - Validates tabs arrays
  - Validates itemTemplate (repeater nodes)
  - Validates conditional branches (then/else)
- **Type Checking**: Ensures fields are correct types (arrays, strings, objects)

#### User Experience
- **Status Indicators**: Shows "Synced" (green) or "Unsaved changes" (orange)
- **Error Display**: Clear validation error messages with dismiss button
- **Toolbar Actions**: Format, Validate, Auto-sync toggle, Discard, Apply
- **Help Text**: Footer with guidance on using the editor
- **Dark Theme**: Editor uses dark background for better readability

#### State Management
Uses Svelte 5 runes for reactive state:
- `$state` for local component state (jsonText, validationError, autoSync, hasUnsavedChanges)
- `$effect` to sync form changes to JSON text
- `$derived` for computed values from props

### 2. FormDesigner Integration

Updated `apps/web/src/lib/components/designer/FormDesigner.svelte`:

#### View Mode Toggle
- Added `viewMode` state: 'canvas' | 'json'
- Added JSON/Canvas toggle button in toolbar (only shown in Design mode)
- Conditional rendering: shows either JSON editor or visual canvas

#### JSON Apply Handler
- `handleJsonApply(formJson: string)`: Parses JSON and updates store
- Error handling with user-friendly messages
- Integrates with existing save error banner

#### Layout Structure
- JSON editor takes full available space when active
- Maintains existing three-panel layout for canvas mode
- Smooth transition between view modes

### 3. Store Methods

Added to `apps/web/src/lib/stores/formDesigner.ts`:

```typescript
updateFromJson(updatedForm: FormDefinition): void
```

- Updates the entire form from a parsed JSON object
- Adds to undo stack for rollback capability
- Marks form as dirty
- Validates input is a FormDefinition

---

## Files Created

1. **apps/web/src/lib/components/designer/JsonEditor.svelte**
   - Full JSON editor component
   - ~440 lines (including styles)
   - Comprehensive validation logic
   - Dark theme styling

---

## Files Modified

1. **apps/web/src/lib/components/designer/FormDesigner.svelte**
   - Added JsonEditor import
   - Added viewMode state and toggle
   - Added handleJsonApply function
   - Added conditional rendering for JSON view
   - Added JSON view styling

2. **apps/web/src/lib/stores/formDesigner.ts**
   - Added updateFromJson method
   - Integrates with existing undo/redo system

3. **docs/guides/form-designer-guide.md**
   - Added complete JSON Editor section
   - Documented features, workflow, and use cases
   - Added validation and error documentation
   - Included tips and best practices
   - ~100 lines of comprehensive documentation

---

## Key Implementation Decisions

### 1. Simple Syntax Highlighting Approach

**Decision**: Used a dark theme textarea with line numbers instead of a full code editor library.

**Rationale**:
- Monaco Editor or CodeMirror would be overkill for this use case
- Keeps bundle size small
- Simpler implementation and maintenance
- Good enough for JSON editing needs
- Can be enhanced later if needed

**Implementation**:
- Separate scrollable line numbers div
- Dark editor theme with syntax-appropriate colors
- Monospace font (Consolas, Monaco, Courier New)
- Custom scrollbar styling

### 2. Comprehensive Validation

**Decision**: Implemented deep validation of node structure, not just JSON syntax.

**Rationale**:
- Prevents users from creating invalid forms
- Catches errors before they cause runtime issues
- Provides specific error messages for debugging
- Validates all node types and their children

**Implementation**:
- Recursive `validateNode` function
- Checks required fields: id, type
- Validates children arrays in all node types
- Validates special structures: tabs, itemTemplate, then/else
- Returns detailed error messages with paths

### 3. Auto-sync as Optional Feature

**Decision**: Auto-sync is opt-in, not default behavior.

**Rationale**:
- Explicit apply gives users control
- Prevents accidental changes
- Better for complex multi-step edits
- Auto-sync available for power users who want it

**Implementation**:
- Checkbox toggle in toolbar
- When enabled, calls validateAndApply on every change
- When disabled, Apply button must be clicked
- Clear visual indicator of sync status

### 4. Integration as View Toggle

**Decision**: JSON editor is a view mode toggle, not a separate panel.

**Rationale**:
- Simpler UI with less clutter
- Full screen space for JSON editing
- Clear separation between visual and JSON workflows
- Easier to implement and maintain

**Implementation**:
- Toggle button in toolbar
- Conditional rendering in FormDesigner
- Persists in component state (not persisted across sessions)
- Only available in Design mode

### 5. Undo Integration

**Decision**: JSON changes integrate with existing undo/redo system.

**Rationale**:
- Consistent user experience
- Users can undo JSON changes just like visual changes
- Leverages existing undo infrastructure
- No special case needed

**Implementation**:
- updateFromJson calls pushToUndo
- Changes added to undo stack
- Redo stack cleared on new changes
- Works seamlessly with existing undo/redo buttons

---

## Testing Approach

While no automated tests were added (browser testing required), the component includes:

1. **Validation Testing Points**:
   - Valid JSON with complete structure
   - Invalid JSON syntax (missing comma, bracket)
   - Missing required fields (id, name, layout)
   - Invalid node structure (missing id, type)
   - Nested validation (children, tabs, etc.)

2. **User Interaction Testing Points**:
   - Format button with invalid/valid JSON
   - Validate button showing errors/success
   - Auto-sync toggle behavior
   - Apply button with valid/invalid changes
   - Discard button reverting changes
   - View mode toggle persistence

3. **Integration Testing Points**:
   - JSON to visual editor sync
   - Visual editor to JSON sync
   - Undo/redo with JSON changes
   - Save with JSON modifications
   - Error handling and display

---

## Usage Examples

### Example 1: Copying a Component

```json
// Find component in JSON
{
  "id": "strength-field",
  "type": "field",
  "fieldType": "number",
  "label": "Strength",
  "binding": "abilities.strength.value",
  "options": { "min": 1, "max": 20 }
}

// Copy and paste, change id
{
  "id": "dexterity-field",  // NEW ID
  "type": "field",
  "fieldType": "number",
  "label": "Dexterity",     // Changed label
  "binding": "abilities.dexterity.value",  // Changed binding
  "options": { "min": 1, "max": 20 }
}
```

### Example 2: Bulk Property Change

Using browser's Find & Replace (Ctrl+H / Cmd+H):
- Find: `"required": false`
- Replace: `"required": true`

This updates all fields at once.

### Example 3: Fine-tuning Grid Layout

```json
{
  "type": "grid",
  "columns": "minmax(150px, 1fr) minmax(150px, 1fr) minmax(100px, 200px)",
  "rowGap": "0.5rem",
  "columnGap": "1rem",
  "children": [...]
}
```

Direct JSON editing for precise CSS grid configurations.

---

## User Documentation

Added comprehensive JSON Editor section to `docs/guides/form-designer-guide.md`:

### Topics Covered
1. Accessing the JSON Editor
2. JSON Editor Features
3. Basic Workflow
4. Using Auto-sync Mode
5. Common Use Cases
6. When to Use JSON vs Visual Editor
7. Validation and Errors
8. Tips for JSON Editing

### Documentation Style
- Clear step-by-step instructions
- Visual examples where helpful
- Comparison of when to use each approach
- Troubleshooting guidance
- Best practices

---

## Known Limitations

1. **No Syntax Highlighting**: Uses dark theme but not true syntax highlighting
   - Could be enhanced with a simple highlighting library if needed
   - Current approach prioritizes simplicity and bundle size

2. **No Intellisense/Autocomplete**: Plain textarea without editor features
   - Users need to know the schema
   - Could add schema-based autocomplete later

3. **No Diff View**: Can't see visual diff between versions
   - Could add undo/redo preview
   - Could highlight changed sections

4. **No Search/Replace in Editor**: Uses browser's native find
   - Browser Ctrl+F / Cmd+F works fine
   - Could add dedicated search/replace UI

5. **Line Numbers Don't Scroll Sync**: Line numbers are static
   - Not perfectly aligned during scrolling
   - Good enough for most use cases

---

## Future Enhancements

Possible improvements for later phases:

1. **Syntax Highlighting**: Add lightweight JSON highlighting
   - Could use highlight.js or similar
   - Or implement simple regex-based highlighting

2. **Schema Validation**: Integrate with FormDefinition schema
   - Provide detailed type-level validation
   - Show available properties for each node type

3. **Error Location**: Highlight error line in editor
   - Scroll to error location
   - Visual indicator in line numbers

4. **JSON Diffing**: Show what changed
   - Visual diff between versions
   - Highlight modified sections

5. **Format on Apply**: Auto-format when applying
   - Ensure consistent formatting
   - Option to enable/disable

6. **Import/Export**: Download/upload JSON files
   - Save JSON to file
   - Load JSON from file
   - Share between campaigns

7. **JSON Templates**: Common patterns library
   - Quick insert of common structures
   - Example snippets

---

## Technical Notes

### Component Architecture

```
FormDesigner
├── viewMode state ('canvas' | 'json')
├── Toolbar (JSON/Canvas toggle button)
└── Conditional Rendering
    ├── JSON View → JsonEditor
    │   ├── Toolbar (Format, Validate, Auto-sync, Apply)
    │   ├── Error Banner
    │   ├── Editor (Line Numbers + Textarea)
    │   └── Footer (Help text)
    └── Canvas View → Designer Layout (existing)
```

### Data Flow

1. **Form → JSON**:
   - FormDesigner passes `store.form` to JsonEditor
   - JsonEditor serializes to JSON in $effect
   - Updates local `jsonText` state

2. **JSON → Form**:
   - User edits jsonText
   - Clicks Apply (or auto-sync triggers)
   - validateAndApply checks validity
   - Calls onApply callback with valid JSON string
   - FormDesigner parses and calls store.updateFromJson
   - Store updates form and adds to undo stack

3. **Sync Status**:
   - hasUnsavedChanges tracks local edits
   - Status indicator shows sync state
   - Apply/Discard buttons appear when unsaved

### Validation Logic

```typescript
validate() {
  // 1. Parse JSON (catch SyntaxError)
  const parsed = JSON.parse(jsonText);

  // 2. Check top-level structure
  - Must be object
  - Must have id, name (strings)
  - Must have layout (array)

  // 3. Recursively validate layout nodes
  validateNode(node, path) {
    - Must have id, type
    - Recursively validate:
      - children arrays
      - tabs arrays
      - itemTemplate arrays
      - then/else arrays
  }

  // 4. Return { valid, error? }
}
```

### Styling Approach

- **Dark Theme**: Editor background #1e1e1e (VS Code-like)
- **Line Numbers**: Separate scrolling column
- **Monospace Font**: Consolas, Monaco, Courier New
- **Syntax Colors**: Basic colors for readability
- **Toolbar**: Light background consistent with FormDesigner
- **Error Banner**: Red warning style
- **Status Indicators**: Color-coded (green/orange)

---

## Integration with Existing Systems

### Undo/Redo System
- JSON changes create undo snapshots
- Undo button works for JSON edits
- Redo stack cleared on new edits
- Seamless integration with visual editor undo

### Save System
- JSON changes mark form as dirty
- Save button enabled when isDirty
- Saves complete form including JSON changes
- No special case needed

### Error Handling
- Uses existing saveError banner
- JSON validation errors shown in editor
- Apply errors shown in error banner
- Clear error messaging

### Form State Management
- Uses existing formDesignerStore
- updateFromJson method follows store patterns
- Integrates with mode, selectedNode, etc.
- No conflicts with visual editor

---

## Current Status

### Completed
- JsonEditor component fully implemented
- FormDesigner integration complete
- Store methods added
- Documentation written
- Ready for browser testing

### Not Tested Yet
- Browser functionality (requires running dev server)
- Visual appearance and styling
- Validation error messages
- Auto-sync behavior
- View mode toggling

### Next Steps
1. Test in browser (pnpm run dev)
2. Verify all features work as expected
3. Test validation with various JSON errors
4. Test auto-sync behavior
5. Verify styling looks good
6. Fix any bugs found during testing

---

## Code Quality

### Svelte 5 Compliance
- Uses `$state` for reactive state
- Uses `$effect` for side effects
- Uses `$derived` for computed values (if needed)
- No deprecated Svelte syntax
- TypeScript throughout

### Code Organization
- Clear separation of concerns
- Validation logic in separate functions
- Event handlers well-named
- Comprehensive comments
- Consistent code style

### Error Handling
- Try-catch around JSON.parse
- Detailed error messages
- User-friendly error display
- Prevents invalid states

### Accessibility
- Line numbers marked aria-hidden
- Semantic HTML structure
- Clear button labels
- Error messages for screen readers

---

## Documentation Quality

### User Guide
- Step-by-step instructions
- Clear use case examples
- When to use each approach
- Troubleshooting section
- Tips and best practices

### Code Comments
- Component purpose documented
- Complex logic explained
- Props and state documented
- Function purposes clear

---

## Lessons Learned

1. **Keep It Simple**: A simple textarea approach works well for JSON editing. No need for heavy libraries.

2. **Validation Is Key**: Comprehensive validation prevents user frustration and bad data.

3. **User Control Matters**: Making auto-sync optional gives power users flexibility without confusing beginners.

4. **Integration Over Replacement**: JSON editor as an alternative view, not a replacement for visual editor.

5. **Documentation First**: Clear documentation helps users understand when and how to use advanced features.

---

## Related Documentation

- Form Designer User Guide: `docs/guides/form-designer-guide.md` (JSON Editor section)
- Form Types Reference: `packages/shared/src/types/forms.ts`
- FormDesigner Component: `apps/web/src/lib/components/designer/FormDesigner.svelte`
- FormDesigner Store: `apps/web/src/lib/stores/formDesigner.ts`

---

## Session End Status

**Implementation**: Complete
**Testing**: Pending (browser testing required)
**Documentation**: Complete
**Next Session**: Browser testing and bug fixes if needed

---

**Session Duration**: ~1 hour
**Files Created**: 1
**Files Modified**: 3
**Documentation Added**: ~100 lines
**Code Added**: ~440 lines
