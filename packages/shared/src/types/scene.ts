export interface Scene {
  id: string;
  campaignId: string;
  name: string;
  active: boolean;
  // Background
  backgroundImage?: string | null;
  backgroundWidth?: number | null;
  backgroundHeight?: number | null;
  // Grid configuration
  gridType: string;
  gridSize: number;
  gridColor: string;
  gridAlpha: number;
  gridDistance: number;
  gridUnits: string;
  // Vision settings
  tokenVision: boolean;
  fogExploration: boolean;
  globalLight: boolean;
  darkness: number;
  // View settings
  initialX?: number | null;
  initialY?: number | null;
  initialScale: number;
  // Metadata
  navOrder: number;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSceneRequest {
  name: string;
  campaignId: string;
  active?: boolean;
  backgroundImage?: string | null;
  backgroundWidth?: number | null;
  backgroundHeight?: number | null;
  gridType?: string;
  gridSize?: number;
  gridColor?: string;
  gridAlpha?: number;
  gridDistance?: number;
  gridUnits?: string;
  tokenVision?: boolean;
  fogExploration?: boolean;
  globalLight?: boolean;
  darkness?: number;
  initialX?: number | null;
  initialY?: number | null;
  initialScale?: number;
  navOrder?: number;
  data?: Record<string, unknown>;
}

export interface UpdateSceneRequest {
  name?: string;
  active?: boolean;
  backgroundImage?: string | null;
  backgroundWidth?: number | null;
  backgroundHeight?: number | null;
  gridType?: string;
  gridSize?: number;
  gridColor?: string;
  gridAlpha?: number;
  gridDistance?: number;
  gridUnits?: string;
  tokenVision?: boolean;
  fogExploration?: boolean;
  globalLight?: boolean;
  darkness?: number;
  initialX?: number | null;
  initialY?: number | null;
  initialScale?: number;
  navOrder?: number;
  data?: Record<string, unknown>;
}

export interface SceneResponse {
  scene: Scene;
}

export interface ScenesListResponse {
  scenes: Scene[];
}
