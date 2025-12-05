export type TemplateType = 'circle' | 'cone' | 'ray' | 'rectangle';

export interface MeasurementTemplate {
  id: string;
  sceneId: string;
  templateType: TemplateType;
  // Position
  x: number;
  y: number;
  // Size and direction
  distance: number; // Size in grid units (radius for circle, length for ray/cone)
  direction?: number | null; // Rotation for cones/rays (degrees, 0 = right, 90 = down)
  angle?: number | null; // Width for cones (default 53 for standard D&D cone)
  width?: number | null; // For rays/rectangles
  // Appearance
  color: string;
  fillAlpha: number;
  borderColor?: string | null;
  // Ownership and visibility
  hidden: boolean;
  ownerId?: string | null;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateTemplateRequest {
  sceneId: string;
  templateType: TemplateType;
  x: number;
  y: number;
  distance: number;
  direction?: number | null;
  angle?: number | null;
  width?: number | null;
  color?: string;
  fillAlpha?: number;
  borderColor?: string | null;
  hidden?: boolean;
  ownerId?: string | null;
  data?: Record<string, unknown>;
}

export interface UpdateTemplateRequest {
  x?: number;
  y?: number;
  distance?: number;
  direction?: number | null;
  angle?: number | null;
  width?: number | null;
  color?: string;
  fillAlpha?: number;
  borderColor?: string | null;
  hidden?: boolean;
  data?: Record<string, unknown>;
}

// Ruler measurement (client-side only, not persisted)
export interface RulerMeasurement {
  userId: string;
  sceneId: string;
  waypoints: { x: number; y: number }[];
  color: string;
}
