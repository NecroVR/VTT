import type { Token } from './game';
import type { Scene } from './scene';
import type { Wall } from './wall';

export type WSMessageType =
  | 'ping' | 'pong'
  | 'game:join' | 'game:leave' | 'game:state' | 'game:players' | 'game:player-joined' | 'game:player-left'
  | 'token:move' | 'token:add' | 'token:added' | 'token:update' | 'token:updated' | 'token:remove' | 'token:removed'
  | 'scene:switch' | 'scene:switched' | 'scene:update' | 'scene:updated'
  | 'wall:add' | 'wall:added' | 'wall:update' | 'wall:updated' | 'wall:remove' | 'wall:removed'
  | 'actor:create' | 'actor:created' | 'actor:update' | 'actor:updated' | 'actor:delete' | 'actor:deleted'
  | 'combat:start' | 'combat:started' | 'combat:end' | 'combat:ended' | 'combat:update' | 'combat:updated'
  | 'combatant:add' | 'combatant:added' | 'combatant:update' | 'combatant:updated' | 'combatant:remove' | 'combatant:removed'
  | 'combat:next-turn' | 'combat:turn-changed'
  | 'dice:roll' | 'dice:result'
  | 'chat:message' | 'chat:delete' | 'chat:deleted' | 'chat:whisper'
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

export interface DiceRollGroup {
  /** Dice notation for this group (e.g., "2d6", "1d20kh1") */
  dice: string;
  /** Individual die results */
  results: number[];
  /** Indices of kept dice (if keep/drop applied) */
  kept?: number[];
  /** This group's contribution to total */
  subtotal: number;
}

export interface DiceResultPayload {
  /** Original notation string */
  notation: string;
  /** Individual dice roll groups */
  rolls: DiceRollGroup[];
  /** Sum of all modifiers */
  modifiers: number;
  /** Final total (rolls + modifiers) */
  total: number;
  /** Human-readable breakdown */
  breakdown: string;
  /** Optional label for the roll */
  label?: string;
  /** User who rolled */
  userId: string;
  /** Username who rolled */
  username: string;
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

// Actor payloads
export interface ActorCreatePayload {
  gameId: string;
  name: string;
  actorType: string;
  img?: string | null;
  ownerId?: string | null;
  attributes?: Record<string, unknown>;
  abilities?: Record<string, unknown>;
  folderId?: string | null;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface ActorCreatedPayload {
  actor: {
    id: string;
    gameId: string;
    name: string;
    actorType: string;
    img?: string | null;
    ownerId?: string | null;
    attributes: Record<string, unknown>;
    abilities: Record<string, unknown>;
    folderId?: string | null;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ActorUpdatePayload {
  actorId: string;
  updates: {
    name?: string;
    actorType?: string;
    img?: string | null;
    ownerId?: string | null;
    attributes?: Record<string, unknown>;
    abilities?: Record<string, unknown>;
    folderId?: string | null;
    sort?: number;
    data?: Record<string, unknown>;
  };
}

export interface ActorUpdatedPayload {
  actor: {
    id: string;
    gameId: string;
    name: string;
    actorType: string;
    img?: string | null;
    ownerId?: string | null;
    attributes: Record<string, unknown>;
    abilities: Record<string, unknown>;
    folderId?: string | null;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ActorDeletePayload {
  actorId: string;
}

export interface ActorDeletedPayload {
  actorId: string;
}

// Combat payloads
export interface CombatStartPayload {
  gameId: string;
  sceneId?: string | null;
  combatants?: Array<{
    actorId?: string | null;
    tokenId?: string | null;
    initiative?: number | null;
    initiativeModifier?: number;
    hidden?: boolean;
    defeated?: boolean;
    data?: Record<string, unknown>;
  }>;
}

export interface CombatStartedPayload {
  combat: {
    id: string;
    sceneId?: string | null;
    gameId: string;
    active: boolean;
    round: number;
    turn: number;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
  combatants: Array<{
    id: string;
    combatId: string;
    actorId?: string | null;
    tokenId?: string | null;
    initiative?: number | null;
    initiativeModifier: number;
    hidden: boolean;
    defeated: boolean;
    data: Record<string, unknown>;
    createdAt: Date;
  }>;
}

export interface CombatEndPayload {
  combatId: string;
}

export interface CombatEndedPayload {
  combatId: string;
}

export interface CombatUpdatePayload {
  combatId: string;
  updates: {
    sceneId?: string | null;
    active?: boolean;
    round?: number;
    turn?: number;
    sort?: number;
    data?: Record<string, unknown>;
  };
}

export interface CombatUpdatedPayload {
  combat: {
    id: string;
    sceneId?: string | null;
    gameId: string;
    active: boolean;
    round: number;
    turn: number;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CombatantAddPayload {
  combatId: string;
  actorId?: string | null;
  tokenId?: string | null;
  initiative?: number | null;
  initiativeModifier?: number;
  hidden?: boolean;
  defeated?: boolean;
  data?: Record<string, unknown>;
}

export interface CombatantAddedPayload {
  combatant: {
    id: string;
    combatId: string;
    actorId?: string | null;
    tokenId?: string | null;
    initiative?: number | null;
    initiativeModifier: number;
    hidden: boolean;
    defeated: boolean;
    data: Record<string, unknown>;
    createdAt: Date;
  };
}

export interface CombatantUpdatePayload {
  combatantId: string;
  updates: {
    actorId?: string | null;
    tokenId?: string | null;
    initiative?: number | null;
    initiativeModifier?: number;
    hidden?: boolean;
    defeated?: boolean;
    data?: Record<string, unknown>;
  };
}

export interface CombatantUpdatedPayload {
  combatant: {
    id: string;
    combatId: string;
    actorId?: string | null;
    tokenId?: string | null;
    initiative?: number | null;
    initiativeModifier: number;
    hidden: boolean;
    defeated: boolean;
    data: Record<string, unknown>;
    createdAt: Date;
  };
}

export interface CombatantRemovePayload {
  combatantId: string;
}

export interface CombatantRemovedPayload {
  combatantId: string;
}

export interface CombatNextTurnPayload {
  combatId: string;
}

export interface CombatTurnChangedPayload {
  combat: {
    id: string;
    sceneId?: string | null;
    gameId: string;
    active: boolean;
    round: number;
    turn: number;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
  currentCombatantId?: string | null;
}

// Chat payloads (extended)
export interface ChatDeletePayload {
  messageId: string;
}

export interface ChatDeletedPayload {
  messageId: string;
}

export interface ChatWhisperPayload {
  text: string;
  targetUserIds: string[];
  userId: string;
  username: string;
}

export interface ChatWhisperMessage {
  text: string;
  userId: string;
  username: string;
  targetUserIds: string[];
}
