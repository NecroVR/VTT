/** Configuration for sparkle animation type, stored in light.data */
export interface SparkleConfig {
  /** Array of hex colors to randomly pick from (defaults to [light.color]) */
  sparkleColors?: string[];
  /** Number of concurrent sparks (default: 10, range: 1-50) */
  sparkleCount?: number;
  /** Size of each spark in pixels (default: 3, range: 1-10) */
  sparkleSize?: number;
  /** How long each spark lives in milliseconds (default: 1000, range: 200-5000) */
  sparkleLifetime?: number;
  /** Whether sparks fade in/out or just appear/disappear (default: true) */
  sparkleFade?: boolean;
  /** Distribution pattern for spark positions */
  sparkleDistribution?: 'uniform' | 'center-weighted' | 'edge-weighted';
}

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
  /** Animation type: 'flicker' | 'pulse' | 'wave' | 'sparkle' | null */
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
  // Path following
  followPathName?: string | null;  // Path name to follow
  pathSpeed?: number | null;       // Speed in units per second
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
  followPathName?: string | null;
  pathSpeed?: number | null;
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
  followPathName?: string | null;
  pathSpeed?: number | null;
  data?: Record<string, unknown>;
}

export interface AmbientLightResponse {
  ambientLight: AmbientLight;
}

export interface AmbientLightsListResponse {
  ambientLights: AmbientLight[];
}
