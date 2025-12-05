import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseDiceNotation } from './parser.js';
import * as random from './random';

describe('Dice Parser', () => {
  describe('Basic rolls', () => {
    it('should roll 1d20', () => {
      const result = parseDiceNotation('1d20');
      expect(result.notation).toBe('1d20');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].count).toBe(1);
      expect(result.rolls[0].sides).toBe(20);
      expect(result.rolls[0].results).toHaveLength(1);
      expect(result.rolls[0].results[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0].results[0]).toBeLessThanOrEqual(20);
      expect(result.total).toBe(result.rolls[0].results[0]);
    });

    it('should roll d20 (shorthand for 1d20)', () => {
      const result = parseDiceNotation('d20');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].count).toBe(1);
      expect(result.rolls[0].sides).toBe(20);
    });

    it('should roll 2d6', () => {
      const result = parseDiceNotation('2d6');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].count).toBe(2);
      expect(result.rolls[0].sides).toBe(6);
      expect(result.rolls[0].results).toHaveLength(2);
      result.rolls[0].results.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });

    it('should roll 3d8', () => {
      const result = parseDiceNotation('3d8');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].count).toBe(3);
      expect(result.rolls[0].sides).toBe(8);
      expect(result.rolls[0].results).toHaveLength(3);
    });
  });

  describe('Modifiers', () => {
    it('should handle positive modifier: 2d6+5', () => {
      const result = parseDiceNotation('2d6+5');
      expect(result.rolls).toHaveLength(1);
      const rollSum = result.rolls[0].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(rollSum + 5);
      expect(result.breakdown).toContain('+ 5');
    });

    it('should handle negative modifier: 1d20-2', () => {
      const result = parseDiceNotation('1d20-2');
      expect(result.rolls).toHaveLength(1);
      const rollSum = result.rolls[0].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(rollSum - 2);
      expect(result.breakdown).toContain('- 2');
    });

    it('should handle modifier without explicit sign', () => {
      const result = parseDiceNotation('1d20+3');
      const rollSum = result.rolls[0].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(rollSum + 3);
    });
  });

  describe('Multiple groups', () => {
    it('should handle 2d6+1d4', () => {
      const result = parseDiceNotation('2d6+1d4');
      expect(result.rolls).toHaveLength(2);
      expect(result.rolls[0].count).toBe(2);
      expect(result.rolls[0].sides).toBe(6);
      expect(result.rolls[1].count).toBe(1);
      expect(result.rolls[1].sides).toBe(4);

      const total = result.rolls[0].results.reduce((a, b) => a + b, 0) +
                    result.rolls[1].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(total);
    });

    it('should handle 2d6+1d4+3', () => {
      const result = parseDiceNotation('2d6+1d4+3');
      expect(result.rolls).toHaveLength(2);

      const rollTotal = result.rolls[0].results.reduce((a, b) => a + b, 0) +
                        result.rolls[1].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(rollTotal + 3);
    });

    it('should handle 1d20+5+2d6', () => {
      const result = parseDiceNotation('1d20+5+2d6');
      expect(result.rolls).toHaveLength(2);
      expect(result.rolls[0].sides).toBe(20);
      expect(result.rolls[1].sides).toBe(6);

      const rollTotal = result.rolls[0].results.reduce((a, b) => a + b, 0) +
                        result.rolls[1].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(rollTotal + 5);
    });
  });

  describe('Keep highest', () => {
    it('should handle 4d6kh3 (keep highest 3)', () => {
      // Mock rolls to test keep logic
      vi.spyOn(random, 'rollDice').mockReturnValue([6, 4, 3, 2]);

      const result = parseDiceNotation('4d6kh3');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].results).toEqual([6, 4, 3, 2]);
      expect(result.rolls[0].kept).toHaveLength(3);
      expect(result.rolls[0].subtotal).toBe(13); // 6 + 4 + 3
      expect(result.breakdown).toContain('~~2~~'); // Dropped die should be crossed out

      vi.restoreAllMocks();
    });

    it('should handle 4d6k3 (k defaults to highest)', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([5, 4, 3, 2]);

      const result = parseDiceNotation('4d6k3');
      expect(result.rolls[0].subtotal).toBe(12); // 5 + 4 + 3

      vi.restoreAllMocks();
    });

    it('should handle 2d20kh1 (advantage)', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([15, 8]);

      const result = parseDiceNotation('2d20kh1');
      expect(result.rolls[0].results).toEqual([15, 8]);
      expect(result.rolls[0].kept).toHaveLength(1);
      expect(result.rolls[0].subtotal).toBe(15);

      vi.restoreAllMocks();
    });
  });

  describe('Keep lowest', () => {
    it('should handle 2d20kl1 (disadvantage)', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([15, 8]);

      const result = parseDiceNotation('2d20kl1');
      expect(result.rolls[0].results).toEqual([15, 8]);
      expect(result.rolls[0].kept).toHaveLength(1);
      expect(result.rolls[0].subtotal).toBe(8);
      expect(result.breakdown).toContain('~~15~~');

      vi.restoreAllMocks();
    });
  });

  describe('Drop highest', () => {
    it('should handle 4d6dh1 (drop highest)', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([6, 4, 3, 2]);

      const result = parseDiceNotation('4d6dh1');
      expect(result.rolls[0].results).toEqual([6, 4, 3, 2]);
      expect(result.rolls[0].kept).toHaveLength(3);
      expect(result.rolls[0].subtotal).toBe(9); // 4 + 3 + 2
      expect(result.breakdown).toContain('~~6~~');

      vi.restoreAllMocks();
    });
  });

  describe('Drop lowest', () => {
    it('should handle 4d6dl1 (drop lowest)', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([6, 4, 3, 2]);

      const result = parseDiceNotation('4d6dl1');
      expect(result.rolls[0].results).toEqual([6, 4, 3, 2]);
      expect(result.rolls[0].kept).toHaveLength(3);
      expect(result.rolls[0].subtotal).toBe(13); // 6 + 4 + 3
      expect(result.breakdown).toContain('~~2~~');

      vi.restoreAllMocks();
    });
  });

  describe('Exploding dice', () => {
    it('should handle 4d6! (exploding)', () => {
      // First call returns [6, 3, 6, 2], then additional rolls for the two 6s
      const mockCalls = [
        [6, 3, 6, 2],
        [4],
        [2],
      ];
      let callCount = 0;

      vi.spyOn(random, 'rollDice').mockImplementation((count, sides) => {
        if (callCount === 0) {
          callCount++;
          return mockCalls[0];
        }
        return [];
      });

      vi.spyOn(random, 'rollDie').mockImplementation(() => {
        callCount++;
        if (callCount === 2) return 4;
        if (callCount === 3) return 2;
        return 1;
      });

      const result = parseDiceNotation('4d6!');
      expect(result.rolls[0].results.length).toBeGreaterThan(4); // Should have exploded
      expect(result.rolls[0].exploding).toBe(true);

      vi.restoreAllMocks();
    });
  });

  describe('Percentile dice', () => {
    it('should handle d100', () => {
      const result = parseDiceNotation('d100');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].sides).toBe(100);
      expect(result.rolls[0].results[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0].results[0]).toBeLessThanOrEqual(100);
    });

    it('should handle d% as d100', () => {
      const result = parseDiceNotation('d%');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].sides).toBe(100);
    });
  });

  describe('Case insensitivity', () => {
    it('should handle uppercase notation', () => {
      const result = parseDiceNotation('2D6+5');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0].count).toBe(2);
      expect(result.rolls[0].sides).toBe(6);
    });

    it('should handle mixed case', () => {
      const result = parseDiceNotation('1D20+2d6');
      expect(result.rolls).toHaveLength(2);
    });
  });

  describe('Whitespace handling', () => {
    it('should ignore whitespace', () => {
      const result = parseDiceNotation('2d6 + 5');
      expect(result.rolls).toHaveLength(1);
      const rollSum = result.rolls[0].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(rollSum + 5);
    });

    it('should handle extra whitespace', () => {
      const result = parseDiceNotation('  1d20  +  3  ');
      expect(result.rolls).toHaveLength(1);
      const rollSum = result.rolls[0].results.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(rollSum + 3);
    });
  });

  describe('Error handling', () => {
    it('should throw on empty notation', () => {
      expect(() => parseDiceNotation('')).toThrow('Invalid dice notation');
    });

    it('should throw on null notation', () => {
      expect(() => parseDiceNotation(null as any)).toThrow('Invalid dice notation');
    });

    it('should throw on invalid notation', () => {
      expect(() => parseDiceNotation('invalid')).toThrow('Invalid dice notation');
    });

    it('should throw on zero-sided die', () => {
      expect(() => parseDiceNotation('1d0')).toThrow('at least 1 side');
    });

    it('should throw on zero dice', () => {
      expect(() => parseDiceNotation('0d6')).toThrow('at least 1 die');
    });

    it('should throw on keeping more dice than rolled', () => {
      expect(() => parseDiceNotation('2d6kh3')).toThrow('keep/drop more dice than rolled');
    });

    it('should throw on dropping more dice than rolled', () => {
      expect(() => parseDiceNotation('2d6dl3')).toThrow('keep/drop more dice than rolled');
    });

    it('should throw on keeping zero dice', () => {
      expect(() => parseDiceNotation('4d6kh0')).toThrow('keep/drop amount must be at least 1');
    });
  });

  describe('Breakdown formatting', () => {
    it('should format basic roll', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([3, 5]);

      const result = parseDiceNotation('2d6');
      expect(result.breakdown).toBe('2d6 (3, 5) = 8');

      vi.restoreAllMocks();
    });

    it('should format roll with modifier', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([10]);

      const result = parseDiceNotation('1d20+5');
      expect(result.breakdown).toBe('1d20 (10) + 5 = 15');

      vi.restoreAllMocks();
    });

    it('should format roll with keep highest', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([6, 4, 3, 2]);

      const result = parseDiceNotation('4d6kh3');
      expect(result.breakdown).toContain('4d6kh3');
      expect(result.breakdown).toContain('~~2~~');
      expect(result.breakdown).toContain('= 13');

      vi.restoreAllMocks();
    });

    it('should format multiple groups', () => {
      vi.spyOn(random, 'rollDice')
        .mockReturnValueOnce([3, 5])
        .mockReturnValueOnce([2]);

      const result = parseDiceNotation('2d6+1d4+3');
      expect(result.breakdown).toContain('2d6');
      expect(result.breakdown).toContain('1d4');
      expect(result.breakdown).toContain('+ 3');

      vi.restoreAllMocks();
    });
  });

  describe('Complex notation', () => {
    it('should handle 4d6kh3+5 (character stat with modifier)', () => {
      vi.spyOn(random, 'rollDice').mockReturnValue([6, 5, 4, 2]);

      const result = parseDiceNotation('4d6kh3+5');
      expect(result.rolls[0].subtotal).toBe(15); // 6 + 5 + 4
      expect(result.total).toBe(20); // 15 + 5

      vi.restoreAllMocks();
    });

    it('should handle 1d20+2d6+5 (attack with sneak attack)', () => {
      vi.spyOn(random, 'rollDice')
        .mockReturnValueOnce([12])
        .mockReturnValueOnce([3, 4]);

      const result = parseDiceNotation('1d20+2d6+5');
      expect(result.rolls).toHaveLength(2);
      expect(result.total).toBe(24); // 12 + 3 + 4 + 5

      vi.restoreAllMocks();
    });
  });
});
