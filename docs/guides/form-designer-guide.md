# Form Designer User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Designer Interface Overview](#designer-interface-overview)
4. [The Component Palette](#the-component-palette)
5. [The Canvas Editor](#the-canvas-editor)
6. [The Property Editor](#the-property-editor)
7. [The Tree View](#the-tree-view)
8. [Toolbar Actions](#toolbar-actions)
9. [Working with Components](#working-with-components)
10. [Tips and Best Practices](#tips-and-best-practices)
11. [Common Workflows](#common-workflows)

---

## Introduction

### What is the Form Designer?

The Form Designer is a visual tool for creating custom forms in your VTT campaign. It provides a drag-and-drop interface that lets you build complex, interactive forms without writing any code.

### What Can You Create?

Use the Form Designer to build:
- **Character sheets** with tabs for abilities, inventory, spells, etc.
- **Item cards** for weapons, armor, and magical items
- **Spell cards** with all relevant spell information
- **NPC stat blocks** for quick reference during play
- **Custom forms** for any campaign-specific needs

### Who Can Use It?

The Form Designer is a **Game Master (GM) only** feature. Players cannot create or edit forms, but they can use the forms you create when filling out character sheets or viewing items.

---

## Getting Started

### Accessing the Form Designer

1. Navigate to the **Forms** section from the main menu
2. You'll see a list of existing forms in your campaign
3. Click the **"New Form"** button to create a new form, or click the **Edit** button next to an existing form

### Creating a New Form

When you create a new form:
1. Click **"New Form"** from the forms list
2. The designer opens with an empty canvas
3. Give your form a name by editing the text in the center of the toolbar
4. Start adding components from the palette

### Opening an Existing Form

To edit an existing form:
1. Find the form in the forms list
2. Click the **Edit** button (pencil icon)
3. The designer opens with the current form layout
4. Make your changes and click **Save**

---

## Designer Interface Overview

The Form Designer uses a three-panel layout with a toolbar at the top:

```
┌──────────────────────────────────────────────────────────────┐
│  [Back]  [Undo] [Redo]  Form Name Here  [Preview]  [Save]   │ Toolbar
├──────────┬────────────────────────────┬──────────────────────┤
│          │                            │                      │
│  PALETTE │         CANVAS             │     PROPERTIES       │
│          │                            │                      │
│  (left)  │       (center)             │      (right)         │
│          │                            │                      │
├──────────┤                            │                      │
│          │                            │                      │
│   TREE   │                            │                      │
│          │                            │                      │
│ (left)   │                            │                      │
└──────────┴────────────────────────────┴──────────────────────┘
```

### The Three Panels

1. **Left Panel** - Component Palette (top) and Tree View (bottom)
2. **Center Panel** - Canvas where you build your form visually
3. **Right Panel** - Property Editor for configuring selected components

### The Toolbar

The toolbar provides quick access to:
- **Back** - Return to forms list
- **Undo/Redo** - Revert or replay changes
- **Form Name** - Edit the form's display name
- **Preview** - Test how your form will look to users
- **Save** - Save changes to the server

---

## The Component Palette

The Component Palette is located in the upper-left panel and contains all available components you can add to your form.

### Component Categories

Components are organized into four categories:

#### 1. Layout Components

These components control the visual structure of your form:

- **Container** (📦) - Generic wrapper for grouping elements
- **Grid** (⊞) - CSS Grid layout with configurable rows and columns
- **Flex** (⬌) - Flexbox layout with direction and alignment controls
- **Columns** (|||) - Side-by-side columns with adjustable widths
- **Tabs** (🗂) - Tabbed interface for organizing related content
- **Section** (▣) - Collapsible section with optional title and icon
- **Group** (▢) - Visual grouping with optional border and title

#### 2. Field Components

These components collect or display data:

- **Text Field** (T) - Single-line text input
- **Number Field** (#) - Numeric input with optional min/max validation
- **Checkbox** (☑) - Boolean true/false checkbox
- **Select** (▼) - Dropdown selection from predefined options
- **Textarea** (⊞) - Multi-line text input for longer content
- **Computed Field** (ƒ) - Display calculated values from other fields

#### 3. Dynamic Components

These components provide advanced functionality:

- **Repeater** (↻) - Repeat a template for array data (e.g., inventory items, spell lists)
- **Conditional** (?) - Show or hide content based on conditions
- **Fragment Reference** (🔗) - Insert a reusable form fragment

#### 4. Static Content

These components display static information:

- **Static Text** (📝) - Text, HTML, or markdown content
- **Image** (🖼) - Display an image from a URL
- **Spacer** (↔) - Add spacing between elements
- **Divider** (─) - Visual divider line

### Searching for Components

Use the search box at the top of the palette to quickly find components:
1. Type a component name or description
2. The palette filters to show only matching components
3. Clear the search to see all components again

### Expanding/Collapsing Categories

Click on a category header to expand or collapse it:
- **▶** (collapsed) - Click to expand and see components
- **▼** (expanded) - Click to collapse and hide components

The number badge shows how many components are in each category.

### Dragging Components to the Canvas

To add a component to your form:
1. Click and hold on a component in the palette
2. Drag it to the canvas
3. Drop it on a blue drop zone
4. Release to add the component

The component will be added with sensible default settings that you can customize in the Property Editor.

---

## The Canvas Editor

The Canvas is the center panel where you visually build and arrange your form.

### Understanding the Visual Representation

Each component on the canvas is displayed as a colored box with:
- **Icon and label** - Shows the component type and name
- **Color-coded background** - Different colors for different component types
- **Nested structure** - Container components show their children indented inside

### Component Colors

Components use different background colors to help you identify them:

- **Blue shades** - Field components (text, number, checkbox, etc.)
- **Pastel colors** - Layout components (grid, flex, tabs, etc.)
- **Purple/amber** - Dynamic components (repeater, conditional)
- **Gray shades** - Static content (text, images, spacers)

### Drop Zones

**Drop zones** are thin horizontal lines that appear between components. They show where you can drop a new component or move an existing one.

When you drag a component:
- Drop zones appear as thin blue lines
- Hovering over a drop zone expands it and shows "Drop here"
- Drop zones appear both at the root level and inside containers

### Selecting Components

Click on any component in the canvas to select it:
- **Blue border** appears around the selected component
- **Property Editor** (right panel) updates to show the component's properties
- **Tree View** (left panel) highlights the selected component

Click on the canvas background to deselect all components.

### Visual Indicators

- **Selection** - 2px solid blue border
- **Hover** - Light blue border when you mouse over a component
- **Container nodes** - Dashed border to distinguish them from fields
- **Empty containers** - Show a message prompting you to add child components

### Quick Actions

When you select or hover over a component, quick action buttons appear:

- **↑ Move Up** - Move component earlier in the list (disabled if already first)
- **↓ Move Down** - Move component later in the list (disabled if already last)
- **Copy icon** - Duplicate the component
- **Trash icon** - Delete the component (shows confirmation)

### Working with Nested Structures

Container components (Grid, Flex, Tabs, etc.) can contain child components:

1. Drag a layout component to the canvas first
2. Drag field or content components into the layout container
3. Drop zones appear inside containers to show where children can be placed
4. Nested components appear indented with a visual hierarchy

### Empty Form State

When your form is empty, the canvas displays:
- A helpful message: "Your form is empty"
- Instructions: "Drag components from the palette to get started"
- A large drop zone for your first component

---

## The Property Editor

The Property Editor is the right panel where you configure the selected component's properties.

### How Properties Work

1. Select a component in the canvas or tree view
2. The Property Editor updates to show that component's properties
3. Make changes to any property
4. Changes are applied immediately to the canvas
5. Use Undo if you make a mistake

### No Selection State

When nothing is selected, the Property Editor shows:
- "No component selected"
- Instructions to select a component to edit its properties

### Common Properties

All components have these common properties:

#### Appearance
- **CSS Class** - Add custom CSS class names for styling (space-separated)

### Layout Component Properties

#### Container Properties
- Minimal configuration - just a wrapper for children
- Relies on CSS Class for custom styling

#### Grid Properties
- **Columns** - Number of columns or CSS template (e.g., "1fr 2fr 1fr")
- **Rows** - CSS template for row heights (optional)
- **Gap** - Spacing between all grid cells
- **Column Gap** - Horizontal spacing (overrides gap)
- **Row Gap** - Vertical spacing (overrides gap)

**Tip**: Use numbers for simple grids (e.g., "2" for 2 columns) or CSS templates for advanced layouts (e.g., "200px 1fr 200px").

#### Flex Properties
- **Direction** - Layout direction: row, column, row-reverse, column-reverse
- **Justify Content** - Alignment along main axis: start, center, end, space-between, space-around, space-evenly
- **Align Items** - Alignment along cross axis: start, center, end, stretch, baseline
- **Wrap** - Allow items to wrap to multiple lines
- **Gap** - Spacing between flex items

#### Columns Properties
- **Columns** - List of column widths (click + to add, − to remove)
- **Gap** - Spacing between columns

**Tip**: Use CSS units for widths: "1fr" for flexible, "200px" for fixed, "auto" for content-based.

#### Tabs Properties
- **Tabs** - List of tabs with labels and icons
  - Click + to add a new tab
  - Click − to remove a tab (minimum 1 required)
- **Position** - Where tabs appear: top, bottom, left, right
- **Default Tab** - Which tab is active by default

#### Section Properties
- **Title** - Section heading text
- **Icon** - Optional icon name to display
- **Collapsible** - Allow users to collapse/expand the section
- **Default Collapsed** - Start with section collapsed (only if collapsible)

#### Group Properties
- **Title** - Group heading text
- **Border** - Show a visual border around the group

### Field Component Properties

All field components share these common properties:

#### Basic Settings
- **Field Type** - Type of input: text, number, checkbox, select, textarea, etc.
- **Label** - Display label shown above/beside the field
- **Help Text** - Optional explanatory text shown below the field

#### Binding
- **Property Path** - The data property this field is bound to (e.g., "name", "attributes.strength.value")
- **Placeholder** - Hint text shown when field is empty

#### Validation
- **Required** - Mark field as required (user must fill it out)
- **Read Only** - Prevent users from editing this field

#### Type-Specific Options

**Select Fields**:
- **Options** - Multi-line editor for dropdown options
- Format: `value:Label` (one per line)
- Example:
  ```
  warrior:Warrior
  mage:Mage
  rogue:Rogue
  ```

**Number and Slider Fields**:
- **Min** - Minimum allowed value
- **Max** - Maximum allowed value
- **Step** - Increment/decrement step size

### Dynamic Component Properties

#### Repeater Properties
- **Binding** - Array property to repeat over (e.g., "inventory", "spells")
- **Add Label** - Text for the "add new item" button
- **Empty Message** - Message shown when array is empty
- **Min Items** - Minimum number of items (optional)
- **Max Items** - Maximum number of items (optional)
- **Allow Reorder** - Let users drag items to reorder
- **Allow Delete** - Show delete button on each item

#### Conditional Properties
- **Condition** - Simple condition for showing/hiding content
  - **Field** - Property path to check
  - **Operator** - Comparison: equals, notEquals, contains, greaterThan, lessThan, isEmpty, isNotEmpty, etc.
  - **Value** - Value to compare against (hidden for isEmpty/isNotEmpty)

**Note**: Complex conditions with AND/OR logic will be available in a future update.

#### Fragment Reference Properties
- **Fragment ID** - ID of the reusable fragment to insert
- **Parameters** - Key-value pairs to pass to the fragment

### Static Component Properties

#### Static Content Properties
- **Content Type** - Format of the content: text, html, markdown, image, icon
- **Content** - The actual content to display (for text/html/markdown)
- **HTML Tag** - Wrapper element for text content (div, p, span, etc.)

**Image Type**:
- **URL** - Image source URL
- **Alt Text** - Accessibility description
- **Width** - Image width (CSS value)
- **Height** - Image height (CSS value)

**Icon Type**:
- **Icon Name** - Name of the icon to display
- **Size** - Icon size in CSS units

#### Image Properties
- **Source URL** - URL of the image to display
- **Alt Text** - Accessibility description for screen readers
- **Width** - Image width (CSS value like "100px" or "50%")
- **Height** - Image height (CSS value)
- **Object Fit** - How image scales: contain, cover, fill, none, scale-down

#### Spacer Properties
- **Size** - Amount of space (CSS value like "1rem" or "20px")
- **Orientation** - horizontal or vertical

#### Divider Properties
- **Orientation** - horizontal or vertical
- **Style** - Line style (solid, dashed, dotted)

### Computed Field Properties
- **Field ID** - ID of the computed field (defined in form settings)
- **Label** - Display label for the computed value
- **Format** - Format string using `{value}` placeholder (e.g., "HP: {value}")

**Note**: Computed fields are defined separately in form settings and perform calculations based on other field values.

---

## The Tree View

The Tree View is located in the lower-left panel and shows your form's hierarchical structure.

### Understanding the Tree Structure

The tree displays your form as a nested list:
- **Root nodes** appear at the top level
- **Child nodes** appear indented under their parent
- **Icons and labels** identify each component

### Navigation

Click on any node in the tree to:
- Select that component
- Highlight it in the canvas
- Load its properties in the Property Editor

### Expanding and Collapsing

Components with children have an expand/collapse arrow:
- **▶** (collapsed) - Click to expand and see children
- **▼** (expanded) - Click to collapse and hide children

**Tip**: Double-click a node to toggle expand/collapse.

### Auto-Expand Feature

When you select a deeply nested component, the tree automatically expands all parent nodes to make your selection visible.

### Node Icons and Labels

Each node shows:
- **Icon** - Visual indicator of component type
- **Label** - Component name or identifier
  - Fields show their label or binding
  - Grids show column count
  - Sections show their title
  - Repeaters show their binding property

### Visual States

- **Normal** - Transparent background
- **Hover** - Light gray background
- **Selected** - Blue background with white text

### Empty State

When your form has no components, the tree shows:
- "No components yet"
- "Add components from the palette to get started"

---

## Toolbar Actions

The toolbar at the top provides essential form management tools.

### Back Button

Returns you to the forms list.

**Important**: If you have unsaved changes, you'll see a confirmation dialog:
- "You have unsaved changes. Are you sure you want to leave?"
- Click **OK** to discard changes and leave
- Click **Cancel** to stay in the designer

### Form Name Input

The large text input in the center lets you edit your form's name:
1. Click on the current name
2. Type a new name
3. Changes are saved when you click **Save**

### Undo Button (↶)

Reverts your last change:
- Click to undo the most recent action
- Disabled (grayed out) when there's nothing to undo
- Works with all operations: add, delete, move, property changes

### Redo Button (↷)

Replays a change you undid:
- Click to redo an undone action
- Disabled when there's nothing to redo
- The redo stack clears when you make a new change

### Preview Button

Switches between Design and Preview modes:

**Design Mode** - The normal editing view with palette, canvas, and properties

**Preview Mode** - Shows how your form will look to users:
- Three-panel layout is hidden
- Form renders using sample data
- Use this to test your form's appearance
- Click **Design** to return to editing

### Save Button

Saves your form to the server:
- **Enabled** when you have unsaved changes (blue)
- **Disabled** when form is saved or unchanged (gray)
- Shows "Saving..." while the save is in progress
- Shows an error banner if save fails

**Tip**: Save frequently to avoid losing work!

---

## Working with Components

### Adding Components

**Method 1: Drag and Drop**
1. Find the component in the palette
2. Click and drag it to the canvas
3. Drop it on a blue drop zone
4. Component is added and automatically selected

**Method 2: Quick Add** (future feature)
- Right-click a drop zone to see a menu of components
- Click to add without dragging

### Removing Components

**Method 1: Quick Action Button**
1. Select or hover over the component
2. Click the trash icon in the quick actions
3. Confirm deletion in the dialog
4. Component is removed

**Method 2: Keyboard** (future feature)
- Select the component
- Press Delete key
- Confirm deletion

**Warning**: Deleting a container also deletes all its children!

### Duplicating Components

1. Select the component you want to duplicate
2. Click the copy icon in quick actions
3. A duplicate is created immediately below the original
4. The duplicate has a new unique ID

**Note**: Duplicating a container copies all its children as well.

### Moving Components

**Method 1: Quick Actions**
- Click **↑** to move earlier in the list
- Click **↓** to move later in the list

**Method 2: Drag and Drop** (future feature)
- Click and drag a component on the canvas
- Drop it on a different drop zone
- Component moves to the new location

### Reordering Children

To change the order of components within a container:
1. Select a child component
2. Use the ↑/↓ quick action buttons to move it
3. Or drag it to a different drop zone within the same container

### Copying Between Containers

To move a component from one container to another:
1. Duplicate the component in its current location
2. Drag it to a drop zone in the target container
3. Delete the original

**Note**: Direct drag-between-containers will be added in a future update.

---

## Tips and Best Practices

### Start with Layout

Always start your form with a layout component:
- Use **Container** for simple vertical stacking
- Use **Grid** for multi-column layouts
- Use **Tabs** for complex forms with multiple sections
- Use **Flex** when you need precise alignment control

### Use Grid for Multi-Column Layouts

For side-by-side fields (common in character sheets):
```
Grid (2 columns)
├── Text Field: Character Name
├── Number Field: Level
├── Select: Class
└── Select: Race
```

Set columns to 2 and gap to "1rem" for a clean two-column layout.

### Use Tabs for Complex Forms

Character sheets often have multiple sections:
```
Tabs
├── Tab: Basic Info
│   └── Grid with name, class, race, level
├── Tab: Abilities
│   └── Grid with STR, DEX, CON, INT, WIS, CHA
├── Tab: Inventory
│   └── Repeater for items
└── Tab: Spells
    └── Repeater for spells
```

This keeps the interface organized and prevents overwhelming users.

### Use Sections for Collapsible Content

Break up long forms with collapsible sections:
```
Section: Combat Stats (collapsible)
├── Number: Armor Class
├── Number: Initiative
├── Number: Speed
└── Resource: Hit Points

Section: Skills (collapsible)
├── Checkbox: Acrobatics
├── Checkbox: Athletics
└── ... more skills
```

Users can collapse sections they're not currently using.

### Use Repeaters for Lists

Any time you have a list of similar items, use a Repeater:

**Inventory Example:**
```
Repeater (binding: "inventory")
├── Text: Item Name
├── Number: Quantity
└── Textarea: Description
```

**Spells Example:**
```
Repeater (binding: "spells")
├── Text: Spell Name
├── Number: Level
└── Select: School
```

Set "Allow Reorder" and "Allow Delete" to let users manage their lists.

### Preview Often

Click the **Preview** button frequently to see how your form looks:
- Check that layouts appear as expected
- Verify field labels are clear
- Test with different sample data
- Ensure sections collapse properly

### Use Meaningful Bindings

When setting property paths for fields:
- Use clear, descriptive names: "characterName" not "cn"
- Use dot notation for nested data: "attributes.strength.value"
- Be consistent across your forms
- Document complex bindings in help text

### Keep It Simple

Don't overcomplicate your forms:
- Start with essential fields, add more later if needed
- Use tabs to hide complexity
- Group related fields together
- Provide help text for non-obvious fields

### Test with Real Data

Before deploying your form:
1. Create a test character/item
2. Fill out the form completely
3. Check that all fields save correctly
4. Verify computed fields calculate properly
5. Test edge cases (empty arrays, min/max values)

---

## Common Workflows

### Creating a Simple Character Sheet

**Goal**: Basic character sheet with name, class, level, and abilities.

1. **Create the form**
   - Click "New Form"
   - Name it "Basic Character Sheet"

2. **Add a container for basic info**
   - Drag a **Grid** to the canvas (2 columns)
   - Set gap to "1rem"

3. **Add basic fields**
   - Drag **Text Field** into grid, configure:
     - Label: "Character Name"
     - Binding: "name"
   - Drag **Number Field** into grid:
     - Label: "Level"
     - Binding: "level"
     - Min: 1, Max: 20
   - Drag **Select Field** into grid:
     - Label: "Class"
     - Binding: "class"
     - Options:
       ```
       fighter:Fighter
       wizard:Wizard
       rogue:Rogue
       cleric:Cleric
       ```

4. **Add abilities section**
   - Drag a **Section** below the grid:
     - Title: "Ability Scores"
     - Collapsible: true
   - Inside the section, drag a **Grid** (3 columns)
   - Add 6 **Number Fields** for abilities:
     - STR, DEX, CON, INT, WIS, CHA
     - Binding: "abilities.strength.value", etc.
     - Min: 1, Max: 20

5. **Preview and save**
   - Click **Preview** to test
   - Click **Design** to return
   - Click **Save**

### Adding an Inventory Section with Repeater

**Goal**: Add an inventory list to an existing character sheet.

1. **Open your character sheet** in the designer

2. **Add a new tab** (if using tabs)
   - Select the Tabs component
   - In Property Editor, click + to add a tab
   - Label: "Inventory"

3. **Add a repeater**
   - Drag **Repeater** into the Inventory tab
   - Configure:
     - Binding: "inventory"
     - Add Label: "Add Item"
     - Empty Message: "No items in inventory"
     - Allow Reorder: checked
     - Allow Delete: checked

4. **Design the item template**
   - Inside the repeater, drag a **Grid** (2 columns)
   - Add **Text Field**:
     - Label: "Item Name"
     - Binding: "name"
   - Add **Number Field**:
     - Label: "Quantity"
     - Binding: "quantity"
     - Min: 0
   - Add **Textarea** (spans both columns):
     - Label: "Description"
     - Binding: "description"

5. **Save and test**
   - Click **Save**
   - In Preview mode, test adding/removing/reordering items

### Setting Up Conditional Fields

**Goal**: Show different fields based on character class.

1. **Add the class selector**
   - Add a **Select Field** for class selection
   - Binding: "class"
   - Options: fighter, wizard, rogue

2. **Add conditional for fighter**
   - Drag **Conditional** to canvas
   - Configure condition:
     - Field: "class"
     - Operator: equals
     - Value: "fighter"
   - Inside the conditional, add fighter-specific fields:
     - Number Field: "Armor Proficiency"
     - Checkbox: "Shield Training"

3. **Add conditional for wizard**
   - Drag another **Conditional**
   - Configure condition:
     - Field: "class"
     - Operator: equals
     - Value: "wizard"
   - Inside, add wizard fields:
     - Number Field: "Spell Slots"
     - Text Field: "Familiar Name"

4. **Test in preview**
   - Switch between different classes
   - Verify correct fields appear/disappear

### Using Computed Values

**Goal**: Display total modifier based on ability score.

1. **Add the base ability field**
   - Add **Number Field** for Strength
   - Binding: "abilities.strength.value"
   - Label: "Strength"

2. **Add computed modifier field**
   - Drag **Computed Field** next to Strength
   - Configure:
     - Field ID: "strModifier" (must be defined in form settings)
     - Label: "Modifier"
     - Format: "+{value}" or "{value}"

3. **Define the computation** (in form settings)
   - Open form settings (future feature)
   - Add computed field:
     - ID: "strModifier"
     - Formula: `floor((abilities.strength.value - 10) / 2)`

4. **Preview**
   - Change Strength value
   - Watch modifier update automatically

**Note**: The computed field configuration UI is coming in a future update. For now, computed field definitions must be added manually to the form JSON.

---

## Troubleshooting

### My component won't drop on the canvas

**Solution**: Make sure you're dropping on a blue drop zone line, not on a component itself. Drop zones appear between components and at the beginning/end of lists.

### I can't find a component in the palette

**Solution**:
- Check if you have a search filter active (clear the search box)
- Expand all categories by clicking their headers
- The component might be in a different category than expected

### My changes aren't saving

**Solution**:
- Check for error messages at the top of the designer
- Verify you're connected to the server
- Try clicking Save again
- If the issue persists, copy your form layout (use JSON view when available) and contact support

### The preview looks different from the canvas

**Solution**: This is normal. The canvas shows a simplified representation for editing. Preview mode shows the actual rendered form. Always use Preview to verify final appearance.

### I accidentally deleted a component

**Solution**: Click the **Undo** button (↶) immediately to restore it. The undo button can reverse all recent changes.

### My form is too complex and hard to navigate

**Solution**:
- Use the Tree View to navigate instead of scrolling the canvas
- Collapse sections you're not currently editing
- Consider breaking up the form with Tabs
- Split very complex forms into multiple smaller forms

### Fields aren't binding to data correctly

**Solution**:
- Check the property path spelling (case-sensitive)
- Use dot notation for nested properties: "attributes.strength.value"
- Preview the form and check browser console for binding errors
- Verify the data structure matches your bindings

---

## Keyboard Shortcuts

**Currently Available:**
- No dedicated keyboard shortcuts yet

**Coming Soon:**
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Y` - Redo
- `Delete` - Delete selected component
- `Ctrl+D` / `Cmd+D` - Duplicate selected component
- `Ctrl+S` / `Cmd+S` - Save form

---

## Advanced Topics

### Nested Repeaters

You can nest repeaters for complex data structures (e.g., a spell list within a character's class):

```
Repeater: Classes (binding: "classes")
└── Container
    ├── Text: Class Name
    └── Repeater: Class Spells (binding: "spells")
        └── Text: Spell Name
```

This creates a structure where each class has its own spell list.

### Complex Grid Layouts

Use CSS Grid template syntax for advanced layouts:

**Columns**: `"200px 1fr 1fr 100px"`
- First column: fixed 200px
- Middle two columns: equal flexible width
- Last column: fixed 100px

**Rows**: `"auto 1fr auto"`
- First row: content height
- Middle row: takes remaining space
- Last row: content height

### Styling with CSS Classes

Add custom CSS classes to components for advanced styling:

1. Add a CSS class in the Property Editor: "highlight-box"
2. Define the style in your campaign's custom CSS
3. The component will use your custom styles

**Example Classes:**
- "two-column" - Force a component to span 2 grid columns
- "emphasized" - Highlight important fields
- "compact" - Reduce padding/spacing

### Fragment Reusability

Create common fragments once and reuse them:

1. Create a fragment for common elements (e.g., "Ability Score Block")
2. Use Fragment Reference to insert it multiple times
3. Changes to the fragment automatically update all references

**Use Cases:**
- Ability scores block (used in character sheets, NPC sheets)
- Weapon stats block (used in character weapons, item cards)
- Spell format (used in spell lists, spellbooks)

---

## What's Next?

The Form Designer is actively being developed. Upcoming features include:

- **Property Binding Picker** - Visual tool for selecting data properties
- **Advanced Condition Builder** - Complex conditions with AND/OR logic
- **Fragment Library** - Browse and manage reusable fragments
- **JSON View** - Edit form definition as JSON for advanced users
- **Template Gallery** - Start from pre-built form templates
- **Drag-to-reorder** on canvas - Drag components directly on the canvas
- **Keyboard shortcuts** - Faster editing with keyboard
- **Form validation preview** - Test required fields and validation
- **Import/Export** - Share forms between campaigns

Stay tuned for updates!

---

## Getting Help

If you need assistance:

1. **Preview Mode** - Use preview to test your form and identify issues
2. **Undo Feature** - Don't be afraid to experiment; you can always undo
3. **Session Notes** - Check the session notes for technical details and implementation notes
4. **Community** - Ask other GMs in the community forums
5. **Support** - Contact VTT support for technical issues

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Form Designer Version**: Phase 3 (Designer UI Complete)
