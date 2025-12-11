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

  // For exactly 2 points, just return a straight line between them
  // The centripetal parameterization causes division by zero with duplicated points
  if (points.length === 2) {
    const result: Point[] = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      result.push({
        x: points[0].x + t * (points[1].x - points[0].x),
        y: points[0].y + t * (points[1].y - points[0].y)
      });
    }
    return result;
  }

  // For exactly 3 points, create virtual endpoints to make Catmull-Rom work
  // The curve should pass through all 3 points
  if (points.length === 3) {
    // Create virtual points by reflecting the first and last points
    const p0 = points[0];
    const p1 = points[1];
    const p2 = points[2];

    // Virtual point before first: reflect p1 across p0
    const virtualStart = {
      x: 2 * p0.x - p1.x,
      y: 2 * p0.y - p1.y
    };
    // Virtual point after last: reflect p1 across p2
    const virtualEnd = {
      x: 2 * p2.x - p1.x,
      y: 2 * p2.y - p1.y
    };

    // Now treat as 5 points: virtualStart, p0, p1, p2, virtualEnd
    // But only draw the middle 2 segments (p0->p1 and p1->p2)
    const result: Point[] = [];
    const allPoints = [virtualStart, p0, p1, p2, virtualEnd];

    // Segment 1: p0 to p1 (uses virtualStart, p0, p1, p2)
    for (let j = 0; j <= numSegments; j++) {
      const t = j / numSegments;
      const t2 = t * t;
      const t3 = t2 * t;

      // Catmull-Rom matrix coefficients
      const c0 = -0.5 * t3 + t2 - 0.5 * t;
      const c1 = 1.5 * t3 - 2.5 * t2 + 1;
      const c2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
      const c3 = 0.5 * t3 - 0.5 * t2;

      result.push({
        x: c0 * allPoints[0].x + c1 * allPoints[1].x + c2 * allPoints[2].x + c3 * allPoints[3].x,
        y: c0 * allPoints[0].y + c1 * allPoints[1].y + c2 * allPoints[2].y + c3 * allPoints[3].y
      });
    }

    // Segment 2: p1 to p2 (uses p0, p1, p2, virtualEnd)
    for (let j = 1; j <= numSegments; j++) {
      const t = j / numSegments;
      const t2 = t * t;
      const t3 = t2 * t;

      const c0 = -0.5 * t3 + t2 - 0.5 * t;
      const c1 = 1.5 * t3 - 2.5 * t2 + 1;
      const c2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
      const c3 = 0.5 * t3 - 0.5 * t2;

      result.push({
        x: c0 * allPoints[1].x + c1 * allPoints[2].x + c2 * allPoints[3].x + c3 * allPoints[4].x,
        y: c0 * allPoints[1].y + c1 * allPoints[2].y + c2 * allPoints[3].y + c3 * allPoints[4].y
      });
    }

    return result;
  }

  // For 4+ points, use cubic Bezier segments through consecutive points
  // This avoids the division-by-zero issues with Catmull-Rom endpoint duplication
  const result: Point[] = [];

  // Generate smooth curve through all points using cubic Bezier segments
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Calculate control points for cubic Bezier that passes through p1 and p2
    // Using Catmull-Rom to Bezier conversion with tension factor
    const t = tension;
    const c1x = p1.x + (p2.x - p0.x) / 6 * (1 - t);
    const c1y = p1.y + (p2.y - p0.y) / 6 * (1 - t);
    const c2x = p2.x - (p3.x - p1.x) / 6 * (1 - t);
    const c2y = p2.y - (p3.y - p1.y) / 6 * (1 - t);

    // Generate points along this cubic Bezier segment
    for (let j = 0; j <= numSegments; j++) {
      // Skip first point of subsequent segments to avoid duplicates
      if (i > 0 && j === 0) continue;

      const s = j / numSegments;
      const s2 = s * s;
      const s3 = s2 * s;
      const ms = 1 - s;
      const ms2 = ms * ms;
      const ms3 = ms2 * ms;

      // Cubic Bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tC1 + 3(1-t)t²C2 + t³P1
      const x = ms3 * p1.x + 3 * ms2 * s * c1x + 3 * ms * s2 * c2x + s3 * p2.x;
      const y = ms3 * p1.y + 3 * ms2 * s * c1y + 3 * ms * s2 * c2y + s3 * p2.y;

      result.push({ x, y });
    }
  }

  // Ensure we have the final endpoint
  if (result.length > 0) {
    const lastPoint = points[points.length - 1];
    const lastResult = result[result.length - 1];
    if (Math.abs(lastResult.x - lastPoint.x) > 0.01 || Math.abs(lastResult.y - lastPoint.y) > 0.01) {
      result.push(lastPoint);
    }
  }

  return result;
}

/**
 * Generates a smooth closed-loop Catmull-Rom spline through the given points
 * The curve connects the last point back to the first point
 *
 * @param points - Array of control points (minimum 3 points for a closed loop)
 * @param tension - Controls curve tightness, typically 0.0-1.0 (default 0.5)
 * @param numSegments - Number of interpolated segments between each pair of points (default 20)
 * @returns Array of points along the smooth closed curve
 */
export function catmullRomSplineClosedLoop(
  points: Point[],
  tension: number = 0.5,
  numSegments: number = 20
): Point[] {
  if (points.length < 3) {
    // For fewer than 3 points, just return the points as a closed polygon
    return [...points, points[0]];
  }

  const n = points.length;
  const result: Point[] = [];

  // For each segment in the closed loop
  for (let i = 0; i < n; i++) {
    // Get 4 points for this segment using modular indexing
    const p0 = points[(i - 1 + n) % n];  // Previous point (wraps around)
    const p1 = points[i];                 // Current point (segment start)
    const p2 = points[(i + 1) % n];       // Next point (segment end)
    const p3 = points[(i + 2) % n];       // Point after next (for tangent calculation)

    // Calculate control points for cubic Bezier that passes through p1 and p2
    const t = tension;
    const c1x = p1.x + (p2.x - p0.x) / 6 * (1 - t);
    const c1y = p1.y + (p2.y - p0.y) / 6 * (1 - t);
    const c2x = p2.x - (p3.x - p1.x) / 6 * (1 - t);
    const c2y = p2.y - (p3.y - p1.y) / 6 * (1 - t);

    // Generate points along this cubic Bezier segment
    for (let j = 0; j < numSegments; j++) {
      const s = j / numSegments;
      const s2 = s * s;
      const s3 = s2 * s;
      const ms = 1 - s;
      const ms2 = ms * ms;
      const ms3 = ms2 * ms;

      // Cubic Bezier formula
      const x = ms3 * p1.x + 3 * ms2 * s * c1x + 3 * ms * s2 * c2x + s3 * p2.x;
      const y = ms3 * p1.y + 3 * ms2 * s * c1y + 3 * ms * s2 * c2y + s3 * p2.y;

      result.push({ x, y });
    }
  }

  // Add the final point to close the loop exactly
  result.push({ x: points[0].x, y: points[0].y });

  return result;
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
