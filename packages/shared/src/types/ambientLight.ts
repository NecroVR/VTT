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
  animationReverse: boolean;
  // Settings
  walls: boolean;
  vision: boolean;
  snapToGrid: boolean;
  // Foundry-aligned fields
  negative: boolean;
  priority: number;
  luminosity: number;
  saturation: number;
  contrast: number;
  shadows: number;
  attenuation: number;
  coloration: number;
  darknessMin: number;
  darknessMax: number;
  hidden: boolean;
  elevation: number;
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
  animationReverse?: boolean;
  walls?: boolean;
  vision?: boolean;
  snapToGrid?: boolean;
  negative?: boolean;
  priority?: number;
  luminosity?: number;
  saturation?: number;
  contrast?: number;
  shadows?: number;
  attenuation?: number;
  coloration?: number;
  darknessMin?: number;
  darknessMax?: number;
  hidden?: boolean;
  elevation?: number;
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
  animationReverse?: boolean;
  walls?: boolean;
  vision?: boolean;
  snapToGrid?: boolean;
  negative?: boolean;
  priority?: number;
  luminosity?: number;
  saturation?: number;
  contrast?: number;
  shadows?: number;
  attenuation?: number;
  coloration?: number;
  darknessMin?: number;
  darknessMax?: number;
  hidden?: boolean;
  elevation?: number;
  data?: Record<string, unknown>;
}

export interface AmbientLightResponse {
  ambientLight: AmbientLight;
}

export interface AmbientLightsListResponse {
  ambientLights: AmbientLight[];
}
