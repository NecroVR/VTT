# Form Designer Performance Guide

This guide explains the performance optimizations built into the VTT Form Designer and provides best practices for designing fast, responsive forms.

## Table of Contents

1. [Performance Optimizations](#performance-optimizations)
2. [Best Practices](#best-practices)
3. [Performance Considerations](#performance-considerations)
4. [Troubleshooting](#troubleshooting)

---

## Performance Optimizations

The Form Designer includes several automatic performance optimizations:

### 1. Lazy Tab Rendering

**What it does**: Tabs are only rendered when first visited, and then kept in memory for instant switching.

**How it works**:
- When a form with tabs loads, only the active tab's content is rendered
- When you switch to a new tab, it's rendered and cached
- Previously visited tabs remain in the DOM but hidden, enabling instant switching
- Unvisited tabs don't consume rendering time or memory

**Benefits**:
- Faster initial load times for forms with multiple tabs
- Reduced memory usage for large forms
- Smooth tab switching after first visit

**Example**:
A character sheet with 5 tabs (Stats, Inventory, Spells, Notes, Settings) will only render the Stats tab on first load. The other tabs render only when clicked, reducing initial render time by ~80%.

### 2. Virtual Scrolling for Repeaters

**What it does**: For repeater fields with more than 20 items, only visible items are rendered.

**How it works**:
- The system calculates which items are currently visible in the viewport
- Only visible items plus a small buffer (5 items above/below) are rendered
- As you scroll, items are dynamically added/removed from the DOM
- The scrollbar size reflects the total number of items

**Benefits**:
- Handle hundreds or thousands of items without performance degradation
- Constant memory usage regardless of array size
- Smooth scrolling even with complex item templates

**Automatic activation**: Virtual scrolling automatically activates when a repeater has more than 20 items.

**Example**:
An inventory with 500 items will only render ~15 items at a time, making it as performant as an inventory with 20 items.

### 3. Computed Field Optimization

**What it does**: Computed field results are cached and intelligently invalidated.

**How it works**:
- Formula results are cached for 60 seconds
- Dependencies are tracked automatically
- Cache is invalidated only when dependencies change
- Rapid recalculations are debounced (50ms)

**Benefits**:
- Complex formulas only calculate when needed
- Prevents redundant calculations during rapid input
- Reduces CPU usage for forms with many computed fields

**Example**:
A formula like `strength + dexterity / 2` will only recalculate when `strength` or `dexterity` changes, not when unrelated fields like `name` change.

### 4. Form Definition Caching

**What it does**: Form definitions are cached for 5 minutes after loading.

**How it works**:
- When a form is loaded from the API, it's stored in memory with a timestamp
- Subsequent requests for the same form use the cached version
- Cache automatically expires after 5 minutes
- Cache is invalidated when forms are updated

**Benefits**:
- Reduced API calls
- Faster form switching
- Lower server load

---

## Best Practices

### Designing Performant Forms

#### 1. Use Tabs for Large Forms

**Good**:
```
Form with tabs:
- Tab 1: Core Stats (5 fields)
- Tab 2: Skills (20 fields)
- Tab 3: Equipment (30 fields)
- Tab 4: Biography (10 fields)
```

**Why**: Only the active tab is rendered initially, reducing load time from 65 fields to 5 fields.

**Bad**:
```
Single long form with all 65 fields visible at once
```

**Why**: All fields render immediately, slowing down initial load.

#### 2. Group Related Fields

Use sections and groups to organize content:

```
Section: Combat Stats (collapsible)
  - HP
  - AC
  - Initiative

Section: Ability Scores (collapsible)
  - Strength
  - Dexterity
  - etc.
```

**Benefits**:
- Users can collapse sections they're not using
- Better visual organization
- Collapsible sections reduce visible DOM size

#### 3. Optimize Repeater Templates

**Good**: Simple, focused repeater templates
```
Repeater: Inventory Items
  - Name (text)
  - Quantity (number)
  - Weight (number)
```

**Bad**: Complex nested structures in repeaters
```
Repeater: Inventory Items
  - Container (group)
    - Details (section)
      - Name (text)
      - Description (textarea)
      - Tabs for properties
        - Tab 1: Stats
        - Tab 2: Effects
```

**Why**: Each item in the repeater is multiplied by the array size. Keep templates simple.

#### 4. Limit Computed Fields

**Good**: Use computed fields for important calculations
```
- Total Weight: sum(inventory.*.weight)
- Modifier: floor((strength - 10) / 2)
```

**Bad**: Computed fields for simple formatting
```
- Display Name: name (just use the field directly)
- Label Text: "Hit Points: " + hp (use static text + field)
```

**Why**: Computed fields have overhead. Use them for actual computation, not display formatting.

#### 5. Use Conditional Rendering Wisely

**Good**: Hide large sections when not relevant
```
Conditional: if(class == "wizard")
  - Spellcasting Tab (30+ fields)
```

**Bad**: Conditional for every individual field
```
Conditional: if(strength > 10) → Strength Modifier
Conditional: if(dexterity > 10) → Dexterity Modifier
(repeated for many fields)
```

**Why**: Conditionals are checked on every render. Use them for large groups, not individual fields.

---

## Performance Considerations

### Form Size Guidelines

| Form Complexity | Total Fields | Recommended Structure |
|----------------|--------------|----------------------|
| Simple | < 20 | Single page, no tabs |
| Medium | 20-50 | 2-3 tabs, collapsible sections |
| Complex | 50-100 | 4-6 tabs, nested sections |
| Very Complex | 100+ | Multiple tabs, fragments for reusable sections |

### Repeater Size Guidelines

| Items | Performance | Notes |
|-------|------------|-------|
| < 20 | Excellent | Normal rendering |
| 20-100 | Good | Virtual scrolling activates |
| 100-500 | Good | Virtual scrolling handles efficiently |
| 500+ | Fair | Consider pagination or filtering |

### Computed Field Guidelines

| Complexity | Formula Example | Performance Impact |
|-----------|----------------|-------------------|
| Simple | `a + b` | Negligible |
| Moderate | `sum(array.*.value) / count(array)` | Low |
| Complex | Multiple nested functions | Medium |
| Very Complex | Recursive calculations | High (use sparingly) |

---

## Troubleshooting

### Form Loads Slowly

**Symptoms**: Form takes > 2 seconds to appear

**Solutions**:
1. **Split into tabs**: Move sections into separate tabs
2. **Default collapsed**: Set large sections to `defaultCollapsed: true`
3. **Reduce initial fields**: Hide advanced fields behind tabs/conditionals
4. **Check computed fields**: Ensure formulas aren't too complex

### Repeater is Laggy

**Symptoms**: Scrolling or editing repeater items is slow

**Solutions**:
1. **Simplify template**: Reduce fields in each item
2. **Remove nested repeaters**: Avoid repeaters inside repeaters
3. **Check item count**: If > 1000 items, consider filtering/pagination
4. **Verify virtual scrolling**: Should auto-activate at 20+ items

### Computed Fields Slow

**Symptoms**: Typing causes lag, fields update slowly

**Solutions**:
1. **Check dependencies**: Ensure formulas only depend on necessary fields
2. **Simplify formulas**: Break complex calculations into multiple fields
3. **Reduce computed fields**: Combine related calculations
4. **Cache aggressively**: Use constants instead of computed fields when possible

### High Memory Usage

**Symptoms**: Browser becomes sluggish, high RAM usage

**Solutions**:
1. **Use lazy tabs**: Ensure tabs are configured properly
2. **Limit repeater size**: Consider pagination for large datasets
3. **Clear unused forms**: Close forms you're not actively editing
4. **Check for leaks**: Ensure conditional fields properly unmount

---

## Performance Metrics

### Target Performance

- **Initial Load**: < 1 second for medium forms (50 fields)
- **Tab Switch**: < 100ms (instant feel)
- **Field Input**: < 50ms response time
- **Save Operation**: < 2 seconds

### Monitoring

The Form Designer automatically tracks performance. Check browser DevTools for:
- **LCP (Largest Contentful Paint)**: Should be < 2.5s
- **FID (First Input Delay)**: Should be < 100ms
- **CLS (Cumulative Layout Shift)**: Should be < 0.1

---

## Advanced Tips

### 1. Use Fragments for Repeated Structures

Instead of duplicating complex layouts, create a fragment and reference it:

```
Fragment: "statBlock"
  - Grid (3 columns)
    - Stat Name
    - Stat Value
    - Stat Modifier

Use in form:
  - Fragment Reference: statBlock (for Strength)
  - Fragment Reference: statBlock (for Dexterity)
  - Fragment Reference: statBlock (for Constitution)
```

**Benefits**: Fragments are parsed once and reused, improving performance and maintainability.

### 2. Defer Non-Critical Content

Use tabs to defer loading of optional content:

```
- Tab 1: Essential Info (always needed)
- Tab 2: Advanced Stats (rarely used)
- Tab 3: Appearance (optional)
- Tab 4: Notes (optional)
```

Only Tab 1 loads immediately; others load when accessed.

### 3. Optimize Field Types

Some field types are more performant than others:

**Fast**: Text, Number, Checkbox, Select
**Medium**: Textarea, Multi-select, Radio Group
**Slower**: Rich Text, File Upload, Complex Custom Fields

Choose the simplest field type that meets your needs.

---

## Summary

The Form Designer is built for performance, but following best practices ensures the best user experience:

1. **Use tabs** for forms > 20 fields
2. **Keep repeater templates simple**
3. **Limit computed fields** to actual calculations
4. **Collapse large sections** by default
5. **Trust automatic optimizations** (lazy tabs, virtual scrolling, caching)

By following these guidelines, you can create complex, feature-rich forms that remain fast and responsive even with hundreds of fields and thousands of data items.
