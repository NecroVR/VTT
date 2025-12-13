# Form Designer Security Guide

## Overview

The VTT Form Designer implements comprehensive security measures to protect against Cross-Site Scripting (XSS) attacks and other web vulnerabilities. This guide explains how HTML content is sanitized, what content is allowed, and best practices for form creators.

## HTML Sanitization

### What is HTML Sanitization?

HTML sanitization is the process of cleaning user-provided HTML content to remove potentially malicious code while preserving safe formatting. The Form Designer uses **DOMPurify**, an industry-standard XSS sanitizer, to ensure all HTML content is safe before rendering.

### Where Sanitization is Applied

The system automatically sanitizes HTML content in the following locations:

1. **Static HTML Fields** - Any static field with `contentType: 'html'`
2. **Rich Text Fields (View Mode)** - When displaying rich text field values
3. **Rich Text Fields (Preview)** - When showing live previews in edit mode
4. **Custom CSS** - Form-level custom CSS is sanitized separately (see FormRenderer.svelte)

### How Sanitization Works

When you include HTML content in a form, the system:

1. **Processes the content** through DOMPurify
2. **Removes dangerous elements** like `<script>`, `<iframe>`, `<object>`, `<embed>`
3. **Strips event handlers** like `onclick`, `onerror`, `onload`, etc.
4. **Validates URLs** in links to prevent `javascript:` and `data:` URIs
5. **Preserves safe formatting** as defined in the allowed tags list

## Allowed HTML Content

### Permitted HTML Tags

The following HTML tags are allowed in static fields and rich text content:

#### Text Formatting
- `<p>` - Paragraphs
- `<br>` - Line breaks
- `<strong>`, `<b>` - Bold text
- `<em>`, `<i>` - Italic text
- `<u>` - Underlined text
- `<s>`, `<del>` - Strikethrough text
- `<ins>` - Inserted text
- `<sup>`, `<sub>` - Superscript and subscript

#### Headings
- `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>` - All heading levels

#### Lists
- `<ul>` - Unordered lists
- `<ol>` - Ordered lists
- `<li>` - List items

#### Structure
- `<div>` - Generic containers
- `<span>` - Inline containers
- `<blockquote>` - Block quotes
- `<hr>` - Horizontal rules

#### Code
- `<code>` - Inline code
- `<pre>` - Preformatted text blocks

#### Tables
- `<table>` - Table container
- `<thead>`, `<tbody>` - Table sections
- `<tr>` - Table rows
- `<th>`, `<td>` - Table headers and cells

#### Links
- `<a>` - Hyperlinks (see URL restrictions below)

### Permitted HTML Attributes

Only the following attributes are allowed:

- `href` - Link destinations (restricted to safe protocols)
- `title` - Tooltip text
- `class` - CSS class names
- `id` - Element identifiers
- `style` - Inline styles (limited to safe properties)

### URL Restrictions

Links (`<a href="...">`) are restricted to safe protocols:

- `http://` and `https://` - Web links
- `mailto:` - Email links
- Relative URLs - Same-origin links

**Blocked protocols include:**
- `javascript:` - Prevents code execution
- `data:` - Prevents embedded scripts
- `vbscript:` - Prevents VBScript execution
- Other dangerous protocols

## Forbidden Content

### Blocked HTML Tags

The following tags are **always removed** regardless of content:

- `<script>` - JavaScript code
- `<iframe>` - Embedded frames
- `<object>` - Embedded objects
- `<embed>` - Embedded content
- `<link>` - External stylesheets
- `<style>` - Inline style blocks

### Blocked Attributes

All event handler attributes are removed:

- `onclick`, `ondblclick`, `onmousedown`, etc.
- `onload`, `onerror`, `onabort`
- `onfocus`, `onblur`, `onchange`
- `onsubmit`, `onreset`
- Any attribute starting with `on`

### Data Attributes

Custom data attributes (`data-*`) are **not allowed** to prevent data exfiltration attacks.

## Best Practices for Form Creators

### 1. Use Semantic HTML

Use proper HTML tags for their intended purpose:

```html
<!-- Good: Semantic and accessible -->
<h3>Character Stats</h3>
<p>Your character's primary attributes.</p>
<ul>
  <li><strong>Strength:</strong> Physical power</li>
  <li><strong>Dexterity:</strong> Agility and reflexes</li>
</ul>

<!-- Avoid: Inline styles for headings -->
<p style="font-size: 20px; font-weight: bold;">Character Stats</p>
```

### 2. Trust the Sanitizer

Don't try to work around the sanitizer. If you need functionality that's blocked, it's blocked for security reasons. Instead:

- Use allowed tags creatively
- Leverage CSS classes for styling
- Use form fields for interactive elements instead of JavaScript

### 3. Structure Over Style

Focus on content structure rather than visual styling:

```html
<!-- Good: Structured content -->
<h4>Important Note</h4>
<blockquote>
  <p>This ability can only be used once per day.</p>
</blockquote>

<!-- Avoid: Purely decorative HTML -->
<div style="border: 2px solid red; padding: 10px;">
  <span style="color: red; font-weight: bold;">IMPORTANT!</span>
  <span>This ability can only be used once per day.</span>
</div>
```

### 4. Use Rich Text for Formatted Content

For content that needs formatting:

1. Create a **Rich Text Field** instead of HTML in static fields
2. Users can then edit the content with proper formatting
3. The sanitizer protects the content automatically

### 5. Leverage Interpolation Safely

Use variable interpolation for dynamic content:

```html
<!-- Safe: Interpolated values are automatically escaped -->
<p>Welcome, {{character.name}}!</p>
<p>Your current health: {{character.health.current}}/{{character.health.max}}</p>
```

The system interpolates `{{path}}` patterns with values from the entity data, and these values are safely escaped.

### 6. Test Your Forms

Always test forms in both view and edit mode:

1. Create test content with various HTML tags
2. Verify formatting appears as expected
3. Ensure no error messages appear in the browser console
4. Test with different user roles if applicable

## Common Use Cases

### Adding Descriptive Text with Formatting

```html
<div>
  <h4>Ability: Fireball</h4>
  <p><strong>Cost:</strong> 3 Mana</p>
  <p><strong>Range:</strong> 60 feet</p>
  <p><em>A bright streak flashes from your pointing finger to a point
  you choose within range and then blossoms with a low roar into an
  explosion of flame.</em></p>
</div>
```

### Creating Tables for Reference

```html
<table>
  <thead>
    <tr>
      <th>Level</th>
      <th>Damage</th>
      <th>Range</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>1d6</td>
      <td>30 ft</td>
    </tr>
    <tr>
      <td>2</td>
      <td>2d6</td>
      <td>60 ft</td>
    </tr>
  </tbody>
</table>
```

### Adding Help Text with Links

```html
<p>
  For more information about character creation, see the
  <a href="https://example.com/character-guide" title="Character Creation Guide">
    official guide
  </a>.
</p>
```

### Displaying Game Rules

```html
<blockquote>
  <p><strong>Rule:</strong> When you roll a natural 20, the attack hits
  regardless of any modifiers or the target's AC.</p>
</blockquote>

<p><strong>Critical Hit Effects:</strong></p>
<ul>
  <li>Roll all damage dice twice</li>
  <li>Add modifiers only once</li>
  <li>Some abilities grant additional effects</li>
</ul>
```

## Security Considerations

### Why These Restrictions?

The sanitization rules prevent several attack vectors:

1. **XSS Attacks** - Blocked by removing `<script>` tags and event handlers
2. **Clickjacking** - Prevented by blocking `<iframe>` elements
3. **Data Exfiltration** - Stopped by URL restrictions and data attribute blocks
4. **CSS Injection** - Mitigated by blocking `<style>` tags and inline style sheets
5. **Phishing** - Limited by URL protocol restrictions

### What If I Need More Functionality?

If you need functionality blocked by the sanitizer:

1. **Use Form Fields** - Interactive elements should be proper form fields
2. **Use Computed Fields** - For dynamic calculations and displays
3. **Use Conditionals** - Show/hide content based on field values
4. **Contact Support** - If you have a legitimate use case that's blocked

### Reporting Security Issues

If you discover a way to bypass the sanitization or have security concerns:

1. **Do not post publicly** - This could expose other users to risk
2. **Contact the development team** - Use the security disclosure process
3. **Provide details** - Include steps to reproduce and potential impact

## Technical Details

### Implementation

The sanitization is implemented using:

- **Library:** isomorphic-dompurify v2.34.0+
- **Configuration:** Whitelist-based (allow known-good, block everything else)
- **Scope:** Client-side and server-side rendering

### Files Involved

- `apps/web/src/lib/components/forms/LayoutRenderer.svelte` - Static HTML sanitization
- `apps/web/src/lib/components/forms/FieldRenderer.svelte` - Rich text sanitization
- `apps/web/src/lib/services/cssSanitizer.ts` - CSS sanitization (separate system)

### Sanitization Configuration

```typescript
DOMPurify.sanitize(html, {
  ALLOWED_TAGS: [/* whitelist of safe tags */],
  ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'style'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', /* all event handlers */]
});
```

## Computed Field Formula Security

The Computed Field Engine processes user-defined formulas to calculate derived values in dynamic forms. To prevent abuse and resource exhaustion attacks, the engine enforces strict complexity limits.

### Formula Complexity Limits

All formulas are subject to the following security limits:

#### 1. Maximum Formula Length: 10,000 Characters

**Purpose**: Prevents parsing and memory exhaustion from extremely long formulas.

**Example that would be rejected**:
```javascript
// A formula with > 10,000 characters
"field1 + field2 + field3 + ..." (repeated 5,000+ times)
```

**Error Message**:
```
Formula exceeds maximum length of 10000 characters (got 15000).
This limit prevents resource exhaustion attacks.
Consider breaking your formula into multiple computed fields.
```

**Workaround**: Break complex calculations into multiple computed fields.

---

#### 2. Maximum AST Depth: 20 Levels

**Purpose**: Prevents stack overflow attacks from deeply nested expressions.

**Example that would be rejected**:
```javascript
// 25 levels of nested parentheses
"(((((((((((((((((((((((((1)))))))))))))))))))))))))"
```

**Error Message**:
```
Formula exceeds maximum depth of 20 levels (got 25).
This limit prevents stack overflow attacks.
Consider breaking your formula into smaller parts.
```

---

#### 3. Maximum Node Count: 500 Nodes

**Purpose**: Prevents CPU exhaustion from overly complex formulas.

**What counts as a node**: Each literal, property, operator, function call, and array access.

**Example that would be rejected**:
```javascript
// 600+ nodes from chaining many operations
"field1 + field2 + field3 + field4 + ..." (repeated 300 times)
```

**Error Message**:
```
Formula exceeds maximum complexity of 500 nodes (got 650).
This limit prevents resource exhaustion attacks.
Consider simplifying your formula.
```

**Tip**: Use built-in functions like `sum(array)` instead of manual chaining.

---

#### 4. Maximum Array Iterations: 1,000 Items

**Purpose**: Prevents CPU and memory exhaustion from processing large arrays.

**Affected operations**: `sum(array)`, `count(array)`, `array[index]`

**Example that would be rejected**:
```javascript
// Context with 1,500 items
{ inventory: { items: [/* 1,500 items */] } }

// Formula
"sum(inventory.items.price)"  // ERROR: Array too large
```

**Error Message**:
```
Array operation exceeds maximum size of 1000 items (got 1500).
This limit prevents resource exhaustion attacks.
Consider using a smaller dataset.
```

**Workaround**: Pre-filter or paginate data before passing to formulas.

---

### Prototype Pollution Protection

The engine blocks access to JavaScript object prototype properties to prevent prototype pollution attacks.

#### Blocked Properties

The following property names are **always blocked**:
- `__proto__`
- `constructor`
- `prototype`

**Examples that would be rejected**:
```javascript
"__proto__"                    // BLOCKED
"user.__proto__"               // BLOCKED
"object.constructor"           // BLOCKED
"data.prototype"               // BLOCKED
```

**Error Message**:
```
Access to property '__proto__' is blocked for security reasons.
This prevents prototype pollution attacks.
Use a different property name.
```

**Safe alternatives**:
```javascript
"my_constructor"               // OK (not exact match)
"proto_value"                  // OK
```

---

### Formula Security Best Practices

1. **Keep Formulas Simple**: Simple formulas are easier to understand and maintain.

2. **Use Built-in Functions**: Functions like `sum()`, `count()`, `max()`, `min()` are optimized with security checks.

3. **Break Down Complex Calculations**: Use multiple computed fields instead of one mega-formula.

4. **Validate Input Data**: Ensure data passed to formulas is within expected ranges.

5. **Test Formula Limits**: Test with realistic data volumes to ensure formulas stay within limits.

### Testing Formula Security

Run the comprehensive security test suite:

```bash
# Run all formula security tests
pnpm test computedFieldEngine.limits

# Run with coverage
pnpm test:coverage computedFieldEngine.limits
```

Test files: `apps/web/tests/computedFieldEngine.limits.test.ts`

### Limit Summary Table

| Limit | Value | Purpose |
|-------|-------|---------|
| Maximum Formula Length | 10,000 chars | Prevent parser exhaustion |
| Maximum AST Depth | 20 levels | Prevent stack overflow |
| Maximum Node Count | 500 nodes | Prevent CPU exhaustion |
| Maximum Array Size | 1,000 items | Prevent memory/CPU exhaustion |
| Blocked Properties | `__proto__`, `constructor`, `prototype` | Prevent prototype pollution |

---

## Changelog

### 2025-12-12 - Formula Security Limits

- Added maximum formula length limit (10,000 characters)
- Added maximum AST depth limit (20 levels)
- Added maximum node count limit (500 nodes)
- Added maximum array iteration limit (1,000 items)
- Added prototype pollution protection (blocked `__proto__`, `constructor`, `prototype`)
- Created comprehensive security test suite
- Added helpful error messages for all limit violations

### 2025-12-12 - Initial Security Implementation

- Added DOMPurify sanitization to all HTML rendering locations
- Configured whitelist-based tag and attribute filtering
- Implemented URL protocol restrictions
- Added sanitization to static fields and rich text fields
- Created security documentation

---

**Last Updated:** 2025-12-12
**Version:** 1.1.0
