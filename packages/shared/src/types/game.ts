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
  gameId: string;
  name: string;
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ownerId?: string;
  visible: boolean;
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
