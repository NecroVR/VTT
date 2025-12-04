import { writable } from 'svelte/store';
import type { Token } from '@vtt/shared';
import { browser } from '$app/environment';

interface TokensState {
  tokens: Map<string, Token>;
  selectedTokenId: string | null;
  loading: boolean;
  error: string | null;
}

function createTokensStore() {
  const { subscribe, set, update } = writable<TokensState>({
    tokens: new Map(),
    selectedTokenId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load tokens for a game from the API
     */
    async loadTokens(gameId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('sessionToken') || sessionStorage.getItem('sessionToken');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3000/api/v1/games/${gameId}/tokens`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.statusText}`);
        }

        const data = await response.json();
        const tokens = new Map<string, Token>();

        if (data.tokens && Array.isArray(data.tokens)) {
          data.tokens.forEach((token: Token) => {
            tokens.set(token.id, token);
          });
        }

        update(state => ({
          ...state,
          tokens,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load tokens';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading tokens:', error);
      }
    },

    /**
     * Add a token to the store
     */
    addToken(token: Token): void {
      update(state => {
        const newTokens = new Map(state.tokens);
        newTokens.set(token.id, token);
        return {
          ...state,
          tokens: newTokens,
        };
      });
    },

    /**
     * Move a token to a new position
     */
    moveToken(tokenId: string, x: number, y: number): void {
      update(state => {
        const token = state.tokens.get(tokenId);
        if (!token) return state;

        const updatedToken = { ...token, x, y };
        const newTokens = new Map(state.tokens);
        newTokens.set(tokenId, updatedToken);

        return {
          ...state,
          tokens: newTokens,
        };
      });
    },

    /**
     * Update a token with partial data
     */
    updateToken(tokenId: string, updates: Partial<Token>): void {
      update(state => {
        const token = state.tokens.get(tokenId);
        if (!token) return state;

        const updatedToken = { ...token, ...updates };
        const newTokens = new Map(state.tokens);
        newTokens.set(tokenId, updatedToken);

        return {
          ...state,
          tokens: newTokens,
        };
      });
    },

    /**
     * Remove a token from the store
     */
    removeToken(tokenId: string): void {
      update(state => {
        const newTokens = new Map(state.tokens);
        newTokens.delete(tokenId);

        return {
          ...state,
          tokens: newTokens,
          selectedTokenId: state.selectedTokenId === tokenId ? null : state.selectedTokenId,
        };
      });
    },

    /**
     * Select a token
     */
    selectToken(tokenId: string | null): void {
      update(state => ({
        ...state,
        selectedTokenId: tokenId,
      }));
    },

    /**
     * Get a token by ID
     */
    getToken(tokenId: string, currentState: TokensState): Token | undefined {
      return currentState.tokens.get(tokenId);
    },

    /**
     * Clear all tokens (useful when leaving a game)
     */
    clear(): void {
      set({
        tokens: new Map(),
        selectedTokenId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const tokensStore = createTokensStore();
