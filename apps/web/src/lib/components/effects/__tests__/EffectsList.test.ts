import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EffectsList from '../EffectsList.svelte';
import type { ActiveEffect } from '@vtt/shared';

// Mock the stores
vi.mock('$lib/stores/effects', () => ({
  effectsStore: {
    subscribe: vi.fn(),
    loadForActor: vi.fn(),
    add: vi.fn(),
    updateEffect: vi.fn(),
    remove: vi.fn(),
    getForActor: vi.fn(() => []),
  },
}));

vi.mock('$lib/stores/websocket', () => ({
  websocket: {
    onEffectAdded: vi.fn(() => vi.fn()),
    onEffectUpdated: vi.fn(() => vi.fn()),
    onEffectRemoved: vi.fn(() => vi.fn()),
    onEffectToggled: vi.fn(() => vi.fn()),
  },
}));

const mockEffect: ActiveEffect = {
  id: 'effect-1',
  gameId: 'game-1',
  actorId: 'actor-1',
  tokenId: null,
  name: 'Bless',
  icon: 'https://example.com/bless.png',
  description: 'Add 1d4 to attack rolls',
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

describe('EffectsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no effects', () => {
    const { container } = render(EffectsList, {
      props: {
        actorId: 'actor-1',
        gameId: 'game-1',
        isGM: false,
        token: 'test-token',
      },
    });

    expect(container.textContent).toContain('No active effects');
  });

  it('renders add effect button for GM', () => {
    const { container } = render(EffectsList, {
      props: {
        actorId: 'actor-1',
        gameId: 'game-1',
        isGM: true,
        token: 'test-token',
      },
    });

    expect(container.textContent).toContain('Add Effect');
  });

  it('does not render add effect button for non-GM', () => {
    const { container } = render(EffectsList, {
      props: {
        actorId: 'actor-1',
        gameId: 'game-1',
        isGM: false,
        token: 'test-token',
      },
    });

    // Should not find "Add Effect" button in header (only in empty state for GM)
    const header = container.querySelector('.effects-header');
    expect(header?.textContent).not.toContain('Add Effect');
  });
});
