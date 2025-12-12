/**
 * Type definitions for form components
 */

import type { ItemRarity, AttunementState } from '@vtt/shared';

/**
 * Form data structure for creating a derived item from a module entity
 */
export interface DerivedItemFormData {
  name: string;
  img: string;
  description: string;
  quantity: number;
  weight: number;
  price: number;
  equipped: boolean;
  identified: boolean;
  rarity: ItemRarity;
  attunement: AttunementState;
  data: Record<string, unknown>;
}

/**
 * Events dispatched by ItemForm component
 */
export interface ItemFormEvents {
  createDerived: void;
  save: DerivedItemFormData;
}
