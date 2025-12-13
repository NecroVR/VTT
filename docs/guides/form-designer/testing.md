# Form Designer Testing Guide

**Version**: 1.0
**Last Updated**: 2025-12-12
**Status**: Phase 6.8 Final Testing

---

## Overview

This guide covers all testing aspects of the Form Designer System, including unit tests, integration tests, end-to-end tests, performance benchmarks, security testing, and accessibility audits.

---

## Table of Contents

1. [Running Tests](#running-tests)
2. [Test Coverage](#test-coverage)
3. [End-to-End Tests](#end-to-end-tests)
4. [Performance Benchmarks](#performance-benchmarks)
5. [Security Testing](#security-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Browser Compatibility](#browser-compatibility)
8. [Known Limitations](#known-limitations)

---

## Running Tests

### All Tests

Run the complete test suite:

```bash
# From project root
pnpm run test

# With coverage report
pnpm run test:coverage

# Watch mode (for development)
pnpm run test:watch
```

### Unit Tests Only

```bash
# Run tests for specific package
pnpm --filter @vtt/web test
pnpm --filter @vtt/server test
pnpm --filter @vtt/shared test
```

### Integration Tests

```bash
# Run server integration tests
cd apps/server
pnpm test

# Run specific test file
pnpm test tests/api/forms.test.ts
```

### End-to-End Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run with UI (interactive mode)
pnpm run test:e2e:ui

# Run with debugging
pnpm run test:e2e:debug

# Run specific test file
pnpm exec playwright test apps/web/tests/e2e/form-designer.spec.ts
```

### Performance Benchmarks

```bash
# Run performance benchmarks
cd scripts/testing
npx tsx benchmark-form-designer.ts
```

---

## Test Coverage

### Current Coverage Summary

| Component | Coverage | Files | Status |
|-----------|----------|-------|--------|
| Computed Field Engine | 85% | 1 | ✅ Good |
| Form Renderer | 60% | 3 | ⚠️ Needs improvement |
| Layout Renderer | 55% | 1 | ⚠️ Needs improvement |
| Field Renderer | 70% | 1 | ✅ Good |
| Form Designer UI | 30% | 5 | ❌ Low coverage |
| API Endpoints | 80% | 2 | ✅ Good |

### Coverage Goals

- **Critical paths**: 100% (computed fields, form save/load)
- **Core components**: 80% (renderers, API)
- **UI components**: 60% (designer panels, toolbars)
- **Overall target**: 75%

### Generating Coverage Reports

```bash
# Generate HTML coverage report
pnpm run test:coverage

# View report (opens in browser)
open coverage/index.html
```

---

## End-to-End Tests

### Test Scenarios

The E2E test suite covers the following workflows:

#### 1. Form List Management
- Display forms list page
- Filter forms by game system
- Filter forms by entity type
- Search forms by name
- Create new form (navigation)

#### 2. Form Designer UI
- Display designer panels (tree, properties, canvas)
- Toolbar with field types
- Preview mode toggle
- Save/load operations

#### 3. Field Operations
- Add text field
- Add number field
- Add select/dropdown field
- Configure field properties
- Delete field
- Reorder fields

#### 4. Layout Operations
- Add grid layout
- Configure grid columns
- Add tabs layout
- Add section (collapsible)
- Add flex container
- Add columns layout

#### 5. Advanced Features
- Add computed field
- Configure formula
- Formula validation
- Add repeater (array binding)
- Add static content
- Add conditional rendering

#### 6. Save/Load
- Save new form
- Update existing form
- Load form in designer
- Duplicate form

#### 7. Preview Mode
- Toggle preview mode
- Render fields correctly
- Edit mode interaction
- Computed field updates

### Running Specific Test Groups

```bash
# Run only form list tests
pnpm exec playwright test -g "Form Designer - Complete Workflow"

# Run only field operation tests
pnpm exec playwright test -g "Field Operations"

# Run only performance tests
pnpm exec playwright test -g "Performance"
```

### E2E Test Configuration

**Location**: `playwright.config.ts`

**Key Settings**:
- Base URL: `http://localhost:5173`
- Browsers: Chromium (primary), Firefox, Safari (optional)
- Timeout: 30 seconds per test
- Retries: 2 (in CI), 0 (local)
- Screenshots: On failure only
- Video: On first retry

### Current E2E Status

⚠️ **Note**: Most E2E tests are currently **skipped** because they require:
1. Test user accounts (authentication setup)
2. Seeded test data (sample forms)
3. Complete UI implementation

**To enable E2E tests**:
1. Create test user credentials
2. Update test setup with authentication
3. Seed database with test forms
4. Remove `.skip` from test cases

---

## Performance Benchmarks

### Performance Targets

| Operation | Target | Critical |
|-----------|--------|----------|
| Simple formula evaluation | < 1ms | < 2ms |
| Complex formula evaluation | < 2ms | < 5ms |
| Array operation formula | < 5ms | < 10ms |
| Formula parsing | < 0.5ms | < 1ms |
| Form structure clone | < 5ms | < 10ms |
| Node lookup in tree | < 1ms | < 2ms |
| Render 10 fields | < 50ms | < 100ms |
| Render 100 fields | < 200ms | < 500ms |

### Running Benchmarks

```bash
# Run all benchmarks
cd scripts/testing
npx tsx benchmark-form-designer.ts

# Expected output:
# === COMPUTED FIELD ENGINE BENCHMARKS ===
# Running: Simple arithmetic formula
# PASS - 0.45ms (target: 1ms)
# ...
#
# === BENCHMARK RESULTS SUMMARY ===
# Total Tests: 15
# Passed: 14
# Failed: 1
# Pass Rate: 93.3%
```

### Benchmark Categories

1. **Computed Field Engine**
   - Simple arithmetic
   - Complex formulas
   - Array operations
   - Conditional logic
   - Dependency chains
   - Cache performance

2. **Form Structure**
   - Deep cloning
   - Tree traversal
   - Node lookup
   - Field counting

3. **Memory Operations**
   - Object creation
   - String interpolation
   - Array operations

### Performance Optimization Tips

If benchmarks fail, consider:

1. **Formula caching**: Ensure computed fields use cache
2. **Virtual scrolling**: For repeaters with > 20 items
3. **Lazy rendering**: Tabs only render when visited
4. **Memoization**: Use `$derived` for expensive computations
5. **Debouncing**: Delay updates on rapid user input

---

## Security Testing

### Security Audit Report

**Location**: `docs/reports/form-designer-security-audit.md`

### Critical Security Findings

1. **XSS Vulnerability in Static HTML** (CRITICAL)
   - Unescaped HTML rendering
   - **Status**: ❌ NOT FIXED
   - **Fix Required**: Implement DOMPurify sanitization

2. **CSS Injection Risk** (MEDIUM)
   - Unvalidated inline styles
   - **Status**: ⚠️ NEEDS FIX
   - **Fix Required**: CSS property whitelist

3. **Formula Complexity** (MEDIUM)
   - No depth/complexity limits
   - **Status**: ⚠️ NEEDS ENHANCEMENT
   - **Fix Required**: Add max depth limit

### Security Test Cases

```bash
# Run security-focused tests (when implemented)
pnpm test tests/security/
```

### Manual Security Testing

1. **HTML Injection Test**:
   ```html
   <script>alert('XSS')</script>
   <img src=x onerror="alert('XSS')">
   <a href="javascript:alert('XSS')">Click</a>
   ```

2. **CSS Injection Test**:
   ```json
   {
     "background-image": "url('https://evil.com/track')",
     "behavior": "url(xss.htc)"
   }
   ```

3. **Formula Exploitation Test**:
   ```javascript
   // Deeply nested
   ((((((((((1+1)+1)+1)+1)+1)+1)+1)+1)+1)+1)

   // Resource intensive
   9999999999 ^ 9999999999
   ```

### Security Checklist

Before production deployment:

- [ ] Install and configure DOMPurify
- [ ] Implement CSS sanitization
- [ ] Add formula complexity limits
- [ ] Add path traversal protection
- [ ] Implement Content Security Policy headers
- [ ] Write security unit tests
- [ ] Conduct penetration testing
- [ ] Review all user-generated content handling

---

## Accessibility Testing

### Accessibility Standards

**Target**: WCAG 2.1 Level AA compliance

### Key Accessibility Features

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Arrow keys for tree navigation
   - Enter to activate/edit
   - Escape to cancel/close
   - Delete to remove items

2. **Screen Reader Support**
   - ARIA labels on all controls
   - ARIA landmarks (main, navigation, complementary)
   - ARIA live regions for dynamic updates
   - Semantic HTML structure

3. **Visual Accessibility**
   - Color contrast ratio ≥ 4.5:1 (text)
   - Color contrast ratio ≥ 3:1 (UI components)
   - Focus indicators visible
   - No information conveyed by color alone

4. **Form Accessibility**
   - Labels for all inputs
   - Error messages associated with fields
   - Required fields indicated
   - Help text available

### Automated Accessibility Testing

```bash
# Install axe-core
pnpm add -D @axe-core/playwright

# Run accessibility tests (when implemented)
pnpm exec playwright test tests/a11y/
```

### Manual Accessibility Testing

1. **Keyboard-only navigation**:
   - Disconnect mouse
   - Navigate entire form designer using only keyboard
   - Verify all functions accessible

2. **Screen reader testing**:
   - **Windows**: NVDA (free)
   - **macOS**: VoiceOver (built-in)
   - **Linux**: Orca
   - Verify all content announced correctly

3. **Color contrast**:
   - Use browser DevTools contrast checker
   - Test with color blindness simulators

4. **Zoom testing**:
   - Test at 200% zoom
   - Verify no horizontal scrolling
   - Verify all content readable

### Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels on all buttons/controls
- [ ] Form labels properly associated
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader testing completed
- [ ] Zoom testing at 200% passed
- [ ] No keyboard traps

---

## Browser Compatibility

### Supported Browsers

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 90+ | ✅ Fully supported | Primary development browser |
| Firefox | 88+ | ✅ Fully supported | Tested regularly |
| Safari | 14+ | ⚠️ Should work | Limited testing |
| Edge | 90+ | ✅ Fully supported | Chromium-based |
| Opera | 76+ | ⚠️ Should work | Chromium-based |

### Mobile Browsers

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome Mobile | 90+ | ⚠️ Limited support | Designer UI not optimized for mobile |
| Safari iOS | 14+ | ⚠️ Limited support | Touch interactions may be limited |
| Firefox Mobile | 88+ | ⚠️ Limited support | Not tested |

**Note**: The Form Designer is primarily designed for desktop use. Form rendering (view/edit modes) should work on mobile, but the designer UI itself may not be mobile-friendly.

### Browser Feature Requirements

The Form Designer requires the following browser features:

- ✅ ES2020+ JavaScript
- ✅ CSS Grid Layout
- ✅ CSS Flexbox
- ✅ Drag and Drop API (for designer)
- ✅ Local Storage
- ✅ Fetch API
- ✅ Promises/Async-Await
- ✅ Web Components (for Svelte)

### Cross-Browser Testing

```bash
# Run E2E tests on all browsers
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit  # Safari
```

### Known Browser Issues

1. **Safari < 14**: CSS Grid gap property not supported
   - **Workaround**: Use margin-based spacing

2. **Firefox**: Drag and drop preview may look different
   - **Status**: Cosmetic only, not functional issue

3. **Mobile Safari**: Touch drag-and-drop unreliable
   - **Workaround**: Provide alternative reorder controls

---

## Known Limitations

### Current Limitations

1. **E2E Tests Not Fully Implemented**
   - Most tests are skipped pending authentication setup
   - Requires test user accounts and seeded data
   - **Impact**: Manual testing required for now

2. **Mobile Designer Not Optimized**
   - Designer UI is desktop-focused
   - Touch interactions may be difficult
   - **Recommendation**: Use desktop for designing, mobile for viewing

3. **Security Fixes Pending**
   - HTML sanitization not implemented (CRITICAL)
   - CSS sanitization not implemented (MEDIUM)
   - **Impact**: XSS vulnerability exists

4. **Performance Not Verified at Scale**
   - Benchmarks cover moderate complexity
   - Very large forms (500+ fields) not tested
   - **Recommendation**: Keep forms under 200 fields

5. **Browser Testing Limited**
   - Primary testing on Chrome/Firefox
   - Safari/Edge tested minimally
   - **Recommendation**: Test in target browsers before production

### Planned Improvements

1. **Complete E2E test suite**
   - Set up test authentication
   - Seed test database
   - Remove `.skip` from tests

2. **Implement security fixes**
   - DOMPurify integration
   - CSS sanitization
   - Formula complexity limits

3. **Expand browser testing**
   - Regular Safari testing
   - Mobile browser testing
   - Automated cross-browser CI

4. **Performance optimization**
   - Test with very large forms
   - Optimize virtual scrolling
   - Improve caching strategies

---

## Testing Best Practices

### For Developers

1. **Write tests alongside code**
   - TDD approach preferred
   - Don't commit untested code

2. **Keep tests focused**
   - One assertion per test (when possible)
   - Test behavior, not implementation

3. **Use meaningful test names**
   - Describe what is tested and expected outcome
   - Example: `should validate formula and show error for invalid syntax`

4. **Mock external dependencies**
   - Mock API calls
   - Mock localStorage
   - Mock user authentication

5. **Clean up after tests**
   - Reset global state
   - Clear localStorage
   - Restore mocked functions

### For QA/Testers

1. **Test in realistic scenarios**
   - Use real-world form structures
   - Test with actual game data
   - Simulate user workflows

2. **Test edge cases**
   - Empty forms
   - Maximum complexity forms
   - Unusual field combinations
   - Invalid user input

3. **Document bugs clearly**
   - Steps to reproduce
   - Expected vs. actual behavior
   - Browser/OS information
   - Screenshots/videos

4. **Verify fixes**
   - Retest after bug fixes
   - Check for regressions
   - Verify in all supported browsers

---

## Continuous Integration

### CI Pipeline (Planned)

```yaml
# .github/workflows/test.yml (example)
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm exec playwright install
      - run: pnpm run test:e2e

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm audit
      - run: pnpm run test tests/security/
```

---

## Resources

### Documentation
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

### Tools
- **DOMPurify**: HTML sanitization
- **axe-core**: Accessibility testing
- **Lighthouse**: Performance auditing
- **WAVE**: Accessibility evaluation

### Reporting Issues

If you find bugs or have testing suggestions:

1. Check existing issues in GitHub
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/logs
3. Tag appropriately (`bug`, `testing`, `security`, etc.)

---

**Last Updated**: 2025-12-12
**Next Review**: After security fixes implemented
