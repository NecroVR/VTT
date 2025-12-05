import { describe, it, expect } from 'vitest';
import type {
  Campaign,
  CampaignSettings,
  Token,
  CreateTokenRequest,
  UpdateTokenRequest,
  TokenResponse,
  TokensListResponse,
  MapLayer,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignResponse,
  CampaignsListResponse,
} from './campaign.js';

describe('Campaign Types', () => {
  describe('CampaignSettings', () => {
    it('should have correct structure with square grid', () => {
      const settings: CampaignSettings = {
        gridType: 'square',
        gridSize: 50,
        snapToGrid: true,
      };

      expect(settings.gridType).toBe('square');
      expect(settings.gridSize).toBe(50);
      expect(settings.snapToGrid).toBe(true);
    });

    it('should support hex grid type', () => {
      const settings: CampaignSettings = {
        gridType: 'hex',
        gridSize: 60,
        snapToGrid: false,
      };

      expect(settings.gridType).toBe('hex');
    });

    it('should support none grid type', () => {
      const settings: CampaignSettings = {
        gridType: 'none',
        gridSize: 0,
        snapToGrid: false,
      };

      expect(settings.gridType).toBe('none');
    });

    it('should handle various grid sizes', () => {
      const settings: CampaignSettings = {
        gridType: 'square',
        gridSize: 100,
        snapToGrid: true,
      };

      expect(settings.gridSize).toBe(100);
    });
  });

  describe('Campaign', () => {
    it('should have correct structure for valid campaign', () => {
      const campaign: Campaign = {
        id: 'campaign123',
        name: 'My Campaign',
        ownerId: 'user123',
        gmUserIds: [],
        createdAt: new Date(),
        settings: {
          gridType: 'square',
          gridSize: 50,
          snapToGrid: true,
        },
      };

      expect(campaign.id).toBe('campaign123');
      expect(campaign.name).toBe('My Campaign');
      expect(campaign.ownerId).toBe('user123');
      expect(campaign.gmUserIds).toEqual([]);
      expect(campaign.createdAt).toBeInstanceOf(Date);
      expect(campaign.settings).toBeDefined();
    });

    it('should handle different campaign names', () => {
      const campaign: Campaign = {
        id: '1',
        name: 'Test Campaign: Episode 1',
        ownerId: 'owner1',
        gmUserIds: [],
        createdAt: new Date(),
        settings: { gridType: 'hex', gridSize: 40, snapToGrid: false },
      };

      expect(campaign.name).toBe('Test Campaign: Episode 1');
    });
  });

  describe('Token', () => {
    it('should have correct structure for basic token', () => {
      const token: Token = {
        id: 'token123',
        sceneId: 'scene123',
        actorId: null,
        name: 'Guard',
        imageUrl: null,
        x: 100,
        y: 200,
        width: 1,
        height: 1,
        elevation: 0,
        rotation: 0,
        locked: false,
        ownerId: null,
        visible: true,
        vision: false,
        visionRange: 0,
        bars: {},
        lightBright: 0,
        lightDim: 0,
        lightColor: null,
        lightAngle: 360,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(token.id).toBe('token123');
      expect(token.sceneId).toBe('scene123');
      expect(token.name).toBe('Guard');
      expect(token.x).toBe(100);
      expect(token.y).toBe(200);
    });

    it('should handle token with actor reference', () => {
      const token: Token = {
        id: 'token1',
        sceneId: 'scene1',
        actorId: 'actor123',
        name: 'Player Character',
        imageUrl: 'https://example.com/avatar.png',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        elevation: 0,
        rotation: 0,
        locked: false,
        ownerId: 'user123',
        visible: true,
        vision: true,
        visionRange: 60,
        bars: { hp: { value: 25, max: 30 } },
        lightBright: 20,
        lightDim: 40,
        lightColor: '#ff9900',
        lightAngle: 360,
        data: { ac: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(token.actorId).toBe('actor123');
      expect(token.vision).toBe(true);
      expect(token.visionRange).toBe(60);
    });

    it('should handle different token sizes', () => {
      const largeToken: Token = {
        id: 't1',
        sceneId: 's1',
        name: 'Dragon',
        x: 0,
        y: 0,
        width: 3,
        height: 3,
        elevation: 0,
        rotation: 0,
        locked: false,
        visible: true,
        vision: false,
        visionRange: 0,
        bars: {},
        lightBright: 0,
        lightDim: 0,
        lightAngle: 360,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(largeToken.width).toBe(3);
      expect(largeToken.height).toBe(3);
    });

    it('should handle rotation values', () => {
      const token: Token = {
        id: 't1',
        sceneId: 's1',
        name: 'Token',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        elevation: 0,
        rotation: 45,
        locked: false,
        visible: true,
        vision: false,
        visionRange: 0,
        bars: {},
        lightBright: 0,
        lightDim: 0,
        lightAngle: 360,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(token.rotation).toBe(45);
    });

    it('should handle elevation values', () => {
      const token: Token = {
        id: 't1',
        sceneId: 's1',
        name: 'Flying creature',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        elevation: 10,
        rotation: 0,
        locked: false,
        visible: true,
        vision: false,
        visionRange: 0,
        bars: {},
        lightBright: 0,
        lightDim: 0,
        lightAngle: 360,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(token.elevation).toBe(10);
    });

    it('should handle light emission', () => {
      const token: Token = {
        id: 't1',
        sceneId: 's1',
        name: 'Torch bearer',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        elevation: 0,
        rotation: 0,
        locked: false,
        visible: true,
        vision: false,
        visionRange: 0,
        bars: {},
        lightBright: 10,
        lightDim: 20,
        lightColor: '#ffaa00',
        lightAngle: 120,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(token.lightBright).toBe(10);
      expect(token.lightDim).toBe(20);
      expect(token.lightColor).toBe('#ffaa00');
      expect(token.lightAngle).toBe(120);
    });

    it('should handle locked state', () => {
      const token: Token = {
        id: 't1',
        sceneId: 's1',
        name: 'Locked token',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        elevation: 0,
        rotation: 0,
        locked: true,
        visible: true,
        vision: false,
        visionRange: 0,
        bars: {},
        lightBright: 0,
        lightDim: 0,
        lightAngle: 360,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(token.locked).toBe(true);
    });
  });

  describe('CreateTokenRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateTokenRequest = {
        sceneId: 'scene123',
        name: 'New Token',
      };

      expect(request.sceneId).toBe('scene123');
      expect(request.name).toBe('New Token');
    });

    it('should handle all optional fields', () => {
      const request: CreateTokenRequest = {
        sceneId: 'scene123',
        actorId: 'actor123',
        name: 'Complete Token',
        imageUrl: 'https://example.com/img.png',
        x: 50,
        y: 75,
        width: 2,
        height: 2,
        elevation: 5,
        rotation: 90,
        locked: true,
        ownerId: 'user123',
        visible: false,
        vision: true,
        visionRange: 30,
        bars: { hp: { value: 20, max: 20 } },
        lightBright: 15,
        lightDim: 30,
        lightColor: '#ffffff',
        lightAngle: 180,
        data: { custom: 'data' },
      };

      expect(request.actorId).toBe('actor123');
      expect(request.x).toBe(50);
      expect(request.vision).toBe(true);
    });
  });

  describe('UpdateTokenRequest', () => {
    it('should allow partial updates', () => {
      const request: UpdateTokenRequest = {
        x: 150,
        y: 200,
      };

      expect(request.x).toBe(150);
      expect(request.y).toBe(200);
    });

    it('should allow updating name only', () => {
      const request: UpdateTokenRequest = {
        name: 'Updated Name',
      };

      expect(request.name).toBe('Updated Name');
    });

    it('should allow updating visibility', () => {
      const request: UpdateTokenRequest = {
        visible: false,
      };

      expect(request.visible).toBe(false);
    });
  });

  describe('TokenResponse', () => {
    it('should have correct structure', () => {
      const response: TokenResponse = {
        token: {
          id: 'token123',
          sceneId: 'scene123',
          name: 'Token',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          elevation: 0,
          rotation: 0,
          locked: false,
          visible: true,
          vision: false,
          visionRange: 0,
          bars: {},
          lightBright: 0,
          lightDim: 0,
          lightAngle: 360,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(response.token).toBeDefined();
      expect(response.token.id).toBe('token123');
    });
  });

  describe('TokensListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: TokensListResponse = {
        tokens: [],
      };

      expect(response.tokens).toHaveLength(0);
    });

    it('should have correct structure with multiple tokens', () => {
      const response: TokensListResponse = {
        tokens: [
          {
            id: 't1',
            sceneId: 's1',
            name: 'Token 1',
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            elevation: 0,
            rotation: 0,
            locked: false,
            visible: true,
            vision: false,
            visionRange: 0,
            bars: {},
            lightBright: 0,
            lightDim: 0,
            lightAngle: 360,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 't2',
            sceneId: 's1',
            name: 'Token 2',
            x: 50,
            y: 50,
            width: 1,
            height: 1,
            elevation: 0,
            rotation: 0,
            locked: false,
            visible: true,
            vision: false,
            visionRange: 0,
            bars: {},
            lightBright: 0,
            lightDim: 0,
            lightAngle: 360,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(response.tokens).toHaveLength(2);
      expect(response.tokens[0].id).toBe('t1');
      expect(response.tokens[1].id).toBe('t2');
    });
  });

  describe('MapLayer', () => {
    it('should have correct structure for background layer', () => {
      const layer: MapLayer = {
        id: 'layer123',
        campaignId: 'campaign123',
        name: 'Background',
        type: 'background',
        visible: true,
        order: 0,
      };

      expect(layer.type).toBe('background');
      expect(layer.visible).toBe(true);
      expect(layer.order).toBe(0);
    });

    it('should support tokens layer type', () => {
      const layer: MapLayer = {
        id: 'layer2',
        campaignId: 'campaign1',
        name: 'Tokens',
        type: 'tokens',
        visible: true,
        order: 1,
      };

      expect(layer.type).toBe('tokens');
    });

    it('should support gm layer type', () => {
      const layer: MapLayer = {
        id: 'layer3',
        campaignId: 'campaign1',
        name: 'GM Layer',
        type: 'gm',
        visible: false,
        order: 2,
      };

      expect(layer.type).toBe('gm');
      expect(layer.visible).toBe(false);
    });

    it('should support effects layer type', () => {
      const layer: MapLayer = {
        id: 'layer4',
        campaignId: 'campaign1',
        name: 'Effects',
        type: 'effects',
        visible: true,
        order: 3,
      };

      expect(layer.type).toBe('effects');
    });
  });

  describe('CreateCampaignRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateCampaignRequest = {
        name: 'New Campaign',
      };

      expect(request.name).toBe('New Campaign');
    });

    it('should handle optional settings', () => {
      const request: CreateCampaignRequest = {
        name: 'Campaign with Settings',
        settings: {
          gridType: 'hex',
          gridSize: 60,
          snapToGrid: true,
        },
      };

      expect(request.settings).toBeDefined();
      expect(request.settings?.gridType).toBe('hex');
    });

    it('should handle partial settings', () => {
      const request: CreateCampaignRequest = {
        name: 'Campaign',
        settings: {
          gridSize: 40,
        },
      };

      expect(request.settings?.gridSize).toBe(40);
    });
  });

  describe('UpdateCampaignRequest', () => {
    it('should allow updating name only', () => {
      const request: UpdateCampaignRequest = {
        name: 'Updated Campaign Name',
      };

      expect(request.name).toBe('Updated Campaign Name');
    });

    it('should allow updating settings only', () => {
      const request: UpdateCampaignRequest = {
        settings: {
          gridType: 'none',
        },
      };

      expect(request.settings?.gridType).toBe('none');
    });

    it('should allow updating both name and settings', () => {
      const request: UpdateCampaignRequest = {
        name: 'New Name',
        settings: {
          gridSize: 70,
          snapToGrid: false,
        },
      };

      expect(request.name).toBe('New Name');
      expect(request.settings?.gridSize).toBe(70);
    });
  });

  describe('CampaignResponse', () => {
    it('should have correct structure', () => {
      const response: CampaignResponse = {
        campaign: {
          id: 'campaign123',
          name: 'My Campaign',
          ownerId: 'user123',
          gmUserIds: [],
          createdAt: new Date(),
          settings: {
            gridType: 'square',
            gridSize: 50,
            snapToGrid: true,
          },
        },
      };

      expect(response.campaign).toBeDefined();
      expect(response.campaign.id).toBe('campaign123');
    });
  });

  describe('CampaignsListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: CampaignsListResponse = {
        campaigns: [],
      };

      expect(response.campaigns).toHaveLength(0);
    });

    it('should have correct structure with multiple campaigns', () => {
      const response: CampaignsListResponse = {
        campaigns: [
          {
            id: 'campaign1',
            name: 'Campaign 1',
            ownerId: 'user1',
            gmUserIds: [],
            createdAt: new Date(),
            settings: { gridType: 'square', gridSize: 50, snapToGrid: true },
          },
          {
            id: 'campaign2',
            name: 'Campaign 2',
            ownerId: 'user1',
            gmUserIds: [],
            createdAt: new Date(),
            settings: { gridType: 'hex', gridSize: 60, snapToGrid: false },
          },
        ],
      };

      expect(response.campaigns).toHaveLength(2);
      expect(response.campaigns[0].id).toBe('campaign1');
      expect(response.campaigns[1].id).toBe('campaign2');
    });
  });
});
