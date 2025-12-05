import { describe, it, expect } from 'vitest';
import type {
  AmbientLight,
  CreateAmbientLightRequest,
  UpdateAmbientLightRequest,
  AmbientLightResponse,
  AmbientLightsListResponse,
} from './ambientLight.js';

describe('AmbientLight Types', () => {
  describe('AmbientLight', () => {
    it('should have correct structure for basic ambient light', () => {
      const light: AmbientLight = {
        id: 'light123',
        sceneId: 'scene123',
        x: 100,
        y: 100,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.id).toBe('light123');
      expect(light.sceneId).toBe('scene123');
      expect(light.x).toBe(100);
      expect(light.y).toBe(100);
    });

    it('should handle light with rotation', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 200,
        y: 200,
        rotation: 45,
        bright: 15,
        dim: 30,
        angle: 90,
        color: '#ff9900',
        alpha: 0.8,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.rotation).toBe(45);
      expect(light.angle).toBe(90);
    });

    it('should handle different light ranges', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 20,
        dim: 40,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.bright).toBe(20);
      expect(light.dim).toBe(40);
    });

    it('should handle different colors', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ff0000',
        alpha: 0.5,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.color).toBe('#ff0000');
      expect(light.alpha).toBe(0.5);
    });

    it('should handle torch-like light with animation', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ff9900',
        alpha: 1.0,
        animationType: 'pulse',
        animationSpeed: 2,
        animationIntensity: 3,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.animationType).toBe('pulse');
      expect(light.animationSpeed).toBe(2);
      expect(light.animationIntensity).toBe(3);
    });

    it('should handle different animation types', () => {
      const animationTypes = ['pulse', 'flicker', 'wave', 'sunburst'];

      animationTypes.forEach((type) => {
        const light: AmbientLight = {
          id: 'light1',
          sceneId: 'scene1',
          x: 0,
          y: 0,
          rotation: 0,
          bright: 10,
          dim: 20,
          angle: 360,
          color: '#ffffff',
          alpha: 1.0,
          animationType: type,
          animationSpeed: 1,
          animationIntensity: 5,
          walls: true,
          vision: true,
          data: {},
          createdAt: new Date(),
        };

        expect(light.animationType).toBe(type);
      });
    });

    it('should handle light without animation', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 0,
        animationIntensity: 0,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.animationType).toBeNull();
      expect(light.animationSpeed).toBe(0);
      expect(light.animationIntensity).toBe(0);
    });

    it('should handle wall blocking', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.walls).toBe(true);
    });

    it('should handle light that ignores walls', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: false,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.walls).toBe(false);
    });

    it('should handle vision setting', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: false,
        data: {},
        createdAt: new Date(),
      };

      expect(light.vision).toBe(false);
    });

    it('should handle directional light', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 90,
        bright: 10,
        dim: 20,
        angle: 45,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };

      expect(light.rotation).toBe(90);
      expect(light.angle).toBe(45);
    });

    it('should handle custom data', () => {
      const light: AmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: { source: 'magical', dispellable: true },
        createdAt: new Date(),
      };

      expect(light.data.source).toBe('magical');
      expect(light.data.dispellable).toBe(true);
    });
  });

  describe('CreateAmbientLightRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateAmbientLightRequest = {
        sceneId: 'scene123',
        x: 100,
        y: 100,
      };

      expect(request.sceneId).toBe('scene123');
      expect(request.x).toBe(100);
      expect(request.y).toBe(100);
    });

    it('should handle all optional fields', () => {
      const request: CreateAmbientLightRequest = {
        sceneId: 'scene123',
        x: 100,
        y: 100,
        rotation: 45,
        bright: 15,
        dim: 30,
        angle: 90,
        color: '#ff9900',
        alpha: 0.8,
        animationType: 'pulse',
        animationSpeed: 2,
        animationIntensity: 3,
        walls: true,
        vision: true,
        data: { note: 'Campfire' },
      };

      expect(request.rotation).toBe(45);
      expect(request.bright).toBe(15);
      expect(request.dim).toBe(30);
      expect(request.angle).toBe(90);
      expect(request.color).toBe('#ff9900');
      expect(request.animationType).toBe('pulse');
    });

    it('should handle omnidirectional light', () => {
      const request: CreateAmbientLightRequest = {
        sceneId: 'scene123',
        x: 100,
        y: 100,
        angle: 360,
      };

      expect(request.angle).toBe(360);
    });

    it('should handle spotlight', () => {
      const request: CreateAmbientLightRequest = {
        sceneId: 'scene123',
        x: 100,
        y: 100,
        rotation: 180,
        angle: 60,
        bright: 20,
        dim: 40,
      };

      expect(request.rotation).toBe(180);
      expect(request.angle).toBe(60);
    });

    it('should handle colored light', () => {
      const request: CreateAmbientLightRequest = {
        sceneId: 'scene123',
        x: 100,
        y: 100,
        color: '#00ff00',
        alpha: 0.6,
      };

      expect(request.color).toBe('#00ff00');
      expect(request.alpha).toBe(0.6);
    });

    it('should handle animated light', () => {
      const request: CreateAmbientLightRequest = {
        sceneId: 'scene123',
        x: 100,
        y: 100,
        animationType: 'flicker',
        animationSpeed: 3,
        animationIntensity: 7,
      };

      expect(request.animationType).toBe('flicker');
      expect(request.animationSpeed).toBe(3);
      expect(request.animationIntensity).toBe(7);
    });

    it('should handle null animation', () => {
      const request: CreateAmbientLightRequest = {
        sceneId: 'scene123',
        x: 100,
        y: 100,
        animationType: null,
      };

      expect(request.animationType).toBeNull();
    });
  });

  describe('UpdateAmbientLightRequest', () => {
    it('should allow updating position', () => {
      const request: UpdateAmbientLightRequest = {
        x: 200,
        y: 200,
      };

      expect(request.x).toBe(200);
      expect(request.y).toBe(200);
    });

    it('should allow updating rotation', () => {
      const request: UpdateAmbientLightRequest = {
        rotation: 90,
      };

      expect(request.rotation).toBe(90);
    });

    it('should allow updating brightness', () => {
      const request: UpdateAmbientLightRequest = {
        bright: 25,
        dim: 50,
      };

      expect(request.bright).toBe(25);
      expect(request.dim).toBe(50);
    });

    it('should allow updating angle', () => {
      const request: UpdateAmbientLightRequest = {
        angle: 120,
      };

      expect(request.angle).toBe(120);
    });

    it('should allow updating color', () => {
      const request: UpdateAmbientLightRequest = {
        color: '#0000ff',
        alpha: 0.7,
      };

      expect(request.color).toBe('#0000ff');
      expect(request.alpha).toBe(0.7);
    });

    it('should allow updating animation', () => {
      const request: UpdateAmbientLightRequest = {
        animationType: 'wave',
        animationSpeed: 2,
        animationIntensity: 6,
      };

      expect(request.animationType).toBe('wave');
      expect(request.animationSpeed).toBe(2);
      expect(request.animationIntensity).toBe(6);
    });

    it('should allow clearing animation', () => {
      const request: UpdateAmbientLightRequest = {
        animationType: null,
      };

      expect(request.animationType).toBeNull();
    });

    it('should allow updating walls setting', () => {
      const request: UpdateAmbientLightRequest = {
        walls: false,
      };

      expect(request.walls).toBe(false);
    });

    it('should allow updating vision setting', () => {
      const request: UpdateAmbientLightRequest = {
        vision: false,
      };

      expect(request.vision).toBe(false);
    });

    it('should allow updating custom data', () => {
      const request: UpdateAmbientLightRequest = {
        data: { intensity: 'high', flickering: true },
      };

      expect(request.data).toEqual({ intensity: 'high', flickering: true });
    });

    it('should allow updating multiple fields', () => {
      const request: UpdateAmbientLightRequest = {
        x: 150,
        y: 150,
        bright: 20,
        dim: 40,
        color: '#ffff00',
      };

      expect(request.x).toBe(150);
      expect(request.bright).toBe(20);
      expect(request.color).toBe('#ffff00');
    });
  });

  describe('AmbientLightResponse', () => {
    it('should have correct structure', () => {
      const response: AmbientLightResponse = {
        ambientLight: {
          id: 'light123',
          sceneId: 'scene123',
          x: 100,
          y: 100,
          rotation: 0,
          bright: 10,
          dim: 20,
          angle: 360,
          color: '#ffffff',
          alpha: 1.0,
          animationType: null,
          animationSpeed: 1,
          animationIntensity: 5,
          walls: true,
          vision: true,
          data: {},
          createdAt: new Date(),
        },
      };

      expect(response.ambientLight).toBeDefined();
      expect(response.ambientLight.id).toBe('light123');
    });
  });

  describe('AmbientLightsListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: AmbientLightsListResponse = {
        ambientLights: [],
      };

      expect(response.ambientLights).toHaveLength(0);
    });

    it('should have correct structure with multiple lights', () => {
      const response: AmbientLightsListResponse = {
        ambientLights: [
          {
            id: 'light1',
            sceneId: 'scene1',
            x: 100,
            y: 100,
            rotation: 0,
            bright: 10,
            dim: 20,
            angle: 360,
            color: '#ffffff',
            alpha: 1.0,
            animationType: null,
            animationSpeed: 1,
            animationIntensity: 5,
            walls: true,
            vision: true,
            data: {},
            createdAt: new Date(),
          },
          {
            id: 'light2',
            sceneId: 'scene1',
            x: 200,
            y: 200,
            rotation: 45,
            bright: 15,
            dim: 30,
            angle: 90,
            color: '#ff9900',
            alpha: 0.8,
            animationType: 'pulse',
            animationSpeed: 2,
            animationIntensity: 3,
            walls: true,
            vision: true,
            data: {},
            createdAt: new Date(),
          },
        ],
      };

      expect(response.ambientLights).toHaveLength(2);
      expect(response.ambientLights[0].id).toBe('light1');
      expect(response.ambientLights[1].id).toBe('light2');
      expect(response.ambientLights[0].color).toBe('#ffffff');
      expect(response.ambientLights[1].animationType).toBe('pulse');
    });
  });
});
