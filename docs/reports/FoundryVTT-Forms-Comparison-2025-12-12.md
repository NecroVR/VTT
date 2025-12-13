# FoundryVTT vs VTT Forms System - Comprehensive Comparison & Improvement Plan

**Date:** 2025-12-12
**Author:** Claude Opus 4.5
**Purpose:** Detailed comparison of FoundryVTT's form system patterns with our VTT implementation to identify improvements

---

## Executive Summary

Our VTT form system is **significantly more advanced** than FoundryVTT in several key areas:
- **Visual Designer**: We have a full WYSIWYG form builder; Foundry uses manual Handlebars templates
- **Dynamic Layouts**: 15+ layout node types vs Foundry's manual HTML/CSS
- **Modern Stack**: Svelte 5 with reactivity vs Handlebars templates
- **Advanced Features**: Computed fields, fragments, virtual scrolling, conditional rendering

**However**, FoundryVTT has established patterns we should adopt:
- **CSS utility classes** for common form patterns (`.form-group`, `.stacked`, `.inline`)
- **Handlebars-style helpers** as reusable field components
- **Data-attribute conventions** for actions and events
- **Better accessibility patterns** with ARIA and label associations
- **Specialized input components** (`<file-picker>`, `<color-picker>`, `<range-picker>`)

---

## Feature Comparison Matrix

### 1. Layout Systems

| Feature | FoundryVTT | Our VTT | Winner |
|---------|------------|---------|--------|
| **Grid Layout** | Manual CSS Grid | `GridNode` with config | **VTT** |
| **Flexbox Layout** | Manual CSS Flex | `FlexNode` with config | **VTT** |
| **Tabs** | data-tab attributes | `TabsNode` with lazy rendering | **VTT** |
| **Sections** | Manual `<section>` | `SectionNode` with collapse | **VTT** |
| **Columns** | Manual CSS | `ColumnsNode` with widths | **VTT** |
| **Visual Designer** | None (manual HTML) | Full WYSIWYG designer | **VTT** |
| **CSS Utility Classes** | Extensive (`.form-group`, `.stacked`) | Limited | **Foundry** |

**Analysis**: We win on functionality and ease-of-use, but lack standardized CSS utilities.

---

### 2. Field Types

| Field Type | FoundryVTT | Our VTT | Notes |
|------------|------------|---------|-------|
| **Text** | `{{formInput}}` helper | `text` FieldNode | Both have |
| **Number** | `{{numberInput}}` helper | `number` FieldNode | Both have |
| **Checkbox** | `{{formInput type="checkbox"}}` | `checkbox` FieldNode | Both have |
| **Select** | `{{selectOptions}}` helper | `select` FieldNode | Both have |
| **Textarea** | `{{formInput type="textarea"}}` | `textarea` FieldNode | Both have |
| **Range/Slider** | `<range-picker>` custom element | `slider` FieldNode | Both have |
| **Color Picker** | `<color-picker>` custom element | `color` FieldNode | Both have |
| **File Picker** | `<file-picker>` custom element | `image` FieldNode (URL only) | **Foundry better** |
| **Multi-Select** | `<multi-select>` custom element | Not implemented | **Missing** |
| **Code Editor** | `<code-mirror>` custom element | Not implemented | **Missing** |
| **Dice Notation** | None | `dice` FieldNode | **VTT** |
| **Resource Bar** | None | `resource` FieldNode | **VTT** |
| **Rating** | None | `rating` FieldNode | **VTT** |
| **Tags** | None | `tags` FieldNode | **VTT** |
| **Rich Text** | `<editor>` ProseMirror | `richtext` FieldNode (basic) | **Foundry better** |
| **Reference** | Manual autocomplete | `reference` FieldNode (basic) | Both basic |
| **Date** | HTML5 date input | `date` FieldNode | Both have |
| **Computed** | None | `computed` FieldNode | **VTT** |

**Analysis**: We have more specialized field types (dice, resource, rating, tags), but lack file picker and rich code editor.

---

### 3. Advanced Features

| Feature | FoundryVTT | Our VTT | Winner |
|---------|------------|---------|--------|
| **Repeaters** | Manual array iteration | `RepeaterNode` with virtual scrolling | **VTT** |
| **Conditionals** | `#if` in templates | `ConditionalNode` with operators | **VTT** |
| **Fragments** | Handlebars partials | `FormFragment` with parameters | **VTT** |
| **Computed Fields** | Manual JavaScript | `FormComputedField` with formulas | **VTT** |
| **Localization** | `game.i18n.localize()` | `LocalizedString` with resolver | **Tie** |
| **Visibility Conditions** | Manual `#if` | `VisibilityCondition` system | **VTT** |
| **Drag & Drop** | Built into platform | Not implemented | **Foundry** |
| **Context Menus** | Built into platform | Not implemented | **Foundry** |
| **Virtual Scrolling** | None | `RepeaterNode` (20+ items) | **VTT** |
| **Lazy Tab Rendering** | None | Built-in | **VTT** |

**Analysis**: We excel at data-driven features, but lack platform integration patterns.

---

### 4. Styling & Theming

| Feature | FoundryVTT | Our VTT | Winner |
|---------|------------|---------|--------|
| **Built-in Themes** | None (system-dependent) | 5 themes (default, dark, light, parchment, custom) | **VTT** |
| **CSS Variables** | Platform-wide variables | Scoped form variables | **Tie** |
| **Custom CSS** | Global styles only | Scoped + sanitized | **VTT** |
| **Utility Classes** | Extensive (`.form-group`, `.stacked`, `.inline`, `.slim`) | Limited | **Foundry** |
| **Responsive Design** | CSS-based | CSS-based | **Tie** |
| **CSS Sanitization** | None | Full XSS prevention | **VTT** |

**Analysis**: We have better theming architecture, but lack utility class conventions.

---

### 5. Developer Experience

| Feature | FoundryVTT | Our VTT | Winner |
|---------|------------|---------|--------|
| **Visual Designer** | None | Full WYSIWYG | **VTT** |
| **Template Syntax** | Handlebars | JSON config | **Tie** |
| **Reusability** | Partials | Fragments | **Tie** |
| **Type Safety** | None | Full TypeScript | **VTT** |
| **Documentation** | Extensive | Growing | **Foundry** |
| **Examples** | Many community templates | Built-in D&D 5e templates | **Tie** |
| **Learning Curve** | Steep (Handlebars) | Moderate (Designer) | **VTT** |

**Analysis**: Our visual designer makes form creation accessible to non-developers.

---

### 6. Accessibility

| Feature | FoundryVTT | Our VTT | Assessment |
|---------|------------|---------|------------|
| **ARIA Labels** | Manual but documented | Auto-generated from labels | **VTT better** |
| **ARIA Described By** | Manual | Auto-generated for help text | **VTT better** |
| **ARIA Required** | Manual | Auto-generated | **VTT better** |
| **ID Generation** | `rootId` pattern | `field-{node.id}` | **Tie** |
| **Focus Management** | Manual | Built into components | **VTT better** |
| **Keyboard Navigation** | Platform-standard | Component-based | **Tie** |
| **Screen Reader Support** | Good | Good | **Tie** |

**Analysis**: Our auto-generation makes accessibility easier and more consistent.

---

## FoundryVTT Patterns We Should Adopt

### 1. CSS Utility Classes

FoundryVTT has excellent form layout utilities we're missing:

```css
/* Form Groups - Container for label + input */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.form-group.stacked {
  flex-direction: column;
  gap: 0.25rem;
}

.form-group.inline {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.form-group.slim {
  margin-bottom: 0.25rem;
  gap: 0.125rem;
}

/* Form Fields Container */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-fields.stacked {
  gap: 0.75rem;
}

.form-fields.inline {
  flex-direction: row;
  gap: 1rem;
}

/* Form Header */
.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-color);
}

/* Form Footer */
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--surface-color);
}

/* Standard Form Container */
.standard-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.standard-form .form-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}
```

**Recommendation**: Add these as built-in CSS classes in our form renderer.

---

### 2. Data Attribute Conventions

FoundryVTT uses data attributes extensively for event delegation:

```html
<!-- Action delegation -->
<button data-action="rollDice">Roll</button>
<button data-action="deleteItem" data-item-id="abc123">Delete</button>

<!-- Tab system -->
<nav class="tabs">
  <a class="item" data-tab="stats">Stats</a>
  <a class="item" data-tab="inventory">Inventory</a>
</nav>
<div class="tab" data-tab="stats" data-group="main">...</div>

<!-- Tooltip system -->
<span data-tooltip="This is a helpful tooltip">?</span>
```

**Recommendation**: Add `data-action` support to our form system for custom events.

---

### 3. Specialized Input Components

FoundryVTT has custom elements we should consider:

**File Picker Component:**
```html
<file-picker type="image" target="system.image">
  <input name="system.image" type="text" value="path/to/image.jpg" />
</file-picker>
```

**Color Picker Component:**
```html
<color-picker name="system.color" value="#ff0000">
  <input type="text" name="system.color" value="#ff0000" />
  <input type="color" value="#ff0000" />
</color-picker>
```

**Range Picker Component:**
```html
<range-picker name="system.level" value="5" min="1" max="20" step="1">
  <input type="range" value="5" />
  <span class="range-value">5</span>
</range-picker>
```

**Multi-Select Component:**
```html
<multi-select name="system.skills">
  <optgroup label="Physical">
    <option value="athletics">Athletics</option>
    <option value="acrobatics">Acrobatics</option>
  </optgroup>
</multi-select>
```

**Recommendation**: Enhance our field types with these patterns.

---

### 4. Form Field Helpers Pattern

FoundryVTT uses Handlebars helpers to standardize field rendering. We can adopt similar **component composition**:

**Foundry Pattern:**
```handlebars
{{formGroup label="Hit Points" required=true}}
  {{numberInput name="system.hp.value" value=system.hp.value min=0}}
{{/formGroup}}
```

**Our Equivalent (Component Pattern):**
```typescript
// FieldGroup component wrapper
interface FieldGroupNode extends BaseLayoutNode {
  type: 'fieldGroup';
  layout: 'stacked' | 'inline' | 'slim';
  label?: LocalizedString;
  helpText?: LocalizedString;
  required?: boolean;
  children: LayoutNode[];
}
```

**Recommendation**: Add `FieldGroupNode` layout type for better field organization.

---

### 5. Nested Field Naming Convention

FoundryVTT uses dot notation with array syntax for nested data:

```javascript
// Data structure
{
  system: {
    attributes: {
      strength: { value: 10, mod: 0 }
    },
    skills: [
      { name: "Athletics", bonus: 5 },
      { name: "Acrobatics", bonus: 3 }
    ]
  }
}

// Field names
"system.attributes.strength.value"
"system.skills.0.name"
"system.skills.1.bonus"
```

We already support this with `{{index}}` in repeaters. Good!

---

## Priority-Ranked Improvement Recommendations

### Phase 1: CSS Utility Classes (HIGH PRIORITY)

**Impact**: High
**Effort**: Low
**Why**: Provides immediate styling consistency and developer convenience

**Implementation:**
1. Create `D:/Projects/VTT/apps/web/src/lib/styles/form-utilities.css`
2. Add utility classes: `.form-group`, `.form-fields`, `.form-header`, `.form-footer`, `.stacked`, `.inline`, `.slim`
3. Import in `FormRenderer.svelte`
4. Update documentation with examples

**Estimated Time**: 2-3 hours

---

### Phase 2: Enhanced Field Types (HIGH PRIORITY)

**Impact**: High
**Effort**: Medium
**Why**: Fills gaps in functionality compared to FoundryVTT

**New Field Types to Add:**

1. **Multi-Select Field**
   ```typescript
   fieldType: 'multiselect';
   options: {
     options: { value: string; label: LocalizedString; group?: string }[];
     max?: number;  // Maximum selections
   }
   ```

2. **File Upload Field** (with actual file handling)
   ```typescript
   fieldType: 'file';
   options: {
     accept?: string;  // MIME types
     maxSize?: number;
     preview?: boolean;
     uploadPath?: string;
   }
   ```

3. **Code Editor Field**
   ```typescript
   fieldType: 'code';
   options: {
     language?: 'javascript' | 'json' | 'html' | 'css';
     height?: string;
     lineNumbers?: boolean;
   }
   ```

**Estimated Time**: 8-12 hours

---

### Phase 3: FieldGroup Layout Node (MEDIUM PRIORITY)

**Impact**: Medium
**Effort**: Low
**Why**: Standardizes field layout patterns

**Implementation:**
```typescript
export interface FieldGroupNode extends BaseLayoutNode {
  type: 'fieldGroup';
  layout?: 'stacked' | 'inline' | 'slim';  // Default: 'stacked'
  label?: LocalizedString;
  helpText?: LocalizedString;
  required?: boolean;
  showBorder?: boolean;
  children: LayoutNode[];  // Usually one FieldNode
}
```

**Benefits:**
- Consistent label/field/help-text layout
- Reduces boilerplate in form definitions
- Matches Foundry's `formGroup` helper pattern

**Estimated Time**: 4-6 hours

---

### Phase 4: Data Action System (MEDIUM PRIORITY)

**Impact**: Medium
**Effort**: Medium
**Why**: Enables custom button actions and event delegation

**Implementation:**
```typescript
export interface ActionNode extends BaseLayoutNode {
  type: 'action';
  actionType: 'button' | 'link';
  action: string;  // Action name (e.g., 'rollDice', 'deleteItem')
  label: LocalizedString;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  parameters?: Record<string, unknown>;
}
```

**Usage:**
```typescript
{
  type: 'action',
  actionType: 'button',
  action: 'rollDice',
  label: { literal: 'Roll Attack' },
  parameters: { diceFormula: '{{attack.dice}}' }
}
```

**Estimated Time**: 6-8 hours

---

### Phase 5: Enhanced Color Picker (LOW PRIORITY)

**Impact**: Low
**Effort**: Low
**Why**: Our color picker is functional but could be better

**Enhancements:**
1. Add opacity/alpha channel support
2. Add HSL/RGB input modes
3. Add eyedropper tool (browser API)
4. Add recent colors history

**Estimated Time**: 3-4 hours

---

### Phase 6: Enhanced Rich Text Editor (LOW PRIORITY)

**Impact**: Medium
**Effort**: High
**Why**: Our current rich text is basic markdown textarea

**Options:**
1. Integrate TinyMCE (like Foundry)
2. Integrate ProseMirror
3. Integrate Tiptap (modern, extensible)

**Recommendation**: Use **Tiptap** - it's modern, Svelte-friendly, and extensible.

**Estimated Time**: 12-16 hours

---

### Phase 7: Drag & Drop Support (LOW PRIORITY)

**Impact**: Low
**Effort**: High
**Why**: Nice-to-have for inventory management

**Implementation:**
- Add drag handles to repeater items
- Add drop zones for entity references
- Add visual feedback during drag
- Add drag-to-reorder for tabs

**Estimated Time**: 10-15 hours

---

## CSS Utility Classes - Detailed Specification

Create: `D:/Projects/VTT/apps/web/src/lib/styles/form-utilities.css`

```css
/**
 * Form Utility Classes
 *
 * Standard CSS utilities for form layouts, inspired by FoundryVTT patterns
 * but adapted for our Svelte-based system.
 */

/* ============================================================================
   FORM CONTAINERS
   ============================================================================ */

/**
 * Standard form container - full height with content/footer
 */
.standard-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--form-bg-color, #ffffff);
  color: var(--form-text-color, #212529);
}

.standard-form .form-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--form-spacing-md, 1rem);
}

.standard-form .form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--form-spacing-sm, 0.5rem) var(--form-spacing-md, 1rem);
  border-bottom: 1px solid var(--form-border-color, #dee2e6);
  background: var(--form-surface-color, #f8f9fa);
}

.standard-form .form-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--form-spacing-sm, 0.5rem);
  padding: var(--form-spacing-sm, 0.5rem) var(--form-spacing-md, 1rem);
  border-top: 1px solid var(--form-border-color, #dee2e6);
  background: var(--form-surface-color, #f8f9fa);
}

/* ============================================================================
   FORM GROUPS
   ============================================================================ */

/**
 * Form group - container for label + input + help text
 * Default: stacked (label above input)
 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--form-spacing-xs, 0.25rem);
  margin-bottom: var(--form-spacing-sm, 0.5rem);
}

/**
 * Explicit stacked layout (default)
 */
.form-group.stacked {
  flex-direction: column;
  gap: var(--form-spacing-xs, 0.25rem);
}

/**
 * Inline layout - label and input side-by-side
 */
.form-group.inline {
  flex-direction: row;
  align-items: center;
  gap: var(--form-spacing-sm, 0.5rem);
}

.form-group.inline > label {
  flex: 0 0 auto;
  min-width: 120px;
  margin-bottom: 0;
}

.form-group.inline > input,
.form-group.inline > select,
.form-group.inline > textarea {
  flex: 1 1 auto;
}

/**
 * Slim layout - minimal spacing
 */
.form-group.slim {
  margin-bottom: var(--form-spacing-xs, 0.25rem);
  gap: 0.125rem;
}

/**
 * Form group with border
 */
.form-group.bordered {
  border: 1px solid var(--form-border-color, #dee2e6);
  border-radius: var(--form-radius-md, 0.5rem);
  padding: var(--form-spacing-sm, 0.5rem);
  background: var(--form-surface-color, #f8f9fa);
}

/* ============================================================================
   FORM FIELDS CONTAINER
   ============================================================================ */

/**
 * Container for multiple form groups
 */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--form-spacing-sm, 0.5rem);
}

.form-fields.stacked {
  gap: var(--form-spacing-md, 1rem);
}

.form-fields.inline {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--form-spacing-md, 1rem);
}

.form-fields.inline > .form-group {
  flex: 1 1 auto;
  min-width: 200px;
}

.form-fields.slim {
  gap: var(--form-spacing-xs, 0.25rem);
}

/* ============================================================================
   GRID LAYOUTS
   ============================================================================ */

/**
 * Two-column grid
 */
.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--form-spacing-md, 1rem);
}

/**
 * Three-column grid
 */
.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--form-spacing-md, 1rem);
}

/**
 * Four-column grid
 */
.form-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--form-spacing-md, 1rem);
}

/**
 * Auto-fit grid (responsive)
 */
.form-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--form-spacing-md, 1rem);
}

/**
 * Responsive grid - stacks on mobile
 */
@media (max-width: 768px) {
  .form-grid-2,
  .form-grid-3,
  .form-grid-4 {
    grid-template-columns: 1fr;
  }
}

/* ============================================================================
   LABEL STYLES
   ============================================================================ */

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--form-text-color, #212529);
  margin-bottom: var(--form-spacing-xs, 0.25rem);
}

.form-label.required::after {
  content: ' *';
  color: var(--form-error-color, #dc3545);
}

/* ============================================================================
   INPUT STYLES
   ============================================================================ */

.form-input {
  padding: var(--form-spacing-sm, 0.5rem);
  border: 1px solid var(--form-border-color, #dee2e6);
  border-radius: var(--form-radius-sm, 0.25rem);
  font-size: 1rem;
  font-family: var(--form-font-body, system-ui, sans-serif);
  background: var(--form-bg-color, #ffffff);
  color: var(--form-text-color, #212529);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--form-primary-color, #007bff);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-input:disabled,
.form-input:read-only {
  background: var(--form-surface-color, #f8f9fa);
  cursor: not-allowed;
  opacity: 0.6;
}

.form-input.error {
  border-color: var(--form-error-color, #dc3545);
}

.form-input.success {
  border-color: var(--form-success-color, #28a745);
}

/* ============================================================================
   HELP TEXT
   ============================================================================ */

.form-help {
  font-size: 0.75rem;
  color: var(--form-text-muted-color, #6c757d);
  margin-top: var(--form-spacing-xs, 0.25rem);
}

.form-error-text {
  font-size: 0.75rem;
  color: var(--form-error-color, #dc3545);
  margin-top: var(--form-spacing-xs, 0.25rem);
}

/* ============================================================================
   BUTTON GROUPS
   ============================================================================ */

.btn-group {
  display: flex;
  gap: var(--form-spacing-xs, 0.25rem);
}

.btn-group.vertical {
  flex-direction: column;
}

.btn-group.spread {
  justify-content: space-between;
}

/* ============================================================================
   UTILITY CLASSES
   ============================================================================ */

.hidden {
  display: none !important;
}

.invisible {
  visibility: hidden !important;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.mb-0 { margin-bottom: 0 !important; }
.mb-1 { margin-bottom: var(--form-spacing-xs, 0.25rem) !important; }
.mb-2 { margin-bottom: var(--form-spacing-sm, 0.5rem) !important; }
.mb-3 { margin-bottom: var(--form-spacing-md, 1rem) !important; }
.mb-4 { margin-bottom: var(--form-spacing-lg, 1.5rem) !important; }

.mt-0 { margin-top: 0 !important; }
.mt-1 { margin-top: var(--form-spacing-xs, 0.25rem) !important; }
.mt-2 { margin-top: var(--form-spacing-sm, 0.5rem) !important; }
.mt-3 { margin-top: var(--form-spacing-md, 1rem) !important; }
.mt-4 { margin-top: var(--form-spacing-lg, 1.5rem) !important; }

.p-0 { padding: 0 !important; }
.p-1 { padding: var(--form-spacing-xs, 0.25rem) !important; }
.p-2 { padding: var(--form-spacing-sm, 0.5rem) !important; }
.p-3 { padding: var(--form-spacing-md, 1rem) !important; }
.p-4 { padding: var(--form-spacing-lg, 1.5rem) !important; }

.w-100 { width: 100% !important; }
.w-auto { width: auto !important; }

.flex-1 { flex: 1 1 auto !important; }
.flex-grow { flex-grow: 1 !important; }
.flex-shrink { flex-shrink: 1 !important; }
```

---

## Specific Code Patterns to Adopt

### 1. ID Generation Pattern

**FoundryVTT Pattern:**
```javascript
const rootId = `${this.id}-${fieldName}`;
```

**Our Current Pattern:**
```typescript
id="field-{node.id}"
```

**Recommendation**: Keep our pattern - it's simpler and works well.

---

### 2. Tab System Pattern

**FoundryVTT Pattern:**
```javascript
// Tab activation via data attributes
html.find('.tabs .item').click(function() {
  const tab = $(this).data('tab');
  const group = $(this).data('group') || 'primary';
  _activateTab(tab, group);
});
```

**Our Pattern:**
```typescript
// Reactive state with lazy rendering
let activeTabId = $state<string | undefined>(undefined);
let visitedTabs = $state<Set<string>>(new Set());
```

**Recommendation**: Keep our pattern - reactive state is more powerful.

---

### 3. Form Data Serialization

**FoundryVTT Pattern:**
```javascript
// FormDataExtended - converts form to nested object
const formData = new FormDataExtended(form).object;
// { "system.attributes.strength.value": 10 } → { system: { attributes: { strength: { value: 10 } } } }
```

**Our Pattern:**
```typescript
// Direct reactive updates to entity object
onChange(path, value);
// Path: "system.attributes.strength.value"
// Updates entity object directly via path resolution
```

**Recommendation**: Keep our pattern - more direct and efficient.

---

## Implementation Roadmap

### Immediate Actions (This Sprint)

1. **Create form utilities CSS file** (2-3 hours)
   - Add all utility classes from specification above
   - Import in FormRenderer component
   - Update documentation

2. **Update FieldRenderer to use utility classes** (1-2 hours)
   - Replace inline styles with `.form-group` classes
   - Add `.form-label`, `.form-input` classes
   - Add `.form-help` for help text

### Next Sprint

3. **Add FieldGroupNode layout type** (4-6 hours)
   - Define TypeScript interface
   - Add to LayoutRenderer
   - Update Form Designer palette
   - Add examples to docs

4. **Implement multiselect field type** (3-4 hours)
   - Add to field type enum
   - Create multiselect renderer in FieldRenderer
   - Add to Form Designer
   - Add tests

### Future Sprints

5. **Add file upload field** (6-8 hours)
   - Implement file picker UI
   - Add upload handling to backend
   - Add preview functionality
   - Security hardening

6. **Add code editor field** (8-10 hours)
   - Evaluate Monaco vs CodeMirror
   - Integrate editor component
   - Add syntax highlighting
   - Add to Form Designer

7. **Enhance rich text editor** (12-16 hours)
   - Integrate Tiptap
   - Create custom toolbar
   - Add image upload
   - Add table support

---

## Conclusion

Our VTT form system is **architecturally superior** to FoundryVTT's approach:
- Visual designer vs manual templates
- Type-safe vs runtime strings
- Modern reactive framework vs jQuery
- Advanced features (computed fields, fragments, virtual scrolling)

However, FoundryVTT has **battle-tested patterns** we should adopt:
- CSS utility classes for consistency
- Specialized input components
- Standardized data patterns

**Recommended Focus:**
1. Add CSS utilities (high impact, low effort)
2. Add FieldGroupNode (standardizes patterns)
3. Add missing field types (multiselect, file, code)
4. Enhance existing field types (rich text, color picker)

**Estimated Total Effort:** 50-70 hours across 3-4 sprints

**ROI:** High - these improvements will make our form system more polished and easier to use while maintaining our architectural advantages.

---

## Appendix A: Field Type Coverage Comparison

| Category | FoundryVTT | Our VTT | Gap |
|----------|------------|---------|-----|
| **Basic Inputs** | text, number, checkbox, radio | text, number, checkbox | Missing: radio |
| **Selection** | select, multiselect | select | Missing: multiselect |
| **Text Editing** | textarea, rich text (ProseMirror) | textarea, richtext (basic) | Rich text needs upgrade |
| **Numbers** | number, range | number, slider | Equivalent |
| **Colors** | color picker (custom) | color (HTML5 + presets) | Equivalent |
| **Files** | file picker (FilePicker API) | image (URL only) | Missing: actual uploads |
| **Dates** | date, datetime | date (with time option) | Equivalent |
| **Code** | code editor (CodeMirror) | None | Missing |
| **Specialized** | None | dice, resource, rating, tags | VTT advantage |

---

## Appendix B: CSS Variable Mapping

| Purpose | FoundryVTT Variable | Our VTT Variable |
|---------|-------------------|------------------|
| Background | `--color-bg-primary` | `--form-bg-color` |
| Surface | `--color-bg-secondary` | `--form-surface-color` |
| Primary | `--color-accent` | `--form-primary-color` |
| Text | `--color-text-primary` | `--form-text-color` |
| Border | `--color-border` | `--form-border-color` |
| Error | N/A | `--form-error-color` |
| Success | N/A | `--form-success-color` |
| Spacing | `--spacing-*` | `--form-spacing-*` |
| Radius | N/A | `--form-radius-*` |

**Recommendation**: Our naming is more explicit and scoped. Keep it.

---

## Appendix C: Accessibility Comparison

Both systems have good accessibility, but different approaches:

**FoundryVTT:**
- Manual ARIA attributes in templates
- Documented patterns for developers
- Relies on developer discipline

**Our VTT:**
- Auto-generated ARIA attributes
- Built into component logic
- Enforced by framework

**Winner:** Our system - accessibility is automatic and consistent.

---

**End of Report**
