/**
 * CSS Sanitization Utility
 *
 * Sanitizes user-provided CSS styles to prevent CSS injection attacks,
 * data exfiltration, and UI redressing.
 *
 * Security measures:
 * - Whitelist of allowed CSS properties
 * - Blocks dangerous patterns: url(), expression(), javascript:, etc.
 * - Validates property values
 */

/**
 * Whitelist of allowed CSS properties.
 * Only common layout and typography properties are permitted.
 */
const ALLOWED_PROPERTIES = new Set([
  // Layout - Display & Positioning
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',

  // Flexbox
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-flow',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'justify-content',
  'align-items',
  'align-content',
  'align-self',
  'order',

  // Grid
  'grid',
  'grid-template',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-auto-columns',
  'grid-auto-rows',
  'grid-auto-flow',
  'grid-column',
  'grid-row',
  'grid-area',
  'gap',
  'row-gap',
  'column-gap',

  // Sizing
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',

  // Spacing
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',

  // Typography
  'color',
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-decoration',
  'text-transform',
  'text-indent',
  'white-space',
  'word-wrap',
  'word-break',
  'overflow-wrap',

  // Borders
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',

  // Background (color only, no images)
  'background-color',

  // Visual
  'opacity',
  'visibility',
  'overflow',
  'overflow-x',
  'overflow-y',

  // Cursor
  'cursor',

  // Transform (limited)
  'transform',
  'transform-origin',
]);

/**
 * Dangerous patterns that should be blocked in CSS values.
 * These can be used for data exfiltration or XSS attacks.
 */
const DANGEROUS_PATTERNS = [
  /url\s*\(/i,                    // url() - can be used for data exfiltration
  /import\s*\(/i,                 // @import
  /expression\s*\(/i,             // IE expression()
  /javascript:/i,                 // javascript: protocol
  /data:/i,                       // data: URIs (can contain scripts)
  /vbscript:/i,                   // VBScript protocol
  /@import/i,                     // @import directive
  /<script/i,                     // script tags
  /on\w+\s*=/i,                   // event handlers (onclick=, etc.)
  /\\[0-9a-f]{1,6}/i,            // Unicode escapes (can bypass filters)
  /&\s*#/i,                       // HTML entities
];

/**
 * Properties that should never contain URLs.
 * Extra validation layer.
 */
const NO_URL_PROPERTIES = new Set([
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'width',
  'height',
  'margin',
  'padding',
  'display',
  'flex',
  'grid',
]);

/**
 * Sanitizes a CSS property name.
 *
 * @param property - The CSS property name to sanitize
 * @returns The sanitized property name, or null if not allowed
 */
function sanitizeProperty(property: string): string | null {
  const normalized = property.trim().toLowerCase();

  if (ALLOWED_PROPERTIES.has(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Sanitizes a CSS property value.
 *
 * @param property - The CSS property name (for context)
 * @param value - The CSS value to sanitize
 * @returns The sanitized value, or null if dangerous
 */
function sanitizeValue(property: string, value: string): string | null {
  const normalizedValue = String(value).trim();

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(normalizedValue)) {
      console.warn(`[CSS Sanitizer] Blocked dangerous pattern in ${property}: ${normalizedValue}`);
      return null;
    }
  }

  // Additional check: properties that should never have URLs
  if (NO_URL_PROPERTIES.has(property.toLowerCase())) {
    if (/url|import|expression/i.test(normalizedValue)) {
      console.warn(`[CSS Sanitizer] Blocked URL-like value in ${property}: ${normalizedValue}`);
      return null;
    }
  }

  // Check for excessive length (potential DoS)
  if (normalizedValue.length > 1000) {
    console.warn(`[CSS Sanitizer] Blocked excessively long value in ${property}`);
    return null;
  }

  return normalizedValue;
}

/**
 * Sanitizes a CSS style object.
 *
 * @param styles - Object mapping CSS properties to values
 * @returns Sanitized style object with only safe properties and values
 */
export function sanitizeStyleObject(styles: Record<string, string | number>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [property, value] of Object.entries(styles)) {
    const sanitizedProp = sanitizeProperty(property);
    if (!sanitizedProp) {
      console.warn(`[CSS Sanitizer] Blocked disallowed property: ${property}`);
      continue;
    }

    const sanitizedVal = sanitizeValue(sanitizedProp, String(value));
    if (!sanitizedVal) {
      continue;
    }

    sanitized[sanitizedProp] = sanitizedVal;
  }

  return sanitized;
}

/**
 * Converts a sanitized style object to an inline style string.
 *
 * @param styles - Object mapping CSS properties to values
 * @returns Sanitized inline style string
 */
export function sanitizeStyleToString(styles: Record<string, string | number> | undefined): string {
  if (!styles) {
    return '';
  }

  const sanitized = sanitizeStyleObject(styles);
  return Object.entries(sanitized)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

/**
 * Sanitizes a style string and converts it to an object.
 * Useful for parsing inline style attributes.
 *
 * @param styleString - CSS style string (e.g., "color: red; font-size: 14px")
 * @returns Sanitized style object
 */
export function sanitizeStyleString(styleString: string): Record<string, string> {
  const styles: Record<string, string> = {};

  // Parse the style string
  const declarations = styleString.split(';');
  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();

    if (property && value) {
      styles[property] = value;
    }
  }

  return sanitizeStyleObject(styles);
}

/**
 * Type-safe wrapper for style objects used in Svelte components.
 *
 * Example usage:
 * ```svelte
 * <div style={sanitizeStyles(node.style)}>
 * ```
 */
export function sanitizeStyles(styles: Record<string, string | number> | undefined): string {
  return sanitizeStyleToString(styles);
}
