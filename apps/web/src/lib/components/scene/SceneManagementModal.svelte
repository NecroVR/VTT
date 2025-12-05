<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Scene } from '@vtt/shared';
  import { API_BASE_URL } from '$lib/config/api';
  import { browser } from '$app/environment';

  // Props
  export let isOpen: boolean;
  export let gameId: string;
  export let onClose: () => void;
  export let onSceneCreated: (scene: Scene) => void;

  const dispatch = createEventDispatcher<{
    close: void;
    created: Scene;
  }>();

  // Form state
  let formData = {
    name: '',
    gridSize: 50,
    gridColor: '#000000',
    backgroundColor: '#f0f0f0',
  };

  // Error and loading state
  let error: string | null = null;
  let loading = false;

  // Reset form when modal opens
  $: if (isOpen) {
    formData = {
      name: '',
      gridSize: 50,
      gridColor: '#000000',
      backgroundColor: '#f0f0f0',
    };
    error = null;
  }

  async function handleCreate() {
    // Validate
    if (!formData.name.trim()) {
      error = 'Scene name is required';
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

      const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameId}/scenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId,
          name: formData.name.trim(),
          gridSize: formData.gridSize,
          gridColor: formData.gridColor,
          // Note: backgroundColor is not part of the Scene model
          // Using gridColor as the primary color configuration
          active: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const scene = data.scene as Scene;

        // Call the prop callback
        onSceneCreated(scene);

        // Dispatch event for additional handling
        dispatch('created', scene);

        // Close modal
        handleCancel();
      } else {
        const errorData = await response.json().catch(() => ({}));
        error = errorData.error || 'Failed to create scene';
      }
    } catch (err) {
      console.error('Error creating scene:', err);
      error = err instanceof Error ? err.message : 'Failed to create scene';
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
        <h2>Create New Scene</h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <form on:submit|preventDefault={handleCreate}>
          <!-- Scene Name -->
          <section class="form-section">
            <div class="form-row">
              <label for="scene-name">
                Scene Name *
                <input
                  id="scene-name"
                  type="text"
                  bind:value={formData.name}
                  required
                  placeholder="Enter scene name"
                  disabled={loading}
                />
              </label>
            </div>
          </section>

          <!-- Grid Configuration -->
          <section class="form-section">
            <h3>Grid Configuration</h3>

            <div class="form-row">
              <label for="grid-size">
                Grid Size (pixels)
                <input
                  id="grid-size"
                  type="number"
                  bind:value={formData.gridSize}
                  min="10"
                  max="500"
                  step="5"
                  placeholder="50"
                  disabled={loading}
                />
              </label>
              <div class="help-text">Size of each grid cell in pixels (default: 50)</div>
            </div>

            <div class="form-row">
              <label for="grid-color">
                Grid Color
                <div class="color-input-group">
                  <input
                    id="grid-color"
                    type="color"
                    bind:value={formData.gridColor}
                    disabled={loading}
                  />
                  <input
                    type="text"
                    bind:value={formData.gridColor}
                    placeholder="#000000"
                    disabled={loading}
                    class="color-text-input"
                  />
                </div>
              </label>
            </div>

            <div class="form-row">
              <label for="background-color">
                Background Color
                <div class="color-input-group">
                  <input
                    id="background-color"
                    type="color"
                    bind:value={formData.backgroundColor}
                    disabled={loading}
                  />
                  <input
                    type="text"
                    bind:value={formData.backgroundColor}
                    placeholder="#f0f0f0"
                    disabled={loading}
                    class="color-text-input"
                  />
                </div>
              </label>
              <div class="help-text">Note: Background images can be set after creating the scene</div>
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
            {loading ? 'Creating...' : 'Create Scene'}
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
  input[type="number"] {
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
  input[type="number"]:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type="text"]:disabled,
  input[type="number"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .color-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  input[type="color"] {
    width: 60px;
    height: 38px;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    cursor: pointer;
    padding: 2px;
  }

  input[type="color"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .color-text-input {
    flex: 1;
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
