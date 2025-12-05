import { writable } from 'svelte/store';
import type { Game, CreateGameRequest, UpdateGameRequest, GamesListResponse, GameResponse } from '@vtt/shared';
import { API_BASE_URL } from '$lib/config/api';

const SESSION_STORAGE_KEY = 'vtt_session_id';

interface GamesState {
  games: Game[];
  currentGame: Game | null;
  loading: boolean;
  error: string | null;
}

const initialState: GamesState = {
  games: [],
  currentGame: null,
  loading: false,
  error: null,
};

function createGamesStore() {
  const { subscribe, set, update } = writable<GamesState>(initialState);

  /**
   * Get authorization header with session token
   * @param includeContentType - Whether to include Content-Type header (default: true)
   */
  function getAuthHeader(includeContentType: boolean = true): Record<string, string> {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      throw new Error('Not authenticated');
    }
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${sessionId}`,
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  return {
    subscribe,

    /**
     * Fetch all games for the current user
     */
    async fetchGames(): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/games`, {
          method: 'GET',
          headers: getAuthHeader(false),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch games');
        }

        const data: GamesListResponse = await response.json();

        update(state => ({
          ...state,
          games: data.games,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch games';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Fetch a single game by ID
     */
    async fetchGame(id: string): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/games/${id}`, {
          method: 'GET',
          headers: getAuthHeader(false),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch game');
        }

        const data: GameResponse = await response.json();

        update(state => ({
          ...state,
          currentGame: data.game,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch game';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Create a new game
     */
    async createGame(data: CreateGameRequest): Promise<Game | null> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/games`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create game');
        }

        const responseData: GameResponse = await response.json();

        update(state => ({
          ...state,
          games: [...state.games, responseData.game],
          loading: false,
          error: null,
        }));

        return responseData.game;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return null;
      }
    },

    /**
     * Update an existing game
     */
    async updateGame(id: string, data: UpdateGameRequest): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/games/${id}`, {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update game');
        }

        const responseData: GameResponse = await response.json();

        update(state => ({
          ...state,
          games: state.games.map(game =>
            game.id === id ? responseData.game : game
          ),
          currentGame: state.currentGame?.id === id ? responseData.game : state.currentGame,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update game';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Delete a game
     */
    async deleteGame(id: string): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/games/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader(false),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete game');
        }

        update(state => ({
          ...state,
          games: state.games.filter(game => game.id !== id),
          currentGame: state.currentGame?.id === id ? null : state.currentGame,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete game';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Clear error message
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Clear current game
     */
    clearCurrentGame(): void {
      update(state => ({ ...state, currentGame: null }));
    },

    /**
     * Reset store to initial state
     */
    reset(): void {
      set(initialState);
    },
  };
}

export const gamesStore = createGamesStore();
