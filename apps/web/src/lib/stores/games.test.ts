import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gamesStore } from './games';
import type { Game, CreateGameRequest, UpdateGameRequest, GamesListResponse, GameResponse } from '@vtt/shared';

describe('games store', () => {
  const mockGame1: Game = {
    id: 'game-1',
    name: 'Test Game 1',
    description: 'A test game',
    ownerId: 'user-123',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockGame2: Game = {
    id: 'game-2',
    name: 'Test Game 2',
    description: 'Another test game',
    ownerId: 'user-123',
    isActive: false,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset store to initial state
    gamesStore.reset();
    // Setup default localStorage mock
    global.localStorage.getItem = vi.fn().mockReturnValue('session-abc-123');
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(gamesStore);
      expect(state.games).toEqual([]);
      expect(state.currentGame).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchGames', () => {
    it('should fetch all games successfully', async () => {
      const mockResponse: GamesListResponse = {
        games: [mockGame1, mockGame2],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await gamesStore.fetchGames();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer session-abc-123',
          }),
        })
      );

      const state = get(gamesStore);
      expect(state.games).toEqual([mockGame1, mockGame2]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch games error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch games' }),
      } as Response);

      const result = await gamesStore.fetchGames();

      expect(result).toBe(false);
      const state = get(gamesStore);
      expect(state.games).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch games');
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await gamesStore.fetchGames();

      expect(result).toBe(false);
      const state = get(gamesStore);
      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchGame', () => {
    it('should fetch single game by ID successfully', async () => {
      const mockResponse: GameResponse = {
        game: mockGame1,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await gamesStore.fetchGame('game-1');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games/game-1',
        expect.objectContaining({
          method: 'GET',
        })
      );

      const state = get(gamesStore);
      expect(state.currentGame).toEqual(mockGame1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle game not found error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Game not found' }),
      } as Response);

      const result = await gamesStore.fetchGame('nonexistent');

      expect(result).toBe(false);
      const state = get(gamesStore);
      expect(state.currentGame).toBeNull();
      expect(state.error).toBe('Game not found');
    });
  });

  describe('createGame', () => {
    it('should create new game successfully', async () => {
      const createData: CreateGameRequest = {
        name: 'New Game',
        description: 'A new game',
      };

      const mockResponse: GameResponse = {
        game: mockGame1,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await gamesStore.createGame(createData);

      expect(result).toEqual(mockGame1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );

      const state = get(gamesStore);
      expect(state.games).toContainEqual(mockGame1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should add created game to games array', async () => {
      // Setup initial state with one game
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [mockGame1] }),
      } as Response);
      await gamesStore.fetchGames();

      // Create new game
      const createData: CreateGameRequest = {
        name: 'New Game 2',
        description: 'Another new game',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: mockGame2 }),
      } as Response);

      await gamesStore.createGame(createData);

      const state = get(gamesStore);
      expect(state.games).toHaveLength(2);
      expect(state.games).toContainEqual(mockGame1);
      expect(state.games).toContainEqual(mockGame2);
    });

    it('should handle create game error', async () => {
      const createData: CreateGameRequest = {
        name: 'New Game',
        description: 'A new game',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create game' }),
      } as Response);

      const result = await gamesStore.createGame(createData);

      expect(result).toBeNull();
      const state = get(gamesStore);
      expect(state.error).toBe('Failed to create game');
      expect(state.loading).toBe(false);
    });
  });

  describe('updateGame', () => {
    it('should update game successfully', async () => {
      // Setup initial state with games
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [mockGame1, mockGame2] }),
      } as Response);
      await gamesStore.fetchGames();

      const updateData: UpdateGameRequest = {
        name: 'Updated Game Name',
      };

      const updatedGame = { ...mockGame1, name: 'Updated Game Name' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: updatedGame }),
      } as Response);

      const result = await gamesStore.updateGame('game-1', updateData);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games/game-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      );

      const state = get(gamesStore);
      const game = state.games.find((g) => g.id === 'game-1');
      expect(game?.name).toBe('Updated Game Name');
    });

    it('should update game in games array', async () => {
      // Setup initial state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [mockGame1, mockGame2] }),
      } as Response);
      await gamesStore.fetchGames();

      const updatedGame = { ...mockGame1, name: 'New Name' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: updatedGame }),
      } as Response);

      await gamesStore.updateGame('game-1', { name: 'New Name' });

      const state = get(gamesStore);
      expect(state.games[0].name).toBe('New Name');
      expect(state.games[1]).toEqual(mockGame2); // Other games unchanged
    });

    it('should update currentGame if it matches updated game', async () => {
      // Set currentGame
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: mockGame1 }),
      } as Response);
      await gamesStore.fetchGame('game-1');

      // Setup games array
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [mockGame1] }),
      } as Response);
      await gamesStore.fetchGames();

      // Update the current game
      const updatedGame = { ...mockGame1, name: 'Updated Name' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: updatedGame }),
      } as Response);

      await gamesStore.updateGame('game-1', { name: 'Updated Name' });

      const state = get(gamesStore);
      expect(state.currentGame?.name).toBe('Updated Name');
    });

    it('should handle update game error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      } as Response);

      const result = await gamesStore.updateGame('game-1', { name: 'New Name' });

      expect(result).toBe(false);
      const state = get(gamesStore);
      expect(state.error).toBe('Update failed');
    });
  });

  describe('deleteGame', () => {
    it('should delete game successfully', async () => {
      // Setup initial state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [mockGame1, mockGame2] }),
      } as Response);
      await gamesStore.fetchGames();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await gamesStore.deleteGame('game-1');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games/game-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      const state = get(gamesStore);
      expect(state.games).toHaveLength(1);
      expect(state.games[0]).toEqual(mockGame2);
    });

    it('should remove game from games array', async () => {
      // Setup initial state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [mockGame1, mockGame2] }),
      } as Response);
      await gamesStore.fetchGames();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await gamesStore.deleteGame('game-1');

      const state = get(gamesStore);
      expect(state.games.find((g) => g.id === 'game-1')).toBeUndefined();
      expect(state.games).toContainEqual(mockGame2);
    });

    it('should clear currentGame if deleted game is current', async () => {
      // Set currentGame
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: mockGame1 }),
      } as Response);
      await gamesStore.fetchGame('game-1');

      // Delete current game
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await gamesStore.deleteGame('game-1');

      const state = get(gamesStore);
      expect(state.currentGame).toBeNull();
    });

    it('should not clear currentGame if different game is deleted', async () => {
      // Set currentGame
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: mockGame1 }),
      } as Response);
      await gamesStore.fetchGame('game-1');

      // Delete different game
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await gamesStore.deleteGame('game-2');

      const state = get(gamesStore);
      expect(state.currentGame).toEqual(mockGame1);
    });

    it('should handle delete game error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      } as Response);

      const result = await gamesStore.deleteGame('game-1');

      expect(result).toBe(false);
      const state = get(gamesStore);
      expect(state.error).toBe('Delete failed');
    });
  });

  describe('clearError', () => {
    it('should clear error message', async () => {
      // Create error state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Some error' }),
      } as Response);
      await gamesStore.fetchGames();

      let state = get(gamesStore);
      expect(state.error).toBe('Some error');

      // Clear error
      gamesStore.clearError();

      state = get(gamesStore);
      expect(state.error).toBeNull();
    });
  });

  describe('clearCurrentGame', () => {
    it('should clear current game', async () => {
      // Set currentGame
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game: mockGame1 }),
      } as Response);
      await gamesStore.fetchGame('game-1');

      let state = get(gamesStore);
      expect(state.currentGame).toEqual(mockGame1);

      // Clear current game
      gamesStore.clearCurrentGame();

      state = get(gamesStore);
      expect(state.currentGame).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', async () => {
      // Setup state with games
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [mockGame1, mockGame2] }),
      } as Response);
      await gamesStore.fetchGames();

      // Reset
      gamesStore.reset();

      const state = get(gamesStore);
      expect(state.games).toEqual([]);
      expect(state.currentGame).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
