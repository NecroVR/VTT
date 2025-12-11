import type { Token } from './campaign.js';
import type { Scene } from './scene.js';
import type { Wall } from './wall.js';
import type { Window } from './window.js';
import type { Door } from './door.js';
import type { AmbientLight } from './ambientLight.js';
import type { PathPoint, AssembledPath } from './path.js';
import type { ActiveEffect } from './activeEffect.js';
import type { MeasurementTemplate, RulerMeasurement } from './template.js';
import type { Drawing, DrawingPoint } from './drawing.js';
import type { Tile } from './tile.js';
import type { Region, RegionPoint } from './region.js';
import type { ScenePin } from './scenePin.js';

export type WSMessageType =
  | 'ping' | 'pong'
  | 'campaign:join' | 'campaign:leave' | 'campaign:state' | 'campaign:players' | 'campaign:player-joined' | 'campaign:player-left'
  | 'token:move' | 'token:add' | 'token:added' | 'token:update' | 'token:updated' | 'token:remove' | 'token:removed'
  | 'scene:switch' | 'scene:switched' | 'scene:update' | 'scene:updated'
  | 'wall:add' | 'wall:added' | 'wall:update' | 'wall:updated' | 'wall:remove' | 'wall:removed'
  | 'window:add' | 'window:added' | 'window:update' | 'window:updated' | 'window:remove' | 'window:removed'
  | 'door:add' | 'door:added' | 'door:update' | 'door:updated' | 'door:remove' | 'door:removed'
  | 'light:add' | 'light:added' | 'light:update' | 'light:updated' | 'light:remove' | 'light:removed'
  | 'path:add' | 'path:added' | 'path:update' | 'path:updated' | 'path:remove' | 'path:removed'
  | 'pathPoint:add' | 'pathPoint:added' | 'pathPoint:update' | 'pathPoint:updated' | 'pathPoint:remove' | 'pathPoint:removed'
  | 'actor:create' | 'actor:created' | 'actor:update' | 'actor:updated' | 'actor:delete' | 'actor:deleted'
  | 'combat:start' | 'combat:started' | 'combat:end' | 'combat:ended' | 'combat:update' | 'combat:updated'
  | 'combatant:add' | 'combatant:added' | 'combatant:update' | 'combatant:updated' | 'combatant:remove' | 'combatant:removed'
  | 'combat:next-turn' | 'combat:turn-changed'
  | 'effect:add' | 'effect:added' | 'effect:update' | 'effect:updated' | 'effect:remove' | 'effect:removed' | 'effect:toggle' | 'effect:toggled' | 'effects:expired'
  | 'dice:roll' | 'dice:result'
  | 'chat:message' | 'chat:delete' | 'chat:deleted' | 'chat:whisper'
  | 'journal:create' | 'journal:created' | 'journal:update' | 'journal:updated' | 'journal:delete' | 'journal:deleted' | 'journal:show' | 'journal:shown'
  | 'page:create' | 'page:created' | 'page:update' | 'page:updated' | 'page:delete' | 'page:deleted'
  | 'folder:create' | 'folder:created' | 'folder:update' | 'folder:updated' | 'folder:delete' | 'folder:deleted'
  | 'measure:start' | 'measure:started' | 'measure:update' | 'measure:updated' | 'measure:end' | 'measure:ended'
  | 'template:place' | 'template:placed' | 'template:update' | 'template:updated' | 'template:remove' | 'template:removed'
  | 'drawing:create' | 'drawing:created' | 'drawing:update' | 'drawing:updated' | 'drawing:delete' | 'drawing:deleted' | 'drawing:stream' | 'drawing:streamed'
  | 'tile:add' | 'tile:added' | 'tile:update' | 'tile:updated' | 'tile:remove' | 'tile:removed'
  | 'region:add' | 'region:added' | 'region:update' | 'region:updated' | 'region:remove' | 'region:removed' | 'region:enter' | 'region:exit'
  | 'pin:add' | 'pin:added' | 'pin:update' | 'pin:updated' | 'pin:remove' | 'pin:removed' | 'pin:click' | 'pin:opened'
  | 'compendium:create' | 'compendium:created' | 'compendium:update' | 'compendium:updated' | 'compendium:delete' | 'compendium:deleted'
  | 'compendium:entry-create' | 'compendium:entry-created' | 'compendium:entry-update' | 'compendium:entry-updated' | 'compendium:entry-delete' | 'compendium:entry-deleted'
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

// Campaign room payloads
export interface CampaignJoinPayload {
  campaignId: string;
  token: string;
}

export interface CampaignLeavePayload {
  campaignId: string;
}

export interface CampaignPlayersPayload {
  players: PlayerInfo[];
}

export interface CampaignPlayerJoinedPayload {
  player: PlayerInfo;
}

export interface CampaignPlayerLeftPayload {
  userId: string;
}

// Token payloads
// Note: Token interface is defined in ./campaign.ts
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
  updates: Partial<Omit<Scene, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>>;
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
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
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

// Window payloads
export interface WindowAddPayload {
  sceneId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface WindowAddedPayload {
  window: Window;
}

export interface WindowUpdatePayload {
  windowId: string;
  updates: Partial<Omit<Window, 'id' | 'sceneId' | 'createdAt'>>;
}

export interface WindowUpdatedPayload {
  window: Window;
}

export interface WindowRemovePayload {
  windowId: string;
}

export interface WindowRemovedPayload {
  windowId: string;
}

// Door payloads
export interface DoorAddPayload {
  sceneId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  wallShape?: 'straight' | 'curved';
  controlPoints?: Array<{ x: number; y: number }>;
  status?: 'open' | 'closed' | 'broken';
  isLocked?: boolean;
  snapToGrid?: boolean;
  data?: Record<string, unknown>;
}

export interface DoorAddedPayload {
  door: Door;
}

export interface DoorUpdatePayload {
  doorId: string;
  updates: Partial<Omit<Door, 'id' | 'sceneId' | 'createdAt'>>;
}

export interface DoorUpdatedPayload {
  door: Door;
}

export interface DoorRemovePayload {
  doorId: string;
}

export interface DoorRemovedPayload {
  doorId: string;
}

// Light payloads
export interface LightAddPayload {
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
  walls?: boolean;
  vision?: boolean;
  data?: Record<string, unknown>;
}

export interface LightAddedPayload {
  light: AmbientLight;
}

export interface LightUpdatePayload {
  lightId: string;
  updates: Partial<Omit<AmbientLight, 'id' | 'sceneId' | 'createdAt'>>;
}

export interface LightUpdatedPayload {
  light: AmbientLight;
}

export interface LightRemovePayload {
  lightId: string;
}

export interface LightRemovedPayload {
  lightId: string;
}

// Error payload
export interface ErrorPayload {
  message: string;
  code?: string;
}

// Actor payloads
export interface ActorCreatePayload {
  campaignId: string;
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
    campaignId: string;
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
    campaignId: string;
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
  campaignId: string;
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
    campaignId: string;
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
    campaignId: string;
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
    campaignId: string;
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

// Active Effect payloads
export interface EffectAddPayload {
  campaignId: string;
  actorId?: string | null;
  tokenId?: string | null;
  name: string;
  icon?: string | null;
  description?: string | null;
  effectType?: string;
  durationType?: string;
  duration?: number | null;
  startRound?: number | null;
  startTurn?: number | null;
  remaining?: number | null;
  sourceActorId?: string | null;
  sourceItemId?: string | null;
  enabled?: boolean;
  hidden?: boolean;
  changes?: Array<{
    key: string;
    mode: string;
    value: number | string | boolean;
    priority: number;
  }>;
  priority?: number;
  transfer?: boolean;
  data?: Record<string, unknown>;
  sort?: number;
}

export interface EffectAddedPayload {
  effect: ActiveEffect;
}

export interface EffectUpdatePayload {
  effectId: string;
  updates: Partial<Omit<ActiveEffect, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>>;
}

export interface EffectUpdatedPayload {
  effect: ActiveEffect;
}

export interface EffectRemovePayload {
  effectId: string;
}

export interface EffectRemovedPayload {
  effectId: string;
}

export interface EffectTogglePayload {
  effectId: string;
  enabled: boolean;
}

export interface EffectToggledPayload {
  effect: ActiveEffect;
}

export interface EffectsExpiredPayload {
  effectIds: string[];
  actorId?: string | null;
  tokenId?: string | null;
}

// Journal payloads
export interface JournalCreatePayload {
  campaignId: string;
  name: string;
  img?: string | null;
  folderId?: string | null;
  permission?: string;
  ownerId?: string | null;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface JournalCreatedPayload {
  journal: {
    id: string;
    campaignId: string;
    name: string;
    img?: string | null;
    folderId?: string | null;
    permission: string;
    ownerId?: string | null;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface JournalUpdatePayload {
  journalId: string;
  updates: {
    name?: string;
    img?: string | null;
    folderId?: string | null;
    permission?: string;
    ownerId?: string | null;
    sort?: number;
    data?: Record<string, unknown>;
  };
}

export interface JournalUpdatedPayload {
  journal: {
    id: string;
    campaignId: string;
    name: string;
    img?: string | null;
    folderId?: string | null;
    permission: string;
    ownerId?: string | null;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface JournalDeletePayload {
  journalId: string;
}

export interface JournalDeletedPayload {
  journalId: string;
}

export interface JournalShowPayload {
  journalId: string;
  targetUserIds: string[];
}

export interface JournalShownPayload {
  journal: {
    id: string;
    campaignId: string;
    name: string;
    img?: string | null;
    folderId?: string | null;
    permission: string;
    ownerId?: string | null;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
  pages: Array<{
    id: string;
    journalId: string;
    name: string;
    pageType: string;
    content?: string | null;
    src?: string | null;
    sort: number;
    showInNavigation: boolean;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }>;
  targetUserIds: string[];
  shownByUserId: string;
}

// Journal Page payloads
export interface PageCreatePayload {
  journalId: string;
  name: string;
  pageType?: string;
  content?: string | null;
  src?: string | null;
  sort?: number;
  showInNavigation?: boolean;
  data?: Record<string, unknown>;
}

export interface PageCreatedPayload {
  page: {
    id: string;
    journalId: string;
    name: string;
    pageType: string;
    content?: string | null;
    src?: string | null;
    sort: number;
    showInNavigation: boolean;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface PageUpdatePayload {
  pageId: string;
  updates: {
    name?: string;
    pageType?: string;
    content?: string | null;
    src?: string | null;
    sort?: number;
    showInNavigation?: boolean;
    data?: Record<string, unknown>;
  };
}

export interface PageUpdatedPayload {
  page: {
    id: string;
    journalId: string;
    name: string;
    pageType: string;
    content?: string | null;
    src?: string | null;
    sort: number;
    showInNavigation: boolean;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface PageDeletePayload {
  pageId: string;
}

export interface PageDeletedPayload {
  pageId: string;
}

// Folder payloads
export interface FolderCreatePayload {
  campaignId: string;
  name: string;
  folderType: string;
  parentId?: string | null;
  color?: string | null;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface FolderCreatedPayload {
  folder: {
    id: string;
    campaignId: string;
    name: string;
    folderType: string;
    parentId?: string | null;
    color?: string | null;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
  };
}

export interface FolderUpdatePayload {
  folderId: string;
  updates: {
    name?: string;
    parentId?: string | null;
    color?: string | null;
    sort?: number;
    data?: Record<string, unknown>;
  };
}

export interface FolderUpdatedPayload {
  folder: {
    id: string;
    campaignId: string;
    name: string;
    folderType: string;
    parentId?: string | null;
    color?: string | null;
    sort: number;
    data: Record<string, unknown>;
    createdAt: Date;
  };
}

export interface FolderDeletePayload {
  folderId: string;
}

export interface FolderDeletedPayload {
  folderId: string;
}

// Measurement payloads (ruler - client-side only, not persisted)
export interface MeasureStartPayload {
  sceneId: string;
  x: number;
  y: number;
}

export interface MeasureStartedPayload {
  measurement: RulerMeasurement;
}

export interface MeasureUpdatePayload {
  x: number;
  y: number;
  addWaypoint?: boolean;
}

export interface MeasureUpdatedPayload {
  measurement: RulerMeasurement;
}

export interface MeasureEndPayload {
  // No payload needed
}

export interface MeasureEndedPayload {
  userId: string;
}

// Template payloads (persistent)
export interface TemplatePlacePayload {
  sceneId: string;
  templateType: 'circle' | 'cone' | 'ray' | 'rectangle';
  x: number;
  y: number;
  distance: number;
  direction?: number | null;
  angle?: number | null;
  width?: number | null;
  color?: string;
  fillAlpha?: number;
  borderColor?: string | null;
  hidden?: boolean;
  data?: Record<string, unknown>;
}

export interface TemplatePlacedPayload {
  template: MeasurementTemplate;
}

export interface TemplateUpdatePayload {
  templateId: string;
  updates: Partial<Omit<MeasurementTemplate, 'id' | 'sceneId' | 'createdAt'>>;
}

export interface TemplateUpdatedPayload {
  template: MeasurementTemplate;
}

export interface TemplateRemovePayload {
  templateId: string;
}

export interface TemplateRemovedPayload {
  templateId: string;
}

// Drawing payloads
export interface DrawingCreatePayload {
  sceneId: string;
  drawingType: 'freehand' | 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'text';
  x?: number;
  y?: number;
  z?: number;
  rotation?: number;
  points?: DrawingPoint[];
  width?: number;
  height?: number;
  radius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeAlpha?: number;
  fillColor?: string;
  fillAlpha?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  hidden?: boolean;
  locked?: boolean;
  data?: Record<string, unknown>;
}

export interface DrawingCreatedPayload {
  drawing: Drawing;
}

export interface DrawingUpdatePayload {
  drawingId: string;
  updates: Partial<Omit<Drawing, 'id' | 'sceneId' | 'authorId' | 'createdAt' | 'updatedAt'>>;
}

export interface DrawingUpdatedPayload {
  drawing: Drawing;
}

export interface DrawingDeletePayload {
  drawingId: string;
}

export interface DrawingDeletedPayload {
  drawingId: string;
}

export interface DrawingStreamPayload {
  drawingId: string;
  points: DrawingPoint[];
}

export interface DrawingStreamedPayload {
  drawingId: string;
  points: DrawingPoint[];
}

// Tile payloads
export interface TileAddPayload {
  sceneId: string;
  img: string;
  x?: number;
  y?: number;
  z?: number;
  width: number;
  height: number;
  rotation?: number;
  tint?: string;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  overhead?: boolean;
  roof?: boolean;
  occlusion?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface TileAddedPayload {
  tile: Tile;
}

export interface TileUpdatePayload {
  tileId: string;
  updates: Partial<Omit<Tile, 'id' | 'sceneId' | 'createdAt' | 'updatedAt'>>;
}

export interface TileUpdatedPayload {
  tile: Tile;
}

export interface TileRemovePayload {
  tileId: string;
}

export interface TileRemovedPayload {
  tileId: string;
}

// Region payloads
export interface RegionAddPayload {
  sceneId: string;
  name: string;
  shape?: 'rectangle' | 'circle' | 'ellipse' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: RegionPoint[];
  color?: string;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  triggerType?: string;
  triggerAction?: string;
  triggerData?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface RegionAddedPayload {
  region: Region;
}

export interface RegionUpdatePayload {
  regionId: string;
  updates: Partial<Omit<Region, 'id' | 'sceneId' | 'createdAt' | 'updatedAt'>>;
}

export interface RegionUpdatedPayload {
  region: Region;
}

export interface RegionRemovePayload {
  regionId: string;
}

export interface RegionRemovedPayload {
  regionId: string;
}

export interface RegionEnterPayload {
  regionId: string;
  tokenId: string;
}

export interface RegionExitPayload {
  regionId: string;
  tokenId: string;
}

// Scene Pin payloads
export interface PinAddPayload {
  sceneId: string;
  x: number;
  y: number;
  icon?: string;
  iconSize?: number;
  iconTint?: string;
  text?: string;
  fontSize?: number;
  textAnchor?: 'top' | 'bottom' | 'left' | 'right';
  textColor?: string;
  journalId?: string;
  pageId?: string;
  global?: boolean;
  data?: Record<string, unknown>;
}

export interface PinAddedPayload {
  pin: ScenePin;
}

export interface PinUpdatePayload {
  pinId: string;
  updates: Partial<Omit<ScenePin, 'id' | 'sceneId' | 'createdAt' | 'updatedAt'>>;
}

export interface PinUpdatedPayload {
  pin: ScenePin;
}

export interface PinRemovePayload {
  pinId: string;
}

export interface PinRemovedPayload {
  pinId: string;
}

export interface PinClickPayload {
  pinId: string;
}

export interface PinOpenedPayload {
  pinId: string;
  journalId?: string | null;
  pageId?: string | null;
}

// Path Point payloads
export interface PathPointAddPayload {
  sceneId: string;
  pathName: string;
  pathIndex: number;
  x: number;
  y: number;
  color?: string;
  visible?: boolean;
  data?: Record<string, unknown>;
}

export interface PathPointAddedPayload {
  pathPoint: PathPoint;
}

export interface PathPointUpdatePayload {
  pathPointId: string;
  updates: {
    pathName?: string;
    pathIndex?: number;
    x?: number;
    y?: number;
    color?: string;
    visible?: boolean;
    data?: Record<string, unknown>;
  };
}

export interface PathPointUpdatedPayload {
  pathPoint: PathPoint;
}

export interface PathPointRemovePayload {
  pathPointId: string;
}

export interface PathPointRemovedPayload {
  pathPointId: string;
}

// Bulk path operations (for backward compatibility and convenience)
export interface PathAddPayload {
  sceneId: string;
  pathName: string;
  points: Array<{ x: number; y: number }>;
  speed?: number;
  loop?: boolean;
  visible?: boolean;
  color?: string;
  assignedObjectId?: string;
  assignedObjectType?: 'token' | 'light';
}

export interface PathAddedPayload {
  assembledPath: AssembledPath;
}

export interface PathUpdatePayload {
  sceneId: string;
  pathName: string;
  points?: Array<{ x: number; y: number }>;
  speed?: number;
  loop?: boolean;
  assignedObjectId?: string | null;
  assignedObjectType?: 'token' | 'light' | null;
  visible?: boolean;
  color?: string;
}

export interface PathUpdatedPayload {
  assembledPath: AssembledPath;
}

export interface PathRemovePayload {
  sceneId: string;
  pathName: string;
}

export interface PathRemovedPayload {
  sceneId: string;
  pathName: string;
}
