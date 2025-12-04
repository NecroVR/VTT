export type WSMessageType =
  | 'ping' | 'pong'
  | 'game:join' | 'game:leave' | 'game:state'
  | 'token:move' | 'token:add' | 'token:remove'
  | 'dice:roll' | 'dice:result'
  | 'chat:message'
  | 'error';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

export interface TokenMovePayload {
  tokenId: string;
  x: number;
  y: number;
}

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
