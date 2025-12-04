# Session Notes: Dice Notation Parser Implementation

**Date**: 2025-12-04
**Session ID**: 0013
**Topic**: Complete Dice Notation Parser for VTT

---

## Session Summary

Successfully implemented a complete dice notation parser system for the VTT project, replacing the mock dice implementation with a production-ready parser that supports full D&D-style dice notation including advanced features like keep/drop, exploding dice, and percentile rolls.

---

## Problems Addressed

### Initial State
- WebSocket handler at `apps/server/src/websocket/handlers/game.ts` had a mock dice implementation
- Always returned hardcoded values `[4,3,6] = 13`
- No support for complex dice notation
- No proper breakdown or roll details

### Requirements
- Support basic rolls (1d20, 2d6, d20)
- Support modifiers (2d6+5, 1d20-2)
- Support multiple dice groups (2d6+1d4+3)
- Support keep highest/lowest (4d6kh3, 2d20kl1) for advantage/disadvantage
- Support drop highest/lowest (4d6dh1, 4d6dl1)
- Support exploding dice (4d6!)
- Support percentile dice (d100, d%)
- Cryptographically secure random generation
- Comprehensive testing

---

## Solutions Implemented

### 1. Random Number Generator (`packages/shared/src/dice/random.ts`)

**Features**:
- Cryptographically secure random number generation
- Uses `crypto.getRandomValues` for browser/modern Node.js
- Falls back to Node.js `crypto.randomInt` for older versions
- Final fallback to Math.random with warning

**Functions**:
```typescript
randomInt(min: number, max: number): number
rollDie(sides: number): number
rollDice(count: number, sides: number): number[]
```

**Security**: Uses cryptographic randomness for fair dice rolls, important for online gaming.

---

### 2. Dice Parser (`packages/shared/src/dice/parser.ts`)

**Core Function**:
```typescript
parseDiceNotation(notation: string): DiceRoll
```

**Supported Notation**:

| Notation | Description | Example |
|----------|-------------|---------|
| `1d20` | Roll 1 twenty-sided die | `1d20` → 15 |
| `d20` | Shorthand for 1d20 | `d20` → 12 |
| `2d6` | Roll 2 six-sided dice | `2d6` → [3,5] = 8 |
| `2d6+5` | Roll with positive modifier | `2d6+5` → [3,5] + 5 = 13 |
| `1d20-2` | Roll with negative modifier | `1d20-2` → 15 - 2 = 13 |
| `2d6+1d4+3` | Multiple dice groups | `2d6+1d4+3` → [3,5] + [2] + 3 = 13 |
| `4d6kh3` | Keep highest 3 (character stats) | `4d6kh3` → [6,4,3,~~2~~] = 13 |
| `4d6k3` | Keep defaults to highest | `4d6k3` → [6,4,3,~~2~~] = 13 |
| `2d20kh1` | Advantage (D&D 5e) | `2d20kh1` → [15,~~8~~] = 15 |
| `2d20kl1` | Disadvantage (D&D 5e) | `2d20kl1` → [~~15~~,8] = 8 |
| `4d6dh1` | Drop highest 1 | `4d6dh1` → [~~6~~,4,3,2] = 9 |
| `4d6dl1` | Drop lowest 1 | `4d6dl1` → [6,4,3,~~2~~] = 13 |
| `4d6!` | Exploding dice (reroll max) | `4d6!` → [6,4,6,2,3,1] = 22 |
| `d100` | Percentile die | `d100` → 67 |
| `d%` | Shorthand for d100 | `d%` → 42 |

**Return Type**:
```typescript
interface DiceRoll {
  notation: string;      // Original notation
  rolls: DiceGroup[];    // Individual roll groups
  total: number;         // Final total
  breakdown: string;     // Human-readable breakdown
}

interface DiceGroup {
  count: number;
  sides: number;
  modifier?: number;
  keep?: { highest: number } | { lowest: number };
  drop?: { highest: number } | { lowest: number };
  exploding?: boolean;
  results: number[];
  kept?: number[];       // Indices of kept dice
  subtotal: number;
}
```

**Example Output**:
```javascript
parseDiceNotation("4d6kh3+5")
// Returns:
{
  notation: "4d6kh3+5",
  rolls: [{
    count: 4,
    sides: 6,
    keep: { highest: 3 },
    results: [6, 4, 3, 2],
    kept: [0, 1, 2],
    subtotal: 13
  }],
  total: 18,
  breakdown: "4d6kh3 (6, 4, 3, ~~2~~) + 5 = 18"
}
```

---

### 3. WebSocket Type Updates (`packages/shared/src/types/websocket.ts`)

**Updated DiceResultPayload**:
```typescript
interface DiceRollGroup {
  dice: string;          // "2d6", "1d20kh1"
  results: number[];     // [3, 5]
  kept?: number[];       // Indices of kept dice
  subtotal: number;      // 8
}

interface DiceResultPayload {
  notation: string;
  rolls: DiceRollGroup[];
  modifiers: number;
  total: number;
  breakdown: string;     // "2d6 (3, 5) + 5 = 13"
  label?: string;
  userId: string;
  username: string;
}
```

---

### 4. Server Handler Update (`apps/server/src/websocket/handlers/game.ts`)

**Before**:
```typescript
const mockResult: DiceResultPayload = {
  notation,
  rolls: [4, 3, 6],
  total: 13,
  label,
  userId: playerInfo.userId,
};
```

**After**:
```typescript
try {
  const diceRoll = parseDiceNotation(notation);

  const rolls: DiceRollGroup[] = diceRoll.rolls.map((group: DiceGroup) => ({
    dice: `${group.count}d${group.sides}${keepDropNotation}${explodingNotation}`,
    results: group.results,
    kept: group.kept,
    subtotal: group.subtotal,
  }));

  const groupTotal = diceRoll.rolls.reduce((sum: number, group: DiceGroup) =>
    sum + group.subtotal, 0
  );
  const modifiers = diceRoll.total - groupTotal;

  const result: DiceResultPayload = {
    notation,
    rolls,
    modifiers,
    total: diceRoll.total,
    breakdown: diceRoll.breakdown,
    label,
    userId: playerInfo.userId,
    username: playerInfo.username,
  };

  roomManager.broadcast(gameId, {
    type: 'dice:result',
    payload: result,
    timestamp: Date.now(),
  });
} catch (error) {
  sendMessage(socket, 'error', {
    message: error instanceof Error ? error.message : 'Invalid dice notation'
  });
}
```

---

### 5. Testing (`packages/shared/src/dice/*.test.ts`)

**Test Suite**: 54 tests, all passing

**Coverage**:
- `parser.test.ts`: 37 tests covering all notation features
- `random.test.ts`: 17 tests covering random number generation

**Test Categories**:
1. Basic rolls (1d20, 2d6, d20)
2. Modifiers (positive, negative, multiple)
3. Multiple dice groups
4. Keep highest/lowest
5. Drop highest/lowest
6. Exploding dice
7. Percentile dice
8. Case insensitivity
9. Whitespace handling
10. Error handling (invalid notation, zero dice, etc.)
11. Breakdown formatting

**Example Tests**:
```typescript
it('should handle 4d6kh3 (keep highest 3)', () => {
  vi.spyOn(random, 'rollDice').mockReturnValue([6, 4, 3, 2]);
  const result = parseDiceNotation('4d6kh3');
  expect(result.rolls[0].results).toEqual([6, 4, 3, 2]);
  expect(result.rolls[0].kept).toHaveLength(3);
  expect(result.rolls[0].subtotal).toBe(13); // 6 + 4 + 3
  expect(result.breakdown).toContain('~~2~~');
});

it('should have relatively uniform distribution', () => {
  // Tests that random distribution is fair
  // Runs 10,000 iterations and checks within 30% of expected
});
```

---

### 6. Package Configuration

**Updated `packages/shared/package.json`**:
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./dice": {
      "import": "./dist/dice/index.js",
      "types": "./dist/dice/index.d.ts"
    }
  }
}
```

**Created `packages/shared/vitest.config.ts`**:
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
```

---

## Files Created/Modified

### Created Files
1. `packages/shared/src/dice/index.ts` - Module exports
2. `packages/shared/src/dice/random.ts` - Random number generator
3. `packages/shared/src/dice/random.test.ts` - Random tests (17 tests)
4. `packages/shared/src/dice/parser.ts` - Dice notation parser
5. `packages/shared/src/dice/parser.test.ts` - Parser tests (37 tests)
6. `packages/shared/vitest.config.ts` - Test configuration

### Modified Files
1. `packages/shared/package.json` - Added dice subpath export
2. `packages/shared/src/index.ts` - Export dice module
3. `packages/shared/src/types/websocket.ts` - Updated DiceResultPayload
4. `apps/server/src/websocket/handlers/game.ts` - Integrated real parser

---

## Testing Results

### Unit Tests
```
 Test Files  2 passed (2)
      Tests  54 passed (54)
   Duration  713ms
```

**All tests passing**:
- 37 parser tests
- 17 random number generator tests
- Coverage includes all edge cases and error conditions

### Build Verification
```
Tasks:    4 successful, 4 total
Cached:    4 cached, 4 total
  Time:    9.776s
```

**All packages built successfully**:
- @vtt/shared
- @vtt/database
- @vtt/server
- @vtt/web

---

## Current Status

### Completed
- ✅ Dice notation parser with full D&D notation support
- ✅ Cryptographically secure random number generation
- ✅ Comprehensive test suite (54 tests, all passing)
- ✅ WebSocket type updates
- ✅ Server handler integration
- ✅ Package exports configuration
- ✅ Build verification
- ✅ Committed to Git
- ✅ Pushed to GitHub (commit bf669bf)

### Architecture Decisions

1. **Separate Module**: Created dedicated dice module for maintainability
2. **Cryptographic Random**: Used crypto APIs for fairness
3. **Detailed Results**: Return full breakdown with kept/dropped dice
4. **Error Handling**: Parser throws descriptive errors for invalid notation
5. **Type Safety**: Full TypeScript types throughout
6. **Testability**: Comprehensive test coverage with mocking support

---

## Integration Notes

### Client-Side Usage
The client can now receive detailed dice roll results:

```typescript
// Received from server
{
  type: 'dice:result',
  payload: {
    notation: '4d6kh3+5',
    rolls: [{
      dice: '4d6kh3',
      results: [6, 4, 3, 2],
      kept: [0, 1, 2],
      subtotal: 13
    }],
    modifiers: 5,
    total: 18,
    breakdown: '4d6kh3 (6, 4, 3, ~~2~~) + 5 = 18',
    userId: 'user123',
    username: 'PlayerOne'
  }
}
```

The `breakdown` string uses markdown-style strikethrough (`~~2~~`) for dropped dice, which can be rendered in the UI.

---

## Next Steps

### Future Enhancements (Not Implemented)
1. **Additional Notation**:
   - Reroll once (1d20r1): Reroll 1s once
   - Minimum/maximum (1d20mi10): Minimum result of 10
   - Critical (1d20cs20): Highlight critical success on 20

2. **UI Components**:
   - Dice roller interface
   - Roll history display
   - Animated dice visualization
   - Roll templates for common rolls

3. **Database Storage**:
   - Store roll history for game sessions
   - Statistics and analytics
   - Roll replay functionality

4. **Advanced Features**:
   - Macros/saved rolls
   - Roll templates from character sheets
   - Private rolls (only GM sees result)
   - Dice pools (count successes)

---

## Key Learnings

1. **Regex Parsing**: Used regex for tokenizing dice notation, handles complex patterns well
2. **Type Safety**: TypeScript caught several potential bugs during development
3. **Testing First**: Comprehensive tests made refactoring safe and easy
4. **Breakdown String**: Human-readable format is important for UX
5. **Crypto APIs**: Different environments (browser/Node) require fallback strategies

---

## Commit Information

**Commit**: bf669bf
**Message**: feat(dice): Implement complete dice notation parser
**Branch**: master
**Pushed**: Yes

---

**Session Duration**: ~1 hour
**Lines of Code**: ~1,058 additions across 10 files
**Tests Written**: 54 tests
**Test Pass Rate**: 100%
