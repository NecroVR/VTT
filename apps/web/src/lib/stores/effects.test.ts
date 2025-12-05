import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { effectsStore } from './effects';
import type { ActiveEffect } from '@vtt/shared';

// Mock fetch
global.fetch = vi.fn();

const mockEffect: ActiveEffect = {
  id: 'effect-1',
  campaignId: 'campaign-1',
  actorId: 'actor-1',
  tokenId: null,
  name: 'Bless',
  icon: 'https://example.com/bless.png',
  description: 'Add 1d4 to attack rolls and saving throws',
  effectType: 'buff',
  durationType: 'rounds',
  duration: 10,
  startRound: 1,
  startTurn: null,
  remaining: 10,
  sourceActorId: null,
  sourceItemId: null,
  enabled: true,
  hidden: false,
  changes: [
    {
      key: 'attack',
      mode: 'add',
      value: '1d4',
      priority: 0,
    },
  ],
  priority: 0,
  transfer: false,
  data: {},
  sort: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('effectsStore', () => {
  beforeEach(() => {
    effectsStore.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const state = get(effectsStore);
    expect(state.effects.size).toBe(0);
    expect(state.selectedEffectId).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('adds an effect to the store', () => {
    effectsStore.add(mockEffect);

    const state = get(effectsStore);
    expect(state.effects.size).toBe(1);
    expect(state.effects.get('effect-1')).toEqual(mockEffect);
  });

  it('updates an effect', () => {
    effectsStore.add(mockEffect);
    effectsStore.updateEffect('effect-1', { enabled: false, remaining: 5 });

    const state = get(effectsStore);
    const updatedEffect = state.effects.get('effect-1');
    expect(updatedEffect?.enabled).toBe(false);
    expect(updatedEffect?.remaining).toBe(5);
    expect(updatedEffect?.name).toBe('Bless'); // Original value unchanged
  });

  it('removes an effect', () => {
    effectsStore.add(mockEffect);
    effectsStore.remove('effect-1');

    const state = get(effectsStore);
    expect(state.effects.size).toBe(0);
    expect(state.effects.get('effect-1')).toBeUndefined();
  });

  it('selects an effect', () => {
    effectsStore.add(mockEffect);
    effectsStore.selectEffect('effect-1');

    const state = get(effectsStore);
    expect(state.selectedEffectId).toBe('effect-1');
  });

  it('deselects effect when removed', () => {
    effectsStore.add(mockEffect);
    effectsStore.selectEffect('effect-1');
    effectsStore.remove('effect-1');

    const state = get(effectsStore);
    expect(state.selectedEffectId).toBeNull();
  });

  it('filters effects by actor', () => {
    const effect1 = { ...mockEffect, id: 'effect-1', actorId: 'actor-1' };
    const effect2 = { ...mockEffect, id: 'effect-2', actorId: 'actor-2' };
    const effect3 = { ...mockEffect, id: 'effect-3', actorId: 'actor-1' };

    effectsStore.add(effect1);
    effectsStore.add(effect2);
    effectsStore.add(effect3);

    const state = get(effectsStore);
    const actor1Effects = effectsStore.getForActor('actor-1', state);

    expect(actor1Effects.length).toBe(2);
    expect(actor1Effects.map(e => e.id)).toEqual(['effect-1', 'effect-3']);
  });

  it('filters effects by token', () => {
    const effect1 = { ...mockEffect, id: 'effect-1', tokenId: 'token-1' };
    const effect2 = { ...mockEffect, id: 'effect-2', tokenId: 'token-2' };
    const effect3 = { ...mockEffect, id: 'effect-3', tokenId: 'token-1' };

    effectsStore.add(effect1);
    effectsStore.add(effect2);
    effectsStore.add(effect3);

    const state = get(effectsStore);
    const token1Effects = effectsStore.getForToken('token-1', state);

    expect(token1Effects.length).toBe(2);
    expect(token1Effects.map(e => e.id)).toEqual(['effect-1', 'effect-3']);
  });

  it('clears all effects', () => {
    effectsStore.add(mockEffect);
    effectsStore.selectEffect('effect-1');
    effectsStore.clear();

    const state = get(effectsStore);
    expect(state.effects.size).toBe(0);
    expect(state.selectedEffectId).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('loads effects for actor from API successfully', async () => {
    const mockResponse = {
      effects: [mockEffect],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await effectsStore.loadForActor('actor-1', 'test-token');

    const state = get(effectsStore);
    expect(state.effects.size).toBe(1);
    expect(state.effects.get('effect-1')).toEqual(mockEffect);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/actors/actor-1/effects', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('loads effects for token from API successfully', async () => {
    const mockResponse = {
      effects: [mockEffect],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await effectsStore.loadForToken('token-1', 'test-token');

    const state = get(effectsStore);
    expect(state.effects.size).toBe(1);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/tokens/token-1/effects', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('loads effects for campaign from API successfully', async () => {
    const mockResponse = {
      effects: [mockEffect],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await effectsStore.loadForCampaign('campaign-1', 'test-token');

    const state = get(effectsStore);
    expect(state.effects.size).toBe(1);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/campaigns/campaign-1/effects', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('handles API errors when loading effects', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await effectsStore.loadForActor('actor-1', 'test-token');

    const state = get(effectsStore);
    expect(state.effects.size).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBeTruthy();
    expect(state.error).toContain('Not Found');
  });
});
