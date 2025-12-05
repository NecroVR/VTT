<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CompendiumEntry, CompendiumInstantiateRequest } from '@vtt/shared';
  import { compendiumsStore } from '$lib/stores/compendiums';

  export let entry: CompendiumEntry | null;
  export let campaignId: string;
  export let isGM: boolean = false;
  export let isLocked: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
    instantiated: string;
  }>();

  let isEditing = false;
  let isSaving = false;

  // Form state
  let formData = {
    name: '',
    img: '',
    entityData: {},
    tags: [] as string[],
  };

  $: if (entry) {
    formData = {
      name: entry.name,
      img: entry.img || '',
      entityData: entry.entityData,
      tags: entry.tags || [],
    };
  }

  function handleClose() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  async function handleInstantiate() {
    if (!entry) return;

    const request: CompendiumInstantiateRequest = {
      campaignId,
    };

    const entityId = await compendiumsStore.instantiateEntry(entry.id, request);

    if (entityId) {
      dispatch('instantiated', entityId);
      handleClose();
    } else {
      alert('Failed to add entry to campaign');
    }
  }

  async function handleSave() {
    if (!entry || !isGM) return;

    isSaving = true;

    const success = await compendiumsStore.updateEntry(entry.id, {
      name: formData.name,
      img: formData.img || null,
      entityData: formData.entityData,
      tags: formData.tags,
    });

    isSaving = false;

    if (success) {
      isEditing = false;
    } else {
      alert('Failed to save changes');
    }
  }

  function handleEdit() {
    if (!isLocked && isGM) {
      isEditing = true;
    }
  }

  function handleCancelEdit() {
    if (entry) {
      formData = {
        name: entry.name,
        img: entry.img || '',
        entityData: entry.entityData,
        tags: entry.tags || [],
      };
    }
    isEditing = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if entry}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content" on:click|stopPropagation>
      <header class="modal-header">
        <h2>{entry.name}</h2>
        <button class="close-button" on:click={handleClose} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        {#if entry.img}
          <div class="entry-image">
            <img src={entry.img} alt={entry.name} />
          </div>
        {/if}

        <div class="entry-details">
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">{entry.entityType}</span>
          </div>

          {#if entry.tags && entry.tags.length > 0}
            <div class="detail-row">
              <span class="detail-label">Tags:</span>
              <div class="tags">
                {#each entry.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="entity-data">
          <h3>Entity Data</h3>
          <pre class="data-preview">{JSON.stringify(entry.entityData, null, 2)}</pre>
        </div>

        {#if $compendiumsStore.error}
          <div class="error-message">
            {$compendiumsStore.error}
          </div>
        {/if}
      </div>

      <footer class="modal-footer">
        <div class="footer-left">
          {#if isGM && !isLocked && !isEditing}
            <button class="button-secondary" on:click={handleEdit}>
              Edit
            </button>
          {/if}
        </div>
        <div class="footer-right">
          {#if isEditing}
            <button class="button-secondary" on:click={handleCancelEdit} disabled={isSaving}>
              Cancel
            </button>
            <button class="button-primary" on:click={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          {:else}
            <button class="button-secondary" on:click={handleClose}>
              Close
            </button>
            <button class="button-primary" on:click={handleInstantiate}>
              Add to campaign
            </button>
          {/if}
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
    max-width: 800px;
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

  .entry-image {
    width: 100%;
    max-width: 300px;
    margin: 0 auto 1.5rem;
    border-radius: 8px;
    overflow: hidden;
  }

  .entry-image img {
    width: 100%;
    height: auto;
    display: block;
  }

  .entry-details {
    margin-bottom: 1.5rem;
  }

  .detail-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .detail-label {
    font-weight: 600;
    color: var(--color-text-secondary, #aaa);
    min-width: 100px;
  }

  .detail-value {
    color: var(--color-text-primary, #ffffff);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    padding: 0.25rem 0.75rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
    font-size: 0.75rem;
    color: var(--color-text-primary, #ffffff);
  }

  .entity-data {
    margin-top: 1.5rem;
  }

  .entity-data h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .data-preview {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
  }

  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    font-size: 0.875rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .footer-left,
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

  button:active {
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
