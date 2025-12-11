/**
 * Path animation utilities for smooth object movement along spline paths
 */

import { catmullRomSplineClosedLoop, type Point } from './spline';
import type { PathNode } from '@vtt/shared';

/**
 * Calculate the total length of a path using its spline representation
 *
 * @param nodes - Array of path nodes (control points)
 * @param tension - Controls curve tightness, typically 0.0-1.0 (default 0.5)
 * @returns Total length of the path in units
 */
export function calculatePathLength(nodes: PathNode[], tension: number = 0.5): number {
  if (nodes.length < 2) {
    return 0;
  }

  // Generate spline points using closed loop
  const splinePoints = catmullRomSplineClosedLoop(nodes, tension);

  if (splinePoints.length < 2) {
    return 0;
  }

  // Sum distances between consecutive points
  let totalLength = 0;
  for (let i = 0; i < splinePoints.length - 1; i++) {
    const dx = splinePoints[i + 1].x - splinePoints[i].x;
    const dy = splinePoints[i + 1].y - splinePoints[i].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  return totalLength;
}

/**
 * Get position along the path at a given distance from start
 *
 * @param nodes - Array of path nodes (control points)
 * @param distance - Distance along path from start
 * @param tension - Controls curve tightness, typically 0.0-1.0 (default 0.5)
 * @returns {x, y} coordinates at the specified distance
 */
export function getPositionAtDistance(
  nodes: PathNode[],
  distance: number,
  tension: number = 0.5
): { x: number; y: number } {
  if (nodes.length < 2) {
    return nodes[0] || { x: 0, y: 0 };
  }

  // Generate spline points
  const splinePoints = catmullRomSpline(nodes, tension);

  if (splinePoints.length < 2) {
    return splinePoints[0] || { x: 0, y: 0 };
  }

  // Handle negative distance
  if (distance <= 0) {
    return splinePoints[0];
  }

  // Walk along path until reaching target distance
  let accumulatedDistance = 0;

  for (let i = 0; i < splinePoints.length - 1; i++) {
    const dx = splinePoints[i + 1].x - splinePoints[i].x;
    const dy = splinePoints[i + 1].y - splinePoints[i].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (accumulatedDistance + segmentLength >= distance) {
      // Target distance is within this segment
      const remainingDistance = distance - accumulatedDistance;
      const t = segmentLength > 0 ? remainingDistance / segmentLength : 0;

      return {
        x: splinePoints[i].x + t * dx,
        y: splinePoints[i].y + t * dy
      };
    }

    accumulatedDistance += segmentLength;
  }

  // Distance exceeds path length, return last point
  return splinePoints[splinePoints.length - 1];
}

/**
 * Get position along path based on time elapsed and speed
 * Handles looping automatically
 *
 * @param nodes - Array of path nodes (control points)
 * @param elapsedTimeMs - Time elapsed since animation start in milliseconds
 * @param speed - Movement speed in units per second
 * @param loop - Whether to loop the animation
 * @param tension - Controls curve tightness, typically 0.0-1.0 (default 0.5)
 * @returns Object with {x, y} coordinates and progress (0-1)
 */
export function getPositionAtTime(
  nodes: PathNode[],
  elapsedTimeMs: number,
  speed: number,
  loop: boolean,
  tension: number = 0.5
): { x: number; y: number; progress: number } {
  if (nodes.length < 2) {
    return { x: nodes[0]?.x || 0, y: nodes[0]?.y || 0, progress: 0 };
  }

  // Calculate total path length
  const totalLength = calculatePathLength(nodes, tension);

  if (totalLength === 0) {
    return { x: nodes[0].x, y: nodes[0].y, progress: 0 };
  }

  // Calculate distance based on elapsed time and speed
  const elapsedSeconds = elapsedTimeMs / 1000;
  let distance = elapsedSeconds * speed;

  // Handle looping
  if (loop) {
    distance = distance % totalLength;
  } else if (distance > totalLength) {
    distance = totalLength;
  }

  // Calculate progress (0-1)
  const progress = Math.min(1, distance / totalLength);

  // Get position at calculated distance
  const position = getPositionAtDistance(nodes, distance, tension);

  return {
    x: position.x,
    y: position.y,
    progress
  };
}

/**
 * Calculate the direction/angle at a point on the path
 * Useful for rotating objects to face their direction of travel
 *
 * @param nodes - Array of path nodes (control points)
 * @param distance - Distance along path from start
 * @param tension - Controls curve tightness, typically 0.0-1.0 (default 0.5)
 * @returns Angle in radians (0 = right, PI/2 = down, PI = left, 3PI/2 = up)
 */
export function getDirectionAtDistance(
  nodes: PathNode[],
  distance: number,
  tension: number = 0.5
): number {
  if (nodes.length < 2) {
    return 0;
  }

  // Generate spline points
  const splinePoints = catmullRomSpline(nodes, tension);

  if (splinePoints.length < 2) {
    return 0;
  }

  // Handle negative distance
  if (distance <= 0) {
    const dx = splinePoints[1].x - splinePoints[0].x;
    const dy = splinePoints[1].y - splinePoints[0].y;
    return Math.atan2(dy, dx);
  }

  // Walk along path until reaching target distance
  let accumulatedDistance = 0;

  for (let i = 0; i < splinePoints.length - 1; i++) {
    const dx = splinePoints[i + 1].x - splinePoints[i].x;
    const dy = splinePoints[i + 1].y - splinePoints[i].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (accumulatedDistance + segmentLength >= distance) {
      // Target distance is within this segment
      return Math.atan2(dy, dx);
    }

    accumulatedDistance += segmentLength;
  }

  // Distance exceeds path length, return angle of last segment
  const lastIdx = splinePoints.length - 1;
  const dx = splinePoints[lastIdx].x - splinePoints[lastIdx - 1].x;
  const dy = splinePoints[lastIdx].y - splinePoints[lastIdx - 1].y;
  return Math.atan2(dy, dx);
}

/**
 * Pre-calculated spline point with cumulative distance
 */
export interface SplinePoint {
  x: number;
  y: number;
  distance: number; // cumulative distance from start
}

/**
 * Pre-calculate spline points for efficient animation
 * Returns array of points with cumulative distances
 *
 * @param nodes - Array of path nodes (control points)
 * @param tension - Controls curve tightness, typically 0.0-1.0 (default 0.5)
 * @param numSegments - Number of interpolated segments between each pair of points (default 20)
 * @returns Array of spline points with cumulative distances
 */
export function precomputeSplinePath(
  nodes: PathNode[],
  tension: number = 0.5,
  numSegments: number = 20
): SplinePoint[] {
  if (nodes.length < 2) {
    return nodes.map(node => ({ x: node.x, y: node.y, distance: 0 }));
  }

  // Generate spline points using closed loop for smooth animation
  const splinePoints = catmullRomSplineClosedLoop(nodes, tension, numSegments);

  if (splinePoints.length === 0) {
    return [];
  }

  // Calculate cumulative distances
  const result: SplinePoint[] = [];
  let cumulativeDistance = 0;

  // First point is at distance 0
  result.push({
    x: splinePoints[0].x,
    y: splinePoints[0].y,
    distance: 0
  });

  // Calculate cumulative distance for each subsequent point
  for (let i = 1; i < splinePoints.length; i++) {
    const dx = splinePoints[i].x - splinePoints[i - 1].x;
    const dy = splinePoints[i].y - splinePoints[i - 1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    cumulativeDistance += segmentLength;

    result.push({
      x: splinePoints[i].x,
      y: splinePoints[i].y,
      distance: cumulativeDistance
    });
  }

  return result;
}

/**
 * Find position on precomputed path at given distance (using binary search)
 *
 * @param precomputed - Precomputed spline points with cumulative distances
 * @param distance - Target distance along path
 * @returns {x, y} coordinates at the specified distance
 */
export function interpolatePrecomputedPath(
  precomputed: SplinePoint[],
  distance: number
): { x: number; y: number } {
  if (precomputed.length === 0) {
    return { x: 0, y: 0 };
  }

  if (precomputed.length === 1) {
    return { x: precomputed[0].x, y: precomputed[0].y };
  }

  // Handle distance before start
  if (distance <= 0) {
    return { x: precomputed[0].x, y: precomputed[0].y };
  }

  // Handle distance after end
  const lastPoint = precomputed[precomputed.length - 1];
  if (distance >= lastPoint.distance) {
    return { x: lastPoint.x, y: lastPoint.y };
  }

  // Binary search to find the segment containing the target distance
  let left = 0;
  let right = precomputed.length - 1;

  while (left < right - 1) {
    const mid = Math.floor((left + right) / 2);

    if (precomputed[mid].distance === distance) {
      return { x: precomputed[mid].x, y: precomputed[mid].y };
    }

    if (precomputed[mid].distance < distance) {
      left = mid;
    } else {
      right = mid;
    }
  }

  // Linear interpolate between left and right
  const p1 = precomputed[left];
  const p2 = precomputed[right];

  const segmentLength = p2.distance - p1.distance;
  const t = segmentLength > 0 ? (distance - p1.distance) / segmentLength : 0;

  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  };
}

/**
 * Animation state for a single path
 */
export interface PathAnimationState {
  pathId: string;
  objectId: string;
  objectType: 'token' | 'light';
  startTime: number; // timestamp when animation started
  precomputed: SplinePoint[];
  totalLength: number;
  speed: number;
  loop: boolean;
}

/**
 * Manages path animations for multiple objects
 */
export class PathAnimationManager {
  private animations: Map<string, PathAnimationState> = new Map();

  /**
   * Start a new path animation
   *
   * @param pathId - Unique identifier for the path
   * @param objectId - ID of the object being animated
   * @param objectType - Type of object ('token' or 'light')
   * @param nodes - Array of path nodes (control points)
   * @param speed - Movement speed in units per second
   * @param loop - Whether to loop the animation
   */
  startAnimation(
    pathId: string,
    objectId: string,
    objectType: 'token' | 'light',
    nodes: PathNode[],
    speed: number,
    loop: boolean
  ): void {
    // Precompute the spline path
    const precomputed = precomputeSplinePath(nodes);
    const totalLength = precomputed.length > 0
      ? precomputed[precomputed.length - 1].distance
      : 0;

    this.animations.set(pathId, {
      pathId,
      objectId,
      objectType,
      startTime: Date.now(),
      precomputed,
      totalLength,
      speed,
      loop
    });
  }

  /**
   * Stop a path animation
   *
   * @param pathId - Unique identifier for the path
   */
  stopAnimation(pathId: string): void {
    this.animations.delete(pathId);
  }

  /**
   * Get the current position of an object on its path
   *
   * @param pathId - Unique identifier for the path
   * @param currentTime - Current timestamp (defaults to Date.now())
   * @returns {x, y} coordinates or null if animation not found
   */
  getObjectPosition(pathId: string, currentTime: number = Date.now()): { x: number; y: number } | null {
    const animation = this.animations.get(pathId);

    if (!animation) {
      return null;
    }

    const elapsedTimeMs = currentTime - animation.startTime;
    const elapsedSeconds = elapsedTimeMs / 1000;
    let distance = elapsedSeconds * animation.speed;

    // Handle looping
    if (animation.loop && animation.totalLength > 0) {
      distance = distance % animation.totalLength;
    } else if (distance > animation.totalLength) {
      distance = animation.totalLength;
    }

    return interpolatePrecomputedPath(animation.precomputed, distance);
  }

  /**
   * Get positions of all animated objects
   *
   * @param currentTime - Current timestamp (defaults to Date.now())
   * @returns Map of pathId to object position data
   */
  getAllAnimatedPositions(currentTime: number = Date.now()): Map<string, {
    x: number;
    y: number;
    objectId: string;
    objectType: 'token' | 'light'
  }> {
    const positions = new Map<string, {
      x: number;
      y: number;
      objectId: string;
      objectType: 'token' | 'light'
    }>();

    Array.from(this.animations.entries()).forEach(([pathId, animation]) => {
      const position = this.getObjectPosition(pathId, currentTime);

      if (position) {
        positions.set(pathId, {
          x: position.x,
          y: position.y,
          objectId: animation.objectId,
          objectType: animation.objectType
        });
      }
    });

    return positions;
  }

  /**
   * Check if a path is currently animating
   *
   * @param pathId - Unique identifier for the path
   * @returns True if animation is active
   */
  isAnimating(pathId: string): boolean {
    return this.animations.has(pathId);
  }

  /**
   * Get all active animation path IDs
   *
   * @returns Array of active path IDs
   */
  getActiveAnimations(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * Clear all animations
   */
  clearAll(): void {
    this.animations.clear();
  }
}
