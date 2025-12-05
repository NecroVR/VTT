export interface Item {
  id: string;
  campaignId: string;
  actorId?: string | null;
  name: string;
  itemType: string;
  img?: string | null;
  // Core properties
  description?: string | null;
  quantity: number;
  weight: number;
  price: number;
  equipped: boolean;
  // Metadata
  data: Record<string, unknown>;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemRequest {
  campaignId: string;
  actorId?: string | null;
  name: string;
  itemType: string;
  img?: string | null;
  description?: string | null;
  quantity?: number;
  weight?: number;
  price?: number;
  equipped?: boolean;
  data?: Record<string, unknown>;
  sort?: number;
}

export interface UpdateItemRequest {
  actorId?: string | null;
  name?: string;
  itemType?: string;
  img?: string | null;
  description?: string | null;
  quantity?: number;
  weight?: number;
  price?: number;
  equipped?: boolean;
  data?: Record<string, unknown>;
  sort?: number;
}

export interface ItemResponse {
  item: Item;
}

export interface ItemsListResponse {
  items: Item[];
}
