export interface Campaign {
  id: string;
  name: string;
  ownerId: string;
  gmUserIds: string[];
  createdAt: Date;
  settings: CampaignSettings;
}

export interface CampaignSettings {
  gridType: 'square' | 'hex' | 'none';
  gridSize: number;
  snapToGrid: boolean;
  wallEndpointSnapRange?: number; // Pixel range for wall endpoint snapping (default: 4)
}

export interface Token {
  id: string;
  sceneId: string;
  actorId?: string | null;
  name: string;
  imageUrl?: string | null;
  // Position and orientation
  x: number;
  y: number;
  width: number;
  height: number;
  elevation: number;
  rotation: number;
  locked: boolean;
  // Ownership and visibility
  ownerId?: string | null;
  visible: boolean;
  // Vision
  vision: boolean;
  visionRange: number;
  // Bars (HP display, etc.)
  bars: Record<string, unknown>;
  // Light emission
  lightBright: number;
  lightDim: number;
  lightColor?: string | null;
  lightAngle: number;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTokenRequest {
  sceneId: string;
  actorId?: string | null;
  name: string;
  imageUrl?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  elevation?: number;
  rotation?: number;
  locked?: boolean;
  ownerId?: string | null;
  visible?: boolean;
  vision?: boolean;
  visionRange?: number;
  bars?: Record<string, unknown>;
  lightBright?: number;
  lightDim?: number;
  lightColor?: string | null;
  lightAngle?: number;
  data?: Record<string, unknown>;
}

export interface UpdateTokenRequest {
  sceneId?: string;
  actorId?: string | null;
  name?: string;
  imageUrl?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  elevation?: number;
  rotation?: number;
  locked?: boolean;
  ownerId?: string | null;
  visible?: boolean;
  vision?: boolean;
  visionRange?: number;
  bars?: Record<string, unknown>;
  lightBright?: number;
  lightDim?: number;
  lightColor?: string | null;
  lightAngle?: number;
  data?: Record<string, unknown>;
}

export interface TokenResponse {
  token: Token;
}

export interface TokensListResponse {
  tokens: Token[];
}

export interface MapLayer {
  id: string;
  campaignId: string;
  name: string;
  type: 'background' | 'tokens' | 'gm' | 'effects';
  visible: boolean;
  order: number;
}

// Campaign CRUD API Types
export interface CreateCampaignRequest {
  name: string;
  settings?: Partial<CampaignSettings>;
}

export interface UpdateCampaignRequest {
  name?: string;
  settings?: Partial<CampaignSettings>;
}

export interface CampaignResponse {
  campaign: Campaign;
}

export interface CampaignsListResponse {
  campaigns: Campaign[];
}

// GM Management API Types
export interface AddGMRequest {
  userId: string;
}

export interface RemoveGMRequest {
  userId: string;
}

export interface GMsListResponse {
  gmUserIds: string[];
}
