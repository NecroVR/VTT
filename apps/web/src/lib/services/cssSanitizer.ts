/**
 * CSS Sanitization Service
 *
 * Sanitizes custom CSS to prevent XSS and other security issues.
 */

/**
 * Allowed CSS properties - safe properties that don't pose security risks
 */
const allowedProperties = new Set([
  // Colors
  'color',
  'background-color',
  'background',
  'border-color',

  // Typography
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-align',
  'line-height',
  'letter-spacing',
  'text-decoration',
  'text-transform',

  // Borders
  'border',
  'border-width',
  'border-style',
  'border-radius',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',

  // Spacing
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
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

  // Layout
  'display',
  'flex',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'align-content',
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'grid-column',
  'grid-row',

  // Visual effects
  'opacity',
  'box-shadow',
  'text-shadow',
  'filter',
  'transform',
  'transition'
]);

/**
 * Dangerous CSS patterns to block
 */
const dangerousPatterns = [
  /@import/i,
  /url\s*\(/i,
  /javascript:/i,
  /expression\s*\(/i,
  /behavior\s*:/i,
  /binding\s*:/i,
  /-moz-binding/i,
  /position\s*:\s*(fixed|sticky)/i,
  /z-index/i
];

/**
 * Sanitize a CSS property name
 */
function sanitizePropertyName(property: string): string | null {
  const normalized = property.trim().toLowerCase();

  // Check if property is in allowed list
  if (allowedProperties.has(normalized)) {
    return normalized;
  }

  // Check for CSS custom properties (variables)
  if (normalized.startsWith('--')) {
    return normalized;
  }

  return null;
}

/**
 * Sanitize a CSS property value
 */
function sanitizePropertyValue(value: string): string | null {
  const trimmed = value.trim();

  // Check for dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return null;
    }
  }

  return trimmed;
}

/**
 * Parse and sanitize CSS rules
 */
function sanitizeCssRule(rule: string): string | null {
  // Remove comments
  const cleaned = rule.replace(/\/\*[\s\S]*?\*\//g, '');

  // Split into property and value
  const colonIndex = cleaned.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  const property = cleaned.substring(0, colonIndex);
  const value = cleaned.substring(colonIndex + 1).replace(';', '');

  const sanitizedProperty = sanitizePropertyName(property);
  const sanitizedValue = sanitizePropertyValue(value);

  if (!sanitizedProperty || !sanitizedValue) {
    return null;
  }

  return `${sanitizedProperty}: ${sanitizedValue};`;
}

/**
 * Parse CSS selector and validate it's safe
 */
function sanitizeSelector(selector: string): string | null {
  const trimmed = selector.trim();

  // Block dangerous selectors
  if (
    trimmed.includes('*') || // Universal selector
    trimmed.includes('@') || // At-rules
    trimmed.includes('javascript:') ||
    trimmed.includes('expression(')
  ) {
    return null;
  }

  return trimmed;
}

/**
 * Parse and sanitize a complete CSS block
 */
function sanitizeCssBlock(css: string): string {
  const lines: string[] = [];

  // Split into rule blocks (selector { declarations })
  const blockRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = blockRegex.exec(css)) !== null) {
    const selector = match[1];
    const declarations = match[2];

    const sanitizedSelector = sanitizeSelector(selector);
    if (!sanitizedSelector) {
      continue;
    }

    // Parse declarations
    const sanitizedDeclarations = declarations
      .split(';')
      .map((rule) => sanitizeCssRule(rule))
      .filter((rule): rule is string => rule !== null);

    if (sanitizedDeclarations.length > 0) {
      lines.push(`${sanitizedSelector} {`);
      lines.push(...sanitizedDeclarations.map((rule) => `  ${rule}`));
      lines.push('}');
    }
  }

  return lines.join('\n');
}

/**
 * Sanitize custom CSS
 *
 * @param css - The CSS string to sanitize
 * @returns Sanitized CSS string
 */
export function sanitizeCustomCss(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  try {
    return sanitizeCssBlock(css);
  } catch (error) {
    console.error('Error sanitizing CSS:', error);
    return '';
  }
}

/**
 * Generate a scoped CSS class name for a form
 */
export function generateFormScopeClass(formId: string): string {
  return `form-${formId.replace(/[^a-z0-9]/gi, '-')}`;
}

/**
 * Apply scoping to sanitized CSS
 */
export function scopeCustomCss(css: string, scopeClass: string): string {
  if (!css) {
    return '';
  }

  // Add scope class to all selectors
  const scoped = css.replace(/([^{]+)\{/g, (match, selector) => {
    const trimmedSelector = selector.trim();
    return `.${scopeClass} ${trimmedSelector} {`;
  });

  return scoped;
}

/**
 * Complete CSS sanitization and scoping pipeline
 */
export function sanitizeAndScopeCustomCss(
  css: string,
  formId: string
): string {
  const sanitized = sanitizeCustomCss(css);
  const scopeClass = generateFormScopeClass(formId);
  return scopeCustomCss(sanitized, scopeClass);
}

/**
 * Validate CSS custom properties (variables)
 */
export function validateCustomProperties(
  variables: Record<string, string>
): Record<string, string> {
  const validated: Record<string, string> = {};

  for (const [key, value] of Object.entries(variables)) {
    // Validate key is a valid CSS custom property name
    if (!key.startsWith('--')) {
      continue;
    }

    // Sanitize the value
    const sanitizedValue = sanitizePropertyValue(value);
    if (sanitizedValue) {
      validated[key] = sanitizedValue;
    }
  }

  return validated;
}
