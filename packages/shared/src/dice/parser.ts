import { rollDice, rollDie } from './random';

/**
 * Represents a single dice group in a roll
 */
export interface DiceGroup {
  /** Number of dice to roll */
  count: number;
  /** Number of sides on each die */
  sides: number;
  /** Modifier to add/subtract (applied to the group) */
  modifier?: number;
  /** Keep highest/lowest dice */
  keep?: { highest: number } | { lowest: number };
  /** Drop highest/lowest dice */
  drop?: { highest: number } | { lowest: number };
  /** Exploding dice (reroll max values) */
  exploding?: boolean;
  /** Raw results from rolling */
  results: number[];
  /** Indices of kept dice (if keep/drop applied) */
  kept?: number[];
  /** This group's contribution to total */
  subtotal: number;
}

/**
 * Represents a complete dice roll result
 */
export interface DiceRoll {
  /** Original notation string */
  notation: string;
  /** Individual dice groups */
  rolls: DiceGroup[];
  /** Final total */
  total: number;
  /** Human-readable breakdown */
  breakdown: string;
}

/**
 * Parse a dice notation string and return the result
 *
 * Supported notation:
 * - Basic: 1d20, 2d6, d20
 * - Modifiers: 2d6+5, 1d20-2
 * - Multiple groups: 2d6+1d4+3
 * - Keep highest: 4d6kh3, 4d6k3 (defaults to highest)
 * - Keep lowest: 2d20kl1
 * - Drop highest: 4d6dh1
 * - Drop lowest: 4d6dl1
 * - Exploding: 4d6!
 * - Percentile: d100, d%
 *
 * @param notation - Dice notation string
 * @returns DiceRoll result
 * @throws Error if notation is invalid
 */
export function parseDiceNotation(notation: string): DiceRoll {
  if (!notation || typeof notation !== 'string') {
    throw new Error('Invalid dice notation: must be a non-empty string');
  }

  // Normalize the notation
  const normalized = notation.toLowerCase().replace(/\s+/g, '');

  // Replace d% with d100
  const withPercentile = normalized.replace(/d%/g, 'd100');

  // Parse the notation into tokens
  const tokens = tokenize(withPercentile);

  // Parse tokens into dice groups and modifiers
  const groups: DiceGroup[] = [];
  let totalModifier = 0;

  for (const token of tokens) {
    if (token.type === 'dice') {
      const group = rollDiceGroup(token);
      groups.push(group);
    } else if (token.type === 'modifier') {
      totalModifier += token.value;
    }
  }

  // Calculate total
  const groupTotal = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const total = groupTotal + totalModifier;

  // Generate breakdown string
  const breakdown = generateBreakdown(groups, totalModifier, total);

  return {
    notation,
    rolls: groups,
    total,
    breakdown,
  };
}

/**
 * Token types for parsing
 */
interface DiceToken {
  type: 'dice';
  count: number;
  sides: number;
  keep?: { highest: number } | { lowest: number };
  drop?: { highest: number } | { lowest: number };
  exploding?: boolean;
}

interface ModifierToken {
  type: 'modifier';
  value: number;
}

type Token = DiceToken | ModifierToken;

/**
 * Tokenize a dice notation string
 */
function tokenize(notation: string): Token[] {
  const tokens: Token[] = [];

  // Regular expression to match dice notation components
  // Matches: [count]d[sides][keep/drop][exploding]
  const diceRegex = /(\d*)d(\d+)(kh?\d+|kl\d+|dh\d+|dl\d+)?(!)?/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = diceRegex.exec(notation)) !== null) {
    // Check for modifier between last match and this one
    if (match.index > lastIndex) {
      const modifierStr = notation.slice(lastIndex, match.index);
      const modifier = parseModifier(modifierStr);
      if (modifier !== 0) {
        tokens.push({ type: 'modifier', value: modifier });
      }
    }

    // Parse dice token
    const count = match[1] === '' ? 1 : parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const keepDrop = match[3];
    const exploding = match[4] === '!';

    if (sides < 1) {
      throw new Error(`Invalid dice notation: die must have at least 1 side (got d${sides})`);
    }

    if (count < 1) {
      throw new Error(`Invalid dice notation: must roll at least 1 die (got ${count}d${sides})`);
    }

    const token: DiceToken = {
      type: 'dice',
      count,
      sides,
      exploding,
    };

    // Parse keep/drop modifier
    if (keepDrop) {
      const kdMatch = keepDrop.match(/^(k|kh|kl|dh|dl)(\d+)$/);
      if (kdMatch) {
        const operation = kdMatch[1];
        const amount = parseInt(kdMatch[2], 10);

        if (amount < 1) {
          throw new Error(`Invalid dice notation: keep/drop amount must be at least 1 (got ${amount})`);
        }

        if (amount > count) {
          throw new Error(`Invalid dice notation: cannot keep/drop more dice than rolled (${amount} > ${count})`);
        }

        if (operation === 'k' || operation === 'kh') {
          token.keep = { highest: amount };
        } else if (operation === 'kl') {
          token.keep = { lowest: amount };
        } else if (operation === 'dh') {
          token.drop = { highest: amount };
        } else if (operation === 'dl') {
          token.drop = { lowest: amount };
        }
      }
    }

    tokens.push(token);
    lastIndex = diceRegex.lastIndex;
  }

  // Check for trailing modifier
  if (lastIndex < notation.length) {
    const modifierStr = notation.slice(lastIndex);
    const modifier = parseModifier(modifierStr);
    if (modifier !== 0) {
      tokens.push({ type: 'modifier', value: modifier });
    }
  }

  if (tokens.length === 0) {
    throw new Error(`Invalid dice notation: no valid dice or modifiers found in "${notation}"`);
  }

  return tokens;
}

/**
 * Parse a modifier string (e.g., "+5", "-2")
 */
function parseModifier(str: string): number {
  if (!str) return 0;

  const match = str.match(/([+-]?\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
}

/**
 * Roll a dice group based on a token
 */
function rollDiceGroup(token: DiceToken): DiceGroup {
  let results = rollDice(token.count, token.sides);

  // Handle exploding dice
  if (token.exploding) {
    const maxValue = token.sides;
    const exploded: number[] = [...results];

    // Keep rolling while we have max values (with a safety limit)
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      const maxIndices = exploded
        .map((value, index) => ({ value, index }))
        .filter(item => item.value === maxValue)
        .map(item => item.index);

      if (maxIndices.length === 0) break;

      // Roll additional dice for each max value
      const additionalRolls = maxIndices.map(() => rollDie(token.sides));
      exploded.push(...additionalRolls);

      iterations++;
    }

    results = exploded;
  }

  // Handle keep/drop
  let kept: number[] | undefined;
  let finalResults = results;

  if (token.keep || token.drop) {
    const indexed = results.map((value, index) => ({ value, index }));
    const sorted = [...indexed].sort((a, b) => b.value - a.value); // Sort descending

    let keptIndexed: typeof indexed;

    if (token.keep) {
      if ('highest' in token.keep) {
        keptIndexed = sorted.slice(0, token.keep.highest);
      } else {
        keptIndexed = sorted.slice(-token.keep.lowest);
      }
    } else if (token.drop) {
      if ('highest' in token.drop) {
        keptIndexed = sorted.slice(token.drop.highest);
      } else {
        keptIndexed = sorted.slice(0, -token.drop.lowest);
      }
    } else {
      keptIndexed = indexed;
    }

    // Sort kept indices back to original order
    keptIndexed.sort((a, b) => a.index - b.index);
    kept = keptIndexed.map(item => item.index);
    finalResults = keptIndexed.map(item => item.value);
  }

  const subtotal = finalResults.reduce((sum, value) => sum + value, 0);

  return {
    count: token.count,
    sides: token.sides,
    modifier: token.exploding ? undefined : undefined,
    keep: token.keep,
    drop: token.drop,
    exploding: token.exploding,
    results,
    kept,
    subtotal,
  };
}

/**
 * Generate a human-readable breakdown string
 */
function generateBreakdown(groups: DiceGroup[], modifier: number, total: number): string {
  const parts: string[] = [];

  for (const group of groups) {
    let groupStr = `${group.count}d${group.sides}`;

    // Add keep/drop notation
    if (group.keep) {
      if ('highest' in group.keep) {
        groupStr += `kh${group.keep.highest}`;
      } else {
        groupStr += `kl${group.keep.lowest}`;
      }
    } else if (group.drop) {
      if ('highest' in group.drop) {
        groupStr += `dh${group.drop.highest}`;
      } else {
        groupStr += `dl${group.drop.lowest}`;
      }
    }

    // Add exploding notation
    if (group.exploding) {
      groupStr += '!';
    }

    // Add results
    if (group.kept !== undefined) {
      // Show kept vs dropped
      const resultStrs = group.results.map((value, index) => {
        if (group.kept!.includes(index)) {
          return String(value);
        } else {
          return `~~${value}~~`;
        }
      });
      groupStr += ` (${resultStrs.join(', ')})`;
    } else {
      groupStr += ` (${group.results.join(', ')})`;
    }

    parts.push(groupStr);
  }

  let breakdown = parts.join(' + ');

  if (modifier !== 0) {
    breakdown += modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
  }

  breakdown += ` = ${total}`;

  return breakdown;
}

/**
 * Export for use in WebSocket handler
 */
export { rollDice, rollDie } from './random';
