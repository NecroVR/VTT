// Effect type aliases
export type EffectType = 'buff' | 'debuff' | 'condition' | 'aura' | 'custom';
export type DurationType = 'rounds' | 'turns' | 'seconds' | 'permanent' | 'special';
export type ChangeMode = 'add' | 'multiply' | 'override' | 'upgrade' | 'downgrade';

// Effect change interface
export interface EffectChange {
  key: string;
  mode: ChangeMode;
  value: number | string | boolean;
  priority: number;
}

// Active Effect interface
export interface ActiveEffect {
  id: string;
  gameId: string;
  actorId?: string | null;
  tokenId?: string | null;
  name: string;
  icon?: string | null;
  description?: string | null;
  // Effect type and duration
  effectType: EffectType;
  durationType: DurationType;
  duration?: number | null;
  startRound?: number | null;
  startTurn?: number | null;
  remaining?: number | null;
  // Source tracking
  sourceActorId?: string | null;
  sourceItemId?: string | null;
  // Status and visibility
  enabled: boolean;
  hidden: boolean;
  // Effect data
  changes: EffectChange[];
  priority: number;
  transfer: boolean;
  // Metadata
  data: Record<string, unknown>;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create Active Effect Request
export interface CreateActiveEffectRequest {
  gameId: string;
  actorId?: string | null;
  tokenId?: string | null;
  name: string;
  icon?: string | null;
  description?: string | null;
  effectType?: EffectType;
  durationType?: DurationType;
  duration?: number | null;
  startRound?: number | null;
  startTurn?: number | null;
  remaining?: number | null;
  sourceActorId?: string | null;
  sourceItemId?: string | null;
  enabled?: boolean;
  hidden?: boolean;
  changes?: EffectChange[];
  priority?: number;
  transfer?: boolean;
  data?: Record<string, unknown>;
  sort?: number;
}

// Update Active Effect Request
export interface UpdateActiveEffectRequest {
  name?: string;
  icon?: string | null;
  description?: string | null;
  effectType?: EffectType;
  durationType?: DurationType;
  duration?: number | null;
  startRound?: number | null;
  startTurn?: number | null;
  remaining?: number | null;
  sourceActorId?: string | null;
  sourceItemId?: string | null;
  enabled?: boolean;
  hidden?: boolean;
  changes?: EffectChange[];
  priority?: number;
  transfer?: boolean;
  data?: Record<string, unknown>;
  sort?: number;
}

// Response interfaces
export interface ActiveEffectResponse {
  effect: ActiveEffect;
}

export interface ActiveEffectsListResponse {
  effects: ActiveEffect[];
}
