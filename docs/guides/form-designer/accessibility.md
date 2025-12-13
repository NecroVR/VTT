# Form Designer Accessibility Guide

This guide explains the accessibility features of the VTT Form Designer and how to use them effectively.

## Overview

The Form Designer has been built with accessibility in mind, following WCAG 2.1 AA guidelines to ensure that all users, regardless of ability, can create and edit forms effectively.

## Keyboard Navigation

### Global Keyboard Shortcuts

When working in the Form Designer, the following keyboard shortcuts are available:

- **Ctrl+Z / Cmd+Z** - Undo last action
- **Ctrl+Y / Cmd+Y** - Redo last undone action
- **Delete / Backspace** - Delete selected component (with confirmation if it has children)
- **Enter** - Focus property editor for selected component
- **Escape** - Deselect currently selected component

### Tree View Navigation

The component structure tree supports full keyboard navigation:

- **Arrow Up** - Select previous visible component
- **Arrow Down** - Select next visible component
- **Arrow Right** - Expand collapsed component with children, or select first child if already expanded
- **Arrow Left** - Collapse expanded component, or select parent if already collapsed
- **Home** - Select first component in tree
- **End** - Select last visible component in tree
- **Enter** - Focus property editor for selected component

### Component Palette

- **Tab** - Navigate between palette items
- **Enter / Space** - Select component (note: drag and drop currently requires mouse)
- **Type to search** - Use the search box to filter components

### Form Canvas

- **Tab** - Navigate through components
- **Click** - Select a component
- **Double-click** - Edit component properties

### Property Editor

- **Tab** - Navigate between form fields
- **Enter** - Activate buttons and controls
- **Escape** - Return focus to canvas

## Screen Reader Support

### ARIA Labels and Roles

All interactive elements have appropriate ARIA labels and roles:

- **Toolbar** - Labeled as "Form designer toolbar" with individual button labels
- **Component Palette** - Labeled as "Component palette" with categorized lists
- **Tree View** - Proper tree structure with `role="tree"` and `role="treeitem"`
- **Canvas** - Labeled as "Form canvas" with visual feedback
- **Property Editor** - Form controls with labels and descriptions
- **Form Fields** - All form fields have associated labels and help text

### Live Regions

Dynamic updates are announced to screen readers:

- Save operations and errors
- Component selection changes
- Tree structure changes
- Form validation messages

### Drag and Drop

While drag-and-drop is primarily a mouse operation, we provide:

- ARIA grabbed/dropeffect attributes on draggable items
- Alternative keyboard methods for component insertion (under development)
- Clear visual and auditory feedback during drag operations

## Focus Management

### Focus Indicators

All interactive elements have visible focus indicators:

- **2px blue outline** on focused elements
- **Outline offset** of 2px for clarity
- **High contrast** focus styles that work in dark mode

### Focus Trapping

- Modal dialogs trap focus within the modal
- Tab order follows logical visual order
- Focus returns to triggering element when modals close

### Auto-Focus Behavior

- When selecting a component, it scrolls into view
- When opening property editor, first input is focused
- When creating new component, it's automatically selected

## Color and Contrast

### WCAG AA Compliance

All text and interactive elements meet WCAG 2.1 AA standards:

- **Text contrast**: Minimum 4.5:1 for normal text
- **Large text**: Minimum 3:1 for text 18pt+ or 14pt+ bold
- **UI components**: Minimum 3:1 for interactive elements
- **Focus indicators**: 3:1 contrast with background

### Color-Independent Information

We never rely on color alone to convey information:

- Required fields marked with asterisk (*) in addition to color
- Validation errors shown with icons and text
- Selected states shown with background color and icon
- Disabled states shown with opacity and cursor changes

### Dark Mode Support

The Form Designer fully supports dark mode:

- Automatic theme detection
- Manual theme override
- Consistent contrast ratios in both modes
- Custom theme support

## Form Accessibility Features

### Field Labeling

All form fields support:

- **Visual labels** - Displayed above the field
- **Placeholder text** - Inline hints
- **Help text** - Additional context below field
- **Required indicators** - Visual and ARIA markers
- **Error messages** - Associated with fields via aria-describedby

### Field Associations

- All labels are properly associated with inputs using `for` and `id` attributes
- Help text is linked via `aria-describedby`
- Required fields marked with `aria-required="true"`
- Invalid fields marked with `aria-invalid="true"` (when validation is implemented)

### Complex Controls

Special accessibility considerations for complex field types:

- **Tabs** - Full ARIA tablist implementation
- **Repeaters** - Proper list structure with add/remove buttons
- **Conditional** - Hidden sections use `aria-hidden` appropriately
- **Resource bars** - Progress bars with aria-valuenow/min/max
- **Rating fields** - Radio group alternative for keyboard users

## Testing Recommendations

### Keyboard-Only Testing

Test your forms using keyboard only:

1. Tab through all fields in logical order
2. Verify all controls are reachable
3. Ensure no keyboard traps
4. Test all keyboard shortcuts work

### Screen Reader Testing

Recommended screen readers:

- **Windows**: NVDA (free) or JAWS
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca

Testing checklist:

- [ ] All form fields are announced with labels
- [ ] Help text is read after field label
- [ ] Required fields are announced
- [ ] Navigation landmarks are present
- [ ] Dynamic updates are announced
- [ ] Button purposes are clear

### Browser Testing

Test accessibility in multiple browsers:

- Chrome/Edge with ChromeVox extension
- Firefox with NVDA
- Safari with VoiceOver
- Test zoom levels up to 200%

## Known Limitations

### Current Limitations

- **Drag and drop** - Currently requires mouse; keyboard alternative in development
- **Color picker** - Limited keyboard support in some browsers
- **Rich text editor** - Third-party editor accessibility varies
- **Image upload** - File picker requires mouse in most browsers

### Planned Improvements

- Keyboard-based component insertion
- Enhanced screen reader announcements for complex operations
- High contrast mode support
- Reduced motion mode for animations

## Best Practices for Form Creators

When designing forms, follow these accessibility guidelines:

### 1. Use Semantic Labels

```javascript
// Good
{
  type: 'field',
  fieldType: 'text',
  label: 'Character Name',
  helpText: 'Enter the full name of your character'
}

// Avoid
{
  type: 'field',
  fieldType: 'text',
  // No label - screen readers won't know purpose
}
```

### 2. Mark Required Fields

```javascript
{
  type: 'field',
  fieldType: 'text',
  label: 'Email Address',
  required: true,  // Shows asterisk and sets aria-required
}
```

### 3. Provide Help Text

```javascript
{
  type: 'field',
  fieldType: 'number',
  label: 'Strength Score',
  helpText: 'Enter a value between 3 and 18',  // Linked via aria-describedby
  options: { min: 3, max: 18 }
}
```

### 4. Use Appropriate Field Types

- Use `select` instead of custom dropdowns
- Use `checkbox` for boolean values
- Use `number` with min/max for numeric input
- Use `date` for date selection

### 5. Group Related Fields

```javascript
{
  type: 'section',
  title: 'Character Attributes',  // Provides context
  children: [
    // Related fields here
  ]
}
```

### 6. Logical Tab Order

- Arrange fields in the order users should complete them
- Use sections to group related fields
- Avoid complex nested layouts that confuse tab order

## Additional Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Inclusive Components](https://inclusive-components.design/)

## Feedback

If you encounter accessibility issues or have suggestions for improvements, please:

1. Report issues via GitHub Issues
2. Include details about your assistive technology
3. Describe the expected vs actual behavior
4. Suggest improvements where possible

We're committed to making the Form Designer accessible to everyone!
