# VTT vs FoundryVTT Forms - Feature Matrix

Quick reference comparison table for form system features.

---

## Legend

- ✅ Fully Implemented
- 🟡 Partially Implemented / Basic
- ❌ Not Implemented
- 🏆 Superior Implementation

---

## Core Features

| Feature | FoundryVTT | VTT | Winner |
|---------|-----------|-----|--------|
| **Visual Form Designer** | ❌ | ✅ 🏆 | VTT |
| **Template System** | ✅ Handlebars | ✅ JSON Config | Tie |
| **Type Safety** | ❌ | ✅ 🏆 | VTT |
| **Hot Reload** | ✅ | ✅ | Tie |
| **Version Control** | ❌ | ✅ 🏆 | VTT |
| **Import/Export** | 🟡 Modules | ✅ 🏆 | VTT |
| **Documentation** | ✅ 🏆 | 🟡 | Foundry |

---

## Layout Capabilities

| Layout Type | FoundryVTT | VTT | Notes |
|------------|-----------|-----|-------|
| **Grid** | 🟡 Manual CSS | ✅ GridNode | VTT: Configurable columns/rows |
| **Flexbox** | 🟡 Manual CSS | ✅ FlexNode | VTT: Direction, justify, align |
| **Columns** | 🟡 Manual CSS | ✅ ColumnsNode | VTT: Configurable widths |
| **Tabs** | ✅ data-tab | ✅ TabsNode 🏆 | VTT: Lazy rendering |
| **Sections** | ✅ Manual | ✅ SectionNode | VTT: Collapsible by default |
| **Groups** | 🟡 Manual | ✅ GroupNode | VTT: Border, title options |
| **Repeaters** | 🟡 each loops | ✅ RepeaterNode 🏆 | VTT: Virtual scrolling |
| **Conditionals** | ✅ #if helper | ✅ ConditionalNode | VTT: Complex operators |
| **Fragments** | ✅ Partials | ✅ FormFragment 🏆 | VTT: Parameters, versioning |
| **Spacers** | 🟡 Manual | ✅ SpacerNode | VTT: Configurable |
| **Dividers** | 🟡 Manual `<hr>` | ✅ DividerNode | VTT: Horizontal/vertical |

---

## Field Types

| Field | FoundryVTT | VTT | Winner |
|-------|-----------|-----|--------|
| **Text** | ✅ | ✅ | Tie |
| **Number** | ✅ | ✅ | Tie |
| **Checkbox** | ✅ | ✅ | Tie |
| **Radio** | ✅ | ❌ | Foundry |
| **Select** | ✅ | ✅ | Tie |
| **Multi-Select** | ✅ 🏆 | ❌ | Foundry |
| **Textarea** | ✅ | ✅ | Tie |
| **Rich Text** | ✅ ProseMirror 🏆 | 🟡 Basic | Foundry |
| **Code Editor** | ✅ CodeMirror 🏆 | ❌ | Foundry |
| **Slider/Range** | ✅ range-picker | ✅ slider | Tie |
| **Color** | ✅ color-picker | ✅ color | Tie |
| **Date** | ✅ | ✅ | Tie |
| **File Upload** | ✅ FilePicker 🏆 | 🟡 URL only | Foundry |
| **Dice Notation** | ❌ | ✅ 🏆 | VTT |
| **Resource Bar** | ❌ | ✅ 🏆 | VTT |
| **Rating (Stars)** | ❌ | ✅ 🏆 | VTT |
| **Tags** | ❌ | ✅ 🏆 | VTT |
| **Reference** | 🟡 Autocomplete | 🟡 Basic | Tie |
| **Computed** | ❌ | ✅ 🏆 | VTT |

**Score:**
- FoundryVTT: 3 superior, 13 implemented
- VTT: 7 superior, 12 implemented, 3 basic

---

## Field Options

| Option | FoundryVTT | VTT | Notes |
|--------|-----------|-----|-------|
| **Min/Max** | ✅ | ✅ | Numeric constraints |
| **Step** | ✅ | ✅ | Numeric increment |
| **Placeholder** | ✅ | ✅ | Text fields |
| **Localization** | ✅ | ✅ | Both support i18n |
| **Required** | ✅ | ✅ | Validation |
| **Read-only** | ✅ | ✅ | Disabled editing |
| **Help Text** | ✅ | ✅ 🏆 | VTT: Auto ARIA |
| **Custom Validation** | ✅ | 🟡 | Foundry more flexible |
| **Default Values** | ✅ | ✅ | Both support |
| **Options/Choices** | ✅ | ✅ | Select dropdowns |
| **Grouped Options** | ✅ optgroup | ❌ | Foundry better |

---

## Styling & Theming

| Feature | FoundryVTT | VTT | Winner |
|---------|-----------|-----|--------|
| **CSS Variables** | ✅ | ✅ | Tie |
| **Built-in Themes** | ❌ | ✅ 🏆 | VTT (5 themes) |
| **Custom CSS** | ✅ Global | ✅ Scoped 🏆 | VTT |
| **CSS Utilities** | ✅ 🏆 | 🟡 Limited | Foundry |
| **Responsive** | ✅ | ✅ | Tie |
| **CSS Sanitization** | ❌ | ✅ 🏆 | VTT (XSS prevention) |
| **Theme Editor** | ❌ | ✅ 🏆 | VTT |
| **Dark Mode** | 🟡 System | ✅ Built-in | VTT |

**VTT Themes:**
1. Default (neutral)
2. Dark
3. Light
4. Parchment (fantasy)
5. Custom (user-defined)

---

## Advanced Features

| Feature | FoundryVTT | VTT | Winner |
|---------|-----------|-----|--------|
| **Computed Fields** | ❌ | ✅ 🏆 | VTT |
| **Visibility Conditions** | 🟡 Manual #if | ✅ 🏆 | VTT (operators) |
| **Virtual Scrolling** | ❌ | ✅ 🏆 | VTT (20+ items) |
| **Lazy Tab Rendering** | ❌ | ✅ 🏆 | VTT |
| **Drag & Drop** | ✅ 🏆 | ❌ | Foundry |
| **Context Menus** | ✅ 🏆 | ❌ | Foundry |
| **Auto-save** | ✅ | 🟡 | Foundry |
| **Dirty State Tracking** | ✅ | ✅ | Tie |
| **Undo/Redo** | ❌ | ❌ | Neither |
| **Form Validation** | ✅ | 🟡 Basic | Foundry |
| **Error Messages** | ✅ | 🟡 | Foundry |

---

## Accessibility (ARIA)

| Feature | FoundryVTT | VTT | Winner |
|---------|-----------|-----|--------|
| **ARIA Labels** | 🟡 Manual | ✅ Auto 🏆 | VTT |
| **ARIA Described By** | 🟡 Manual | ✅ Auto 🏆 | VTT |
| **ARIA Required** | 🟡 Manual | ✅ Auto 🏆 | VTT |
| **ARIA Roles** | ✅ | ✅ | Tie |
| **ARIA Live Regions** | ✅ | ✅ | Tie |
| **Focus Management** | ✅ | ✅ | Tie |
| **Keyboard Navigation** | ✅ | ✅ | Tie |
| **Screen Reader** | ✅ | ✅ | Tie |

**Analysis:** VTT auto-generates ARIA attributes, making accessibility easier and more consistent.

---

## Developer Experience

| Aspect | FoundryVTT | VTT | Winner |
|--------|-----------|-----|--------|
| **Learning Curve** | Steep (Handlebars) | Moderate (Designer) | VTT |
| **Code Completion** | ❌ | ✅ 🏆 | VTT (TypeScript) |
| **Error Messages** | 🟡 Runtime | ✅ 🏆 | VTT (Compile time) |
| **Hot Reload** | ✅ | ✅ | Tie |
| **Debugging** | 🟡 | ✅ 🏆 | VTT (Source maps) |
| **Documentation** | ✅ 🏆 | 🟡 Growing | Foundry |
| **Examples** | ✅ 🏆 Many | ✅ D&D 5e | Foundry |
| **Community** | ✅ 🏆 Large | 🟡 Small | Foundry |
| **Testing** | 🟡 Manual | ✅ 🏆 | VTT (Automated) |

---

## Performance

| Metric | FoundryVTT | VTT | Winner |
|--------|-----------|-----|--------|
| **Initial Render** | Fast | Fast | Tie |
| **Update Performance** | Good (jQuery) | Excellent (Svelte) 🏆 | VTT |
| **Large Forms** | 🟡 Can lag | ✅ Virtual scroll 🏆 | VTT |
| **Memory Usage** | Moderate | Low 🏆 | VTT |
| **Bundle Size** | N/A (included) | Small (Svelte) | VTT |

---

## Data Management

| Feature | FoundryVTT | VTT | Winner |
|---------|-----------|-----|--------|
| **Dot Notation** | ✅ | ✅ | Tie |
| **Array Indexing** | ✅ | ✅ | Tie |
| **Reactive Updates** | 🟡 Manual | ✅ Auto 🏆 | VTT |
| **Data Validation** | ✅ | 🟡 | Foundry |
| **Schema Definition** | ✅ DataModel | 🟡 TypeScript | Foundry |
| **Default Values** | ✅ | ✅ | Tie |
| **Data Migration** | ✅ 🏆 | 🟡 | Foundry |

---

## Integration

| Integration | FoundryVTT | VTT | Notes |
|------------|-----------|-----|-------|
| **Game Systems** | ✅ 100+ | 🟡 D&D 5e | Foundry: Mature ecosystem |
| **Modules** | ✅ 1000+ | ❌ | Foundry: Huge ecosystem |
| **Marketplace** | ✅ | 🟡 Planned | Foundry: Established |
| **API** | ✅ Stable | ✅ Growing | Tie |
| **Webhooks** | 🟡 | ✅ | VTT |
| **REST API** | 🟡 Limited | ✅ | VTT |

---

## Summary Scores

### Overall Winner by Category

| Category | Winner | Reason |
|----------|--------|--------|
| **Layout** | VTT 🏆 | Visual designer, more node types |
| **Fields** | Tie | VTT has specialized fields, Foundry has better editors |
| **Styling** | VTT 🏆 | Built-in themes, scoped CSS |
| **Advanced** | VTT 🏆 | Computed fields, conditions, virtual scrolling |
| **Accessibility** | VTT 🏆 | Auto-generated ARIA |
| **Developer UX** | VTT 🏆 | TypeScript, visual designer |
| **Performance** | VTT 🏆 | Svelte reactivity, virtual scrolling |
| **Ecosystem** | Foundry 🏆 | Mature, many systems/modules |
| **CSS Utilities** | Foundry 🏆 | Extensive utility classes |
| **File Handling** | Foundry 🏆 | Built-in file picker |

### Point Totals

**VTT Advantages:** 22 🏆
- Visual designer
- Type safety
- 7 specialized field types
- 5 built-in themes
- Scoped CSS with sanitization
- Computed fields
- Advanced conditions
- Virtual scrolling
- Lazy rendering
- Auto accessibility
- Better performance
- Modern framework

**FoundryVTT Advantages:** 6 🏆
- Multi-select field
- Rich text editor (ProseMirror)
- Code editor (CodeMirror)
- File picker
- CSS utility classes
- Mature ecosystem

**Tie:** 15 features roughly equivalent

---

## Recommended Priorities

### Must Have (Critical Gaps)

1. **CSS Utility Classes** - Foundry has `.form-group`, `.stacked`, etc.
2. **Multi-Select Field** - Common requirement
3. **File Upload** - Currently URL-only

### Should Have (Nice to Have)

4. **FieldGroup Node** - Standardizes label+input pattern
5. **Better Rich Text** - Current is basic textarea
6. **Code Editor Field** - For advanced users

### Could Have (Future)

7. **Radio Buttons** - Less common than checkbox
8. **Drag & Drop** - Platform feature
9. **Grouped Select Options** - `<optgroup>`

---

## Conclusion

**VTT Form System is superior in:**
- Architecture (Svelte > Handlebars)
- Developer experience (TypeScript, visual designer)
- Advanced features (computed fields, conditions, virtual scrolling)
- Performance (reactive framework)
- Theming (5 built-in themes)
- Security (CSS sanitization)

**FoundryVTT is superior in:**
- Ecosystem maturity (100+ systems, 1000+ modules)
- CSS utility patterns (standardized classes)
- Rich content editors (ProseMirror, CodeMirror)
- File handling (built-in picker)

**Recommendation:** Add missing field types and CSS utilities from Foundry while maintaining our architectural advantages.

**Estimated effort to close gaps:** 20-30 hours (CSS utilities, multiselect, file upload, FieldGroup)

---

**Legend Reminder:**
- ✅ Fully Implemented
- 🟡 Partially Implemented / Basic
- ❌ Not Implemented
- 🏆 Superior Implementation
