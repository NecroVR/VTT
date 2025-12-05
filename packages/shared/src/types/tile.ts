export interface Tile {
  id: string;
  sceneId: string;
  img: string;
  // Position and transform
  x: number;
  y: number;
  z: number; // negative = background, positive = foreground
  width: number;
  height: number;
  rotation: number;
  // Visual properties
  tint?: string | null;
  alpha: number;
  // State
  hidden: boolean;
  locked: boolean;
  // Special tile types
  overhead: boolean;
  roof: boolean; // auto-hide when token underneath
  // Occlusion settings
  occlusion?: Record<string, unknown> | null;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTileRequest {
  img: string;
  x?: number;
  y?: number;
  z?: number;
  width: number;
  height: number;
  rotation?: number;
  tint?: string;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  overhead?: boolean;
  roof?: boolean;
  occlusion?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface UpdateTileRequest {
  img?: string;
  x?: number;
  y?: number;
  z?: number;
  width?: number;
  height?: number;
  rotation?: number;
  tint?: string;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  overhead?: boolean;
  roof?: boolean;
  occlusion?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface TileResponse {
  tile: Tile;
}

export interface TilesListResponse {
  tiles: Tile[];
}
