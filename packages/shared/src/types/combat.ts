export interface Combat {
  id: string;
  sceneId?: string | null;
  campaignId: string;
  active: boolean;
  round: number;
  turn: number;
  sort: number;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Combatant {
  id: string;
  combatId: string;
  actorId?: string | null;
  tokenId?: string | null;
  // Initiative
  initiative?: number | null;
  initiativeModifier: number;
  // State
  hidden: boolean;
  defeated: boolean;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateCombatRequest {
  campaignId: string;
  sceneId?: string | null;
  active?: boolean;
  round?: number;
  turn?: number;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface UpdateCombatRequest {
  sceneId?: string | null;
  active?: boolean;
  round?: number;
  turn?: number;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface CreateCombatantRequest {
  combatId: string;
  actorId?: string | null;
  tokenId?: string | null;
  initiative?: number | null;
  initiativeModifier?: number;
  hidden?: boolean;
  defeated?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateCombatantRequest {
  actorId?: string | null;
  tokenId?: string | null;
  initiative?: number | null;
  initiativeModifier?: number;
  hidden?: boolean;
  defeated?: boolean;
  data?: Record<string, unknown>;
}

export interface CombatResponse {
  combat: Combat;
}

export interface CombatsListResponse {
  combats: Combat[];
}

export interface CombatantResponse {
  combatant: Combatant;
}

export interface CombatantsListResponse {
  combatants: Combatant[];
}
