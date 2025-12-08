import { describe, it, expect } from 'vitest';
import type {
  Scene,
  CreateSceneRequest,
  UpdateSceneRequest,
  SceneResponse,
  ScenesListResponse,
} from './scene.js';

describe('Scene Types', () => {
  describe('Scene', () => {
    it('should have correct structure for basic scene', () => {
      const scene: Scene = {
        id: 'scene123',
        campaignId: 'game123',
        name: 'Dungeon Level 1',
        active: true,
        backgroundImage: null,
        backgroundWidth: null,
        backgroundHeight: null,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#000000',
        gridAlpha: 0.2,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 5,
        gridUnits: 'ft',
        tokenVision: true,
        fogExploration: true,
        globalLight: false,
        darkness: 0,
        initialX: null,
        initialY: null,
        initialScale: 1.0,
        navOrder: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(scene.id).toBe('scene123');
      expect(scene.campaignId).toBe('game123');
      expect(scene.name).toBe('Dungeon Level 1');
      expect(scene.active).toBe(true);
    });

    it('should handle scene with background image', () => {
      const scene: Scene = {
        id: 'scene1',
        campaignId: 'game1',
        name: 'Battle Map',
        active: false,
        backgroundImage: 'https://example.com/map.jpg',
        backgroundWidth: 2000,
        backgroundHeight: 1500,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#ffffff',
        gridAlpha: 0.3,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 5,
        gridUnits: 'ft',
        tokenVision: false,
        fogExploration: false,
        globalLight: true,
        darkness: 0,
        initialX: 100,
        initialY: 200,
        initialScale: 0.5,
        navOrder: 1,
        data: { description: 'A battle scene' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(scene.backgroundImage).toBe('https://example.com/map.jpg');
      expect(scene.backgroundWidth).toBe(2000);
      expect(scene.backgroundHeight).toBe(1500);
    });

    it('should handle different grid types', () => {
      const hexScene: Scene = {
        id: 's1',
        campaignId: 'g1',
        name: 'Hex Map',
        active: true,
        gridType: 'hex',
        gridSize: 60,
        gridColor: '#00ff00',
        gridAlpha: 0.5,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 5,
        gridUnits: 'm',
        tokenVision: true,
        fogExploration: false,
        globalLight: false,
        darkness: 0,
        initialScale: 1.0,
        navOrder: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(hexScene.gridType).toBe('hex');
      expect(hexScene.gridSize).toBe(60);
    });

    it('should handle various grid colors', () => {
      const scene: Scene = {
        id: 's1',
        campaignId: 'g1',
        name: 'Scene',
        active: true,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#ff0000',
        gridAlpha: 1.0,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 10,
        gridUnits: 'ft',
        tokenVision: true,
        fogExploration: true,
        globalLight: false,
        darkness: 0,
        initialScale: 1.0,
        navOrder: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(scene.gridColor).toBe('#ff0000');
      expect(scene.gridAlpha).toBe(1.0);
    });

    it('should handle vision settings', () => {
      const scene: Scene = {
        id: 's1',
        campaignId: 'g1',
        name: 'Dark dungeon',
        active: true,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#000000',
        gridAlpha: 0.2,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 5,
        gridUnits: 'ft',
        tokenVision: true,
        fogExploration: true,
        globalLight: false,
        darkness: 0.8,
        initialScale: 1.0,
        navOrder: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(scene.tokenVision).toBe(true);
      expect(scene.fogExploration).toBe(true);
      expect(scene.globalLight).toBe(false);
      expect(scene.darkness).toBe(0.8);
    });

    it('should handle initial view settings', () => {
      const scene: Scene = {
        id: 's1',
        campaignId: 'g1',
        name: 'Scene',
        active: true,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#000000',
        gridAlpha: 0.2,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 5,
        gridUnits: 'ft',
        tokenVision: true,
        fogExploration: true,
        globalLight: false,
        darkness: 0,
        initialX: 500,
        initialY: 300,
        initialScale: 2.0,
        navOrder: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(scene.initialX).toBe(500);
      expect(scene.initialY).toBe(300);
      expect(scene.initialScale).toBe(2.0);
    });

    it('should handle navigation order', () => {
      const scene: Scene = {
        id: 's1',
        campaignId: 'g1',
        name: 'Scene',
        active: true,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#000000',
        gridAlpha: 0.2,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 5,
        gridUnits: 'ft',
        tokenVision: true,
        fogExploration: true,
        globalLight: false,
        darkness: 0,
        initialScale: 1.0,
        navOrder: 5,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(scene.navOrder).toBe(5);
    });

    it('should handle different grid units', () => {
      const metersScene: Scene = {
        id: 's1',
        campaignId: 'g1',
        name: 'Metric Map',
        active: true,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#000000',
        gridAlpha: 0.2,
        gridVisible: true,
        gridLineWidth: 1,
        gridDistance: 1.5,
        gridUnits: 'm',
        tokenVision: true,
        fogExploration: true,
        globalLight: false,
        darkness: 0,
        initialScale: 1.0,
        navOrder: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(metersScene.gridUnits).toBe('m');
      expect(metersScene.gridDistance).toBe(1.5);
    });
  });

  describe('CreateSceneRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateSceneRequest = {
        name: 'New Scene',
        campaignId: 'game123',
      };

      expect(request.name).toBe('New Scene');
      expect(request.campaignId).toBe('game123');
    });

    it('should handle all optional fields', () => {
      const request: CreateSceneRequest = {
        name: 'Complete Scene',
        campaignId: 'game123',
        active: true,
        backgroundImage: 'https://example.com/bg.jpg',
        backgroundWidth: 1920,
        backgroundHeight: 1080,
        gridType: 'hex',
        gridSize: 60,
        gridColor: '#0000ff',
        gridAlpha: 0.4,
        gridDistance: 10,
        gridUnits: 'm',
        tokenVision: false,
        fogExploration: false,
        globalLight: true,
        darkness: 0.5,
        initialX: 250,
        initialY: 150,
        initialScale: 1.5,
        navOrder: 3,
        data: { custom: 'value' },
      };

      expect(request.active).toBe(true);
      expect(request.gridType).toBe('hex');
      expect(request.tokenVision).toBe(false);
    });

    it('should handle null background image', () => {
      const request: CreateSceneRequest = {
        name: 'Scene',
        campaignId: 'game1',
        backgroundImage: null,
        backgroundWidth: null,
        backgroundHeight: null,
      };

      expect(request.backgroundImage).toBeNull();
      expect(request.backgroundWidth).toBeNull();
      expect(request.backgroundHeight).toBeNull();
    });

    it('should handle null initial position', () => {
      const request: CreateSceneRequest = {
        name: 'Scene',
        campaignId: 'game1',
        initialX: null,
        initialY: null,
      };

      expect(request.initialX).toBeNull();
      expect(request.initialY).toBeNull();
    });
  });

  describe('UpdateSceneRequest', () => {
    it('should allow updating name only', () => {
      const request: UpdateSceneRequest = {
        name: 'Updated Scene Name',
      };

      expect(request.name).toBe('Updated Scene Name');
    });

    it('should allow updating active state', () => {
      const request: UpdateSceneRequest = {
        active: true,
      };

      expect(request.active).toBe(true);
    });

    it('should allow updating background', () => {
      const request: UpdateSceneRequest = {
        backgroundImage: 'https://example.com/new-bg.jpg',
        backgroundWidth: 2560,
        backgroundHeight: 1440,
      };

      expect(request.backgroundImage).toBe('https://example.com/new-bg.jpg');
      expect(request.backgroundWidth).toBe(2560);
    });

    it('should allow updating grid settings', () => {
      const request: UpdateSceneRequest = {
        gridType: 'hex',
        gridSize: 70,
        gridColor: '#00ff00',
        gridAlpha: 0.6,
        gridDistance: 8,
        gridUnits: 'ft',
      };

      expect(request.gridType).toBe('hex');
      expect(request.gridSize).toBe(70);
    });

    it('should allow updating vision settings', () => {
      const request: UpdateSceneRequest = {
        tokenVision: false,
        fogExploration: false,
        globalLight: true,
        darkness: 0.3,
      };

      expect(request.tokenVision).toBe(false);
      expect(request.globalLight).toBe(true);
      expect(request.darkness).toBe(0.3);
    });

    it('should allow updating view settings', () => {
      const request: UpdateSceneRequest = {
        initialX: 400,
        initialY: 300,
        initialScale: 0.75,
      };

      expect(request.initialX).toBe(400);
      expect(request.initialScale).toBe(0.75);
    });

    it('should allow updating navigation order', () => {
      const request: UpdateSceneRequest = {
        navOrder: 10,
      };

      expect(request.navOrder).toBe(10);
    });

    it('should allow clearing background image', () => {
      const request: UpdateSceneRequest = {
        backgroundImage: null,
        backgroundWidth: null,
        backgroundHeight: null,
      };

      expect(request.backgroundImage).toBeNull();
    });
  });

  describe('SceneResponse', () => {
    it('should have correct structure', () => {
      const response: SceneResponse = {
        scene: {
          id: 'scene123',
          campaignId: 'game123',
          name: 'Scene',
          active: true,
          gridType: 'square',
          gridSize: 50,
          gridColor: '#000000',
          gridAlpha: 0.2,
          gridDistance: 5,
          gridUnits: 'ft',
          tokenVision: true,
          fogExploration: true,
          globalLight: false,
          darkness: 0,
          initialScale: 1.0,
          navOrder: 0,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(response.scene).toBeDefined();
      expect(response.scene.id).toBe('scene123');
    });
  });

  describe('ScenesListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: ScenesListResponse = {
        scenes: [],
      };

      expect(response.scenes).toHaveLength(0);
    });

    it('should have correct structure with multiple scenes', () => {
      const response: ScenesListResponse = {
        scenes: [
          {
            id: 'scene1',
            campaignId: 'game1',
            name: 'Scene 1',
            active: true,
            gridType: 'square',
            gridSize: 50,
            gridColor: '#000000',
            gridAlpha: 0.2,
            gridVisible: true,
            gridLineWidth: 1,
            gridDistance: 5,
            gridUnits: 'ft',
            tokenVision: true,
            fogExploration: true,
            globalLight: false,
            darkness: 0,
            initialScale: 1.0,
            navOrder: 0,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'scene2',
            campaignId: 'game1',
            name: 'Scene 2',
            active: false,
            gridType: 'hex',
            gridSize: 60,
            gridColor: '#ffffff',
            gridAlpha: 0.3,
            gridVisible: true,
            gridLineWidth: 1,
            gridDistance: 5,
            gridUnits: 'm',
            tokenVision: false,
            fogExploration: false,
            globalLight: true,
            darkness: 0,
            initialScale: 1.0,
            navOrder: 1,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(response.scenes).toHaveLength(2);
      expect(response.scenes[0].id).toBe('scene1');
      expect(response.scenes[1].id).toBe('scene2');
    });
  });
});
