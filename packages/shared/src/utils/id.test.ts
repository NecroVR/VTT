import { describe, it, expect } from 'vitest';
import { generateId, generateGameId } from './id';

describe('ID Generation', () => {
  describe('generateId', () => {
    it('should generate ID of default length 12', () => {
      const id = generateId();
      expect(id).toHaveLength(12);
    });

    it('should generate ID of specified length', () => {
      const id = generateId(16);
      expect(id).toHaveLength(16);
    });

    it('should generate ID of length 8', () => {
      const id = generateId(8);
      expect(id).toHaveLength(8);
    });

    it('should generate ID of length 20', () => {
      const id = generateId(20);
      expect(id).toHaveLength(20);
    });

    it('should only contain lowercase letters and numbers', () => {
      const id = generateId(100);
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate different IDs on subsequent calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      // Should have high uniqueness (at least 99% unique)
      expect(ids.size).toBeGreaterThan(99);
    });

    it('should handle edge case of length 1', () => {
      const id = generateId(1);
      expect(id).toHaveLength(1);
      expect(id).toMatch(/^[a-z0-9]$/);
    });

    it('should handle length 0 gracefully', () => {
      const id = generateId(0);
      expect(id).toHaveLength(0);
      expect(id).toBe('');
    });

    it('should generate statistically distributed characters', () => {
      const charCounts: Record<string, number> = {};
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const id = generateId(1);
        charCounts[id] = (charCounts[id] || 0) + 1;
      }

      // Check that we see a reasonable distribution of characters
      // With 36 possible characters and 10000 iterations, expect ~277 of each
      const uniqueChars = Object.keys(charCounts).length;
      expect(uniqueChars).toBeGreaterThan(25); // Should see most characters
    });

    it('should be performant for large IDs', () => {
      const start = Date.now();
      generateId(1000);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('generateGameId', () => {
    it('should generate ID of length 8', () => {
      const id = generateGameId();
      expect(id).toHaveLength(8);
    });

    it('should only contain lowercase letters and numbers', () => {
      const id = generateGameId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate different IDs on subsequent calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateGameId());
      }
      // Should have high uniqueness
      expect(ids.size).toBeGreaterThan(99);
    });

    it('should generate IDs suitable for URLs', () => {
      const id = generateGameId();
      // Should not contain any URL-unsafe characters
      expect(id).not.toMatch(/[^a-z0-9]/);
    });
  });
});
