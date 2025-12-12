/**
 * Compendium System Types
 * Handles game content collections like Monster Manual, Spell Book, etc.
 */

/**
 * Entity types that can be stored in a compendium
 */
export type CompendiumEntityType = 'Actor' | 'Item' | 'JournalEntry' | 'Scene';

/**
 * Base compendium interface
 * Represents a collection of game content
 */
export interface Compendium {
  id: string;
  campaignId: string | null; // null = system-wide compendium
  name: string;
  label: string;
  entityType: CompendiumEntityType;
  system?: string | null; // dnd5e, pf2e, etc.
  packageId?: string | null; // for imported packages
  locked: boolean;
  private: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base compendium entry interface
 * Represents individual content within a compendium
 */
export interface CompendiumEntry {
  id: string;
  compendiumId: string;
  name: string;
  img?: string | null;
  entityType: CompendiumEntityType;
  entityData: Record<string, unknown>;
  folderId?: string | null;
  sort: number;
  searchText?: string | null;
  tags?: string[] | null;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request to create a new compendium
 */
export interface CreateCompendiumRequest {
  campaignId?: string | null;
  name: string;
  label: string;
  entityType: CompendiumEntityType;
  system?: string | null;
  packageId?: string | null;
  locked?: boolean;
  private?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Request to update an existing compendium
 */
export interface UpdateCompendiumRequest {
  name?: string;
  label?: string;
  locked?: boolean;
  private?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Single compendium response
 */
export interface CompendiumResponse {
  compendium: Compendium;
}

/**
 * List of compendiums response
 */
export interface CompendiumsListResponse {
  compendiums: Compendium[];
}

/**
 * Request to create a new compendium entry
 */
export interface CreateCompendiumEntryRequest {
  compendiumId: string;
  name: string;
  img?: string | null;
  entityType: CompendiumEntityType;
  entityData: Record<string, unknown>;
  folderId?: string | null;
  sort?: number;
  tags?: string[];
  data?: Record<string, unknown>;
}

/**
 * Request to update an existing compendium entry
 */
export interface UpdateCompendiumEntryRequest {
  name?: string;
  img?: string | null;
  entityData?: Record<string, unknown>;
  folderId?: string | null;
  sort?: number;
  tags?: string[];
  data?: Record<string, unknown>;
}

/**
 * Single compendium entry response
 */
export interface CompendiumEntryResponse {
  entry: CompendiumEntry;
}

/**
 * List of compendium entries response (paginated)
 */
export interface CompendiumEntriesListResponse {
  entries: CompendiumEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Search compendium entries request
 */
export interface SearchCompendiumEntriesRequest {
  query: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Import/Export format for compendium data
 */
export interface CompendiumImportData {
  name: string;
  label: string;
  entityType: CompendiumEntityType;
  system?: string;
  entries: Array<{
    name: string;
    img?: string;
    entityData: Record<string, unknown>;
    tags?: string[];
    data?: Record<string, unknown>;
  }>;
}

/**
 * Request to instantiate an entity from a compendium entry
 */
export interface CompendiumInstantiateRequest {
  campaignId: string;
  sceneId?: string; // required for Scene entity type
  actorId?: string; // required for Item entity type
}

/**
 * Response from instantiating an entry
 */
export interface CompendiumInstantiateResponse {
  entityId: string;
  entityType: CompendiumEntityType;
}

// WebSocket Payload Types

/**
 * Payload for compendium:create event
 */
export interface CompendiumCreatePayload {
  campaignId?: string | null;
  name: string;
  label: string;
  entityType: CompendiumEntityType;
  system?: string | null;
  packageId?: string | null;
  locked?: boolean;
  private?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Payload for compendium:created event
 */
export interface CompendiumCreatedPayload {
  compendium: Compendium;
}

/**
 * Payload for compendium:update event
 */
export interface CompendiumUpdatePayload {
  compendiumId: string;
  updates: UpdateCompendiumRequest;
}

/**
 * Payload for compendium:updated event
 */
export interface CompendiumUpdatedPayload {
  compendium: Compendium;
}

/**
 * Payload for compendium:delete event
 */
export interface CompendiumDeletePayload {
  compendiumId: string;
}

/**
 * Payload for compendium:deleted event
 */
export interface CompendiumDeletedPayload {
  compendiumId: string;
}

/**
 * Payload for compendium:entry-create event
 */
export interface CompendiumEntryCreatePayload {
  compendiumId: string;
  name: string;
  img?: string | null;
  entityType: CompendiumEntityType;
  entityData: Record<string, unknown>;
  folderId?: string | null;
  sort?: number;
  tags?: string[];
  data?: Record<string, unknown>;
}

/**
 * Payload for compendium:entry-created event
 */
export interface CompendiumEntryCreatedPayload {
  entry: CompendiumEntry;
}

/**
 * Payload for compendium:entry-update event
 */
export interface CompendiumEntryUpdatePayload {
  entryId: string;
  updates: UpdateCompendiumEntryRequest;
}

/**
 * Payload for compendium:entry-updated event
 */
export interface CompendiumEntryUpdatedPayload {
  entry: CompendiumEntry;
}

/**
 * Payload for compendium:entry-delete event
 */
export interface CompendiumEntryDeletePayload {
  entryId: string;
}

/**
 * Payload for compendium:entry-deleted event
 */
export interface CompendiumEntryDeletedPayload {
  entryId: string;
  compendiumId: string;
}

// ============================================================================
// FILE-BASED COMPENDIUM SYSTEM TYPES
// These types support the new file-based compendium architecture where
// game content is stored as JSON files and loaded at runtime
// @see docs/architecture/COMPENDIUM_SYSTEM.md
// ============================================================================

/**
 * Types of content that can be stored in a compendium
 */
export type FileCompendiumType =
  | 'items'
  | 'spells'
  | 'monsters'
  | 'races'
  | 'classes'
  | 'backgrounds'
  | 'features'
  | 'conditions';

/**
 * A single compendium entry (e.g., one spell, one item)
 * Represents actual game content that can be instantiated
 */
export interface FileCompendiumEntry {
  id: string;
  name: string;
  img?: string;
  description?: string;
  templateId: string;
  source: string;
  data: Record<string, any>;
}

/**
 * A compendium file containing multiple entries
 * This represents a single JSON file on disk
 */
export interface FileCompendiumFile {
  compendiumId: string;
  name: string;
  templateId: string;
  source: string;
  entries: FileCompendiumEntry[];
}

/**
 * In-memory structure after loading a compendium
 * Entries are indexed by ID for fast lookup
 */
export interface LoadedFileCompendium {
  systemId: string;
  type: FileCompendiumType;
  entries: Map<string, FileCompendiumEntry>;
}

/**
 * Parameters for searching compendium content
 */
export interface FileCompendiumSearchParams {
  search?: string;
  filters?: Record<string, string | string[]>;
  page?: number;
  limit?: number;
}

/**
 * Search results from compendium API
 */
export interface FileCompendiumSearchResult {
  entries: FileCompendiumEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Request to add a compendium entry to an actor
 * This creates a database record from a file-based entry
 */
export interface AddFromFileCompendiumRequest {
  fromCompendium: {
    systemId: string;
    type: FileCompendiumType;
    entryId: string;
  };
}
