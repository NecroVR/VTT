# VTT Forms System - Quick Improvement Summary

**Date:** 2025-12-12
**Based on:** FoundryVTT Forms Comparison Analysis

---

## TL;DR - What We Should Do

### Our Advantages (Keep These!)
- Visual WYSIWYG form designer
- Type-safe TypeScript system
- Advanced features: computed fields, fragments, virtual scrolling
- Auto-generated accessibility (ARIA)
- Scoped CSS with XSS prevention
- 5 built-in themes

### What We're Missing (Add These!)
1. CSS utility classes (`.form-group`, `.stacked`, `.inline`)
2. Multiselect field type
3. File upload field (actual uploads, not just URLs)
4. Code editor field
5. Better rich text editor (current is basic textarea)
6. FieldGroup layout node (standardizes label+input patterns)

---

## Priority Implementation Plan

### Phase 1: CSS Utilities (2-3 hours)
**Why:** Immediate styling consistency, low effort, high impact

**Add these classes:**
- `.form-group` - container for label+input+help
- `.form-group.stacked` - vertical layout
- `.form-group.inline` - horizontal layout
- `.form-fields` - container for multiple groups
- `.form-grid-2`, `.form-grid-3`, etc. - responsive grids
- `.standard-form` - full form container pattern

**File:** `D:/Projects/VTT/apps/web/src/lib/styles/form-utilities.css`

---

### Phase 2: Missing Field Types (8-12 hours)

**Multiselect Field** (3-4 hours)
```typescript
fieldType: 'multiselect'
options: {
  options: { value: string; label: string; group?: string }[]
  max?: number  // Maximum selections
}
```

**File Upload Field** (6-8 hours)
```typescript
fieldType: 'file'
options: {
  accept?: string  // MIME types
  maxSize?: number
  preview?: boolean
  uploadPath?: string
}
```

---

### Phase 3: FieldGroup Node (4-6 hours)

Standardizes the label+input+help pattern:

```typescript
{
  type: 'fieldGroup',
  layout: 'stacked',  // or 'inline', 'slim'
  label: { literal: 'Hit Points' },
  helpText: { literal: 'Current HP value' },
  required: true,
  children: [
    { type: 'field', fieldType: 'number', binding: 'hp.value' }
  ]
}
```

**Benefits:**
- Consistent layout patterns
- Less boilerplate in form definitions
- Matches FoundryVTT's `formGroup` helper concept

---

## Quick Wins

### 1. Add Utility Classes to FieldRenderer

**Current:**
```svelte
<div class="field-wrapper">
  <label class="field-label">...</label>
  <input class="field-input" />
  <div class="field-help">...</div>
</div>
```

**Improved:**
```svelte
<div class="form-group stacked">
  <label class="form-label">...</label>
  <input class="form-input" />
  <div class="form-help">...</div>
</div>
```

---

### 2. Use Grid Utilities in Designer

**Current:** Manual grid configuration in every form

**Improved:** Use `.form-grid-2`, `.form-grid-3` for common layouts

---

### 3. Standardize Form Structure

**Current:** Varied form structures

**Improved:**
```svelte
<div class="standard-form">
  <div class="form-header">...</div>
  <div class="form-content">...</div>
  <div class="form-footer">...</div>
</div>
```

---

## Key Patterns from FoundryVTT

### 1. Inline vs Stacked Layouts

```css
/* Stacked (default) - label above input */
.form-group.stacked {
  flex-direction: column;
}

/* Inline - label beside input */
.form-group.inline {
  flex-direction: row;
  align-items: center;
}
```

### 2. Responsive Grids

```css
/* Two-column grid that stacks on mobile */
.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
  .form-grid-2 { grid-template-columns: 1fr; }
}
```

### 3. Required Field Indicator

```css
.form-label.required::after {
  content: ' *';
  color: var(--form-error-color);
}
```

---

## What NOT to Change

### Keep Our Patterns For:

1. **Reactive State Management**
   - Our Svelte 5 reactivity > Foundry's jQuery

2. **Type Safety**
   - Our TypeScript types > Foundry's runtime strings

3. **Component Architecture**
   - Our Svelte components > Foundry's Handlebars templates

4. **Data Binding**
   - Our direct onChange updates > Foundry's form serialization

5. **Accessibility**
   - Our auto-generated ARIA > Foundry's manual ARIA

---

## Estimated Impact vs Effort

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| CSS Utilities | High | Low (2-3h) | **DO FIRST** |
| FieldGroup Node | Medium | Low (4-6h) | **DO SECOND** |
| Multiselect Field | Medium | Low (3-4h) | High |
| File Upload Field | Medium | Medium (6-8h) | High |
| Code Editor Field | Low | Medium (8-10h) | Medium |
| Enhanced Rich Text | Medium | High (12-16h) | Low |
| Drag & Drop | Low | High (10-15h) | Low |

---

## Example: Before & After

### Before (Current)

```typescript
// Form definition - verbose
{
  type: 'grid',
  columns: 2,
  children: [
    {
      type: 'container',
      children: [
        {
          type: 'field',
          fieldType: 'text',
          binding: 'name',
          label: { literal: 'Character Name' },
          helpText: { literal: 'Enter name' }
        }
      ]
    }
  ]
}
```

### After (With Improvements)

```typescript
// Form definition - cleaner with FieldGroup
{
  type: 'grid',
  className: 'form-grid-2',  // Uses utility class
  children: [
    {
      type: 'fieldGroup',
      layout: 'stacked',
      label: { literal: 'Character Name' },
      helpText: { literal: 'Enter name' },
      children: [
        { type: 'field', fieldType: 'text', binding: 'name' }
      ]
    }
  ]
}
```

**Benefits:**
- Less nesting
- Clearer intent
- Reusable patterns
- Better defaults

---

## Next Steps

1. Review full comparison report: `FoundryVTT-Forms-Comparison-2025-12-12.md`
2. Implement Phase 1 (CSS utilities) - 2-3 hours
3. Test with existing forms
4. Implement Phase 2 (FieldGroup) - 4-6 hours
5. Update Form Designer to use new patterns
6. Document new utilities and patterns

---

## Questions to Consider

1. **CSS Utilities:** Should we auto-apply them or require manual className assignment?
   - Recommendation: Auto-apply in FieldRenderer, allow override with className

2. **FieldGroup:** Should it replace raw FieldNode or coexist?
   - Recommendation: Coexist - FieldGroup is a convenience wrapper

3. **File Upload:** Build our own or use library?
   - Recommendation: Start with HTML5 FileReader, enhance later

4. **Rich Text:** Which library to use?
   - Recommendation: Tiptap (modern, Svelte-friendly, extensible)

---

**Total Estimated Time for Core Improvements:** 20-30 hours (Phase 1-3)

**Expected Outcome:** More polished, consistent form system that matches FoundryVTT's polish while maintaining our architectural advantages.
