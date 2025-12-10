import { describe, it, expect } from 'vitest';
import {
  pointInRect,
  circleIntersectsRect,
  lineSegmentsIntersect,
  lineIntersectsRect,
} from './geometry';

describe('pointInRect', () => {
  it('should return true when point is inside rectangle', () => {
    expect(pointInRect(50, 50, 0, 0, 100, 100)).toBe(true);
    expect(pointInRect(1, 1, 0, 0, 100, 100)).toBe(true);
    expect(pointInRect(99, 99, 0, 0, 100, 100)).toBe(true);
  });

  it('should return true when point is on rectangle boundary', () => {
    expect(pointInRect(0, 0, 0, 0, 100, 100)).toBe(true); // top-left corner
    expect(pointInRect(100, 0, 0, 0, 100, 100)).toBe(true); // top-right corner
    expect(pointInRect(0, 100, 0, 0, 100, 100)).toBe(true); // bottom-left corner
    expect(pointInRect(100, 100, 0, 0, 100, 100)).toBe(true); // bottom-right corner
    expect(pointInRect(50, 0, 0, 0, 100, 100)).toBe(true); // top edge
    expect(pointInRect(100, 50, 0, 0, 100, 100)).toBe(true); // right edge
    expect(pointInRect(50, 100, 0, 0, 100, 100)).toBe(true); // bottom edge
    expect(pointInRect(0, 50, 0, 0, 100, 100)).toBe(true); // left edge
  });

  it('should return false when point is outside rectangle', () => {
    expect(pointInRect(-1, 50, 0, 0, 100, 100)).toBe(false); // left of rect
    expect(pointInRect(101, 50, 0, 0, 100, 100)).toBe(false); // right of rect
    expect(pointInRect(50, -1, 0, 0, 100, 100)).toBe(false); // above rect
    expect(pointInRect(50, 101, 0, 0, 100, 100)).toBe(false); // below rect
    expect(pointInRect(-10, -10, 0, 0, 100, 100)).toBe(false); // top-left outside
    expect(pointInRect(110, 110, 0, 0, 100, 100)).toBe(false); // bottom-right outside
  });

  it('should work with negative coordinates', () => {
    expect(pointInRect(-50, -50, -100, -100, 200, 200)).toBe(true);
    expect(pointInRect(-150, -50, -100, -100, 200, 200)).toBe(false);
  });

  it('should work with zero-size rectangle', () => {
    expect(pointInRect(10, 10, 10, 10, 0, 0)).toBe(true);
    expect(pointInRect(11, 10, 10, 10, 0, 0)).toBe(false);
  });
});

describe('circleIntersectsRect', () => {
  describe('circle fully inside rectangle', () => {
    it('should return true when small circle is centered in rectangle', () => {
      expect(circleIntersectsRect(50, 50, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle touches rectangle from inside', () => {
      expect(circleIntersectsRect(50, 50, 50, 0, 0, 100, 100)).toBe(true);
    });
  });

  describe('circle fully outside rectangle', () => {
    it('should return false when circle is far to the left', () => {
      expect(circleIntersectsRect(-50, 50, 10, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when circle is far to the right', () => {
      expect(circleIntersectsRect(150, 50, 10, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when circle is far above', () => {
      expect(circleIntersectsRect(50, -50, 10, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when circle is far below', () => {
      expect(circleIntersectsRect(50, 150, 10, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when circle is in diagonal corner area', () => {
      expect(circleIntersectsRect(-20, -20, 10, 0, 0, 100, 100)).toBe(false);
      expect(circleIntersectsRect(120, -20, 10, 0, 0, 100, 100)).toBe(false);
      expect(circleIntersectsRect(-20, 120, 10, 0, 0, 100, 100)).toBe(false);
      expect(circleIntersectsRect(120, 120, 10, 0, 0, 100, 100)).toBe(false);
    });
  });

  describe('circle partially overlapping rectangle edges', () => {
    it('should return true when circle overlaps left edge', () => {
      expect(circleIntersectsRect(-5, 50, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle overlaps right edge', () => {
      expect(circleIntersectsRect(105, 50, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle overlaps top edge', () => {
      expect(circleIntersectsRect(50, -5, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle overlaps bottom edge', () => {
      expect(circleIntersectsRect(50, 105, 10, 0, 0, 100, 100)).toBe(true);
    });
  });

  describe('circle at rectangle corners', () => {
    it('should return true when circle overlaps top-left corner', () => {
      expect(circleIntersectsRect(-5, -5, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle overlaps top-right corner', () => {
      expect(circleIntersectsRect(105, -5, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle overlaps bottom-left corner', () => {
      expect(circleIntersectsRect(-5, 105, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle overlaps bottom-right corner', () => {
      expect(circleIntersectsRect(105, 105, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should return false when circle is just beyond corner distance', () => {
      // Circle at distance > radius from corner
      const dist = Math.sqrt(2 * 15 * 15); // ~21.2 pixels diagonal
      expect(circleIntersectsRect(-dist, -dist, 10, 0, 0, 100, 100)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return true for zero-radius circle at rectangle corner', () => {
      expect(circleIntersectsRect(0, 0, 0, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when circle exactly touches rectangle edge', () => {
      // Circle center is radius distance from edge
      expect(circleIntersectsRect(-10, 50, 10, 0, 0, 100, 100)).toBe(true);
    });

    it('should work with negative rectangle coordinates', () => {
      expect(circleIntersectsRect(-50, -50, 10, -100, -100, 200, 200)).toBe(true);
      expect(circleIntersectsRect(-150, -50, 10, -100, -100, 200, 200)).toBe(false);
    });
  });
});

describe('lineSegmentsIntersect', () => {
  describe('crossing lines', () => {
    it('should return true when lines cross in the middle', () => {
      // Horizontal and vertical lines crossing
      expect(lineSegmentsIntersect(0, 50, 100, 50, 50, 0, 50, 100)).toBe(true);
    });

    it('should return true when diagonal lines cross', () => {
      expect(lineSegmentsIntersect(0, 0, 100, 100, 0, 100, 100, 0)).toBe(true);
    });

    it('should return true when lines cross at non-center point', () => {
      expect(lineSegmentsIntersect(0, 25, 100, 25, 25, 0, 25, 100)).toBe(true);
    });
  });

  describe('parallel lines', () => {
    it('should return false for parallel horizontal lines', () => {
      expect(lineSegmentsIntersect(0, 0, 100, 0, 0, 10, 100, 10)).toBe(false);
    });

    it('should return false for parallel vertical lines', () => {
      expect(lineSegmentsIntersect(0, 0, 0, 100, 10, 0, 10, 100)).toBe(false);
    });

    it('should return false for parallel diagonal lines', () => {
      expect(lineSegmentsIntersect(0, 0, 100, 100, 10, 0, 110, 100)).toBe(false);
    });
  });

  describe('collinear lines', () => {
    it('should return false for collinear non-overlapping horizontal lines', () => {
      expect(lineSegmentsIntersect(0, 0, 50, 0, 60, 0, 100, 0)).toBe(false);
    });

    it('should return false for collinear non-overlapping vertical lines', () => {
      expect(lineSegmentsIntersect(0, 0, 0, 50, 0, 60, 0, 100)).toBe(false);
    });

    // Note: The current implementation treats collinear overlapping lines as parallel (returns false)
    // This is acceptable for the selection box use case
  });

  describe('T-intersection and endpoint touching', () => {
    it('should return true when lines form a T-intersection', () => {
      expect(lineSegmentsIntersect(0, 50, 100, 50, 50, 50, 50, 100)).toBe(true);
    });

    it('should return true when endpoint of one line touches middle of another', () => {
      expect(lineSegmentsIntersect(0, 0, 100, 0, 50, 0, 50, 50)).toBe(true);
    });

    it('should return true when endpoints touch', () => {
      expect(lineSegmentsIntersect(0, 0, 50, 50, 50, 50, 100, 0)).toBe(true);
    });
  });

  describe('non-intersecting lines', () => {
    it('should return false when lines are close but do not intersect', () => {
      expect(lineSegmentsIntersect(0, 0, 50, 0, 60, 10, 100, 10)).toBe(false);
    });

    it('should return false when line projections intersect but segments do not', () => {
      // Lines would intersect if extended, but segments do not
      expect(lineSegmentsIntersect(0, 0, 10, 10, 20, 0, 30, 10)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-length line segments', () => {
      expect(lineSegmentsIntersect(50, 50, 50, 50, 0, 0, 100, 100)).toBe(false);
    });

    it('should work with negative coordinates', () => {
      expect(lineSegmentsIntersect(-100, -100, 0, 0, -100, 0, 0, -100)).toBe(true);
    });
  });
});

describe('lineIntersectsRect', () => {
  describe('line fully inside rectangle', () => {
    it('should return true when both endpoints are inside', () => {
      expect(lineIntersectsRect(20, 20, 80, 80, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when line is small and centered', () => {
      expect(lineIntersectsRect(45, 45, 55, 55, 0, 0, 100, 100)).toBe(true);
    });
  });

  describe('line fully outside rectangle', () => {
    it('should return false when line is to the left', () => {
      expect(lineIntersectsRect(-50, 0, -50, 100, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when line is to the right', () => {
      expect(lineIntersectsRect(150, 0, 150, 100, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when line is above', () => {
      expect(lineIntersectsRect(0, -50, 100, -50, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when line is below', () => {
      expect(lineIntersectsRect(0, 150, 100, 150, 0, 0, 100, 100)).toBe(false);
    });

    it('should return false when line is in corner area without touching', () => {
      expect(lineIntersectsRect(-50, -50, -30, -30, 0, 0, 100, 100)).toBe(false);
    });
  });

  describe('line crossing through rectangle', () => {
    it('should return true when horizontal line crosses through', () => {
      expect(lineIntersectsRect(-50, 50, 150, 50, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when vertical line crosses through', () => {
      expect(lineIntersectsRect(50, -50, 50, 150, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when diagonal line crosses through', () => {
      expect(lineIntersectsRect(-50, -50, 150, 150, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when diagonal line enters and exits different edges', () => {
      expect(lineIntersectsRect(-50, 50, 150, 50, 0, 0, 100, 100)).toBe(true);
    });
  });

  describe('line touching rectangle edge', () => {
    it('should return true when one endpoint is on edge', () => {
      expect(lineIntersectsRect(0, 50, -50, 50, 0, 0, 100, 100)).toBe(true);
      expect(lineIntersectsRect(100, 50, 150, 50, 0, 0, 100, 100)).toBe(true);
      expect(lineIntersectsRect(50, 0, 50, -50, 0, 0, 100, 100)).toBe(true);
      expect(lineIntersectsRect(50, 100, 50, 150, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true when line intersects a corner', () => {
      expect(lineIntersectsRect(-50, 0, 50, 100, 0, 0, 100, 100)).toBe(true); // through top-left
      expect(lineIntersectsRect(50, 0, 150, 100, 0, 0, 100, 100)).toBe(true); // through top-right
    });

    it('should return true when line intersects single edge', () => {
      expect(lineIntersectsRect(-50, 50, 50, 0, 0, 0, 100, 100)).toBe(true); // left edge
      expect(lineIntersectsRect(150, 50, 50, 0, 0, 0, 100, 100)).toBe(true); // right edge
      expect(lineIntersectsRect(50, -50, 0, 50, 0, 0, 100, 100)).toBe(true); // top edge
      expect(lineIntersectsRect(50, 150, 0, 50, 0, 0, 100, 100)).toBe(true); // bottom edge
    });
  });

  describe('diagonal lines', () => {
    it('should return true for diagonal line from outside to inside', () => {
      expect(lineIntersectsRect(-50, -50, 50, 50, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true for diagonal line from inside to outside', () => {
      expect(lineIntersectsRect(50, 50, 150, 150, 0, 0, 100, 100)).toBe(true);
    });

    it('should return true for diagonal line crossing two opposite corners', () => {
      expect(lineIntersectsRect(-50, -50, 150, 150, 0, 0, 100, 100)).toBe(true);
      expect(lineIntersectsRect(150, -50, -50, 150, 0, 0, 100, 100)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-length line (point)', () => {
      expect(lineIntersectsRect(50, 50, 50, 50, 0, 0, 100, 100)).toBe(true); // inside
      expect(lineIntersectsRect(150, 150, 150, 150, 0, 0, 100, 100)).toBe(false); // outside
    });

    it('should work with negative rectangle coordinates', () => {
      expect(lineIntersectsRect(-150, -50, 50, -50, -100, -100, 200, 200)).toBe(true);
      expect(lineIntersectsRect(-150, -150, -120, -120, -100, -100, 200, 200)).toBe(false);
    });

    it('should handle line parallel to rectangle edge but outside', () => {
      expect(lineIntersectsRect(-10, 50, -10, 80, 0, 0, 100, 100)).toBe(false);
      expect(lineIntersectsRect(110, 50, 110, 80, 0, 0, 100, 100)).toBe(false);
    });

    it('should handle very small rectangles', () => {
      expect(lineIntersectsRect(-10, 5, 20, 5, 0, 0, 10, 10)).toBe(true);
      expect(lineIntersectsRect(5, -10, 5, 20, 0, 0, 10, 10)).toBe(true);
    });
  });
});
