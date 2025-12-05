export type RegionShape = 'rectangle' | 'circle' | 'ellipse' | 'polygon';
export type RegionTriggerType = 'enter' | 'exit' | 'click';
export type RegionTriggerAction = 'show_journal' | 'play_sound' | 'custom';

export interface RegionPoint {
  x: number;
  y: number;
}

export interface Region {
  id: string;
  sceneId: string;
  name: string;
  // Shape definition
  shape: RegionShape;
  x: number;
  y: number;
  // Shape dimensions (varies by shape type)
  width?: number | null;
  height?: number | null;
  radius?: number | null;
  points?: RegionPoint[] | null; // for polygon
  // Visual properties
  color: string;
  alpha: number;
  // State
  hidden: boolean; // GM-only visibility by default
  locked: boolean;
  // Trigger configuration
  triggerType?: string | null;
  triggerAction?: string | null;
  triggerData?: Record<string, unknown> | null;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRegionRequest {
  name: string;
  shape?: RegionShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: RegionPoint[];
  color?: string;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  triggerType?: string;
  triggerAction?: string;
  triggerData?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface UpdateRegionRequest {
  name?: string;
  shape?: RegionShape;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: RegionPoint[];
  color?: string;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  triggerType?: string;
  triggerAction?: string;
  triggerData?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface RegionResponse {
  region: Region;
}

export interface RegionsListResponse {
  regions: Region[];
}
