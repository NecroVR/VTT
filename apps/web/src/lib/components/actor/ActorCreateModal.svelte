<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Actor } from '@vtt/shared';
  import { API_BASE_URL } from '$lib/config/api';
  import { browser } from '$app/environment';

  // Props
  export let isOpen: boolean;
  export let campaignId: string;
  export let onClose: () => void;
  export let onActorCreated: (actor: Actor) => void;

  const dispatch = createEventDispatcher<{
    close: void;
    created: Actor;
  }>();

  // Actor types - common types for tabletop gaming
  const actorTypes = ['character', 'npc', 'monster', 'vehicle', 'other'];

  // Form state
  let formData = {
    name: '',
    actorType: 'character',
    img: '',
  };

  // Error and loading state
  let error: string | null = null;
  let loading = false;

  // Reset form when modal opens
  $: if (isOpen) {
    formData = {
      name: '',
      actorType: 'character',
      img: '',
    };
    error = null;
  }

  async function handleCreate() {
    // Validate
    if (!formData.name.trim()) {
      error = 'Actor name is required';
      return;
    }

    loading = true;
    error = null;

    try {
      const token = browser
        ? localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id')
        : null;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const payload: any = {
        campaignId,
        name: formData.name.trim(),
        actorType: formData.actorType,
      };

      // Only include img if provided
      if (formData.img.trim()) {
        payload.img = formData.img.trim();
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/actors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const actor = data.actor as Actor;

        // Call the prop callback
        onActorCreated(actor);

        // Dispatch event for additional handling
        dispatch('created', actor);

        // Close modal
        handleCancel();
      } else {
        const errorData = await response.json().catch(() => ({}));
        error = errorData.error || 'Failed to create actor';
      }
    } catch (err) {
      console.error('Error creating actor:', err);
      error = err instanceof Error ? err.message : 'Failed to create actor';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    onClose();
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (isOpen) {
      handleKeydown(event);
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content" on:click|stopPropagation>
      <header class="modal-header">
        <h2>Create New Actor</h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <form on:submit|preventDefault={handleCreate}>
          <!-- Actor Name -->
          <section class="form-section">
            <div class="form-row">
              <label for="actor-name">
                Actor Name *
                <input
                  id="actor-name"
                  type="text"
                  bind:value={formData.name}
                  required
                  placeholder="Enter actor name"
                  disabled={loading}
                />
              </label>
            </div>
          </section>

          <!-- Actor Configuration -->
          <section class="form-section">
            <h3>Actor Configuration</h3>

            <div class="form-row">
              <label for="actor-type">
                Actor Type *
                <select
                  id="actor-type"
                  bind:value={formData.actorType}
                  disabled={loading}
                >
                  {#each actorTypes as type}
                    <option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  {/each}
                </select>
              </label>
              <div class="help-text">The type of actor (character, NPC, monster, etc.)</div>
            </div>

            <div class="form-row">
              <label for="actor-img">
                Image URL (optional)
                <input
                  id="actor-img"
                  type="text"
                  bind:value={formData.img}
                  placeholder="https://example.com/image.png"
                  disabled={loading}
                />
              </label>
              <div class="help-text">URL to an image for this actor's portrait</div>
            </div>
          </section>
        </form>
      </div>

      <footer class="modal-footer">
        <div class="footer-right">
          <button class="button-secondary" on:click={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button class="button-primary" on:click={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Actor'}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .error-message {
    padding: 1rem;
    background-color: #7f1d1d;
    color: #fca5a5;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    border-bottom: 1px solid var(--color-border, #333);
    padding-bottom: 0.5rem;
  }

  .form-row {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.25rem;
  }

  input[type="text"],
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  input[type="text"]:focus,
  select:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type="text"]:disabled,
  select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  select {
    cursor: pointer;
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--color-text-tertiary, #888);
    margin-top: 0.25rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .footer-right {
    display: flex;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }
  }
</style>
