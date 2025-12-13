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
9. [The Preview Panel](#the-preview-panel)
10. [Working with Components](#working-with-components)
11. [Tips and Best Practices](#tips-and-best-practices)
12. [Common Workflows](#common-workflows)
13. [Computed Fields](#computed-fields)

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

### Accessing the Forms Management Console

1. **From the Home Page**: After logging in, click the **"Manage Forms"** card on the home page
2. **Direct URL**: Navigate to `/forms` in your browser
3. You'll see the **Forms Management Console** with all available forms

### The Forms Management Console

The Forms Management Console displays all forms in a card grid:

**Each Form Card Shows:**
- Form name and description
- Game System badge (e.g., "D&D 5e OGL")
- Entity Type badge (e.g., "character", "item")
- Version number
- Last updated date
- "Default" indicator for system default forms

**Card Actions:**
- **Preview** (eye icon) - Preview the form with sample data
- **Edit** (pencil icon) - Open in the Form Designer
- **Duplicate** (copy icon) - Create a copy with a new name
- **Delete** (trash icon) - Remove the form (with confirmation)

**Filtering and Search:**
- Use the search box to find forms by name or description
- Filter by Game System using the dropdown
- Filter by Entity Type using the dropdown

### Creating a New Form

1. Click the **"Create New Form"** button in the top-right corner
2. The Form Designer opens with an empty canvas
3. Give your form a name by editing the text in the toolbar
4. Start adding components from the palette
5. Click **Save** when finished

### Duplicating a Form

To create a copy of an existing form:
1. Find the form you want to copy in the list
2. Click the **Duplicate** button (copy icon)
3. Enter a name for the new form (defaults to "Copy of [original name]")
4. Click OK to create the copy
5. The new form appears in the list ready to edit

### Opening an Existing Form

To edit an existing form:
1. Find the form in the Forms Management Console
2. Click the **Edit** button (pencil icon)
3. The Form Designer opens with the current form layout
4. Make your changes and click **Save**

### Previewing a Form

To preview how a form will look without editing:
1. Find the form in the list
2. Click the **Preview** button (eye icon)
3. A preview modal opens showing the form rendered
4. Use the entity selector to test with different sample data
5. Click outside the modal or press Escape to close

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
  - Type manually or click the 📋 button to use the Property Binding Picker
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
  - Type manually or click the 📋 button to browse array properties
- **Add Label** - Text for the "add new item" button
- **Empty Message** - Message shown when array is empty
- **Min Items** - Minimum number of items (optional)
- **Max Items** - Maximum number of items (optional)
- **Allow Reorder** - Let users drag items to reorder
- **Allow Delete** - Show delete button on each item

#### Conditional Properties

The Condition Builder allows you to control when a component is visible based on entity data.

**Simple Mode:**
- **Field** - Property path to check (e.g., "class", "level", "attributes.strength.value")
- **Operator** - Comparison to perform:
  - `equals` - Field equals the specified value
  - `does not equal` - Field does not equal the value
  - `contains` - Field contains the value (for strings)
  - `is empty` - Field is empty/null/undefined
  - `is not empty` - Field has a value
  - `is greater than` - Field is greater than the value (for numbers)
  - `is less than` - Field is less than the value (for numbers)
  - `is greater than or equal to` - Field >= value
  - `is less than or equal to` - Field <= value
- **Value** - Value to compare against (not shown for isEmpty/isNotEmpty operators)

**Compound Mode:**
- **Combine conditions with** - Choose AND or OR:
  - `AND` - All conditions must be true
  - `OR` - Any condition can be true
- **Conditions List** - Add multiple conditions:
  - Click "+ Add Condition" to add a new condition
  - Each condition has Field, Operator, and Value (same as Simple mode)
  - Click the X button to remove a condition
  - Minimum of 1 condition required

**Preview:**
The condition builder shows a plain English preview of your condition at the bottom:
- Simple: "Show when class equals wizard"
- Compound: "Show when level is greater than 5 AND class equals wizard"

**Example Use Cases:**

*Show wizard-specific fields only for wizards:*
- Mode: Simple
- Field: "class"
- Operator: equals
- Value: "wizard"

*Show advanced features for high-level characters:*
- Mode: Compound
- Operator: AND
- Condition 1: level is greater than 10
- Condition 2: experience is greater than 50000

*Show equipment section if character has items or gold:*
- Mode: Compound
- Operator: OR
- Condition 1: inventory is not empty
- Condition 2: gold is greater than 0

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

### Show/Hide Preview Button

Toggles the inline preview panel:
- Only visible in Design mode when viewing the Canvas
- Click **Show Preview** to open a side-by-side preview panel
- The preview panel appears between the Canvas and Properties panels
- Click **Hide Preview** to close the preview panel and reclaim screen space
- Use the preview panel to see real-time updates while editing

See the [Preview Panel](#the-preview-panel) section for detailed information on using the preview features.

---

## The Preview Panel

The Preview Panel is an inline preview that shows alongside your canvas, letting you see how your form renders in real-time as you make changes. This is different from the full-screen Preview mode accessed via the Preview button.

### Opening the Preview Panel

1. Make sure you're in Design mode (not Preview mode)
2. Make sure you're viewing the Canvas (not JSON view)
3. Click the **Show Preview** button in the toolbar
4. The preview panel appears between the Canvas and Properties panels
5. Click **Hide Preview** to close it

### Preview Panel Features

The preview panel includes several tools for testing your form:

#### Sample Data Selection

Choose different test entities to see how your form handles various data scenarios:

- **Empty Entity** - Test empty states and placeholders
- **Basic Character** - Minimal character data (name, class, level, race)
- **Full Character** - Complete D&D 5e character with all fields populated
- **Fighter Character** - Alternative full character example
- **Custom JSON** - Provide your own test data as JSON

**To select sample data:**
1. Use the dropdown at the top of the preview panel
2. Select a sample entity
3. The form re-renders immediately with the new data
4. Choose "Custom JSON" to provide your own test data

#### View/Edit Mode Toggle

Switch between view and edit modes to test both interaction styles:

- **View Mode** - Read-only display of form data
- **Edit Mode** - Interactive form with editable fields

**To toggle mode:**
1. Click the mode button in the preview controls
2. The button shows the current mode (View or Edit)
3. Click to switch between modes
4. Changes are immediate

#### Viewport Size Simulation

Test how your form looks at different screen sizes:

- **Mobile (📱)** - 375px width (smartphone)
- **Tablet (📱)** - 768px width (tablet)
- **Desktop (💻)** - 1024px width (standard monitor)
- **Full (⬛)** - 100% of preview panel width

**To change viewport size:**
1. Click one of the viewport buttons
2. The preview container resizes to the selected width
3. The active viewport is highlighted
4. A size badge at the bottom shows the current width
5. Use this to ensure your form is responsive

#### Custom JSON Data

When you need to test with specific data:

1. Select "Custom JSON" from the sample data dropdown
2. A JSON editor appears below the controls
3. Enter your test data as valid JSON
4. Invalid JSON shows an error message
5. The preview updates automatically when JSON is valid

**Example custom JSON:**
```json
{
  "name": "Test Character",
  "class": "Wizard",
  "level": 10,
  "attributes": {
    "intelligence": { "value": 18 }
  }
}
```

### Real-Time Updates

The preview panel updates automatically when you:
- Add or remove components
- Change component properties
- Modify field bindings
- Reorder components
- Update form structure

You don't need to click a refresh button - changes appear instantly.

### Preview vs Full Preview Mode

**Preview Panel** (inline):
- Shows alongside the canvas
- Use for quick checks while editing
- See changes in real-time
- Doesn't hide the designer interface
- Toggle on/off as needed

**Preview Mode** (full-screen):
- Accessed via the Preview button in toolbar
- Hides the designer interface completely
- Shows full-screen form renderer
- Use for final testing
- Click Design to return to editing

### Tips for Using the Preview Panel

**Test with Multiple Datasets:**
- Start with Empty Entity to check placeholders
- Use Basic Character for minimal data
- Test Full Character for complex layouts
- Create Custom JSON for edge cases

**Check Responsiveness:**
- Toggle between viewport sizes
- Ensure layouts work on mobile
- Check that multi-column grids collapse properly
- Verify text doesn't overflow

**Test Both Modes:**
- View mode for read-only display
- Edit mode to test field interactions
- Make sure required fields are clearly marked
- Check that validation works as expected

**Keep It Open While Editing:**
- The preview panel is designed to stay open
- See changes instantly as you work
- Close it when you need more screen space
- Reopen it to verify your changes

**Use with Tree View:**
- Select components in the tree view
- See them highlighted in both canvas and preview
- Navigate complex forms easily
- Understand the structure better

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

### Using the Property Binding Picker

The Property Binding Picker helps you visually browse and select entity properties instead of typing paths manually.

**Accessing the Picker:**
1. Select a field or repeater component
2. In the Property Editor, find the "Property Path" or "Array Property" field
3. Click the 📋 button next to the input field
4. The binding picker modal will open

**Browsing Properties:**
- Properties are displayed as a hierarchical tree
- Click the ▶ arrow to expand nested objects
- Click the ▼ arrow to collapse them
- Each property shows:
  - Type icon (📝 string, 🔢 number, ☑️ boolean, 📋 array, 📦 object)
  - Property name
  - Computed badge (ƒ) for calculated fields
  - Property type label

**Searching:**
- Type in the search box at the top to filter properties
- Search matches property names and paths
- Parent nodes automatically expand to show matches
- Clear the search to see all properties again

**Selecting a Property:**
1. Click on a property in the tree (leaf nodes only)
2. The property will be highlighted in blue
3. Click "Select" to use this property
4. The property path will be filled in automatically

**For Repeater Components:**
- The picker will only show array properties when opened from a repeater
- This ensures you can only bind to valid array data

**Tips:**
- Hover over a property to see its full path and description
- You can still type paths manually if you prefer
- The picker shows the current binding highlighted when opened

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

## JSON Editor

The Form Designer includes a JSON editor for advanced users who want direct access to the form definition structure. This is useful for precise control, debugging, and understanding how forms work under the hood.

### Accessing the JSON Editor

When in Design mode:
1. Look for the **JSON** button in the toolbar (next to Preview)
2. Click **JSON** to switch from visual canvas to JSON view
3. Click **Canvas** to switch back to the visual editor

**Note**: The JSON button is only available in Design mode, not Preview mode.

### JSON Editor Features

The JSON editor provides:
- **Syntax highlighting** with line numbers for easy reading
- **Format/Prettify** button to clean up indentation
- **Validate** button to check JSON structure
- **Auto-sync** mode for real-time updates
- **Apply** button to sync changes to visual editor
- **Validation errors** with detailed messages

### Basic Workflow

1. **Switch to JSON view** - Click the JSON button
2. **Edit the JSON** - Make changes in the text editor
3. **Validate** (optional) - Check for errors
4. **Apply changes** - Sync to the visual editor
5. **Switch back** - Return to Canvas view

### Using Auto-sync Mode

Enable the **Auto-sync** checkbox for real-time updates:
- Valid JSON changes apply automatically
- Invalid JSON shows errors without breaking the form
- Great for quick tweaks
- Disable for complex multi-step edits

### Common Use Cases

**Copying Components**
1. Copy a component's JSON object
2. Paste it where needed
3. Change the `id` to a unique value
4. Apply changes

**Bulk Property Changes**
Use Find & Replace to update multiple components:
- Find: `"required": false`
- Replace: `"required": true`

**Fine-tuning Layouts**
Direct JSON editing for precise grid/flex configurations:
```json
{
  "type": "grid",
  "columns": "200px 1fr 1fr 100px",
  "gap": "1rem"
}
```

**Learning Form Structure**
View the JSON to understand how components are structured and learn the form definition schema.

### When to Use JSON vs Visual Editor

**Use JSON editor:**
- Copying sections between forms
- Bulk property changes
- Fine-tuning complex configurations
- Debugging form structure
- Advanced users comfortable with JSON

**Use visual editor:**
- Adding new components
- Drag-and-drop reordering
- Learning the form designer
- Simple property changes
- Visualizing layout

### Validation and Errors

The editor validates:
- **JSON syntax** - Missing commas, brackets, quotes
- **Required fields** - id, name, layout must be present
- **Node structure** - Each node must have id and type
- **Data types** - Arrays, strings, objects must be correct

Error messages show exactly what's wrong and where.

### Tips for JSON Editing

1. **Format first** - Click Format for readable indentation
2. **Validate often** - Catch errors early
3. **Backup before major changes** - Copy JSON to clipboard first
4. **Keep IDs unique** - Every component needs a unique id
5. **Use Auto-sync for simple edits** - Enable for quick tweaks
6. **Disable Auto-sync for complex changes** - Make all edits, then apply

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

See the dedicated Fragment Library section below for comprehensive information on creating and managing reusable form fragments.

---

## The Fragment Library (Phase 3.8)

The Fragment Library allows you to create reusable pieces of form layout that can be inserted multiple times with different parameters. This is perfect for repeated patterns like ability score blocks, skill displays, or any component structure you use frequently.

### What are Fragments?

A **fragment** is a self-contained, parameterizable piece of form layout consisting of:
- **Name and description** - What the fragment represents
- **Parameters** - Customizable values (bindings, labels, options)
- **Content** - The actual layout nodes (fields, containers, etc.)

Think of fragments as templates or building blocks you can customize each time you use them.

### When to Use Fragments

Use fragments for:
- **Repeated patterns** - Ability scores, stat blocks, resource displays
- **Consistent layouts** - Standard formatting across forms
- **Reusable components** - Share common structures
- **Parameterized templates** - Same layout, different data bindings

**Example**: A "Skill Block" fragment displays a skill name, modifier, and proficiency checkbox. Create it once and reuse for all 18 D&D skills with different parameters.

### The Fragment Library Panel

Located in the lower-left panel below the Tree View.

**Features:**
- **Search bar** - Filter fragments by name or description
- **Create button** (+ New) - Opens Fragment Editor for new fragments
- **Fragment cards** - Show name, description, parameter count
- **Edit button** (✎) - Opens Fragment Editor for existing fragment
- **Delete button** (🗑) - Removes fragment with confirmation
- **Drag support** - Drag fragments onto canvas (future feature)

**Empty State**: Shows "Create First Fragment" button when no fragments exist.

### Creating a Fragment

1. Click **+ New** in the Fragment Library header
2. The Fragment Editor modal opens
3. Fill in basic information:
   - **Name** - Descriptive name (e.g., "Ability Score Block")
   - **Description** - Purpose and usage notes
4. Define parameters (see below)
5. Click **Create Fragment**

The fragment is created empty - you'll add content separately.

### Editing Fragments

1. Find the fragment in the library
2. Click the **✎** (edit) icon
3. Modify name, description, or parameters
4. Click **Save Changes**

**What You Can Edit:**
- Fragment name and description
- Parameters (add, modify, remove)
- Fragment content (via JSON editor currently)

### Deleting Fragments

1. Click the **🗑** (delete) icon
2. Review the confirmation dialog
3. **Warning**: Check if fragment is in use first
4. Click **Delete** to confirm

**Important**: Deleting a fragment doesn't remove existing Fragment Reference nodes. Update those manually.

### Fragment Parameters

Parameters make fragments flexible and reusable.

**Parameter Types:**
- **Binding** - Data path (e.g., "attributes.strength.value")
- **Literal** - Static value (e.g., "Strength", "AC")

**Parameter Properties:**
- **Name** - Identifier used in fragment content
- **Type** - Binding or Literal
- **Default Value** - Optional fallback
- **Description** - Usage documentation

**Example** - Ability Score Block parameters:
```
Name: abilityName
Type: Literal
Default: "Ability"
Description: Display name for the ability

Name: valuePath
Type: Binding
Description: Path to the ability score value

Name: modifierPath
Type: Binding
Description: Path to the calculated modifier
```

**Managing Parameters:**
1. In Fragment Editor, scroll to "Add Parameter" section
2. Fill in parameter details
3. Click **Add Parameter**
4. To edit: Click ✎, modify, click **Update**
5. To delete: Click 🗑, confirm

### Using Fragment References

Insert fragments into your form using Fragment Reference components.

1. Drag **Fragment Reference** (🔗) from Component Palette (Dynamic category)
2. Drop onto canvas
3. Select the Fragment Reference node
4. In Property Editor:
   - **Fragment ID** - Choose which fragment
   - **Parameters** - Provide values for each parameter
5. Fragment content renders at this location

**Parameter Values:**
- Binding parameters: Enter data path like "abilities.str.value"
- Literal parameters: Enter static text like "Strength"

**Example** - Six ability scores using one fragment:
```
Grid (2 columns)
├── Fragment Reference: Ability Score Block
│   Parameters: { name: "STR", valuePath: "abilities.str.value", modifierPath: "abilities.str.modifier" }
├── Fragment Reference: Ability Score Block
│   Parameters: { name: "DEX", valuePath: "abilities.dex.value", modifierPath: "abilities.dex.modifier" }
├── Fragment Reference: Ability Score Block
│   Parameters: { name: "CON", valuePath: "abilities.con.value", modifierPath: "abilities.con.modifier" }
... (continue for INT, WIS, CHA)
```

### Fragment Best Practices

**Keep Fragments Focused:**
- One fragment = one reusable pattern
- Don't make fragments overly complex
- Break large structures into multiple fragments

**Use Clear Names:**
- Good: "Ability Score Block", "Skill with Proficiency"
- Bad: "Fragment 1", "Random Fields"

**Document Parameters:**
- Always provide parameter descriptions
- Use clear, meaningful parameter names
- Provide sensible defaults when possible

**Plan Parameters:**
- Identify what needs to be customizable
- Don't over-parameterize
- Common parameters: labels, bindings, flags

**Test Thoroughly:**
- Use fragment in multiple places
- Verify parameters work correctly
- Test edge cases (empty values, long text)

### Example: Skill Fragment

Creating a reusable D&D skill block.

**Step 1: Create Fragment**
1. Click **+ New**
2. Name: "Skill Block"
3. Description: "Skill with modifier and proficiency checkbox"

**Step 2: Define Parameters**
```
skillName (Literal)
- Default: "Skill"
- Description: "Display name"

modifierPath (Binding)
- Description: "Path to skill modifier"

proficiencyPath (Binding)
- Description: "Path to proficiency boolean"
```

**Step 3: Define Content** (via JSON currently)
Add to fragment's content array:
```json
{
  "type": "flex",
  "direction": "row",
  "gap": "0.5rem",
  "children": [
    {
      "type": "field",
      "fieldType": "checkbox",
      "binding": "{{proficiencyPath}}",
      "label": ""
    },
    {
      "type": "static",
      "content": "{{skillName}}",
      "contentType": "text"
    },
    {
      "type": "field",
      "fieldType": "number",
      "binding": "{{modifierPath}}",
      "label": "",
      "readonly": true
    }
  ]
}
```

**Step 4: Use Fragment**
Create 18 Fragment References for D&D skills:
```
skillName: "Acrobatics"
modifierPath: "skills.acrobatics.modifier"
proficiencyPath: "skills.acrobatics.proficient"
```

Repeat for all skills!

### Future Enhancements

**Coming Soon:**
- **Visual content editor** - Edit fragment layout in the Fragment Editor modal
- **Drag from library** - Drag fragments directly onto canvas
- **Fragment preview** - See fragment content before using
- **Fragment templates** - Pre-built fragment library
- **Cross-form fragments** - Share fragments between forms

---

## Computed Fields

### Overview

Computed fields allow you to display values that are automatically calculated from other entity properties using formulas. This is perfect for derived stats like ability modifiers, attack bonuses, or encumbrance totals.

**Use Cases:**
- **Ability Modifiers** - Calculate `floor((strength - 10) / 2)`
- **Attack Bonuses** - Compute `proficiencyBonus + dexterityModifier`
- **Encumbrance** - Total up `sum(inventory.*.weight)`
- **Conditional Values** - Use `if(level >= 5, 2, 1)` for proficiency dice

### Creating Computed Fields

Computed fields are defined at the **form level** in the Form Settings and then referenced by Computed Field components in your layout.

**Step 1: Define the Computed Field**
1. In the Form Designer, access the **Form Settings** panel
2. Navigate to the **Computed Fields** section
3. Click **"Add Computed Field"**
4. Enter:
   - **ID**: Unique identifier (e.g., `strengthModifier`)
   - **Name**: Display name (e.g., "Strength Modifier")
   - **Description**: Optional explanation
   - **Formula**: The calculation expression
   - **Result Type**: `number`, `string`, or `boolean`

**Step 2: Add to Layout**
1. Drag a **Computed Field** component from the palette
2. In the Property Editor, select your computed field from the dropdown
3. Set the display label (optional)
4. Set the format string (optional, e.g., `{value} HP`)

### Formula Language Reference

#### Property References
Access entity data using dot notation:
```
abilities.strength.value
character.level
inventory.0.weight
```

#### Mathematical Operators
```
+  Addition
-  Subtraction
*  Multiplication
/  Division
%  Modulo (remainder)
^  Power (exponentiation)
```

#### Comparison Operators
```
==  Equals
!=  Not equals
<   Less than
>   Greater than
<=  Less than or equal
>=  Greater than or equal
```

#### Logical Operators
```
and  Logical AND
or   Logical OR
not  Logical NOT
```

#### Built-in Functions

**Math Functions:**
- `floor(x)` - Round down to nearest integer
- `ceil(x)` - Round up to nearest integer
- `round(x)` - Round to nearest integer
- `abs(x)` - Absolute value
- `sqrt(x)` - Square root
- `min(a, b, ...)` - Return smallest value
- `max(a, b, ...)` - Return largest value

**Array Functions:**
- `sum(array)` - Sum all values in array
- `count(array)` - Count items in array

**Conditional Function:**
- `if(condition, trueValue, falseValue)` - Return value based on condition

### Formula Examples

**Ability Modifier (D&D 5e)**
```
floor((abilities.strength.value - 10) / 2)
```
Calculates the ability modifier from the ability score.

**Attack Bonus**
```
proficiencyBonus + abilities.dexterity.modifier
```
Adds proficiency bonus to dexterity modifier.

**Total Inventory Weight**
```
sum(inventory.*.weight)
```
Sums the weight of all items in inventory (uses wildcard `*`).

**Proficiency Dice by Level**
```
if(level >= 5, 2, 1)
```
Returns 2 dice if level is 5 or higher, otherwise 1.

**AC Calculation**
```
10 + abilities.dexterity.modifier + armor.bonus
```
Computes armor class from multiple sources.

**Spell Save DC**
```
8 + proficiencyBonus + abilities.wisdom.modifier
```
Calculates spell save difficulty class.

**Encumbrance Status**
```
if(totalWeight > abilities.strength.value * 15, "Encumbered", "Normal")
```
Returns string based on encumbrance threshold.

**Min/Max HP**
```
max(1, hitDice + abilities.constitution.modifier)
```
Ensures HP never goes below 1.

### Testing Formulas

The Property Editor includes a **Formula Editor** with live testing:

1. Click **"Edit Formula"** on a computed field
2. Enter your formula in the text area
3. Formula syntax is validated in real-time
4. Use the **Test Data** field to provide sample entity data as JSON
5. See the computed result immediately
6. Click **"Save Formula"** when satisfied

**Example Test Data:**
```json
{
  "abilities": {
    "strength": {
      "value": 16
    }
  },
  "level": 5,
  "proficiencyBonus": 3
}
```

### Displaying Computed Values

**Format Strings:**
Use `{value}` as a placeholder in the format string:
```
{value}            → "3"
{value} HP         → "3 HP"
Modifier: {value}  → "Modifier: 3"
+{value}           → "+3"
```

**Read-Only:**
Computed fields are always read-only and update automatically when dependent values change.

**Error Handling:**
If a formula fails to evaluate (e.g., missing property, division by zero), the computed field displays an error message instead of the value.

### Advanced Features

**Dependency Tracking:**
The engine automatically tracks which properties each formula depends on and recalculates only when those properties change.

**Result Caching:**
Computed results are cached for performance. The cache is invalidated automatically when dependencies change.

**Sandboxed Execution:**
All formulas run in a secure sandbox with:
- No access to global JavaScript objects
- 1-second timeout for long-running calculations
- Memory limits to prevent abuse

### Limitations

- **No Custom Functions**: Only built-in functions are available
- **No Recursion**: Computed fields cannot reference other computed fields
- **No Side Effects**: Formulas are read-only and cannot modify entity data
- **Numeric Focus**: Most functions work with numbers; string operations are limited

### Best Practices

1. **Keep Formulas Simple**: Complex logic is harder to debug
2. **Test Thoroughly**: Use the formula editor to test edge cases
3. **Use Descriptive Names**: Name computed fields clearly (e.g., `strengthModifier` not `sm`)
4. **Document Formulas**: Add descriptions to explain complex calculations
5. **Handle Edge Cases**: Use `if()` to handle zero, null, or missing values
6. **Prefer Wildcards**: Use `inventory.*.weight` instead of hardcoded indices

---

## What's Next?

The Form Designer is actively being developed. Upcoming features include:

- **Template Gallery** - Start from pre-built form templates
- **Drag-to-reorder** on canvas - Drag components directly on the canvas
- **Keyboard shortcuts** - Faster editing with keyboard
- **Form validation preview** - Test required fields and validation
- **Import/Export** - Share forms between campaigns
- **Game system schemas** - Support for multiple game systems beyond D&D 5e
- **Computed Field Improvements** - Reference other computed fields, custom functions

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

**Document Version**: 1.1
**Last Updated**: 2025-12-12
**Form Designer Version**: Phase 4.2-4.3 (Computed Fields & Formula Language)
