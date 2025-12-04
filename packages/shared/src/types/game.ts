export interface Game {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  settings: GameSettings;
}

export interface GameSettings {
  gridType: 'square' | 'hex' | 'none';
  gridSize: number;
  snapToGrid: boolean;
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
  gameId: string;
  name: string;
  type: 'background' | 'tokens' | 'gm' | 'effects';
  visible: boolean;
  order: number;
}

// Game CRUD API Types
export interface CreateGameRequest {
  name: string;
  settings?: Partial<GameSettings>;
}

export interface UpdateGameRequest {
  name?: string;
  settings?: Partial<GameSettings>;
}

export interface GameResponse {
  game: Game;
}

export interface GamesListResponse {
  games: Game[];
}
