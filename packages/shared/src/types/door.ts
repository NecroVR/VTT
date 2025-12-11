export interface Door {
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
  // Door-specific properties
  status: 'open' | 'closed' | 'broken';
  isLocked: boolean;
  // Grid snapping
  snapToGrid?: boolean;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
}

export type DoorStatus = 'open' | 'closed' | 'broken';

export interface CreateDoorRequest {
  sceneId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  status?: 'open' | 'closed' | 'broken';
  isLocked?: boolean;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateDoorRequest {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  status?: 'open' | 'closed' | 'broken';
  isLocked?: boolean;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface DoorResponse {
  door: Door;
}

export interface DoorsListResponse {
  doors: Door[];
}
