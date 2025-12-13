# CSS Utility Classes - Implementation Specification

**Date:** 2025-12-12
**Purpose:** Detailed specification for implementing FoundryVTT-inspired CSS utility classes
**Priority:** HIGH (Quick win, high impact)
**Estimated Effort:** 2-3 hours

---

## Overview

This document specifies CSS utility classes to add to our VTT form system, inspired by FoundryVTT's battle-tested patterns but adapted for our Svelte-based architecture.

---

## Implementation Steps

### 1. Create CSS File

**File:** `D:/Projects/VTT/apps/web/src/lib/styles/form-utilities.css`

**Content:** See full CSS below

### 2. Import in FormRenderer

**File:** `D:/Projects/VTT/apps/web/src/lib/components/forms/FormRenderer.svelte`

**Add:**
```svelte
<script lang="ts">
  import '$lib/styles/form-utilities.css';
  // ... rest of imports
</script>
```

### 3. Update FieldRenderer

**File:** `D:/Projects/VTT/apps/web/src/lib/components/forms/FieldRenderer.svelte`

**Replace class names:**
- `.field-wrapper` → `.form-group`
- `.field-label` → `.form-label`
- `.field-input` → `.form-input`
- `.field-help` → `.form-help`

### 4. Update Documentation

**File:** `D:/Projects/VTT/docs/guides/form-designer-guide.md`

**Add section:** CSS Utility Classes Reference

---

## Complete CSS Specification

```css
/**
 * VTT Form Utility Classes
 *
 * Standardized CSS utilities for form layouts and styling.
 * Inspired by FoundryVTT patterns, adapted for Svelte-based system.
 *
 * @version 1.0.0
 * @date 2025-12-12
 */

/* ============================================================================
   CSS CUSTOM PROPERTIES
   ============================================================================ */

/**
 * Form-specific CSS variables
 * These can be overridden by themes or custom CSS
 */
:root {
  /* Colors */
  --form-bg-color: #ffffff;
  --form-surface-color: #f8f9fa;
  --form-primary-color: #007bff;
  --form-secondary-color: #6c757d;
  --form-text-color: #212529;
  --form-text-muted-color: #6c757d;
  --form-border-color: #dee2e6;
  --form-error-color: #dc3545;
  --form-success-color: #28a745;
  --form-warning-color: #ffc107;
  --form-info-color: #17a2b8;

  /* Spacing */
  --form-spacing-xs: 0.25rem;
  --form-spacing-sm: 0.5rem;
  --form-spacing-md: 1rem;
  --form-spacing-lg: 1.5rem;
  --form-spacing-xl: 2rem;

  /* Border Radius */
  --form-radius-sm: 0.25rem;
  --form-radius-md: 0.5rem;
  --form-radius-lg: 1rem;

  /* Fonts */
  --form-font-body: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --form-font-heading: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --form-font-monospace: "Courier New", Courier, monospace;

  /* Transitions */
  --form-transition-fast: 0.15s ease;
  --form-transition-normal: 0.2s ease;
  --form-transition-slow: 0.3s ease;

  /* Shadows */
  --form-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --form-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --form-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
  --form-shadow-focus: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* ============================================================================
   FORM CONTAINERS
   ============================================================================ */

/**
 * .standard-form
 * Main form container with header/content/footer sections
 *
 * Usage:
 * <div class="standard-form">
 *   <div class="form-header">...</div>
 *   <div class="form-content">...</div>
 *   <div class="form-footer">...</div>
 * </div>
 */
.standard-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--form-bg-color);
  color: var(--form-text-color);
  font-family: var(--form-font-body);
  overflow: hidden;
}

/**
 * .form-header
 * Header section with title and controls
 */
.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--form-spacing-sm);
  padding: var(--form-spacing-sm) var(--form-spacing-md);
  border-bottom: 1px solid var(--form-border-color);
  background: var(--form-surface-color);
  flex-shrink: 0;
}

.form-header h1,
.form-header h2,
.form-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--form-text-color);
}

/**
 * .form-content
 * Main scrollable content area
 */
.form-content {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--form-spacing-md);
}

/**
 * .form-footer
 * Footer section with action buttons
 */
.form-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--form-spacing-sm);
  padding: var(--form-spacing-sm) var(--form-spacing-md);
  border-top: 1px solid var(--form-border-color);
  background: var(--form-surface-color);
  flex-shrink: 0;
}

/* ============================================================================
   FORM GROUPS
   ============================================================================ */

/**
 * .form-group
 * Container for a single form field (label + input + help text)
 * Default: stacked layout (label above input)
 *
 * Modifiers:
 * - .stacked: Explicit vertical layout
 * - .inline: Horizontal layout (label beside input)
 * - .slim: Reduced spacing
 * - .bordered: Add border and background
 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--form-spacing-xs);
  margin-bottom: var(--form-spacing-sm);
}

/**
 * .form-group.stacked
 * Explicit stacked layout (same as default)
 */
.form-group.stacked {
  flex-direction: column;
}

/**
 * .form-group.inline
 * Horizontal layout - label and input side-by-side
 */
.form-group.inline {
  flex-direction: row;
  align-items: center;
  gap: var(--form-spacing-sm);
}

.form-group.inline > .form-label {
  flex: 0 0 auto;
  min-width: 120px;
  margin-bottom: 0;
}

.form-group.inline > .form-input,
.form-group.inline > select,
.form-group.inline > textarea,
.form-group.inline > .field-input {
  flex: 1 1 auto;
}

/**
 * .form-group.slim
 * Reduced spacing variant
 */
.form-group.slim {
  margin-bottom: var(--form-spacing-xs);
  gap: 0.125rem;
}

/**
 * .form-group.bordered
 * Add border, padding, and background
 */
.form-group.bordered {
  border: 1px solid var(--form-border-color);
  border-radius: var(--form-radius-md);
  padding: var(--form-spacing-sm);
  background: var(--form-surface-color);
}

/* ============================================================================
   FORM FIELDS CONTAINER
   ============================================================================ */

/**
 * .form-fields
 * Container for multiple form groups
 *
 * Modifiers:
 * - .stacked: Increased vertical spacing
 * - .inline: Horizontal layout with wrapping
 * - .slim: Reduced spacing
 */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--form-spacing-sm);
}

.form-fields.stacked {
  gap: var(--form-spacing-md);
}

.form-fields.inline {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--form-spacing-md);
}

.form-fields.inline > .form-group {
  flex: 1 1 auto;
  min-width: 200px;
  margin-bottom: 0;
}

.form-fields.slim {
  gap: var(--form-spacing-xs);
}

/* ============================================================================
   GRID LAYOUTS
   ============================================================================ */

/**
 * .form-grid-2
 * Two-column responsive grid
 */
.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--form-spacing-md);
}

/**
 * .form-grid-3
 * Three-column responsive grid
 */
.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--form-spacing-md);
}

/**
 * .form-grid-4
 * Four-column responsive grid
 */
.form-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--form-spacing-md);
}

/**
 * .form-grid-auto
 * Auto-fit grid with minimum column width
 */
.form-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--form-spacing-md);
}

/**
 * Responsive: Stack grids on mobile
 */
@media (max-width: 768px) {
  .form-grid-2,
  .form-grid-3,
  .form-grid-4 {
    grid-template-columns: 1fr;
  }
}

/* ============================================================================
   LABELS
   ============================================================================ */

/**
 * .form-label
 * Standard form label
 */
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--form-text-color);
  margin-bottom: var(--form-spacing-xs);
  line-height: 1.5;
}

/**
 * .form-label.required
 * Required field indicator (red asterisk)
 */
.form-label.required::after {
  content: ' *';
  color: var(--form-error-color);
  font-weight: 700;
}

/**
 * .form-label.optional
 * Optional field indicator (muted text)
 */
.form-label.optional::after {
  content: ' (optional)';
  color: var(--form-text-muted-color);
  font-weight: 400;
  font-size: 0.8em;
}

/* ============================================================================
   INPUTS
   ============================================================================ */

/**
 * .form-input
 * Standard form input styling
 * Applied to: input, select, textarea
 */
.form-input,
input.form-input,
select.form-input,
textarea.form-input {
  width: 100%;
  padding: var(--form-spacing-sm);
  border: 1px solid var(--form-border-color);
  border-radius: var(--form-radius-sm);
  font-size: 1rem;
  font-family: var(--form-font-body);
  background: var(--form-bg-color);
  color: var(--form-text-color);
  transition: border-color var(--form-transition-normal),
              box-shadow var(--form-transition-normal);
}

/**
 * Focus state
 */
.form-input:focus,
input.form-input:focus,
select.form-input:focus,
textarea.form-input:focus {
  outline: none;
  border-color: var(--form-primary-color);
  box-shadow: var(--form-shadow-focus);
}

/**
 * Disabled and read-only states
 */
.form-input:disabled,
.form-input:read-only,
input.form-input:disabled,
input.form-input:read-only,
select.form-input:disabled,
textarea.form-input:read-only {
  background: var(--form-surface-color);
  cursor: not-allowed;
  opacity: 0.6;
}

/**
 * Error state
 */
.form-input.error,
input.form-input.error,
select.form-input.error,
textarea.form-input.error {
  border-color: var(--form-error-color);
}

.form-input.error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
}

/**
 * Success state
 */
.form-input.success,
input.form-input.success,
select.form-input.success,
textarea.form-input.success {
  border-color: var(--form-success-color);
}

.form-input.success:focus {
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
}

/**
 * Warning state
 */
.form-input.warning {
  border-color: var(--form-warning-color);
}

/* ============================================================================
   INPUT SIZES
   ============================================================================ */

.form-input.sm,
input.form-input.sm,
select.form-input.sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.form-input.lg,
input.form-input.lg,
select.form-input.lg {
  padding: 0.75rem 1rem;
  font-size: 1.125rem;
}

/* ============================================================================
   HELP TEXT
   ============================================================================ */

/**
 * .form-help
 * Help text below input fields
 */
.form-help {
  font-size: 0.75rem;
  color: var(--form-text-muted-color);
  margin-top: var(--form-spacing-xs);
  line-height: 1.4;
}

/**
 * .form-error-text
 * Error message styling
 */
.form-error-text {
  font-size: 0.75rem;
  color: var(--form-error-color);
  margin-top: var(--form-spacing-xs);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-error-text::before {
  content: '⚠';
  font-size: 1em;
}

/**
 * .form-success-text
 * Success message styling
 */
.form-success-text {
  font-size: 0.75rem;
  color: var(--form-success-color);
  margin-top: var(--form-spacing-xs);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-success-text::before {
  content: '✓';
  font-size: 1em;
}

/* ============================================================================
   BUTTON GROUPS
   ============================================================================ */

/**
 * .btn-group
 * Container for multiple buttons
 */
.btn-group {
  display: flex;
  gap: var(--form-spacing-xs);
}

.btn-group.vertical {
  flex-direction: column;
}

.btn-group.spread {
  justify-content: space-between;
}

.btn-group.center {
  justify-content: center;
}

.btn-group.end {
  justify-content: flex-end;
}

/* ============================================================================
   SECTIONS
   ============================================================================ */

/**
 * .form-section
 * Grouping of related form fields
 */
.form-section {
  margin-bottom: var(--form-spacing-lg);
}

.form-section:last-child {
  margin-bottom: 0;
}

/**
 * .form-section-title
 * Section heading
 */
.form-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--form-text-color);
  margin-bottom: var(--form-spacing-md);
  padding-bottom: var(--form-spacing-xs);
  border-bottom: 1px solid var(--form-border-color);
}

/**
 * .form-section.bordered
 * Section with border and background
 */
.form-section.bordered {
  border: 1px solid var(--form-border-color);
  border-radius: var(--form-radius-md);
  padding: var(--form-spacing-md);
  background: var(--form-surface-color);
}

/* ============================================================================
   UTILITY CLASSES
   ============================================================================ */

/* Visibility */
.hidden { display: none !important; }
.invisible { visibility: hidden !important; }
.visible { visibility: visible !important; }

/* Text Alignment */
.text-left { text-align: left !important; }
.text-center { text-align: center !important; }
.text-right { text-align: right !important; }
.text-justify { text-align: justify !important; }

/* Margin Utilities */
.m-0 { margin: 0 !important; }
.mt-0 { margin-top: 0 !important; }
.mb-0 { margin-bottom: 0 !important; }
.ml-0 { margin-left: 0 !important; }
.mr-0 { margin-right: 0 !important; }

.m-1 { margin: var(--form-spacing-xs) !important; }
.mt-1 { margin-top: var(--form-spacing-xs) !important; }
.mb-1 { margin-bottom: var(--form-spacing-xs) !important; }
.ml-1 { margin-left: var(--form-spacing-xs) !important; }
.mr-1 { margin-right: var(--form-spacing-xs) !important; }

.m-2 { margin: var(--form-spacing-sm) !important; }
.mt-2 { margin-top: var(--form-spacing-sm) !important; }
.mb-2 { margin-bottom: var(--form-spacing-sm) !important; }
.ml-2 { margin-left: var(--form-spacing-sm) !important; }
.mr-2 { margin-right: var(--form-spacing-sm) !important; }

.m-3 { margin: var(--form-spacing-md) !important; }
.mt-3 { margin-top: var(--form-spacing-md) !important; }
.mb-3 { margin-bottom: var(--form-spacing-md) !important; }
.ml-3 { margin-left: var(--form-spacing-md) !important; }
.mr-3 { margin-right: var(--form-spacing-md) !important; }

.m-4 { margin: var(--form-spacing-lg) !important; }
.mt-4 { margin-top: var(--form-spacing-lg) !important; }
.mb-4 { margin-bottom: var(--form-spacing-lg) !important; }
.ml-4 { margin-left: var(--form-spacing-lg) !important; }
.mr-4 { margin-right: var(--form-spacing-lg) !important; }

/* Padding Utilities */
.p-0 { padding: 0 !important; }
.pt-0 { padding-top: 0 !important; }
.pb-0 { padding-bottom: 0 !important; }
.pl-0 { padding-left: 0 !important; }
.pr-0 { padding-right: 0 !important; }

.p-1 { padding: var(--form-spacing-xs) !important; }
.pt-1 { padding-top: var(--form-spacing-xs) !important; }
.pb-1 { padding-bottom: var(--form-spacing-xs) !important; }
.pl-1 { padding-left: var(--form-spacing-xs) !important; }
.pr-1 { padding-right: var(--form-spacing-xs) !important; }

.p-2 { padding: var(--form-spacing-sm) !important; }
.pt-2 { padding-top: var(--form-spacing-sm) !important; }
.pb-2 { padding-bottom: var(--form-spacing-sm) !important; }
.pl-2 { padding-left: var(--form-spacing-sm) !important; }
.pr-2 { padding-right: var(--form-spacing-sm) !important; }

.p-3 { padding: var(--form-spacing-md) !important; }
.pt-3 { padding-top: var(--form-spacing-md) !important; }
.pb-3 { padding-bottom: var(--form-spacing-md) !important; }
.pl-3 { padding-left: var(--form-spacing-md) !important; }
.pr-3 { padding-right: var(--form-spacing-md) !important; }

.p-4 { padding: var(--form-spacing-lg) !important; }
.pt-4 { padding-top: var(--form-spacing-lg) !important; }
.pb-4 { padding-bottom: var(--form-spacing-lg) !important; }
.pl-4 { padding-left: var(--form-spacing-lg) !important; }
.pr-4 { padding-right: var(--form-spacing-lg) !important; }

/* Width Utilities */
.w-25 { width: 25% !important; }
.w-50 { width: 50% !important; }
.w-75 { width: 75% !important; }
.w-100 { width: 100% !important; }
.w-auto { width: auto !important; }

/* Flex Utilities */
.flex-1 { flex: 1 1 auto !important; }
.flex-grow { flex-grow: 1 !important; }
.flex-shrink { flex-shrink: 1 !important; }
.flex-none { flex: none !important; }

/* Display Utilities */
.d-block { display: block !important; }
.d-inline { display: inline !important; }
.d-inline-block { display: inline-block !important; }
.d-flex { display: flex !important; }
.d-grid { display: grid !important; }
.d-none { display: none !important; }

/* ============================================================================
   RESPONSIVE UTILITIES
   ============================================================================ */

/* Mobile-specific */
@media (max-width: 767px) {
  .mobile-hidden { display: none !important; }
  .mobile-full-width { width: 100% !important; }

  .form-group.inline {
    flex-direction: column;
  }

  .form-group.inline > .form-label {
    min-width: unset;
  }
}

/* Tablet and up */
@media (min-width: 768px) {
  .tablet-up-hidden { display: none !important; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .desktop-up-hidden { display: none !important; }
}

/* ============================================================================
   PRINT STYLES
   ============================================================================ */

@media print {
  .no-print { display: none !important; }

  .form-header,
  .form-footer {
    border: none;
    background: transparent;
  }

  .form-input {
    border: none;
    border-bottom: 1px solid #000;
    border-radius: 0;
    padding-left: 0;
  }
}
```

---

## Usage Examples

### Example 1: Basic Form Group

```svelte
<div class="form-group">
  <label class="form-label required">Character Name</label>
  <input type="text" class="form-input" />
  <div class="form-help">Enter your character's full name</div>
</div>
```

### Example 2: Inline Form Group

```svelte
<div class="form-group inline">
  <label class="form-label">Level</label>
  <input type="number" class="form-input" min="1" max="20" />
</div>
```

### Example 3: Two-Column Grid

```svelte
<div class="form-grid-2">
  <div class="form-group">
    <label class="form-label">Strength</label>
    <input type="number" class="form-input" />
  </div>
  <div class="form-group">
    <label class="form-label">Dexterity</label>
    <input type="number" class="form-input" />
  </div>
</div>
```

### Example 4: Standard Form Structure

```svelte
<div class="standard-form">
  <div class="form-header">
    <h2>Edit Character</h2>
    <button type="button">Close</button>
  </div>

  <div class="form-content">
    <div class="form-section">
      <h3 class="form-section-title">Basic Info</h3>
      <div class="form-fields stacked">
        <!-- Form groups here -->
      </div>
    </div>
  </div>

  <div class="form-footer">
    <button type="button">Cancel</button>
    <button type="submit">Save</button>
  </div>
</div>
```

---

## Testing Checklist

- [ ] Import CSS file in FormRenderer
- [ ] Update FieldRenderer class names
- [ ] Test all layout variations (stacked, inline, slim)
- [ ] Test grid layouts (2, 3, 4 columns)
- [ ] Test responsive behavior on mobile
- [ ] Test with all field types
- [ ] Test with all themes
- [ ] Verify accessibility (focus states, ARIA)
- [ ] Update documentation
- [ ] Add examples to Form Designer

---

## Migration Guide

### For Existing Forms

Most existing forms will work without changes. To adopt utility classes:

**Before:**
```svelte
<div class="field-wrapper">
  <label class="field-label">Name</label>
  <input class="field-input" />
</div>
```

**After:**
```svelte
<div class="form-group">
  <label class="form-label">Name</label>
  <input class="form-input" />
</div>
```

### For Form Designer

Add className support to layout nodes:

```typescript
{
  type: 'grid',
  className: 'form-grid-2',  // Use utility class
  children: [...]
}
```

---

## Performance Considerations

- CSS file size: ~15KB uncompressed, ~3KB gzipped
- No JavaScript overhead
- Leverages CSS variables for theming
- Uses modern CSS (Grid, Flexbox) - no legacy browser support needed

---

## Future Enhancements

1. **Dark mode variants** - Add `.dark` class variants
2. **Animation utilities** - Add transition/animation classes
3. **Elevation utilities** - Add box-shadow classes for depth
4. **Color utilities** - Add text and background color classes
5. **Typography utilities** - Add font size/weight classes

---

## Related Files

- `D:/Projects/VTT/apps/web/src/lib/components/forms/FormRenderer.svelte`
- `D:/Projects/VTT/apps/web/src/lib/components/forms/FieldRenderer.svelte`
- `D:/Projects/VTT/apps/web/src/lib/components/forms/LayoutRenderer.svelte`
- `D:/Projects/VTT/apps/web/src/lib/services/formThemes.ts`
- `D:/Projects/VTT/packages/shared/src/types/forms.ts`

---

## Conclusion

These utility classes provide:
- **Consistency** across all forms
- **Flexibility** with modifier classes
- **Responsiveness** built-in
- **Ease of use** for developers
- **Maintainability** with CSS variables

**Estimated implementation time:** 2-3 hours
**Estimated testing time:** 1-2 hours
**Total:** 3-5 hours

**Impact:** HIGH - Immediate improvement to form styling consistency
