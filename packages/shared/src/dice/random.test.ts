import { describe, it, expect } from 'vitest';
import { randomInt, rollDie, rollDice } from './random.js';

describe('Random Number Generator', () => {
  describe('randomInt', () => {
    it('should generate number within range', () => {
      const min = 1;
      const max = 20;

      for (let i = 0; i < 100; i++) {
        const result = randomInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      }
    });

    it('should return min when min equals max', () => {
      const result = randomInt(5, 5);
      expect(result).toBe(5);
    });

    it('should throw when min > max', () => {
      expect(() => randomInt(10, 5)).toThrow('min must be less than or equal to max');
    });

    it('should handle negative numbers', () => {
      const result = randomInt(-10, -5);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThanOrEqual(-5);
    });

    it('should handle range including zero', () => {
      const result = randomInt(-5, 5);
      expect(result).toBeGreaterThanOrEqual(-5);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('should have relatively uniform distribution', () => {
      const counts: Record<number, number> = {};
      const iterations = 10000;
      const min = 1;
      const max = 6;

      for (let i = 0; i < iterations; i++) {
        const result = randomInt(min, max);
        counts[result] = (counts[result] || 0) + 1;
      }

      // Check all values appeared
      for (let i = min; i <= max; i++) {
        expect(counts[i]).toBeGreaterThan(0);
      }

      // Check distribution is reasonably uniform (within 30% of expected)
      const expected = iterations / (max - min + 1);
      for (let i = min; i <= max; i++) {
        const ratio = counts[i] / expected;
        expect(ratio).toBeGreaterThan(0.7);
        expect(ratio).toBeLessThan(1.3);
      }
    });
  });

  describe('rollDie', () => {
    it('should roll d6', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDie(6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });

    it('should roll d20', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDie(20);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      }
    });

    it('should roll d100', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDie(100);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(100);
      }
    });

    it('should throw on invalid sides', () => {
      expect(() => rollDie(0)).toThrow('Die must have at least 1 side');
      expect(() => rollDie(-1)).toThrow('Die must have at least 1 side');
    });

    it('should handle d1 (always returns 1)', () => {
      const result = rollDie(1);
      expect(result).toBe(1);
    });
  });

  describe('rollDice', () => {
    it('should roll 2d6', () => {
      const results = rollDice(2, 6);
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      });
    });

    it('should roll 3d8', () => {
      const results = rollDice(3, 8);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(8);
      });
    });

    it('should roll 1d20', () => {
      const results = rollDice(1, 20);
      expect(results).toHaveLength(1);
      expect(results[0]).toBeGreaterThanOrEqual(1);
      expect(results[0]).toBeLessThanOrEqual(20);
    });

    it('should throw on invalid count', () => {
      expect(() => rollDice(0, 6)).toThrow('Must roll at least 1 die');
      expect(() => rollDice(-1, 6)).toThrow('Must roll at least 1 die');
    });

    it('should throw on invalid sides', () => {
      expect(() => rollDice(2, 0)).toThrow('Die must have at least 1 side');
      expect(() => rollDice(2, -1)).toThrow('Die must have at least 1 side');
    });

    it('should produce different results across multiple rolls', () => {
      // Roll 4d6 multiple times and check we don't get the same result every time
      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const roll = rollDice(4, 6);
        results.push(roll.join(','));
      }

      // Check that we have at least some variety (not all identical)
      const unique = new Set(results);
      expect(unique.size).toBeGreaterThan(1);
    });
  });
});
