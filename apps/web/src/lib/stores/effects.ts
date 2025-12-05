import { writable } from 'svelte/store';
import type { ActiveEffect } from '@vtt/shared';

interface EffectsState {
  effects: Map<string, ActiveEffect>;
  selectedEffectId: string | null;
  loading: boolean;
  error: string | null;
}

function createEffectsStore() {
  const { subscribe, set, update } = writable<EffectsState>({
    effects: new Map(),
    selectedEffectId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load effects for an actor
     */
    async loadForActor(actorId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/actors/${actorId}/effects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch effects: ${response.statusText}`);
        }

        const data = await response.json();
        const effects = new Map<string, ActiveEffect>();

        data.effects.forEach((effect: ActiveEffect) => {
          effects.set(effect.id, effect);
        });

        update(state => ({
          ...state,
          effects,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load effects:', error);
      }
    },

    /**
     * Load effects for a token
     */
    async loadForToken(tokenId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/tokens/${tokenId}/effects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch effects: ${response.statusText}`);
        }

        const data = await response.json();
        const effects = new Map<string, ActiveEffect>();

        data.effects.forEach((effect: ActiveEffect) => {
          effects.set(effect.id, effect);
        });

        update(state => ({
          ...state,
          effects,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load effects:', error);
      }
    },

    /**
     * Load effects for a campaign
     */
    async loadForCampaign(campaignId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/campaigns/${campaignId}/effects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch effects: ${response.statusText}`);
        }

        const data = await response.json();
        const effects = new Map<string, ActiveEffect>();

        data.effects.forEach((effect: ActiveEffect) => {
          effects.set(effect.id, effect);
        });

        update(state => ({
          ...state,
          effects,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load effects:', error);
      }
    },

    /**
     * Add an effect to the store
     */
    add(effect: ActiveEffect): void {
      update(state => {
        const newEffects = new Map(state.effects);
        newEffects.set(effect.id, effect);
        return {
          ...state,
          effects: newEffects,
        };
      });
    },

    /**
     * Update an effect with partial data
     */
    updateEffect(effectId: string, updates: Partial<ActiveEffect>): void {
      update(state => {
        const effect = state.effects.get(effectId);
        if (!effect) return state;

        const updatedEffect = { ...effect, ...updates };
        const newEffects = new Map(state.effects);
        newEffects.set(effectId, updatedEffect);

        return {
          ...state,
          effects: newEffects,
        };
      });
    },

    /**
     * Remove an effect from the store
     */
    remove(effectId: string): void {
      update(state => {
        const newEffects = new Map(state.effects);
        newEffects.delete(effectId);

        return {
          ...state,
          effects: newEffects,
          selectedEffectId: state.selectedEffectId === effectId ? null : state.selectedEffectId,
        };
      });
    },

    /**
     * Select an effect
     */
    selectEffect(effectId: string | null): void {
      update(state => ({
        ...state,
        selectedEffectId: effectId,
      }));
    },

    /**
     * Get effects for a specific actor
     */
    getForActor(actorId: string, currentState: EffectsState): ActiveEffect[] {
      return Array.from(currentState.effects.values()).filter(effect => effect.actorId === actorId);
    },

    /**
     * Get effects for a specific token
     */
    getForToken(tokenId: string, currentState: EffectsState): ActiveEffect[] {
      return Array.from(currentState.effects.values()).filter(effect => effect.tokenId === tokenId);
    },

    /**
     * Clear all effects (useful when switching actors or leaving a campaign)
     */
    clear(): void {
      set({
        effects: new Map(),
        selectedEffectId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const effectsStore = createEffectsStore();
