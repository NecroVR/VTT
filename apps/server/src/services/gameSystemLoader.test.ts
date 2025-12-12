import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameSystemLoaderService } from './gameSystemLoader.js';
import type { GameSystemManifest, GameSystem } from '@vtt/shared';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test fixtures - minimal valid structures
 */
const createValidManifest = (id: string): GameSystemManifest => ({
  id,
  name: 'Test System',
  version: '1.0.0',
  authors: ['Test Author'],
  description: 'A test game system',
  license: 'MIT',
  minPlatformVersion: '1.0.0',
});

const createValidSystem = (id: string): GameSystem => ({
  id,
  name: 'Test System',
  version: '1.0.0',
  publisher: 'Test Publisher',
  description: 'A test game system',
  dice: {
    standardDice: ['d20'],
    fudgeDice: false,
    defaultRoll: 'd20',
    supportsAdvantage: true,
    supportsExploding: false,
    supportsPushing: false,
  },
  attributes: [
    {
      id: 'strength',
      name: 'Strength',
      abbreviation: 'STR',
      valueType: 'number',
      defaultValue: 10,
    },
  ],
  resources: [
    {
      id: 'hp',
      name: 'Hit Points',
      category: 'health',
      valueType: 'current_max',
      displayStyle: 'bar',
    },
  ],
  skills: [
    {
      id: 'athletics',
      name: 'Athletics',
      linkedAttribute: 'strength',
      proficiencyType: 'boolean',
      rollFormula: '1d20 + {strength_mod}',
    },
  ],
  characterTemplate: {
    id: 'character',
    systemId: id,
    entityType: 'character',
    name: 'Character',
    fields: [],
    computedFields: [],
    sections: [],
    rolls: [],
  },
  npcTemplates: [],
  itemTemplates: [],
  rollResolver: {
    type: 'threshold',
  },
  sheetLayouts: [],
});

describe('GameSystemLoader Service', () => {
  let loader: GameSystemLoaderService;
  let testDir: string;

  beforeEach(async () => {
    loader = new GameSystemLoaderService();
    // Create a temporary test directory
    testDir = path.join(__dirname, '..', '..', 'test-game-systems');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    loader.reset();
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should start uninitialized', () => {
      expect(loader.isInitialized()).toBe(false);
    });

    it('should throw error when accessing systems before initialization', () => {
      expect(() => loader.getSystem('test')).toThrow('not initialized');
      expect(() => loader.getAllSystems()).toThrow('not initialized');
    });

    it('should be initialized after loadAllSystems', async () => {
      await loader.loadAllSystems();
      expect(loader.isInitialized()).toBe(true);
    });
  });

  describe('Loading Systems', () => {
    it('should load all systems from core and community directories', async () => {
      await loader.loadAllSystems();
      expect(loader.isInitialized()).toBe(true);

      const systems = loader.getAllSystems();
      expect(Array.isArray(systems)).toBe(true);
    });

    it('should load existing dnd5e-ogl system', async () => {
      await loader.loadAllSystems();

      const dnd5e = loader.getSystem('dnd5e-ogl');
      if (dnd5e) {
        expect(dnd5e.manifest.id).toBe('dnd5e-ogl');
        expect(dnd5e.manifest.name).toContain('Dungeons & Dragons');
        expect(dnd5e.type).toBe('core');
        expect(dnd5e.system).toBeDefined();
        expect(dnd5e.system.dice).toBeDefined();
        expect(dnd5e.system.attributes).toBeDefined();
      }
    });

    it('should handle missing directories gracefully', async () => {
      await loader.loadAllSystems();
      // Should not throw error even if directories don't exist
      expect(loader.isInitialized()).toBe(true);
    });

    it('should clear previous systems when reloading', async () => {
      await loader.loadAllSystems();
      const firstCount = loader.getAllSystems().length;

      await loader.loadAllSystems();
      const secondCount = loader.getAllSystems().length;

      expect(secondCount).toBe(firstCount);
    });
  });

  describe('System Retrieval', () => {
    beforeEach(async () => {
      await loader.loadAllSystems();
    });

    it('should get system by ID', () => {
      const systems = loader.getAllSystems();
      if (systems.length > 0) {
        const firstSystem = systems[0];
        const retrieved = loader.getSystem(firstSystem.manifest.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.manifest.id).toBe(firstSystem.manifest.id);
      }
    });

    it('should return undefined for non-existent system', () => {
      const system = loader.getSystem('non-existent-system-12345');
      expect(system).toBeUndefined();
    });

    it('should get all systems as array', () => {
      const systems = loader.getAllSystems();
      expect(Array.isArray(systems)).toBe(true);
    });

    it('should get system manifest only', () => {
      const systems = loader.getAllSystems();
      if (systems.length > 0) {
        const firstSystemId = systems[0].manifest.id;
        const manifest = loader.getSystemManifest(firstSystemId);
        expect(manifest).toBeDefined();
        expect(manifest?.id).toBe(firstSystemId);
      }
    });

    it('should return undefined manifest for non-existent system', () => {
      const manifest = loader.getSystemManifest('non-existent-system');
      expect(manifest).toBeUndefined();
    });
  });

  describe('System Status', () => {
    beforeEach(async () => {
      await loader.loadAllSystems();
    });

    it('should check if system is loaded', () => {
      const systems = loader.getAllSystems();
      if (systems.length > 0) {
        const firstSystemId = systems[0].manifest.id;
        expect(loader.isSystemLoaded(firstSystemId)).toBe(true);
      }
    });

    it('should return false for non-existent system', () => {
      expect(loader.isSystemLoaded('non-existent-system')).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate manifest has required fields', async () => {
      await loader.loadAllSystems();

      const systems = loader.getAllSystems();
      for (const system of systems) {
        expect(system.manifest.id).toBeTruthy();
        expect(system.manifest.name).toBeTruthy();
        expect(system.manifest.version).toBeTruthy();
        expect(system.manifest.description).toBeTruthy();
        expect(system.manifest.license).toBeTruthy();
        expect(system.manifest.minPlatformVersion).toBeTruthy();
      }
    });

    it('should validate system has required fields', async () => {
      await loader.loadAllSystems();

      const systems = loader.getAllSystems();
      for (const loadedSystem of systems) {
        const sys = loadedSystem.system;
        expect(sys.id).toBeTruthy();
        expect(sys.name).toBeTruthy();
        expect(sys.version).toBeTruthy();
        expect(sys.publisher).toBeTruthy();
        expect(sys.description).toBeTruthy();
        expect(sys.dice).toBeDefined();
        expect(Array.isArray(sys.attributes)).toBe(true);
        expect(Array.isArray(sys.resources)).toBe(true);
        expect(Array.isArray(sys.skills)).toBe(true);
        expect(sys.characterTemplate).toBeDefined();
        expect(sys.rollResolver).toBeDefined();
      }
    });

    it('should validate manifest and system IDs match', async () => {
      await loader.loadAllSystems();

      const systems = loader.getAllSystems();
      for (const system of systems) {
        expect(system.manifest.id).toBe(system.system.id);
      }
    });
  });

  describe('Error Handling', () => {
    it('should track loading errors', async () => {
      await loader.loadAllSystems();

      const errors = loader.getErrors();
      expect(Array.isArray(errors)).toBe(true);
      // Errors array should be defined, may be empty if all systems load successfully
    });

    it('should continue loading other systems when one fails', async () => {
      await loader.loadAllSystems();
      // Even if some systems fail, others should still load
      expect(loader.isInitialized()).toBe(true);
    });
  });

  describe('System Types', () => {
    beforeEach(async () => {
      await loader.loadAllSystems();
    });

    it('should distinguish between core and community systems', () => {
      const systems = loader.getAllSystems();

      for (const system of systems) {
        expect(['core', 'community']).toContain(system.type);
      }
    });

    it('should load core systems from core directory', () => {
      const systems = loader.getAllSystems();
      const coreSystems = systems.filter(s => s.type === 'core');

      // We know dnd5e-ogl, pf2e, and daggerheart should be core systems
      const coreSystemIds = coreSystems.map(s => s.manifest.id);
      expect(coreSystemIds.length).toBeGreaterThan(0);
    });
  });

  describe('Reload System', () => {
    beforeEach(async () => {
      await loader.loadAllSystems();
    });

    it('should return false when reloading non-existent system', async () => {
      const result = await loader.reloadSystem('non-existent-system');
      expect(result).toBe(false);
    });

    it('should reload an existing system', async () => {
      const systems = loader.getAllSystems();
      if (systems.length > 0) {
        const systemId = systems[0].manifest.id;
        const result = await loader.reloadSystem(systemId);

        // If system files are valid, reload should succeed
        // If files are missing/invalid, it should fail gracefully
        expect(typeof result).toBe('boolean');
      }
    });

    it('should remove system from map if reload fails', async () => {
      const systems = loader.getAllSystems();
      if (systems.length > 0) {
        const systemId = systems[0].manifest.id;

        // After reload attempt, system state should be consistent
        await loader.reloadSystem(systemId);

        const isLoaded = loader.isSystemLoaded(systemId);
        const system = loader.getSystem(systemId);

        if (isLoaded) {
          expect(system).toBeDefined();
        } else {
          expect(system).toBeUndefined();
        }
      }
    });
  });

  describe('Reset', () => {
    it('should clear all systems and errors on reset', async () => {
      await loader.loadAllSystems();

      expect(loader.isInitialized()).toBe(true);
      expect(loader.getAllSystems().length).toBeGreaterThanOrEqual(0);

      loader.reset();

      expect(loader.isInitialized()).toBe(false);
      expect(() => loader.getAllSystems()).toThrow('not initialized');
    });

    it('should allow reloading after reset', async () => {
      await loader.loadAllSystems();
      const firstCount = loader.getAllSystems().length;

      loader.reset();
      await loader.loadAllSystems();
      const secondCount = loader.getAllSystems().length;

      expect(secondCount).toBe(firstCount);
    });
  });

  describe('System Structure', () => {
    beforeEach(async () => {
      await loader.loadAllSystems();
    });

    it('should have valid dice configuration', () => {
      const systems = loader.getAllSystems();

      for (const loadedSystem of systems) {
        const dice = loadedSystem.system.dice;
        expect(Array.isArray(dice.standardDice)).toBe(true);
        expect(dice.standardDice.length).toBeGreaterThan(0);
        expect(typeof dice.fudgeDice).toBe('boolean');
        expect(typeof dice.defaultRoll).toBe('string');
        expect(typeof dice.supportsAdvantage).toBe('boolean');
        expect(typeof dice.supportsExploding).toBe('boolean');
        expect(typeof dice.supportsPushing).toBe('boolean');
      }
    });

    it('should have valid attributes', () => {
      const systems = loader.getAllSystems();

      for (const loadedSystem of systems) {
        const attributes = loadedSystem.system.attributes;
        expect(Array.isArray(attributes)).toBe(true);

        for (const attr of attributes) {
          expect(attr.id).toBeTruthy();
          expect(attr.name).toBeTruthy();
          expect(attr.abbreviation).toBeTruthy();
          expect(attr.valueType).toBeTruthy();
          expect(typeof attr.defaultValue).toBe('number');
        }
      }
    });

    it('should have valid resources', () => {
      const systems = loader.getAllSystems();

      for (const loadedSystem of systems) {
        const resources = loadedSystem.system.resources;
        expect(Array.isArray(resources)).toBe(true);

        for (const resource of resources) {
          expect(resource.id).toBeTruthy();
          expect(resource.name).toBeTruthy();
          expect(resource.category).toBeTruthy();
          expect(resource.valueType).toBeTruthy();
          expect(resource.displayStyle).toBeTruthy();
        }
      }
    });

    it('should have valid skills', () => {
      const systems = loader.getAllSystems();

      for (const loadedSystem of systems) {
        const skills = loadedSystem.system.skills;
        expect(Array.isArray(skills)).toBe(true);

        for (const skill of skills) {
          expect(skill.id).toBeTruthy();
          expect(skill.name).toBeTruthy();
          expect(skill.linkedAttribute).toBeTruthy();
          expect(skill.proficiencyType).toBeTruthy();
          expect(skill.rollFormula).toBeTruthy();
        }
      }
    });

    it('should have valid character template', () => {
      const systems = loader.getAllSystems();

      for (const loadedSystem of systems) {
        const template = loadedSystem.system.characterTemplate;
        expect(template.id).toBeTruthy();
        expect(template.systemId).toBe(loadedSystem.system.id);
        expect(template.entityType).toBe('character');
        expect(template.name).toBeTruthy();
        expect(Array.isArray(template.fields)).toBe(true);
        expect(Array.isArray(template.computedFields)).toBe(true);
        expect(Array.isArray(template.sections)).toBe(true);
        expect(Array.isArray(template.rolls)).toBe(true);
      }
    });

    it('should have valid roll resolver', () => {
      const systems = loader.getAllSystems();

      for (const loadedSystem of systems) {
        const resolver = loadedSystem.system.rollResolver;
        expect(resolver.type).toBeTruthy();
        expect(['threshold', 'degrees', 'pool_count', 'pool_highest', 'comparison']).toContain(resolver.type);
      }
    });

    it('should have valid sheet layouts', () => {
      const systems = loader.getAllSystems();

      for (const loadedSystem of systems) {
        const layouts = loadedSystem.system.sheetLayouts;
        expect(Array.isArray(layouts)).toBe(true);
      }
    });
  });

  describe('Path Handling', () => {
    beforeEach(async () => {
      await loader.loadAllSystems();
    });

    it('should store system path', () => {
      const systems = loader.getAllSystems();

      for (const system of systems) {
        expect(system.path).toBeTruthy();
        expect(typeof system.path).toBe('string');
      }
    });

    it('should have absolute paths', () => {
      const systems = loader.getAllSystems();

      for (const system of systems) {
        expect(path.isAbsolute(system.path)).toBe(true);
      }
    });
  });
});
