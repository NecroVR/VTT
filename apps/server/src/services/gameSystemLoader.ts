import type { GameSystem, GameSystemManifest, GameSystemModule, ItemTemplate, FileCompendiumType, FileCompendiumEntry, FileCompendiumFile } from '@vtt/shared';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Game System Loader Service
 *
 * Handles loading, validating, and managing game systems from the file system.
 * Supports both core and community game systems.
 */

export interface LoadedGameSystem {
  manifest: GameSystemManifest;
  system: GameSystem;
  path: string;
  type: 'core' | 'community';
  compendium: {
    items: Map<string, FileCompendiumEntry>;
    spells: Map<string, FileCompendiumEntry>;
    monsters: Map<string, FileCompendiumEntry>;
    races: Map<string, FileCompendiumEntry>;
    classes: Map<string, FileCompendiumEntry>;
    backgrounds: Map<string, FileCompendiumEntry>;
    features: Map<string, FileCompendiumEntry>;
    conditions: Map<string, FileCompendiumEntry>;
  };
}

export interface GameSystemError {
  systemId: string;
  path: string;
  error: string;
}

class GameSystemLoaderService {
  private systems: Map<string, LoadedGameSystem> = new Map();
  private errors: GameSystemError[] = [];
  private initialized = false;

  /**
   * Get the root game-systems directory path
   */
  private getGameSystemsDir(): string {
    // From apps/server/src/services, go up to project root
    return path.join(__dirname, '..', '..', '..', '..', 'game-systems');
  }

  /**
   * Get the core systems directory path
   */
  private getCoreSystemsDir(): string {
    return path.join(this.getGameSystemsDir(), 'core');
  }

  /**
   * Get the community systems directory path
   */
  private getCommunitySystemsDir(): string {
    return path.join(this.getGameSystemsDir(), 'community');
  }

  /**
   * Check if a directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Read and parse a JSON file
   */
  private async readJsonFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Validate manifest structure
   */
  private validateManifest(manifest: any, systemPath: string): manifest is GameSystemManifest {
    const required = ['id', 'name', 'version', 'description', 'license', 'minPlatformVersion'];

    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field '${field}' in manifest at ${systemPath}`);
      }
    }

    if (typeof manifest.id !== 'string' || !manifest.id.match(/^[a-z0-9-]+$/)) {
      throw new Error(`Invalid system ID '${manifest.id}' - must be lowercase alphanumeric with hyphens`);
    }

    return true;
  }

  /**
   * Validate system structure
   * Note: Some fields are optional as systems may be in development
   */
  private validateSystem(system: any, systemPath: string): system is GameSystem {
    // Core required fields
    const required = ['id', 'name', 'version', 'publisher', 'description', 'dice', 'attributes'];

    for (const field of required) {
      if (system[field] === undefined) {
        throw new Error(`Missing required field '${field}' in system definition at ${systemPath}`);
      }
    }

    // Validate dice configuration
    if (!system.dice.standardDice || !Array.isArray(system.dice.standardDice)) {
      throw new Error(`Invalid dice configuration in system at ${systemPath}`);
    }

    // Validate attributes
    if (!Array.isArray(system.attributes)) {
      throw new Error(`Attributes must be an array in system at ${systemPath}`);
    }

    // Optional but should be arrays if present
    if (system.resources && !Array.isArray(system.resources)) {
      throw new Error(`Resources must be an array if present in system at ${systemPath}`);
    }

    if (system.skills && !Array.isArray(system.skills)) {
      throw new Error(`Skills must be an array if present in system at ${systemPath}`);
    }

    // Set defaults for missing optional fields
    if (!system.resources) {
      system.resources = [];
    }

    if (!system.skills) {
      system.skills = [];
    }

    if (!system.npcTemplates) {
      system.npcTemplates = [];
    }

    if (!system.itemTemplates) {
      system.itemTemplates = [];
    }

    if (!system.sheetLayouts) {
      system.sheetLayouts = [];
    }

    // Provide minimal defaults for complex required fields if missing
    if (!system.characterTemplate) {
      system.characterTemplate = {
        id: 'character',
        systemId: system.id,
        entityType: 'character',
        name: 'Character',
        fields: [],
        computedFields: [],
        sections: [],
        rolls: [],
      };
    }

    if (!system.rollResolver) {
      system.rollResolver = {
        type: 'threshold',
      };
    }

    return true;
  }

  /**
   * Validate a compendium file structure
   */
  private validateCompendiumFile(file: any, filePath: string): file is FileCompendiumFile {
    const required = ['compendiumId', 'name', 'templateId', 'source', 'entries'];

    for (const field of required) {
      if (!file[field]) {
        throw new Error(`Missing required field '${field}' in compendium file at ${filePath}`);
      }
    }

    if (!Array.isArray(file.entries)) {
      throw new Error(`Entries must be an array in compendium file at ${filePath}`);
    }

    // Validate each entry
    for (const entry of file.entries) {
      if (!entry.id || !entry.name || !entry.templateId || !entry.source || !entry.data) {
        throw new Error(`Invalid entry in compendium file at ${filePath}: missing required fields`);
      }
    }

    return true;
  }

  /**
   * Validate an item template structure
   */
  private validateItemTemplate(template: any, filePath: string): template is ItemTemplate {
    // Required fields
    const required = ['id', 'systemId', 'entityType', 'name', 'category'];

    for (const field of required) {
      if (!template[field]) {
        throw new Error(`Missing required field '${field}' in item template at ${filePath}`);
      }
    }

    // Validate entityType
    if (template.entityType !== 'item') {
      throw new Error(`Invalid entityType '${template.entityType}' - must be 'item' in ${filePath}`);
    }

    // Validate category
    const validCategories = [
      'weapon', 'armor', 'spell', 'consumable', 'feature', 'tool',
      'loot', 'container', 'class', 'race', 'background', 'custom'
    ];
    if (!validCategories.includes(template.category)) {
      console.warn(`Unknown category '${template.category}' in item template ${filePath}`);
    }

    // Validate fields array if present
    if (template.fields && !Array.isArray(template.fields)) {
      throw new Error(`Fields must be an array in item template at ${filePath}`);
    }

    // Log warnings for missing optional fields
    if (!template.fields || template.fields.length === 0) {
      console.warn(`Item template ${template.id} has no fields defined at ${filePath}`);
    }

    if (!template.sections || template.sections.length === 0) {
      console.warn(`Item template ${template.id} has no sections defined at ${filePath}`);
    }

    return true;
  }

  /**
   * Load compendium entries from the compendium/ directory
   */
  private async loadCompendiumEntries(systemDir: string): Promise<LoadedGameSystem['compendium']> {
    const compendium: LoadedGameSystem['compendium'] = {
      items: new Map(),
      spells: new Map(),
      monsters: new Map(),
      races: new Map(),
      classes: new Map(),
      backgrounds: new Map(),
      features: new Map(),
      conditions: new Map(),
    };

    const compendiumDir = path.join(systemDir, 'compendium');

    try {
      // Check if compendium directory exists
      const exists = await this.directoryExists(compendiumDir);
      if (!exists) {
        console.log(`No compendium directory found at ${compendiumDir}`);
        return compendium;
      }

      // Read all subdirectories (items, spells, monsters, etc.)
      const entries = await fs.readdir(compendiumDir, { withFileTypes: true });
      const subdirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

      for (const subdir of subdirs) {
        const type = subdir.name as FileCompendiumType;

        // Validate that this is a recognized compendium type
        if (!Object.keys(compendium).includes(type)) {
          console.warn(`Unknown compendium type '${type}' in ${compendiumDir}, skipping`);
          continue;
        }

        const typeDir = path.join(compendiumDir, type);
        await this.loadCompendiumType(typeDir, type, compendium[type]);
      }

      // Log summary
      const totalEntries = Object.values(compendium).reduce((sum, map) => sum + map.size, 0);
      console.log(`Loaded ${totalEntries} total compendium entries`);

    } catch (error) {
      console.error(`Error loading compendium from ${compendiumDir}:`, error);
    }

    return compendium;
  }

  /**
   * Load all compendium files from a specific type directory
   */
  private async loadCompendiumType(
    typeDir: string,
    type: FileCompendiumType,
    entryMap: Map<string, FileCompendiumEntry>
  ): Promise<void> {
    try {
      // Recursively find all .json files in this directory and subdirectories
      const jsonFiles = await this.findJsonFiles(typeDir);

      if (jsonFiles.length === 0) {
        console.log(`No compendium files found for type '${type}'`);
        return;
      }

      console.log(`Loading ${jsonFiles.length} compendium file(s) for type '${type}'`);

      let entriesLoaded = 0;

      // Load and validate each file
      for (const filePath of jsonFiles) {
        try {
          const file = await this.readJsonFile<FileCompendiumFile>(filePath);

          // Validate the file structure
          this.validateCompendiumFile(file, filePath);

          // Add all entries to the map
          for (const entry of file.entries) {
            if (entryMap.has(entry.id)) {
              console.warn(`Duplicate entry ID '${entry.id}' in ${filePath}, overwriting previous entry`);
            }
            entryMap.set(entry.id, entry);
            entriesLoaded++;
          }

          console.log(`  Loaded ${file.entries.length} entries from ${path.basename(filePath)}`);
        } catch (error) {
          console.error(`Failed to load compendium file ${filePath}:`, error instanceof Error ? error.message : String(error));
        }
      }

      console.log(`Successfully loaded ${entriesLoaded} entries for type '${type}'`);
    } catch (error) {
      console.error(`Error loading compendium type '${type}' from ${typeDir}:`, error);
    }
  }

  /**
   * Recursively find all .json files in a directory
   */
  private async findJsonFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // Recursively search subdirectories
          const subFiles = await this.findJsonFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return files;
  }

  /**
   * Load item templates from the templates/items/ directory
   */
  private async loadItemTemplates(systemDir: string): Promise<ItemTemplate[]> {
    const itemTemplates: ItemTemplate[] = [];
    const itemsDir = path.join(systemDir, 'templates', 'items');

    try {
      // Check if templates/items directory exists
      const exists = await this.directoryExists(itemsDir);
      if (!exists) {
        console.log(`No item templates directory found at ${itemsDir}`);
        return itemTemplates;
      }

      // Read all .json files in the directory
      const files = await fs.readdir(itemsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      if (jsonFiles.length === 0) {
        console.log(`No item template files found in ${itemsDir}`);
        return itemTemplates;
      }

      console.log(`Loading ${jsonFiles.length} item template(s) from ${itemsDir}`);

      // Load and validate each template
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(itemsDir, file);
          const template = await this.readJsonFile<ItemTemplate>(filePath);

          // Validate the template
          this.validateItemTemplate(template, filePath);

          itemTemplates.push(template);
          console.log(`  Loaded item template: ${template.id} (${template.category})`);
        } catch (error) {
          console.error(`Failed to load item template from ${file}:`, error instanceof Error ? error.message : String(error));
        }
      }

      console.log(`Successfully loaded ${itemTemplates.length} item template(s)`);
    } catch (error) {
      console.error(`Error loading item templates from ${itemsDir}:`, error);
    }

    return itemTemplates;
  }

  /**
   * Load a single game system from a directory
   */
  private async loadSystemFromDirectory(systemDir: string, type: 'core' | 'community'): Promise<LoadedGameSystem | null> {
    try {
      const manifestPath = path.join(systemDir, 'manifest.json');
      const systemPath = path.join(systemDir, 'system.json');

      // Check if required files exist
      try {
        await fs.access(manifestPath);
        await fs.access(systemPath);
      } catch {
        throw new Error(`Missing manifest.json or system.json in ${systemDir}`);
      }

      // Load and parse manifest
      const manifest = await this.readJsonFile<GameSystemManifest>(manifestPath);
      this.validateManifest(manifest, manifestPath);

      // Load and parse system
      const system = await this.readJsonFile<GameSystem>(systemPath);
      this.validateSystem(system, systemPath);

      // Verify IDs match
      if (manifest.id !== system.id) {
        throw new Error(`Manifest ID (${manifest.id}) does not match system ID (${system.id}) in ${systemDir}`);
      }

      // Load item templates
      const itemTemplates = await this.loadItemTemplates(systemDir);
      system.itemTemplates = itemTemplates;

      // Load compendium entries
      const compendium = await this.loadCompendiumEntries(systemDir);

      return {
        manifest,
        system,
        path: systemDir,
        type,
        compendium,
      };
    } catch (error) {
      const systemId = path.basename(systemDir);
      this.errors.push({
        systemId,
        path: systemDir,
        error: error instanceof Error ? error.message : String(error),
      });
      console.warn(`Failed to load game system from ${systemDir}:`, error);
      return null;
    }
  }

  /**
   * Scan a directory for game systems
   */
  private async scanDirectory(dirPath: string, type: 'core' | 'community'): Promise<LoadedGameSystem[]> {
    const systems: LoadedGameSystem[] = [];

    try {
      const exists = await this.directoryExists(dirPath);
      if (!exists) {
        console.warn(`Game systems directory does not exist: ${dirPath}`);
        return systems;
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const systemDir = path.join(dirPath, entry.name);
          const loadedSystem = await this.loadSystemFromDirectory(systemDir, type);

          if (loadedSystem) {
            systems.push(loadedSystem);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return systems;
  }

  /**
   * Load all game systems from core and community directories
   */
  async loadAllSystems(): Promise<void> {
    this.systems.clear();
    this.errors = [];

    console.log('Loading game systems...');

    // Load core systems
    const coreSystems = await this.scanDirectory(this.getCoreSystemsDir(), 'core');
    console.log(`Loaded ${coreSystems.length} core game systems`);

    // Load community systems
    const communitySystems = await this.scanDirectory(this.getCommunitySystemsDir(), 'community');
    console.log(`Loaded ${communitySystems.length} community game systems`);

    // Store all systems in the map
    const allSystems = [...coreSystems, ...communitySystems];
    for (const system of allSystems) {
      this.systems.set(system.manifest.id, system);
    }

    this.initialized = true;

    // Log errors if any
    if (this.errors.length > 0) {
      console.warn(`Failed to load ${this.errors.length} game systems:`);
      for (const error of this.errors) {
        console.warn(`  - ${error.systemId}: ${error.error}`);
      }
    }

    console.log(`Total game systems loaded: ${this.systems.size}`);
  }

  /**
   * Get a specific game system by ID
   */
  getSystem(systemId: string): LoadedGameSystem | undefined {
    if (!this.initialized) {
      throw new Error('Game system loader not initialized. Call loadAllSystems() first.');
    }
    return this.systems.get(systemId);
  }

  /**
   * Get all loaded game systems
   */
  getAllSystems(): LoadedGameSystem[] {
    if (!this.initialized) {
      throw new Error('Game system loader not initialized. Call loadAllSystems() first.');
    }
    return Array.from(this.systems.values());
  }

  /**
   * Get just the manifest for a specific system
   */
  getSystemManifest(systemId: string): GameSystemManifest | undefined {
    const system = this.getSystem(systemId);
    return system?.manifest;
  }

  /**
   * Check if a system is loaded
   */
  isSystemLoaded(systemId: string): boolean {
    return this.systems.has(systemId);
  }

  /**
   * Reload a specific system from disk
   */
  async reloadSystem(systemId: string): Promise<boolean> {
    const existingSystem = this.systems.get(systemId);

    if (!existingSystem) {
      console.warn(`Cannot reload system '${systemId}' - not currently loaded`);
      return false;
    }

    // Remove from errors list if present
    this.errors = this.errors.filter(e => e.systemId !== systemId);

    // Reload the system
    const reloadedSystem = await this.loadSystemFromDirectory(existingSystem.path, existingSystem.type);

    if (reloadedSystem) {
      this.systems.set(systemId, reloadedSystem);
      console.log(`Successfully reloaded game system: ${systemId}`);
      return true;
    } else {
      // Remove from systems map if reload failed
      this.systems.delete(systemId);
      console.warn(`Failed to reload game system: ${systemId}`);
      return false;
    }
  }

  /**
   * Get loading errors
   */
  getErrors(): GameSystemError[] {
    return [...this.errors];
  }

  /**
   * Check if loader is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset the loader (useful for testing)
   */
  reset(): void {
    this.systems.clear();
    this.errors = [];
    this.initialized = false;
  }

  /**
   * Get compendium entries for a specific system and type
   * Optionally filter by search parameters
   */
  getCompendiumEntries(
    systemId: string,
    type: FileCompendiumType,
    searchParams?: {
      search?: string;
      filters?: Record<string, string | string[]>;
      page?: number;
      limit?: number;
    }
  ): { entries: FileCompendiumEntry[]; total: number; page: number; limit: number; hasMore: boolean } {
    const system = this.getSystem(systemId);

    if (!system) {
      throw new Error(`Game system '${systemId}' not found`);
    }

    const entryMap = system.compendium[type];
    if (!entryMap) {
      throw new Error(`Invalid compendium type '${type}'`);
    }

    // Get all entries as an array
    let entries = Array.from(entryMap.values());

    // Apply search filter
    if (searchParams?.search) {
      const searchLower = searchParams.search.toLowerCase();
      entries = entries.filter(entry =>
        entry.name.toLowerCase().includes(searchLower) ||
        entry.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply custom filters
    if (searchParams?.filters) {
      entries = entries.filter(entry => {
        for (const [key, value] of Object.entries(searchParams.filters!)) {
          const entryValue = entry.data[key];

          if (Array.isArray(value)) {
            // For array filters, check if entry value is in the array
            if (!value.includes(String(entryValue))) {
              return false;
            }
          } else {
            // For single value filters, check exact match
            if (String(entryValue) !== value) {
              return false;
            }
          }
        }
        return true;
      });
    }

    // Calculate pagination
    const total = entries.length;
    const page = searchParams?.page ?? 1;
    const limit = searchParams?.limit ?? 20;
    const offset = (page - 1) * limit;

    // Apply pagination
    const paginatedEntries = entries.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      entries: paginatedEntries,
      total,
      page,
      limit,
      hasMore,
    };
  }

  /**
   * Get a single compendium entry by ID
   */
  getCompendiumEntry(
    systemId: string,
    type: FileCompendiumType,
    entryId: string
  ): FileCompendiumEntry | undefined {
    const system = this.getSystem(systemId);

    if (!system) {
      throw new Error(`Game system '${systemId}' not found`);
    }

    const entryMap = system.compendium[type];
    if (!entryMap) {
      throw new Error(`Invalid compendium type '${type}'`);
    }

    return entryMap.get(entryId);
  }
}

// Export singleton instance
export const gameSystemLoader = new GameSystemLoaderService();

// Export class for testing
export { GameSystemLoaderService };
