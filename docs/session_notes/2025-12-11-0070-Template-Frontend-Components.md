# Session Notes: Template-Driven Frontend Components

**Date**: 2025-12-11
**Session ID**: 0070
**Topic**: Template-Driven Frontend Components

## Summary

Created reusable Svelte components for rendering item sheets based on ItemTemplate definitions. These components enable dynamic, data-driven UI generation for game system items with proper field validation, layout control, and theming.

## Components Created

### 1. TemplateField.svelte

**Location**: `apps/web/src/lib/components/TemplateField.svelte`

**Purpose**: Renders individual fields based on FieldDefinition from the template system.

**Features**:
- Supports multiple field types:
  - `text` - Single-line text input
  - `textarea` - Multi-line text input
  - `number` - Numeric input
  - `boolean` - Checkbox input
  - `select` - Single-select dropdown
  - `multiselect` - Multi-select dropdown
  - `dice` - Dice formula input (e.g., "1d6+3")
  - `resource` - Current/Max value pair (e.g., HP: 10/20)
- Validation support with required field checking
- Readonly mode for display-only views
- Help text and placeholder support
- CSS variable theming for consistency
- Graceful handling of missing/null values

**Props**:
- `field: FieldDefinition` - Field definition from template
- `value: any` - Current field value
- `onChange: (value: any) => void` - Change callback
- `readonly: boolean` - Optional readonly flag

### 2. TemplateSection.svelte

**Location**: `apps/web/src/lib/components/TemplateSection.svelte`

**Purpose**: Groups multiple fields into organized sections with layout control.

**Features**:
- Collapsible sections support
- Responsive grid layout (12-column system)
- Field width controls:
  - `quarter` - 3 columns (25%)
  - `third` - 4 columns (33%)
  - `half` - 6 columns (50%)
  - `full` - 12 columns (100%)
- Automatic responsive breakpoints for mobile/tablet
- Section header with collapse icon
- Field grouping and organization

**Props**:
- `section: SectionDefinition` - Section configuration
- `fields: FieldDefinition[]` - Available fields
- `data: Record<string, any>` - Item data
- `onChange: (fieldId: string, value: any) => void` - Change callback
- `readonly: boolean` - Optional readonly flag

### 3. TemplateItemSheet.svelte

**Location**: `apps/web/src/lib/components/TemplateItemSheet.svelte`

**Purpose**: Complete item sheet that renders all sections from an ItemTemplate.

**Features**:
- Item name input with inline editing
- Item description textarea
- Category badge display
- Section-based layout
- Save/Cancel buttons (hidden in readonly mode)
- Event dispatching for save/cancel actions
- Scrollable content area
- Responsive mobile layout
- CSS variable theming

**Props**:
- `template: ItemTemplate` - Template definition
- `item: any` - Item instance data
- `onChange: (data: Record<string, any>) => void` - Change callback
- `readonly: boolean` - Optional readonly flag

**Events**:
- `save` - Dispatched when save button clicked
- `cancel` - Dispatched when cancel button clicked

## Implementation Details

### Type Safety

All components use proper TypeScript types from the shared package:
```typescript
import type { ItemTemplate, FieldDefinition, SectionDefinition } from '@vtt/shared';
```

### Theming

Components use CSS variables for consistent theming:
- `--color-bg-primary` - Primary background color
- `--color-bg-secondary` - Secondary background color
- `--color-text-primary` - Primary text color
- `--color-text-secondary` - Secondary text color
- `--color-accent` - Accent color (buttons, focus states)
- `--color-accent-hover` - Accent hover color
- `--color-border` - Border color

### Responsive Design

All components include responsive breakpoints:
- Mobile (<640px): Single column layout, full-width buttons
- Tablet (641-1024px): Adjusted column spans
- Desktop (>1024px): Full grid system

### Field Width System

The grid layout uses a 12-column system with semantic width classes:
- `quarter-width`: 3/12 columns (25%)
- `third-width`: 4/12 columns (33%)
- `half-width`: 6/12 columns (50%)
- `full-width`: 12/12 columns (100%)

Fields automatically stack on smaller screens for better mobile UX.

## Integration Example

```svelte
<script>
  import TemplateItemSheet from '$lib/components/TemplateItemSheet.svelte';

  let template = {
    entityType: 'item',
    id: 'longsword',
    name: 'Longsword',
    category: 'weapon',
    fields: [
      { id: 'damage', name: 'Damage', fieldType: 'dice', width: 'half' },
      { id: 'properties', name: 'Properties', fieldType: 'multiselect', width: 'half', options: [...] }
    ],
    sections: [
      { id: 'combat', name: 'Combat Stats', fields: ['damage', 'properties'] }
    ]
  };

  let item = {
    name: 'Longsword +1',
    description: 'A magical longsword',
    damage: '1d8+1',
    properties: ['versatile']
  };

  function handleSave(event) {
    const updatedItem = event.detail;
    // Save to backend
  }
</script>

<TemplateItemSheet
  {template}
  {item}
  onChange={(data) => item = data}
  on:save={handleSave}
/>
```

## Files Modified/Created

### Created
- `apps/web/src/lib/components/TemplateField.svelte` (343 lines)
- `apps/web/src/lib/components/TemplateSection.svelte` (170 lines)
- `apps/web/src/lib/components/TemplateItemSheet.svelte` (388 lines)

## Testing

### Docker Deployment

Changes were successfully deployed to Docker:
```bash
docker-compose up -d --build
```

Both server and web containers started successfully:
- `vtt_server`: Running on port 3000 (internal)
- `vtt_web`: Running on port 5173 (internal)
- All containers healthy and accessible via nginx proxy

### Build Verification

- TypeScript compilation: PASSED
- Svelte component compilation: PASSED
- No breaking changes introduced
- All existing functionality preserved

## Next Steps

1. **Integration with ItemSheet.svelte**: Update the existing ItemSheet component to use TemplateItemSheet when an item has a templateId
2. **Template Selection UI**: Create UI for selecting item templates when creating new items
3. **Custom Template Editor**: Build interface for GMs to create custom item templates
4. **Field Type Extensions**: Add support for additional field types:
   - `slots` - Checkbox array for spell slots
   - `clock` - Segment clock for progress tracking
   - `reference` - Links to other entities
   - `calculated` - Read-only computed values
5. **Validation Feedback**: Enhance validation error display with inline field errors
6. **Template Preview**: Add preview mode for template designers

## Dependencies

- `@vtt/shared` - Type definitions (ItemTemplate, FieldDefinition, SectionDefinition)
- Existing CSS variable system in `apps/web/src/app.css`
- Svelte component patterns from existing codebase

## Notes

- Components follow existing Svelte patterns in the codebase
- CSS styling matches existing component styles
- All components are fully typed with TypeScript
- Responsive design matches existing mobile breakpoints
- Components handle null/undefined values gracefully
- Readonly mode works correctly for all field types

## Commit

```
feat(frontend): Add template-driven item sheet components

- Add TemplateField.svelte for rendering individual field types
- Add TemplateSection.svelte for organizing fields into sections
- Add TemplateItemSheet.svelte for full item sheet rendering

Commit: cc40af3
```
