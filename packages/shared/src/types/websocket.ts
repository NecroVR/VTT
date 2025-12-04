export type WSMessageType =
  | 'ping' | 'pong'
  | 'game:join' | 'game:leave' | 'game:state' | 'game:players' | 'game:player-joined' | 'game:player-left'
  | 'token:move' | 'token:add' | 'token:remove'
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
export interface TokenMovePayload {
  tokenId: string;
  x: number;
  y: number;
}

export interface TokenAddPayload {
  tokenId: string;
  x: number;
  y: number;
  imageUrl: string;
  label?: string;
}

export interface TokenRemovePayload {
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
