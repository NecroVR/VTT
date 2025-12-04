import type { Token } from './game';
import type { Scene } from './scene';
import type { Wall } from './wall';

export type WSMessageType =
  | 'ping' | 'pong'
  | 'game:join' | 'game:leave' | 'game:state' | 'game:players' | 'game:player-joined' | 'game:player-left'
  | 'token:move' | 'token:add' | 'token:added' | 'token:update' | 'token:updated' | 'token:remove' | 'token:removed'
  | 'scene:switch' | 'scene:switched' | 'scene:update' | 'scene:updated'
  | 'wall:add' | 'wall:added' | 'wall:update' | 'wall:updated' | 'wall:remove' | 'wall:removed'
  | 'dice:roll' | 'dice:result'
  | 'chat:message'
  | 'error';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

// Player info
export interface PlayerInfo {
  userId: string;
  username: string;
}

// Game room payloads
export interface GameJoinPayload {
  gameId: string;
  token: string;
}

export interface GameLeavePayload {
  gameId: string;
}

export interface GamePlayersPayload {
  players: PlayerInfo[];
}

export interface GamePlayerJoinedPayload {
  player: PlayerInfo;
}

export interface GamePlayerLeftPayload {
  userId: string;
}

// Token payloads
// Note: Token interface is defined in ./game.ts
export interface TokenMovePayload {
  tokenId: string;
  x: number;
  y: number;
}

export interface TokenAddPayload {
  sceneId: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  imageUrl?: string | null;
  visible?: boolean;
  data?: Record<string, unknown>;
  actorId?: string | null;
  elevation?: number;
  rotation?: number;
  locked?: boolean;
  vision?: boolean;
  visionRange?: number;
  bars?: Record<string, unknown>;
  lightBright?: number;
  lightDim?: number;
  lightColor?: string | null;
  lightAngle?: number;
}

export interface TokenAddedPayload {
  token: Token;
}

export interface TokenUpdatePayload {
  tokenId: string;
  updates: Partial<Omit<Token, 'id' | 'sceneId' | 'createdAt' | 'updatedAt'>>;
}

export interface TokenUpdatedPayload {
  token: Token;
}

export interface TokenRemovePayload {
  tokenId: string;
}

export interface TokenRemovedPayload {
  tokenId: string;
}

// Dice payloads
export interface DiceRollPayload {
  notation: string;
  label?: string;
}

export interface DiceResultPayload {
  notation: string;
  rolls: number[];
  total: number;
  label?: string;
  userId: string;
}

// Chat payloads
export interface ChatMessagePayload {
  text: string;
  userId: string;
  username: string;
}

// Scene payloads
export interface SceneSwitchPayload {
  sceneId: string;
}

export interface SceneSwitchedPayload {
  scene: Scene;
}

export interface SceneUpdatePayload {
  sceneId: string;
  updates: Partial<Omit<Scene, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>;
}

export interface SceneUpdatedPayload {
  scene: Scene;
}

// Wall payloads
export interface WallAddPayload {
  sceneId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wallType?: string;
  move?: string;
  sense?: string;
  sound?: string;
  door?: string;
  doorState?: string;
  data?: Record<string, unknown>;
}

export interface WallAddedPayload {
  wall: Wall;
}

export interface WallUpdatePayload {
  wallId: string;
  updates: Partial<Omit<Wall, 'id' | 'sceneId' | 'createdAt'>>;
}

export interface WallUpdatedPayload {
  wall: Wall;
}

export interface WallRemovePayload {
  wallId: string;
}

export interface WallRemovedPayload {
  wallId: string;
}

// Error payload
export interface ErrorPayload {
  message: string;
  code?: string;
}
