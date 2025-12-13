# Form Templates Guide

Form templates allow you to quickly create new forms with predefined layouts and configurations. This guide explains how to use and create templates in the Form Designer.

---

## Table of Contents

1. [What Are Templates](#what-are-templates)
2. [Using Built-in Templates](#using-built-in-templates)
3. [Creating Your Own Templates](#creating-your-own-templates)
4. [Managing Templates](#managing-templates)
5. [Best Practices](#best-practices)

---

## What Are Templates

Templates are reusable form blueprints that contain:

- **Layout structure** - All components, sections, and their arrangement
- **Field configurations** - Field types, labels, options, and bindings
- **Fragments** - Reusable layout pieces
- **Computed fields** - Formulas and calculations
- **Styles** - Theme and custom CSS

Templates serve as starting points for creating new forms, saving you time and ensuring consistency across your forms.

### Template Types

**Built-in Templates**
- Pre-configured templates provided by the system
- Cannot be edited or deleted
- Include common form layouts (character sheets, item cards, stat blocks)
- Always available to all users

**My Templates**
- Custom templates you create from your own forms
- Can be edited, renamed, or deleted
- Stored in your account
- Based on forms you've designed

---

## Using Built-in Templates

### Browsing Templates

1. Navigate to **Form Manager** (Forms menu)
2. Click the **Templates** tab
3. Browse available templates in the gallery view
4. Use the category tabs to filter:
   - **All** - Shows all templates
   - **Built-in** - Shows only system templates
   - **My Templates** - Shows only your custom templates

### Searching Templates

Use the search box to find templates by name or description:

```
Search: "character" → Finds character sheet templates
Search: "item" → Finds item card templates
Search: "stat" → Finds stat block templates
```

### Previewing a Template

To see what a template looks like before using it:

1. Find the template in the gallery
2. Click the **Use Template** button OR
3. Click the template card to see details
4. Click **Preview** to see the form with sample data

The preview shows:
- Template name and description
- Entity type and version
- Live preview of the form with sample data

### Creating a Form from a Template

To create a new form using a template:

1. Click **Use Template** on the template card
2. Enter a name for your new form
3. Click **OK**
4. The Form Designer opens with your new form

**Example:**
- Template: "Basic Character Sheet"
- Your form name: "My D&D 5e Character"
- Result: A new form with the basic character layout, ready to customize

---

## Creating Your Own Templates

### Saving a Form as a Template

You can save any form you've created as a reusable template:

1. Open your form in the **Form Designer**
2. Click the **Save as Template** button in the toolbar
3. Enter template information:
   - **Template Name** (required) - A descriptive name
   - **Description** (optional) - What the template is for
4. Click **Save Template**

**What Gets Saved:**
- All layout components and their configuration
- All fragments and their definitions
- All computed fields and formulas
- Current theme and custom styles

**What Doesn't Get Saved:**
- Entity data (only the form structure is saved)
- Form ID (each form created from the template gets a new ID)
- Campaign assignments

### When to Create a Template

Create a template when you have a form layout you'll use multiple times:

**Good Use Cases:**
- Character types (warriors, mages, rogues)
- Item categories (weapons, armor, consumables)
- NPC archetypes (merchants, guards, nobles)
- Standard documents (contracts, letters, scrolls)

**Example Workflow:**
1. Design a "Weapon Card" form with all the fields you need
2. Save it as a template: "Weapon Card Template"
3. Create new weapon forms from the template (Sword, Axe, Bow, etc.)
4. Each weapon form starts with the same structure

---

## Managing Templates

### Viewing Your Templates

1. Go to **Form Manager** > **Templates** tab
2. Click **My Templates** to see only your custom templates
3. Each template shows:
   - Template name
   - Description
   - Entity type
   - Number of fields

### Editing a Template

Templates themselves cannot be edited directly. To update a template:

1. Create a new form from the template
2. Make your desired changes in the Form Designer
3. Save it as a new template with the same name
4. Delete the old template (optional)

**Alternative Approach:**
1. Find the template form in **My Forms**
   - Look for forms starting with `[Template]`
2. Edit it directly in the Form Designer
3. The template will reflect your changes

### Deleting a Template

To remove a custom template:

1. Go to **Form Manager** > **Templates** tab
2. Find the template in **My Templates**
3. Click the **Delete** button
4. Confirm the deletion

**Note:** Built-in templates cannot be deleted.

### Organizing Templates

Templates are organized by:

- **Entity Type** - Filter templates by entity type (actor, item, etc.)
- **Game System** - Filter templates by game system
- **Category** - Built-in vs. My Templates

**Tip:** Use descriptive names and detailed descriptions to make templates easy to find later.

---

## Best Practices

### Naming Conventions

Use clear, descriptive names that indicate:
- What the template is for
- What entity type it applies to
- Any specific use case

**Good Names:**
- "Basic D&D 5e Character Sheet"
- "Magic Item Card"
- "Monster Stat Block (CR 1-5)"
- "NPC Quick Reference"

**Poor Names:**
- "Template 1"
- "New Form"
- "Test"
- "Untitled"

### Template Design

**Keep It Generic:**
- Remove specific entity data
- Use placeholder text in labels
- Keep descriptions general
- Don't include campaign-specific fields

**Make It Complete:**
- Include all commonly needed fields
- Set up logical field groupings
- Configure field options and constraints
- Add helpful labels and help text

**Add Documentation:**
- Write a clear description
- Explain what the template is for
- Note any special features or requirements
- Include usage examples in the description

### Example Template Descriptions

**Good Description:**
```
A comprehensive character sheet for D&D 5th Edition characters.
Includes ability scores, skills, combat stats, spell slots, and
inventory management. Suitable for levels 1-20.
```

**Better Description:**
```
D&D 5e Character Sheet Template

Complete character sheet with:
- Six ability scores with modifiers
- 18 skills with proficiency tracking
- Combat stats (AC, HP, initiative)
- Spell slots (levels 1-9)
- Equipment and inventory management
- Features and traits sections

Perfect for standard D&D 5e campaigns.
Use for any class or level.
```

### Template Maintenance

**Regular Review:**
- Periodically review your templates
- Delete templates you no longer use
- Update templates when common needs change
- Consolidate similar templates

**Version Control:**
- Include version info in template names or descriptions
- Keep older versions if you need backward compatibility
- Document changes when creating new versions

**Share Knowledge:**
- Document any special configurations in the description
- Note any dependencies or requirements
- Include examples of what the template is good for

---

## Tips and Tricks

### Quick Start from Template

For fastest results:
1. Click **Templates** tab
2. Click **Use Template** (bypasses preview)
3. Enter form name
4. Start customizing immediately

### Customizing After Creation

After creating a form from a template:
- All fields are fully editable
- You can add/remove components
- Change layout and styling
- Add fragments and computed fields
- The template is a starting point, not a constraint

### Building a Template Library

Create templates for common scenarios:
- Character archetypes
- Item categories
- Document types
- Stat block variations

This creates a personal library of reusable forms.

### Testing Templates

Before finalizing a template:
1. Create a test form from it
2. Verify all fields work correctly
3. Check layout on different screen sizes
4. Test with actual data
5. Make adjustments as needed
6. Save the improved version as a new template

---

## Troubleshooting

### Template Not Showing Up

**Problem:** I saved a template but don't see it in the gallery.

**Solutions:**
- Refresh the page
- Check **My Templates** category
- Verify the template was saved (check My Forms for `[Template]` prefix)
- Check game system and entity type filters

### Template Has Wrong Layout

**Problem:** The template layout doesn't match what I expected.

**Solutions:**
- Preview the template before using it
- Remember templates save the form state at save time
- Create a new template from your current form
- Delete the old template if needed

### Can't Delete a Template

**Problem:** The delete button doesn't work.

**Solutions:**
- Built-in templates cannot be deleted
- You must be the template owner to delete it
- Check you're viewing **My Templates** category

### Template Missing Features

**Problem:** A feature I added isn't in the template.

**Solutions:**
- Ensure you saved the form before creating the template
- Verify the feature is part of the form layout (not external data)
- Create a new template with the updated form

---

## Related Documentation

- [Form Designer Guide](../form-designer-guide.md) - Complete form designer documentation
- [Fragments Guide](../form-designer-fragments.md) - Creating reusable layout pieces
- [Field Types Reference](../field-types-reference.md) - All available field types
- [Computed Fields Guide](../form-designer-formula-reference.md) - Creating calculated fields

---

## Summary

Templates are powerful tools for quickly creating consistent, well-designed forms. Key takeaways:

- **Use built-in templates** for common form types
- **Create your own templates** from forms you design
- **Name templates descriptively** for easy finding later
- **Keep templates generic** and well-documented
- **Build a personal library** of reusable templates

Templates save time and ensure consistency across your forms, making form creation faster and more efficient.
