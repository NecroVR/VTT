import type { ItemRarity, AttunementState } from './item-templates.js';

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
  // Template integration
  templateId?: string | null;      // Reference to item template
  identified: boolean;              // Whether item is identified (default true)
  attunement?: AttunementState | null;
  rarity?: ItemRarity | null;
  containerId?: string | null;      // ID of container item this item is inside
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
  templateId?: string | null;
  identified?: boolean;              // Defaults to true
  attunement?: AttunementState | null;
  rarity?: ItemRarity | null;
  containerId?: string | null;
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
  templateId?: string | null;
  identified?: boolean;
  attunement?: AttunementState | null;
  rarity?: ItemRarity | null;
  containerId?: string | null;
  data?: Record<string, unknown>;
  sort?: number;
}

export interface ItemResponse {
  item: Item;
}

export interface ItemsListResponse {
  items: Item[];
}
