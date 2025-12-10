export interface Wall {
  id: string;
  sceneId: string;
  // Coordinates (line from point A to B)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // Wall shape and curve control
  wallShape: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  // Wall properties
  wallType: string;
  move: string;
  sense: string;
  sound: string;
  // Door properties
  door: string;
  doorState: string;
  // Grid snapping
  snapToGrid?: boolean;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateWallRequest {
  sceneId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  wallType?: string;
  move?: string;
  sense?: string;
  sound?: string;
  door?: string;
  doorState?: string;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateWallRequest {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  wallType?: string;
  move?: string;
  sense?: string;
  sound?: string;
  door?: string;
  doorState?: string;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface WallResponse {
  wall: Wall;
}

export interface WallsListResponse {
  walls: Wall[];
}
