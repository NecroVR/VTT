/**
 * Cryptographically secure random number generator for dice rolls
 */

/**
 * Generate a cryptographically secure random integer between min and max (inclusive)
 * Uses crypto.getRandomValues for browser and crypto.randomInt for Node.js
 */
export function randomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error('min must be less than or equal to max');
  }

  if (min === max) {
    return min;
  }

  const range = max - min + 1;

  // Use crypto.getRandomValues if available (browser or modern Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return min + (randomBuffer[0] % range);
  }

  // Fallback to Node.js crypto module
  try {
    const nodeCrypto = require('crypto');
    if (nodeCrypto && nodeCrypto.randomInt) {
      return nodeCrypto.randomInt(min, max + 1);
    }
  } catch (e) {
    // crypto module not available
  }

  // Final fallback to Math.random (not cryptographically secure)
  console.warn('Cryptographically secure random not available, falling back to Math.random');
  return min + Math.floor(Math.random() * range);
}

/**
 * Roll a single die with the specified number of sides
 */
export function rollDie(sides: number): number {
  if (sides < 1) {
    throw new Error('Die must have at least 1 side');
  }
  return randomInt(1, sides);
}

/**
 * Roll multiple dice with the specified number of sides
 */
export function rollDice(count: number, sides: number): number[] {
  if (count < 1) {
    throw new Error('Must roll at least 1 die');
  }
  return Array.from({ length: count }, () => rollDie(sides));
}
