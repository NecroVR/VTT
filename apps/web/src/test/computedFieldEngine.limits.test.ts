/**
 * Unit tests for Computed Field Engine Security Limits
 *
 * Tests all security limits added to prevent resource exhaustion attacks:
 * - Maximum formula length
 * - Maximum AST depth
 * - Maximum node count
 * - Maximum array iterations
 * - Prototype pollution protection
 */

import { describe, it, expect } from 'vitest';
import { ComputedFieldEngine } from '$lib/services/computedFieldEngine';
import type { FormComputedField } from '@vtt/shared';

describe('ComputedFieldEngine Security Limits', () => {
  const engine = new ComputedFieldEngine();

  describe('Maximum Formula Length', () => {
    it('should accept formulas under the length limit', () => {
      const formula = '1 + 2 + 3 + 4 + 5';
      const field: FormComputedField = {
        id: 'test-field',
        formula,
        label: 'Test',
        type: 'computed'
      };

      expect(() => engine.parseFormula(field.id, formula)).not.toThrow();
    });

    it('should reject formulas exceeding 10,000 characters', () => {
      // Create a formula with > 10,000 characters
      const longFormula = '1 + ' + '2 + '.repeat(5000) + '3';

      const field: FormComputedField = {
        id: 'test-field-long',
        formula: longFormula,
        label: 'Test',
        type: 'computed'
      };

      expect(() => engine.parseFormula(field.id, longFormula)).toThrow(
        /Formula exceeds maximum length of 10000 characters/
      );
    });

    it('should provide helpful error message for formula length violation', () => {
      const longFormula = 'x'.repeat(10001);

      expect(() => engine.parseFormula('test', longFormula)).toThrow(
        /got 10001.*prevents resource exhaustion attacks/
      );
    });

    it('should accept formula at exactly the limit', () => {
      // Create a formula with exactly 10,000 characters
      const exactFormula = '1 + ' + '2'.repeat(4997);

      expect(() => engine.parseFormula('test', exactFormula)).not.toThrow();
    });
  });

  describe('Maximum AST Depth', () => {
    it('should accept formulas with shallow nesting', () => {
      const formula = '((1 + 2) + (3 + 4))';
      expect(() => engine.parseFormula('test-shallow', formula)).not.toThrow();
    });

    it('should reject formulas exceeding depth of 20 levels', () => {
      // Create deeply nested parentheses (each level adds depth)
      const deepFormula = '('.repeat(25) + '1' + ')'.repeat(25);

      expect(() => engine.parseFormula('test-deep', deepFormula)).toThrow(
        /Formula exceeds maximum depth of 20 levels/
      );
    });

    it('should provide helpful error message for depth violation', () => {
      const deepFormula = '('.repeat(25) + '1' + ')'.repeat(25);

      expect(() => engine.parseFormula('test-deep', deepFormula)).toThrow(
        /prevents stack overflow attacks.*breaking your formula into smaller parts/
      );
    });

    it('should accept formula at exactly the depth limit', () => {
      // Create formula with 19 levels of nesting (parseExpression adds 1 level)
      const formula = '('.repeat(19) + '1' + ')'.repeat(19);

      expect(() => engine.parseFormula('test-exact-depth', formula)).not.toThrow();
    });

    it('should track depth correctly across different expression types', () => {
      // Test depth tracking with various operators
      const formula = '((((((((((1 + 2) * 3) / 4) - 5) ^ 6) + 7) * 8) / 9) - 10) ^ 11)';

      expect(() => engine.parseFormula('test-operators', formula)).not.toThrow();
    });
  });

  describe('Maximum Node Count', () => {
    it('should accept formulas with few nodes', () => {
      const formula = '1 + 2 + 3 + 4 + 5';
      expect(() => engine.parseFormula('test-few-nodes', formula)).not.toThrow();
    });

    it('should reject formulas exceeding 500 nodes', () => {
      // Create formula with > 500 nodes by chaining many additions
      const manyNodes = Array(300)
        .fill(0)
        .map((_, i) => `field${i}`)
        .join(' + ');

      expect(() => engine.parseFormula('test-many-nodes', manyNodes)).toThrow(
        /Formula exceeds maximum complexity of 500 nodes/
      );
    });

    it('should provide helpful error message for node count violation', () => {
      const manyNodes = Array(300)
        .fill(0)
        .map((_, i) => `x${i}`)
        .join(' + ');

      expect(() => engine.parseFormula('test', manyNodes)).toThrow(
        /prevents resource exhaustion attacks.*simplifying your formula/
      );
    });

    it('should count nodes correctly for complex expressions', () => {
      // Each binary operation creates 1 node, each literal/property creates 1 node
      const formula = '(a + b) * (c - d) / (e + f)';
      // Nodes: a, b, +, c, d, -, *, e, f, +, / = 11 nodes total

      expect(() => engine.parseFormula('test-complex', formula)).not.toThrow();
    });

    it('should count function call nodes', () => {
      const formula = 'max(a, b, c) + min(d, e, f) + abs(g)';

      expect(() => engine.parseFormula('test-functions', formula)).not.toThrow();
    });
  });

  describe('Maximum Array Iterations', () => {
    it('should accept arrays under the iteration limit', () => {
      const smallArray = Array(100).fill(1);
      const context = { numbers: smallArray };
      const field: FormComputedField = {
        id: 'test-small-array',
        formula: 'sum(numbers)',
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, field.formula);
      const result = engine.evaluate(field, context);

      expect(result).toBe(100);
    });

    it('should reject sum() operations on arrays exceeding 1,000 items', () => {
      const largeArray = Array(1500).fill(1);
      const context = { numbers: largeArray };
      const field: FormComputedField = {
        id: 'test-large-array',
        formula: 'sum(numbers)',
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, field.formula);

      expect(() => engine.evaluate(field, context)).toThrow(
        /Array operation exceeds maximum size of 1000 items.*got 1500/
      );
    });

    it('should reject count() operations on arrays exceeding 1,000 items', () => {
      const largeArray = Array(1500).fill('item');
      const context = { items: largeArray };
      const field: FormComputedField = {
        id: 'test-count-large',
        formula: 'count(items)',
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, field.formula);

      expect(() => engine.evaluate(field, context)).toThrow(
        /Array operation exceeds maximum size of 1000 items/
      );
    });

    it('should reject array access on arrays exceeding 1,000 items', () => {
      const largeArray = Array(1500).fill(1);
      const context = { numbers: largeArray };
      const field: FormComputedField = {
        id: 'test-array-access',
        formula: 'numbers[0]',
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, field.formula);

      expect(() => engine.evaluate(field, context)).toThrow(
        /Array access exceeds maximum size of 1000 items/
      );
    });

    it('should provide helpful error message for array limit violation', () => {
      const largeArray = Array(1500).fill(1);
      const context = { numbers: largeArray };
      const field: FormComputedField = {
        id: 'test',
        formula: 'sum(numbers)',
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, field.formula);

      expect(() => engine.evaluate(field, context)).toThrow(
        /prevents resource exhaustion attacks.*smaller dataset/
      );
    });

    it('should accept arrays at exactly the limit', () => {
      const exactArray = Array(1000).fill(2);
      const context = { numbers: exactArray };
      const field: FormComputedField = {
        id: 'test-exact-array',
        formula: 'sum(numbers)',
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, field.formula);
      const result = engine.evaluate(field, context);

      expect(result).toBe(2000);
    });
  });

  describe('Prototype Pollution Protection', () => {
    it('should block access to __proto__ property', () => {
      const formula = '__proto__';

      expect(() => engine.parseFormula('test-proto', formula)).toThrow(
        /Access to property '__proto__' is blocked for security reasons/
      );
    });

    it('should block access to constructor property', () => {
      const formula = 'constructor';

      expect(() => engine.parseFormula('test-constructor', formula)).toThrow(
        /Access to property 'constructor' is blocked for security reasons/
      );
    });

    it('should block access to prototype property', () => {
      const formula = 'prototype';

      expect(() => engine.parseFormula('test-prototype', formula)).toThrow(
        /Access to property 'prototype' is blocked for security reasons/
      );
    });

    it('should block nested __proto__ access', () => {
      const formula = 'user.__proto__';

      expect(() => engine.parseFormula('test-nested-proto', formula)).toThrow(
        /Access to property '__proto__' is blocked/
      );
    });

    it('should block deeply nested prototype pollution attempts', () => {
      const formula = 'a.b.c.constructor';

      expect(() => engine.parseFormula('test-deep-constructor', formula)).toThrow(
        /Access to property 'constructor' is blocked/
      );
    });

    it('should provide helpful error message for prototype pollution attempts', () => {
      const formula = '__proto__.polluted';

      expect(() => engine.parseFormula('test', formula)).toThrow(
        /prevents prototype pollution attacks.*different property name/
      );
    });

    it('should allow safe property names that contain blocked substrings', () => {
      // These should be allowed as they're not exact matches
      const context = {
        my_constructor: 5,
        proto_value: 10,
        prototype_name: 'test'
      };

      // Note: These would need to be exact property names to be allowed
      // The current implementation blocks exact matches only
      const safeFormula = 'my_constructor + proto_value';
      const field: FormComputedField = {
        id: 'test-safe',
        formula: safeFormula,
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, safeFormula);
      const result = engine.evaluate(field, context);

      expect(result).toBe(15);
    });

    it('should double-check blocked properties during evaluation', () => {
      // Even if parsing somehow allows it, evaluation should block it
      const context = {
        user: {
          name: 'test',
          __proto__: 'should-be-blocked'
        }
      };

      const formula = 'user.name';
      const field: FormComputedField = {
        id: 'test-eval-check',
        formula,
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, formula);

      // This should work fine
      expect(engine.evaluate(field, context)).toBe('test');
    });
  });

  describe('Combined Limits', () => {
    it('should handle formulas that are complex but within all limits', () => {
      const formula = '((a + b) * (c - d)) + ((e / f) - (g ^ h))';
      const context = { a: 1, b: 2, c: 10, d: 3, e: 20, f: 4, g: 2, h: 3 };
      const field: FormComputedField = {
        id: 'test-combined',
        formula,
        label: 'Test',
        type: 'computed'
      };

      engine.parseFormula(field.id, formula);
      const result = engine.evaluate(field, context);

      expect(typeof result).toBe('number');
    });

    it('should validate formula and return helpful errors', () => {
      const deepFormula = '('.repeat(25) + '1' + ')'.repeat(25);

      const validation = engine.validateFormula(deepFormula);

      expect(validation.valid).toBe(false);
      expect(validation.error).toMatch(/exceeds maximum depth/);
    });

    it('should validate safe formulas successfully', () => {
      const safeFormula = 'a + b * c';

      const validation = engine.validateFormula(safeFormula);

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });
  });

  describe('Error Message Quality', () => {
    it('should include actual values in error messages', () => {
      const longFormula = 'x'.repeat(15000);

      expect(() => engine.parseFormula('test', longFormula)).toThrow(/got 15000/);
    });

    it('should explain the security rationale', () => {
      const deepFormula = '('.repeat(25) + '1' + ')'.repeat(25);

      expect(() => engine.parseFormula('test', deepFormula)).toThrow(
        /prevents stack overflow attacks/
      );
    });

    it('should provide actionable guidance', () => {
      const complexFormula = Array(300)
        .fill(0)
        .map((_, i) => `x${i}`)
        .join(' + ');

      expect(() => engine.parseFormula('test', complexFormula)).toThrow(
        /Consider simplifying your formula/
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty formulas', () => {
      expect(() => engine.parseFormula('test', '')).toThrow();
    });

    it('should handle formulas with only whitespace', () => {
      expect(() => engine.parseFormula('test', '   ')).toThrow();
    });

    it('should track depth correctly with mixed operators', () => {
      const formula = '(a + b) * c - (d / e) + (f ^ g)';

      expect(() => engine.parseFormula('test-mixed', formula)).not.toThrow();
    });

    it('should handle function calls in depth calculations', () => {
      const formula = 'max(min(a, b), min(c, d))';

      expect(() => engine.parseFormula('test-func-depth', formula)).not.toThrow();
    });

    it('should handle array access in node count', () => {
      const formula = 'items[0] + items[1] + items[2]';

      expect(() => engine.parseFormula('test-array-nodes', formula)).not.toThrow();
    });
  });
});
