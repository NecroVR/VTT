import { describe, it, expect, beforeEach } from 'vitest';
import { FoundrySceneParser } from '../sceneParser';
import type { RawImportItem, FoundryScene } from '@vtt/shared';
import foundrySceneSample from './fixtures/foundrySceneSample.json';

describe('FoundrySceneParser', () => {
  let parser: FoundrySceneParser;

  beforeEach(() => {
    parser = new FoundrySceneParser();
  });

  describe('parse', () => {
    it('should parse a Foundry scene', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result).toBeDefined();
      expect(result.entityType).toBe('scene');
      expect(result.entityId).toBe('foundry-scene789');
      expect(result.name).toBe('The Rusty Dragon Tavern');
      expect(result.sourceId).toBe('scene789');
    });

    it('should extract scene background correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.img).toBe('scenes/tavern-interior.webp');
      expect(result.data.background).toBeDefined();
      expect(result.data.background.src).toBe('scenes/tavern-interior.webp');
    });

    it('should extract scene dimensions correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.width).toBe(4000);
      expect(result.data.height).toBe(3000);
    });

    it('should extract grid settings correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.grid).toBeDefined();
      expect(result.data.grid.size).toBe(100);
      expect(result.data.grid.type).toBe('square');
      expect(result.data.grid.distance).toBe(5);
      expect(result.data.grid.units).toBe('ft');
    });

    it('should extract navigation setting correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.navigation).toBe(true);
    });

    it('should extract walls correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.walls).toBeDefined();
      expect(result.data.walls).toHaveLength(2);
      expect(result.data.walls[0]).toMatchObject({
        id: 'wall001',
        c: [0, 0, 0, 1000],
        move: 20,
        sight: 20,
        sound: 20
      });
    });

    it('should extract lights correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.lights).toBeDefined();
      expect(result.data.lights).toHaveLength(1);
      expect(result.data.lights[0]).toMatchObject({
        id: 'light001',
        x: 500,
        y: 500,
        bright: 20,
        dim: 40,
        angle: 360,
        color: '#ff9329'
      });
    });

    it('should extract tokens correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.tokens).toBeDefined();
      expect(result.data.tokens).toHaveLength(1);
      expect(result.data.tokens[0]).toMatchObject({
        id: 'token001',
        name: 'Thorin Ironforge',
        x: 1000,
        y: 1500,
        width: 1,
        height: 1,
        disposition: 'friendly'
      });
    });

    it('should map grid type correctly', async () => {
      const hexScene = {
        ...foundrySceneSample,
        grid: { size: 100, type: 2 }
      };

      const item: RawImportItem = {
        sourceId: hexScene._id,
        name: hexScene.name,
        type: 'scene',
        data: hexScene as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.grid.type).toBe('hexRowsOdd');
    });

    it('should map token disposition correctly', async () => {
      const sceneWithHostileToken = {
        ...foundrySceneSample,
        tokens: [
          {
            _id: 'token002',
            name: 'Goblin',
            x: 2000,
            y: 2000,
            disposition: -1
          }
        ]
      };

      const item: RawImportItem = {
        sourceId: sceneWithHostileToken._id,
        name: sceneWithHostileToken.name,
        type: 'scene',
        data: sceneWithHostileToken as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.tokens[0].disposition).toBe('hostile');
    });

    it('should handle scenes without walls, lights, or tokens', async () => {
      const emptyScene = {
        ...foundrySceneSample,
        walls: [],
        lights: [],
        tokens: []
      };

      const item: RawImportItem = {
        sourceId: emptyScene._id,
        name: emptyScene.name,
        type: 'scene',
        data: emptyScene as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.data.walls).toEqual([]);
      expect(result.data.lights).toEqual([]);
      expect(result.data.tokens).toEqual([]);
    });

    it('should extract description from flags if present', async () => {
      const item: RawImportItem = {
        sourceId: foundrySceneSample._id,
        name: foundrySceneSample.name,
        type: 'scene',
        data: foundrySceneSample as FoundryScene
      };

      const result = await parser.parse(item);

      expect(result.description).toContain('The Rusty Dragon is a popular tavern');
    });
  });
});
