<script lang="ts">
  import { onMount } from 'svelte';
  import type { ActiveEffect } from '@vtt/shared';
  import { effectsStore } from '$lib/stores/effects';
  import { websocket } from '$lib/stores/websocket';
  import EffectConfig from './EffectConfig.svelte';

  // Props
  export let actorId: string;
  export let campaignId: string;
  export let isGM: boolean = false;
  export let token: string = '';

  // State
  let effects: ActiveEffect[] = [];
  let loading = false;
  let error: string | null = null;
  let showEffectConfig = false;
  let selectedEffect: ActiveEffect | null = null;

  // Subscribe to effects store
  $: {
    effectsStore.subscribe(state => {
      effects = effectsStore.getForActor(actorId, state);
      loading = state.loading;
      error = state.error;
    });
  }

  onMount(async () => {
    // Load effects for this actor
    await effectsStore.loadForActor(actorId, token);

    // Subscribe to effect updates via WebSocket
    const unsubscribeAdded = websocket.onEffectAdded((payload) => {
      if (payload.effect.actorId === actorId) {
        effectsStore.add(payload.effect);
      }
    });

    const unsubscribeUpdated = websocket.onEffectUpdated((payload) => {
      if (payload.effect.actorId === actorId) {
        effectsStore.updateEffect(payload.effect.id, payload.effect);
      }
    });

    const unsubscribeRemoved = websocket.onEffectRemoved((payload) => {
      effectsStore.remove(payload.effectId);
    });

    const unsubscribeToggled = websocket.onEffectToggled((payload) => {
      effectsStore.updateEffect(payload.effectId, { enabled: payload.enabled });
    });

    return () => {
      unsubscribeAdded();
      unsubscribeUpdated();
      unsubscribeRemoved();
      unsubscribeToggled();
    };
  });

  function handleAddEffect() {
    selectedEffect = null;
    showEffectConfig = true;
  }

  function handleEditEffect(effect: ActiveEffect) {
    selectedEffect = effect;
    showEffectConfig = true;
  }

  async function handleToggleEffect(effect: ActiveEffect) {
    try {
      const response = await fetch(`/api/v1/effects/${effect.id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle effect');
      }

      const data = await response.json();
      effectsStore.updateEffect(effect.id, { enabled: data.effect.enabled });
    } catch (err) {
      console.error('Error toggling effect:', err);
      error = 'Failed to toggle effect';
    }
  }

  async function handleDeleteEffect(effect: ActiveEffect) {
    if (!confirm(`Are you sure you want to delete "${effect.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/effects/${effect.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete effect');
      }

      effectsStore.remove(effect.id);
    } catch (err) {
      console.error('Error deleting effect:', err);
      error = 'Failed to delete effect';
    }
  }

  function handleEffectSaved(event: CustomEvent<ActiveEffect>) {
    const effect = event.detail;
    effectsStore.updateEffect(effect.id, effect);
    showEffectConfig = false;
  }

  function handleEffectDeleted(event: CustomEvent<string>) {
    const effectId = event.detail;
    effectsStore.remove(effectId);
    showEffectConfig = false;
  }

  function handleCloseModal() {
    showEffectConfig = false;
    selectedEffect = null;
  }

  function getEffectTypeColor(effectType: string): string {
    switch (effectType) {
      case 'buff': return '#10b981';
      case 'debuff': return '#ef4444';
      case 'condition': return '#f59e0b';
      case 'aura': return '#8b5cf6';
      case 'custom': return '#6b7280';
      default: return '#6b7280';
    }
  }

  function getDurationText(effect: ActiveEffect): string {
    if (effect.durationType === 'permanent') return 'Permanent';
    if (effect.durationType === 'special') return 'Special';
    if (!effect.duration) return '-';

    const remaining = effect.remaining ?? effect.duration;
    const unit = effect.durationType === 'rounds' ? 'rounds' :
                 effect.durationType === 'turns' ? 'turns' : 'seconds';
    return `${remaining} ${unit}`;
  }
</script>

<div class="effects-list">
  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading effects...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
    </div>
  {:else}
    <div class="effects-header">
      <h3>Active Effects</h3>
      {#if isGM}
        <button class="add-effect-btn" on:click={handleAddEffect}>
          + Add Effect
        </button>
      {/if}
    </div>

    {#if effects.length === 0}
      <div class="empty-state">
        <p>No active effects</p>
        {#if isGM}
          <button class="add-effect-btn-large" on:click={handleAddEffect}>
            Add First Effect
          </button>
        {/if}
      </div>
    {:else}
      <div class="effects-grid">
        {#each effects as effect (effect.id)}
          <div class="effect-card" class:disabled={!effect.enabled}>
            <div class="effect-header">
              {#if effect.icon}
                <img src={effect.icon} alt={effect.name} class="effect-icon" />
              {:else}
                <div class="effect-icon-placeholder">
                  <span>✨</span>
                </div>
              {/if}

              <div class="effect-info">
                <h4 class="effect-name">{effect.name}</h4>
                <span
                  class="effect-type-badge"
                  style="background-color: {getEffectTypeColor(effect.effectType)};"
                >
                  {effect.effectType}
                </span>
              </div>

              <div class="effect-actions">
                <button
                  class="toggle-btn"
                  class:enabled={effect.enabled}
                  on:click={() => handleToggleEffect(effect)}
                  title={effect.enabled ? 'Disable' : 'Enable'}
                >
                  {effect.enabled ? '✓' : '○'}
                </button>
                {#if isGM}
                  <button
                    class="edit-btn"
                    on:click={() => handleEditEffect(effect)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    class="delete-btn"
                    on:click={() => handleDeleteEffect(effect)}
                    title="Delete"
                  >
                    ×
                  </button>
                {/if}
              </div>
            </div>

            {#if effect.description}
              <p class="effect-description">{effect.description}</p>
            {/if}

            <div class="effect-details">
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">{getDurationText(effect)}</span>
              </div>
              {#if effect.changes.length > 0}
                <div class="detail-row">
                  <span class="detail-label">Changes:</span>
                  <span class="detail-value">{effect.changes.length} modification(s)</span>
                </div>
              {/if}
              {#if effect.priority !== 0}
                <div class="detail-row">
                  <span class="detail-label">Priority:</span>
                  <span class="detail-value">{effect.priority}</span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<EffectConfig
  isOpen={showEffectConfig}
  effect={selectedEffect}
  {actorId}
  {campaignId}
  {token}
  on:close={handleCloseModal}
  on:save={handleEffectSaved}
  on:delete={handleEffectDeleted}
/>

<style>
  .effects-list {
    padding: 1.5rem;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #374151;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-container p {
    color: #9ca3af;
    font-size: 1rem;
  }

  .error-container {
    padding: 1rem;
    background-color: #7f1d1d;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .error-message {
    color: #fca5a5;
    margin: 0;
  }

  .effects-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .effects-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f9fafb;
  }

  .add-effect-btn {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .add-effect-btn:hover {
    background-color: #2563eb;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    background-color: #111827;
    border-radius: 0.5rem;
    border: 2px dashed #374151;
  }

  .empty-state p {
    margin: 0;
    color: #9ca3af;
    font-size: 1rem;
  }

  .add-effect-btn-large {
    padding: 0.75rem 1.5rem;
    background-color: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .add-effect-btn-large:hover {
    background-color: #2563eb;
  }

  .effects-grid {
    display: grid;
    gap: 1rem;
  }

  .effect-card {
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 0.5rem;
    padding: 1rem;
    transition: all 0.2s ease;
  }

  .effect-card:hover {
    border-color: #4b5563;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  }

  .effect-card.disabled {
    opacity: 0.6;
  }

  .effect-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .effect-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.375rem;
    object-fit: cover;
    border: 2px solid #374151;
  }

  .effect-icon-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 0.375rem;
    background-color: #1f2937;
    border: 2px solid #374151;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .effect-info {
    flex: 1;
    min-width: 0;
  }

  .effect-name {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .effect-type-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #ffffff;
    text-transform: capitalize;
  }

  .effect-actions {
    display: flex;
    gap: 0.25rem;
  }

  .toggle-btn,
  .edit-btn,
  .delete-btn {
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 1px solid #374151;
    border-radius: 0.25rem;
    background-color: #1f2937;
    color: #9ca3af;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-btn:hover,
  .edit-btn:hover {
    background-color: #374151;
    color: #f9fafb;
  }

  .toggle-btn.enabled {
    background-color: #10b981;
    color: #ffffff;
    border-color: #10b981;
  }

  .delete-btn:hover {
    background-color: #7f1d1d;
    border-color: #ef4444;
    color: #fca5a5;
  }

  .effect-description {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    color: #d1d5db;
    line-height: 1.5;
  }

  .effect-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.75rem;
    border-top: 1px solid #374151;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.8125rem;
  }

  .detail-label {
    color: #9ca3af;
    font-weight: 500;
  }

  .detail-value {
    color: #d1d5db;
  }
</style>
