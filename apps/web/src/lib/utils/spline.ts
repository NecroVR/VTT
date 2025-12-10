/**
 * Spline geometry utility functions for Catmull-Rom splines
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Generates a smooth Catmull-Rom spline through the given points
 *
 * @param points - Array of control points (minimum 2 points)
 * @param tension - Controls curve tightness, typically 0.0-1.0 (default 0.5)
 * @param numSegments - Number of interpolated segments between each pair of points (default 20)
 * @returns Array of points along the smooth curve
 */
export function catmullRomSpline(
  points: Point[],
  tension: number = 0.5,
  numSegments: number = 20
): Point[] {
  if (points.length < 2) {
    return points;
  }

  // For Catmull-Rom splines, we need at least 4 points
  // Pad the array by duplicating endpoints if needed
  const paddedPoints: Point[] = [];

  if (points.length === 2) {
    // For 2 points, create a straight line with duplicated endpoints
    paddedPoints.push(points[0], points[0], points[1], points[1]);
  } else if (points.length === 3) {
    // For 3 points, duplicate the endpoints
    paddedPoints.push(points[0], points[0], points[1], points[2], points[2]);
  } else {
    // For 4+ points, duplicate first and last
    paddedPoints.push(points[0], ...points, points[points.length - 1]);
  }

  const result: Point[] = [];
  const alpha = 0.5; // Centripetal Catmull-Rom (0.5 is standard, 0 is uniform, 1 is chordal)

  // Process each segment between control points
  for (let i = 1; i < paddedPoints.length - 2; i++) {
    const p0 = paddedPoints[i - 1];
    const p1 = paddedPoints[i];
    const p2 = paddedPoints[i + 1];
    const p3 = paddedPoints[i + 2];

    // Calculate parameterization values (for centripetal variant)
    const t0 = 0;
    const t1 = Math.pow(
      Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2),
      alpha
    ) + t0;
    const t2 = Math.pow(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2),
      alpha
    ) + t1;
    const t3 = Math.pow(
      Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2),
      alpha
    ) + t2;

    // Generate points along this segment
    for (let j = 0; j <= numSegments; j++) {
      // Parameter from 0 to 1 for this segment
      const t = t1 + (j / numSegments) * (t2 - t1);

      // Catmull-Rom interpolation formula
      const A1x = ((t1 - t) / (t1 - t0)) * p0.x + ((t - t0) / (t1 - t0)) * p1.x;
      const A1y = ((t1 - t) / (t1 - t0)) * p0.y + ((t - t0) / (t1 - t0)) * p1.y;

      const A2x = ((t2 - t) / (t2 - t1)) * p1.x + ((t - t1) / (t2 - t1)) * p2.x;
      const A2y = ((t2 - t) / (t2 - t1)) * p1.y + ((t - t1) / (t2 - t1)) * p2.y;

      const A3x = ((t3 - t) / (t3 - t2)) * p2.x + ((t - t2) / (t3 - t2)) * p3.x;
      const A3y = ((t3 - t) / (t3 - t2)) * p2.y + ((t - t2) / (t3 - t2)) * p3.y;

      const B1x = ((t2 - t) / (t2 - t0)) * A1x + ((t - t0) / (t2 - t0)) * A2x;
      const B1y = ((t2 - t) / (t2 - t0)) * A1y + ((t - t0) / (t2 - t0)) * A2y;

      const B2x = ((t3 - t) / (t3 - t1)) * A2x + ((t - t1) / (t3 - t1)) * A3x;
      const B2y = ((t3 - t) / (t3 - t1)) * A2y + ((t - t1) / (t3 - t1)) * A3y;

      const Cx = ((t2 - t) / (t2 - t1)) * B1x + ((t - t1) / (t2 - t1)) * B2x;
      const Cy = ((t2 - t) / (t2 - t1)) * B1y + ((t - t1) / (t2 - t1)) * B2y;

      // Apply tension (mix between original point and interpolated point)
      const finalX = Cx * (1 - tension) + p1.x * tension * (j === 0 ? 1 : 0) + p2.x * tension * (j === numSegments ? 1 : 0);
      const finalY = Cy * (1 - tension) + p1.y * tension * (j === 0 ? 1 : 0) + p2.y * tension * (j === numSegments ? 1 : 0);

      result.push({ x: finalX, y: finalY });
    }
  }

  // Remove duplicate points
  const deduplicated: Point[] = [];
  for (let i = 0; i < result.length; i++) {
    if (i === 0 ||
        Math.abs(result[i].x - result[i - 1].x) > 0.01 ||
        Math.abs(result[i].y - result[i - 1].y) > 0.01) {
      deduplicated.push(result[i]);
    }
  }

  return deduplicated;
}

/**
 * Combines wall endpoints and control points into an ordered array
 *
 * @param wall - Wall object with start, end, and optional control points
 * @returns Array of points in order: start, control points, end
 */
export function getSplinePoints(wall: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  controlPoints?: Array<{ x: number; y: number }>;
}): Point[] {
  const points: Point[] = [
    { x: wall.x1, y: wall.y1 }
  ];

  if (wall.controlPoints && wall.controlPoints.length > 0) {
    points.push(...wall.controlPoints);
  }

  points.push({ x: wall.x2, y: wall.y2 });

  return points;
}

/**
 * Renders a Catmull-Rom spline through the given points
 *
 * @param ctx - Canvas rendering context
 * @param points - Array of control points
 */
export function renderSplinePath(
  ctx: CanvasRenderingContext2D,
  points: Point[]
): void {
  if (points.length < 2) {
    return;
  }

  // Generate smooth spline points
  const splinePoints = catmullRomSpline(points);

  if (splinePoints.length === 0) {
    return;
  }

  // Move to first point
  ctx.moveTo(splinePoints[0].x, splinePoints[0].y);

  // Draw lines through all spline points
  for (let i = 1; i < splinePoints.length; i++) {
    ctx.lineTo(splinePoints[i].x, splinePoints[i].y);
  }
}

/**
 * Calculates the minimum distance from a point to a line segment
 *
 * @param px - Point x coordinate
 * @param py - Point y coordinate
 * @param x1 - Line segment start x
 * @param y1 - Line segment start y
 * @param x2 - Line segment end x
 * @param y2 - Line segment end y
 * @returns Minimum distance from point to line segment
 */
function distanceToLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Line segment is a point
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  // Calculate projection of point onto line segment (clamped to [0, 1])
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));

  // Calculate closest point on segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Return distance to closest point
  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
}

/**
 * Returns the minimum distance from a point to a spline curve
 *
 * @param px - Point x coordinate
 * @param py - Point y coordinate
 * @param splinePoints - Array of points along the spline curve
 * @param threshold - Optional distance threshold for early exit
 * @returns Minimum distance from point to spline
 */
export function distanceToSpline(
  px: number,
  py: number,
  splinePoints: Point[],
  threshold?: number
): number {
  if (splinePoints.length === 0) {
    return Infinity;
  }

  if (splinePoints.length === 1) {
    const dx = px - splinePoints[0].x;
    const dy = py - splinePoints[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  let minDistance = Infinity;

  // Check distance to each line segment in the spline
  for (let i = 0; i < splinePoints.length - 1; i++) {
    const distance = distanceToLineSegment(
      px,
      py,
      splinePoints[i].x,
      splinePoints[i].y,
      splinePoints[i + 1].x,
      splinePoints[i + 1].y
    );

    minDistance = Math.min(minDistance, distance);

    // Early exit if below threshold
    if (threshold !== undefined && minDistance <= threshold) {
      return minDistance;
    }
  }

  return minDistance;
}

/**
 * Finds the closest point on a line segment to a given point
 *
 * @param px - Point x coordinate
 * @param py - Point y coordinate
 * @param x1 - Line segment start x
 * @param y1 - Line segment start y
 * @param x2 - Line segment end x
 * @param y2 - Line segment end y
 * @returns Object with closest point and parameter t (0-1)
 */
function closestPointOnLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { point: Point; t: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return { point: { x: x1, y: y1 }, t: 0 };
  }

  // Calculate projection of point onto line segment (clamped to [0, 1])
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));

  return {
    point: {
      x: x1 + t * dx,
      y: y1 + t * dy
    },
    t
  };
}

/**
 * Finds the closest point on a spline to a given point
 *
 * @param px - Point x coordinate
 * @param py - Point y coordinate
 * @param splinePoints - Array of points along the spline curve
 * @returns Object with closest point, parameter t, and segment index
 */
export function findClosestPointOnSpline(
  px: number,
  py: number,
  splinePoints: Point[]
): { point: Point; t: number; segmentIndex: number } {
  if (splinePoints.length === 0) {
    throw new Error("Spline must have at least one point");
  }

  if (splinePoints.length === 1) {
    return {
      point: splinePoints[0],
      t: 0,
      segmentIndex: 0
    };
  }

  let minDistance = Infinity;
  let closestPoint: Point = splinePoints[0];
  let closestT = 0;
  let closestSegment = 0;

  // Check each line segment in the spline
  for (let i = 0; i < splinePoints.length - 1; i++) {
    const result = closestPointOnLineSegment(
      px,
      py,
      splinePoints[i].x,
      splinePoints[i].y,
      splinePoints[i + 1].x,
      splinePoints[i + 1].y
    );

    const dx = px - result.point.x;
    const dy = py - result.point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = result.point;
      closestT = result.t;
      closestSegment = i;
    }
  }

  return {
    point: closestPoint,
    t: closestT,
    segmentIndex: closestSegment
  };
}

/**
 * Inserts a new control point at the correct position based on segment index
 *
 * @param controlPoints - Existing array of control points
 * @param newPoint - New control point to insert
 * @param segmentIndex - Index of the segment where the point should be inserted
 * @returns New array of control points with the inserted point
 */
export function insertControlPoint(
  controlPoints: Array<{ x: number; y: number }>,
  newPoint: { x: number; y: number },
  segmentIndex: number
): Array<{ x: number; y: number }> {
  const result = [...controlPoints];

  // Insert after the segment index
  // If segmentIndex is 0 and there are no control points, insert at position 0
  // Otherwise insert at segmentIndex position
  const insertPosition = Math.min(segmentIndex, result.length);
  result.splice(insertPosition, 0, newPoint);

  return result;
}
