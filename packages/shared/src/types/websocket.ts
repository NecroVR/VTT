import type { Token } from './game';

export type WSMessageType =
  | 'ping' | 'pong'
  | 'game:join' | 'game:leave' | 'game:state' | 'game:players' | 'game:player-joined' | 'game:player-left'
  | 'token:move' | 'token:add' | 'token:added' | 'token:update' | 'token:updated' | 'token:remove' | 'token:removed'
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
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  imageUrl?: string | null;
  visible?: boolean;
  data?: Record<string, unknown>;
}

export interface TokenAddedPayload {
  token: Token;
}

export interface TokenUpdatePayload {
  tokenId: string;
  updates: Partial<Omit<Token, 'id' | 'gameId' | 'createdAt'>>;
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

// Error payload
export interface ErrorPayload {
  message: string;
  code?: string;
}
