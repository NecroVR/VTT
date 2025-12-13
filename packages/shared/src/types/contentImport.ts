// Content Import Types - Supports multiple import sources

export type ImportSourceType = 'foundryvtt' | 'dndbeyond' | 'manual';

export type ContentType =
  | 'actor'       // Characters, NPCs, monsters
  | 'item'        // Items, equipment, loot
  | 'spell'
  | 'class'
  | 'subclass'
  | 'race'
  | 'subrace'
  | 'background'
  | 'feat'
  | 'scene'       // Battle maps (Foundry)
  | 'journal'     // Notes, handouts (Foundry)
  | 'rolltable'   // Random tables (Foundry)
  | 'playlist';   // Audio (Foundry)

export type ImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial';

export interface ImportSource {
  id: string;
  userId: string;              // GM who owns this import
  sourceType: ImportSourceType;
  sourceName: string;          // e.g., "My Foundry World", "Player's Handbook"
  sourceVersion?: string;      // Foundry world version, etc.
  importedAt: Date;
  lastSyncAt?: Date;
  contentTypes: ContentType[];
  itemCount: number;
  metadata: Record<string, unknown>;
}

export interface ImportJob {
  id: string;
  userId: string;
  sourceId?: string;
  sourceType: ImportSourceType;
  status: ImportStatus;
  contentType: ContentType;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: ImportError[];
  startedAt: Date;
  completedAt?: Date;
  rawData?: unknown;           // Original data (for debugging)
}

export interface ImportError {
  itemName: string;
  itemId?: string;
  error: string;
  details?: unknown;
}

export interface ImportRequest {
  sourceType: ImportSourceType;
  contentType: ContentType;
  items: RawImportItem[];
  sourceName: string;
  sourceVersion?: string;
}

export interface RawImportItem {
  sourceId: string;            // ID from source system
  name: string;
  type: ContentType;
  data: unknown;               // Raw source data
  img?: string;
  folder?: string;
}

// Campaign binding
export interface CampaignImportBinding {
  campaignId: string;
  importSourceId: string;
  addedAt: Date;
  addedByUserId: string;
}

// Foundry-specific types
export interface FoundryExportData {
  type: 'world' | 'compendium' | 'folder' | 'single';
  system?: string;             // e.g., 'dnd5e'
  systemVersion?: string;
  foundryVersion?: string;
  actors?: FoundryActor[];
  items?: FoundryItem[];
  scenes?: FoundryScene[];
  journals?: FoundryJournal[];
  tables?: FoundryRollTable[];
  playlists?: FoundryPlaylist[];
}

export interface FoundryDocument {
  _id: string;
  name: string;
  type?: string;
  img?: string;
  folder?: string | null;
  flags?: Record<string, unknown>;
  system?: Record<string, unknown>;  // System-specific data (dnd5e, etc.)
}

export interface FoundryActor extends FoundryDocument {
  type: 'character' | 'npc' | 'vehicle';
  prototypeToken?: Record<string, unknown>;
  items?: FoundryItem[];
  effects?: unknown[];
}

export interface FoundryItem extends FoundryDocument {
  type: string;  // 'weapon', 'spell', 'feat', 'class', etc.
  effects?: unknown[];
}

export interface FoundryScene extends FoundryDocument {
  navigation: boolean;
  width: number;
  height: number;
  background?: { src: string };
  grid?: { size: number; type: number };
  walls?: unknown[];
  lights?: unknown[];
  tokens?: unknown[];
}

export interface FoundryJournal extends FoundryDocument {
  pages?: Array<{
    _id: string;
    name: string;
    type: 'text' | 'image' | 'video';
    text?: { content: string; format: number };
    src?: string;
  }>;
}

export interface FoundryRollTable extends FoundryDocument {
  formula: string;
  results?: Array<{
    _id: string;
    text: string;
    weight: number;
    range: [number, number];
  }>;
}

export interface FoundryPlaylist extends FoundryDocument {
  sounds?: Array<{
    _id: string;
    name: string;
    path: string;
    volume: number;
  }>;
}
