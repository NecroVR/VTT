import { describe, it, expect } from 'vitest';
import type {
  Wall,
  CreateWallRequest,
  UpdateWallRequest,
  WallResponse,
  WallsListResponse,
} from './wall';

describe('Wall Types', () => {
  describe('Wall', () => {
    it('should have correct structure for basic wall', () => {
      const wall: Wall = {
        id: 'wall123',
        sceneId: 'scene123',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.id).toBe('wall123');
      expect(wall.sceneId).toBe('scene123');
      expect(wall.x1).toBe(0);
      expect(wall.y1).toBe(0);
      expect(wall.x2).toBe(100);
      expect(wall.y2).toBe(0);
    });

    it('should handle horizontal wall', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 50,
        y1: 100,
        x2: 150,
        y2: 100,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.y1).toBe(wall.y2);
      expect(wall.x2).toBeGreaterThan(wall.x1);
    });

    it('should handle vertical wall', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 100,
        y1: 50,
        x2: 100,
        y2: 150,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.x1).toBe(wall.x2);
      expect(wall.y2).toBeGreaterThan(wall.y1);
    });

    it('should handle diagonal wall', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.x1).not.toBe(wall.x2);
      expect(wall.y1).not.toBe(wall.y2);
    });

    it('should handle different wall types', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'terrain',
        move: 'allow',
        sense: 'block',
        sound: 'allow',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.wallType).toBe('terrain');
    });

    it('should handle movement restrictions', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'allow',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.move).toBe('allow');
    });

    it('should handle sense restrictions', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'block',
        sense: 'allow',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.sense).toBe('allow');
    });

    it('should handle sound restrictions', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'allow',
        door: 'none',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.sound).toBe('allow');
    });

    it('should handle door with closed state', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'regular',
        doorState: 'closed',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.door).toBe('regular');
      expect(wall.doorState).toBe('closed');
    });

    it('should handle door with open state', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'allow',
        sense: 'allow',
        sound: 'allow',
        door: 'regular',
        doorState: 'open',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.doorState).toBe('open');
    });

    it('should handle door with locked state', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'regular',
        doorState: 'locked',
        data: {},
        createdAt: new Date(),
      };

      expect(wall.doorState).toBe('locked');
    });

    it('should handle custom data', () => {
      const wall: Wall = {
        id: 'w1',
        sceneId: 's1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: { isSecret: true, revealed: false },
        createdAt: new Date(),
      };

      expect(wall.data).toEqual({ isSecret: true, revealed: false });
    });
  });

  describe('CreateWallRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateWallRequest = {
        sceneId: 'scene123',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
      };

      expect(request.sceneId).toBe('scene123');
      expect(request.x1).toBe(0);
      expect(request.y1).toBe(0);
      expect(request.x2).toBe(100);
      expect(request.y2).toBe(0);
    });

    it('should handle all optional fields', () => {
      const request: CreateWallRequest = {
        sceneId: 'scene123',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallType: 'invisible',
        move: 'block',
        sense: 'allow',
        sound: 'allow',
        door: 'secret',
        doorState: 'closed',
        data: { notes: 'Secret passage' },
      };

      expect(request.wallType).toBe('invisible');
      expect(request.door).toBe('secret');
      expect(request.data).toEqual({ notes: 'Secret passage' });
    });

    it('should handle negative coordinates', () => {
      const request: CreateWallRequest = {
        sceneId: 'scene1',
        x1: -50,
        y1: -50,
        x2: 50,
        y2: 50,
      };

      expect(request.x1).toBe(-50);
      expect(request.y1).toBe(-50);
    });

    it('should handle zero-length wall (point)', () => {
      const request: CreateWallRequest = {
        sceneId: 'scene1',
        x1: 100,
        y1: 100,
        x2: 100,
        y2: 100,
      };

      expect(request.x1).toBe(request.x2);
      expect(request.y1).toBe(request.y2);
    });
  });

  describe('UpdateWallRequest', () => {
    it('should allow updating coordinates only', () => {
      const request: UpdateWallRequest = {
        x1: 50,
        y1: 50,
        x2: 150,
        y2: 150,
      };

      expect(request.x1).toBe(50);
      expect(request.x2).toBe(150);
    });

    it('should allow updating wall type', () => {
      const request: UpdateWallRequest = {
        wallType: 'ethereal',
      };

      expect(request.wallType).toBe('ethereal');
    });

    it('should allow updating movement restriction', () => {
      const request: UpdateWallRequest = {
        move: 'allow',
      };

      expect(request.move).toBe('allow');
    });

    it('should allow updating sense restriction', () => {
      const request: UpdateWallRequest = {
        sense: 'block',
      };

      expect(request.sense).toBe('block');
    });

    it('should allow updating sound restriction', () => {
      const request: UpdateWallRequest = {
        sound: 'allow',
      };

      expect(request.sound).toBe('allow');
    });

    it('should allow updating door type', () => {
      const request: UpdateWallRequest = {
        door: 'regular',
      };

      expect(request.door).toBe('regular');
    });

    it('should allow updating door state', () => {
      const request: UpdateWallRequest = {
        doorState: 'open',
      };

      expect(request.doorState).toBe('open');
    });

    it('should allow updating custom data', () => {
      const request: UpdateWallRequest = {
        data: { discovered: true },
      };

      expect(request.data).toEqual({ discovered: true });
    });

    it('should allow updating all fields', () => {
      const request: UpdateWallRequest = {
        x1: 10,
        y1: 20,
        x2: 30,
        y2: 40,
        wallType: 'force',
        move: 'block',
        sense: 'allow',
        sound: 'block',
        door: 'hidden',
        doorState: 'locked',
        data: { hp: 100 },
      };

      expect(request.x1).toBe(10);
      expect(request.wallType).toBe('force');
      expect(request.door).toBe('hidden');
    });
  });

  describe('WallResponse', () => {
    it('should have correct structure', () => {
      const response: WallResponse = {
        wall: {
          id: 'wall123',
          sceneId: 'scene123',
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          wallType: 'normal',
          move: 'block',
          sense: 'block',
          sound: 'block',
          door: 'none',
          doorState: 'closed',
          data: {},
          createdAt: new Date(),
        },
      };

      expect(response.wall).toBeDefined();
      expect(response.wall.id).toBe('wall123');
    });
  });

  describe('WallsListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: WallsListResponse = {
        walls: [],
      };

      expect(response.walls).toHaveLength(0);
    });

    it('should have correct structure with multiple walls', () => {
      const response: WallsListResponse = {
        walls: [
          {
            id: 'wall1',
            sceneId: 'scene1',
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            wallType: 'normal',
            move: 'block',
            sense: 'block',
            sound: 'block',
            door: 'none',
            doorState: 'closed',
            data: {},
            createdAt: new Date(),
          },
          {
            id: 'wall2',
            sceneId: 'scene1',
            x1: 100,
            y1: 0,
            x2: 100,
            y2: 100,
            wallType: 'normal',
            move: 'block',
            sense: 'block',
            sound: 'block',
            door: 'regular',
            doorState: 'open',
            data: {},
            createdAt: new Date(),
          },
        ],
      };

      expect(response.walls).toHaveLength(2);
      expect(response.walls[0].id).toBe('wall1');
      expect(response.walls[1].id).toBe('wall2');
      expect(response.walls[1].door).toBe('regular');
    });
  });
});
