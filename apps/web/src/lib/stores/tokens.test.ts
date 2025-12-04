import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { tokensStore } from './tokens';
import type { Token } from '@vtt/shared';

describe('tokens store', () => {
  const mockToken1: Token = {
    id: 'token-1',
    gameId: 'game-1',
    sceneId: 'scene-1',
    name: 'Hero Token',
    x: 100,
    y: 200,
    width: 50,
    height: 50,
    imageUrl: '/hero.png',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockToken2: Token = {
    id: 'token-2',
    gameId: 'game-1',
    sceneId: 'scene-1',
    name: 'Monster Token',
    x: 300,
    y: 400,
    width: 75,
    height: 75,
    imageUrl: '/monster.png',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset store to initial state
    tokensStore.clear();
    // Setup default localStorage mock
    global.localStorage.getItem = vi.fn().mockReturnValue('session-token-123');
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(tokensStore);
      expect(state.tokens).toBeInstanceOf(Map);
      expect(state.tokens.size).toBe(0);
      expect(state.selectedTokenId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadTokens', () => {
    it('should load tokens successfully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tokens: [mockToken1, mockToken2] }),
      } as Response);

      await tokensStore.loadTokens('game-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games/game-1/tokens',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer session-token-123',
          },
        })
      );

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(2);
      expect(state.tokens.get('token-1')).toEqual(mockToken1);
      expect(state.tokens.get('token-2')).toEqual(mockToken2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle no token error', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue(null);
      global.sessionStorage.getItem = vi.fn().mockReturnValue(null);

      await tokensStore.loadTokens('game-1');

      const state = get(tokensStore);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('No authentication token found');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API error response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await tokensStore.loadTokens('game-1');

      const state = get(tokensStore);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch tokens: Not Found');
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await tokensStore.loadTokens('game-1');

      const state = get(tokensStore);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('should check sessionStorage if localStorage has no token', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue(null);
      global.sessionStorage.getItem = vi.fn().mockReturnValue('session-storage-token');

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tokens: [mockToken1] }),
      } as Response);

      await tokensStore.loadTokens('game-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games/game-1/tokens',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer session-storage-token',
          },
        })
      );
    });

    it('should handle empty tokens array', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tokens: [] }),
      } as Response);

      await tokensStore.loadTokens('game-1');

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('addToken', () => {
    it('should add token to store', () => {
      tokensStore.addToken(mockToken1);

      const state = get(tokensStore);
      expect(state.tokens.get('token-1')).toEqual(mockToken1);
      expect(state.tokens.size).toBe(1);
    });

    it('should add multiple tokens', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.addToken(mockToken2);

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(2);
      expect(state.tokens.get('token-1')).toEqual(mockToken1);
      expect(state.tokens.get('token-2')).toEqual(mockToken2);
    });

    it('should overwrite existing token with same ID', () => {
      tokensStore.addToken(mockToken1);

      const updatedToken = { ...mockToken1, name: 'Updated Hero' };
      tokensStore.addToken(updatedToken);

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(1);
      expect(state.tokens.get('token-1')?.name).toBe('Updated Hero');
    });
  });

  describe('moveToken', () => {
    it('should update token position', () => {
      tokensStore.addToken(mockToken1);

      tokensStore.moveToken('token-1', 500, 600);

      const state = get(tokensStore);
      const token = state.tokens.get('token-1');
      expect(token?.x).toBe(500);
      expect(token?.y).toBe(600);
      expect(token?.name).toBe('Hero Token'); // Other properties unchanged
    });

    it('should handle moving non-existent token', () => {
      tokensStore.addToken(mockToken1);

      tokensStore.moveToken('nonexistent', 500, 600);

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(1);
      expect(state.tokens.get('nonexistent')).toBeUndefined();
    });

    it('should allow moving to zero coordinates', () => {
      tokensStore.addToken(mockToken1);

      tokensStore.moveToken('token-1', 0, 0);

      const state = get(tokensStore);
      const token = state.tokens.get('token-1');
      expect(token?.x).toBe(0);
      expect(token?.y).toBe(0);
    });
  });

  describe('updateToken', () => {
    it('should update token with partial data', () => {
      tokensStore.addToken(mockToken1);

      tokensStore.updateToken('token-1', { name: 'Updated Hero' });

      const state = get(tokensStore);
      const token = state.tokens.get('token-1');
      expect(token?.name).toBe('Updated Hero');
      expect(token?.x).toBe(100); // Other properties unchanged
      expect(token?.y).toBe(200);
    });

    it('should handle updating non-existent token', () => {
      tokensStore.addToken(mockToken1);

      tokensStore.updateToken('nonexistent', { name: 'New Name' });

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(1);
      expect(state.tokens.get('nonexistent')).toBeUndefined();
    });

    it('should update multiple properties', () => {
      tokensStore.addToken(mockToken1);

      tokensStore.updateToken('token-1', {
        name: 'New Name',
        x: 999,
        y: 888,
        width: 100,
      });

      const state = get(tokensStore);
      const token = state.tokens.get('token-1');
      expect(token?.name).toBe('New Name');
      expect(token?.x).toBe(999);
      expect(token?.y).toBe(888);
      expect(token?.width).toBe(100);
      expect(token?.height).toBe(50); // Unchanged property
    });
  });

  describe('removeToken', () => {
    it('should remove token from store', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.addToken(mockToken2);

      tokensStore.removeToken('token-1');

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(1);
      expect(state.tokens.get('token-1')).toBeUndefined();
      expect(state.tokens.get('token-2')).toEqual(mockToken2);
    });

    it('should clear selectedTokenId when selected token is removed', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.selectToken('token-1');

      tokensStore.removeToken('token-1');

      const state = get(tokensStore);
      expect(state.selectedTokenId).toBeNull();
    });

    it('should not change selectedTokenId when different token removed', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.addToken(mockToken2);
      tokensStore.selectToken('token-1');

      tokensStore.removeToken('token-2');

      const state = get(tokensStore);
      expect(state.selectedTokenId).toBe('token-1');
    });

    it('should handle removing non-existent token gracefully', () => {
      tokensStore.addToken(mockToken1);

      tokensStore.removeToken('nonexistent');

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(1);
      expect(state.tokens.get('token-1')).toEqual(mockToken1);
    });
  });

  describe('selectToken', () => {
    it('should select a token', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.selectToken('token-1');

      const state = get(tokensStore);
      expect(state.selectedTokenId).toBe('token-1');
    });

    it('should allow deselecting by passing null', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.selectToken('token-1');
      tokensStore.selectToken(null);

      const state = get(tokensStore);
      expect(state.selectedTokenId).toBeNull();
    });

    it('should change selected token', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.addToken(mockToken2);

      tokensStore.selectToken('token-1');
      let state = get(tokensStore);
      expect(state.selectedTokenId).toBe('token-1');

      tokensStore.selectToken('token-2');
      state = get(tokensStore);
      expect(state.selectedTokenId).toBe('token-2');
    });
  });

  describe('getToken', () => {
    it('should get token by ID', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.addToken(mockToken2);

      const state = get(tokensStore);
      const token = tokensStore.getToken('token-1', state);

      expect(token).toEqual(mockToken1);
    });

    it('should return undefined for non-existent token', () => {
      const state = get(tokensStore);
      const token = tokensStore.getToken('nonexistent', state);

      expect(token).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all tokens and reset state', () => {
      tokensStore.addToken(mockToken1);
      tokensStore.addToken(mockToken2);
      tokensStore.selectToken('token-1');

      tokensStore.clear();

      const state = get(tokensStore);
      expect(state.tokens.size).toBe(0);
      expect(state.selectedTokenId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
