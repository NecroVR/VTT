// Individual path point entity
export interface PathPoint {
  id: string;
  sceneId: string;
  pathName: string;      // Case-sensitive path identifier
  pathIndex: number;     // Positive integer for ordering
  x: number;
  y: number;
  color: string;         // Path visualization color
  visible: boolean;      // GM-only visibility
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PathPointCreateInput {
  sceneId: string;
  pathName: string;
  pathIndex: number;
  x: number;
  y: number;
  color?: string;
  visible?: boolean;
  data?: Record<string, unknown>;
}

export interface PathPointUpdateInput {
  pathName?: string;
  pathIndex?: number;
  x?: number;
  y?: number;
  color?: string;
  visible?: boolean;
  data?: Record<string, unknown>;
}

// Assembled path (computed from points at runtime)
export interface AssembledPath {
  pathName: string;
  sceneId: string;
  points: Array<{ id: string; x: number; y: number; pathIndex: number }>;
  color: string;         // From first point
  visible: boolean;      // From first point
}

// Response types
export interface PathPointResponse {
  pathPoint: PathPoint;
}

export interface PathPointsListResponse {
  pathPoints: PathPoint[];
}

export interface AssembledPathsResponse {
  paths: AssembledPath[];
}
