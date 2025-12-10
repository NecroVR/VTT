/**
 * Geometry utility functions for selection and intersection detection
 * Used by SceneCanvas for marquee selection and object picking
 */

/**
 * Check if a point is inside a rectangle
 * @param px - Point x coordinate
 * @param py - Point y coordinate
 * @param rx - Rectangle x coordinate (top-left)
 * @param ry - Rectangle y coordinate (top-left)
 * @param rw - Rectangle width
 * @param rh - Rectangle height
 * @returns true if point is inside rectangle
 */
export function pointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Check if a circle intersects with a rectangle
 * Used for token selection (tokens are circular)
 * @param cx - Circle center x coordinate
 * @param cy - Circle center y coordinate
 * @param r - Circle radius
 * @param rx - Rectangle x coordinate (top-left)
 * @param ry - Rectangle y coordinate (top-left)
 * @param rw - Rectangle width
 * @param rh - Rectangle height
 * @returns true if circle intersects rectangle
 */
export function circleIntersectsRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Check if two line segments intersect
 * @param x1 - First line segment start x
 * @param y1 - First line segment start y
 * @param x2 - First line segment end x
 * @param y2 - First line segment end y
 * @param x3 - Second line segment start x
 * @param y3 - Second line segment start y
 * @param x4 - Second line segment end x
 * @param y4 - Second line segment end y
 * @returns true if line segments intersect
 */
export function lineSegmentsIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return false; // parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Check if a line segment intersects with a rectangle
 * Used for wall selection
 * @param x1 - Line segment start x
 * @param y1 - Line segment start y
 * @param x2 - Line segment end x
 * @param y2 - Line segment end y
 * @param rx - Rectangle x coordinate (top-left)
 * @param ry - Rectangle y coordinate (top-left)
 * @param rw - Rectangle width
 * @param rh - Rectangle height
 * @returns true if line segment intersects rectangle
 */
export function lineIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Check if either endpoint is inside rectangle
  const p1Inside = pointInRect(x1, y1, rx, ry, rw, rh);
  const p2Inside = pointInRect(x2, y2, rx, ry, rw, rh);
  if (p1Inside || p2Inside) return true;

  // Check if line intersects any of the 4 rectangle edges
  const edges = [
    [rx, ry, rx + rw, ry], // top
    [rx + rw, ry, rx + rw, ry + rh], // right
    [rx, ry + rh, rx + rw, ry + rh], // bottom
    [rx, ry, rx, ry + rh], // left
  ];

  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (lineSegmentsIntersect(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) {
      return true;
    }
  }

  return false;
}
