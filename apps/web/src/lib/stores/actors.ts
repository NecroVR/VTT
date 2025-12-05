import { writable } from 'svelte/store';
import type { Actor } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface ActorsState {
  actors: Map<string, Actor>;
  loading: boolean;
  error: string | null;
}

function createActorsStore() {
  const { subscribe, set, update } = writable<ActorsState>({
    actors: new Map(),
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load actors for a game from the API
     */
    async loadActors(gameId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameId}/actors`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch actors: ${response.statusText}`);
        }

        const data = await response.json();
        const actors = new Map<string, Actor>();

        if (data.actors && Array.isArray(data.actors)) {
          data.actors.forEach((actor: Actor) => {
            actors.set(actor.id, actor);
          });
        }

        update(state => ({
          ...state,
          actors,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load actors';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading actors:', error);
      }
    },

    /**
     * Add an actor to the store
     */
    addActor(actor: Actor): void {
      update(state => {
        const newActors = new Map(state.actors);
        newActors.set(actor.id, actor);
        return {
          ...state,
          actors: newActors,
        };
      });
    },

    /**
     * Update an actor with partial data
     */
    updateActor(actorId: string, updates: Partial<Actor>): void {
      update(state => {
        const actor = state.actors.get(actorId);
        if (!actor) return state;

        const updatedActor = { ...actor, ...updates };
        const newActors = new Map(state.actors);
        newActors.set(actorId, updatedActor);

        return {
          ...state,
          actors: newActors,
        };
      });
    },

    /**
     * Remove an actor from the store
     */
    removeActor(actorId: string): void {
      update(state => {
        const newActors = new Map(state.actors);
        newActors.delete(actorId);

        return {
          ...state,
          actors: newActors,
        };
      });
    },

    /**
     * Get an actor by ID
     */
    getActor(actorId: string, currentState: ActorsState): Actor | undefined {
      return currentState.actors.get(actorId);
    },

    /**
     * Clear all actors (useful when leaving a game)
     */
    clear(): void {
      set({
        actors: new Map(),
        loading: false,
        error: null,
      });
    },
  };
}

export const actorsStore = createActorsStore();
