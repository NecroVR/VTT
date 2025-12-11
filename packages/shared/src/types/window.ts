export interface Window {
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
  // Window light properties
  opacity: number;
  tint: string;
  tintIntensity: number;
  // Grid snapping
  snapToGrid?: boolean;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateWindowRequest {
  sceneId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  opacity?: number;
  tint?: string;
  tintIntensity?: number;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateWindowRequest {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  opacity?: number;
  tint?: string;
  tintIntensity?: number;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface WindowResponse {
  window: Window;
}

export interface WindowsListResponse {
  windows: Window[];
}
