export interface Actor {
  id: string;
  campaignId: string;
  name: string;
  actorType: string;
  img?: string | null;
  // Ownership
  ownerId?: string | null;
  // Core attributes (system-agnostic)
  attributes: Record<string, unknown>;
  abilities: Record<string, unknown>;
  // Organization
  folderId?: string | null;
  sort: number;
  // Token configuration
  tokenSize: number;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActorRequest {
  campaignId: string;
  name: string;
  actorType: string;
  img?: string | null;
  ownerId?: string | null;
  attributes?: Record<string, unknown>;
  abilities?: Record<string, unknown>;
  folderId?: string | null;
  sort?: number;
  tokenSize?: number;
  data?: Record<string, unknown>;
}

export interface UpdateActorRequest {
  name?: string;
  actorType?: string;
  img?: string | null;
  ownerId?: string | null;
  attributes?: Record<string, unknown>;
  abilities?: Record<string, unknown>;
  folderId?: string | null;
  sort?: number;
  tokenSize?: number;
  data?: Record<string, unknown>;
}

export interface ActorResponse {
  actor: Actor;
}

export interface ActorsListResponse {
  actors: Actor[];
}
