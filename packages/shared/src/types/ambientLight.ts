export interface AmbientLight {
  id: string;
  sceneId: string;
  // Position
  x: number;
  y: number;
  rotation: number;
  // Light configuration
  bright: number;
  dim: number;
  angle: number;
  color: string;
  alpha: number;
  // Animation
  animationType?: string | null;
  animationSpeed: number;
  animationIntensity: number;
  // Settings
  walls: boolean;
  vision: boolean;
  snapToGrid: boolean;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateAmbientLightRequest {
  sceneId: string;
  x: number;
  y: number;
  rotation?: number;
  bright?: number;
  dim?: number;
  angle?: number;
  color?: string;
  alpha?: number;
  animationType?: string | null;
  animationSpeed?: number;
  animationIntensity?: number;
  walls?: boolean;
  vision?: boolean;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateAmbientLightRequest {
  x?: number;
  y?: number;
  rotation?: number;
  bright?: number;
  dim?: number;
  angle?: number;
  color?: string;
  alpha?: number;
  animationType?: string | null;
  animationSpeed?: number;
  animationIntensity?: number;
  walls?: boolean;
  vision?: boolean;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface AmbientLightResponse {
  ambientLight: AmbientLight;
}

export interface AmbientLightsListResponse {
  ambientLights: AmbientLight[];
}
