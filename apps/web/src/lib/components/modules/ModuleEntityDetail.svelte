<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { modulesStore } from '$lib/stores/modules';
  import type { ModuleEntity, ModuleEntityWithProperties } from '@vtt/shared';

  export let entity: ModuleEntity;
  export let moduleId: string;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let entityWithProperties: ModuleEntityWithProperties | null = null;
  let loading = true;

  onMount(async () => {
    entityWithProperties = await modulesStore.getEntityWithProperties(moduleId, entity.id);
    loading = false;
  });

  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Reconstruct nested object from flat properties
  function reconstructObject(properties: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(properties)) {
      const parts = key.split('.');
      let current: any = result;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = value;
    }

    return result;
  }

  function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  function getValidationStatusColor(status: string): string {
    switch (status) {
      case 'valid':
        return '#10b981';
      case 'invalid':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }

  $: reconstructedData = entityWithProperties
    ? reconstructObject(entityWithProperties.properties)
    : {};
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick}>
  <div class="modal-container" on:click|stopPropagation>
    <header class="modal-header">
      <div class="header-content">
        <h1>{entity.name}</h1>
        <span class="entity-type">{entity.entityType}</span>
      </div>
      <button class="close-button" on:click={handleClose} aria-label="Close">
        &times;
      </button>
    </header>

    <div class="modal-body">
      {#if loading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading entity details...</p>
        </div>
      {:else if entityWithProperties}
        <div class="detail-sections">
          <!-- Basic Information -->
          <section class="detail-section">
            <h2>Basic Information</h2>
            <div class="detail-grid">
              {#if entity.img}
                <div class="detail-item full-width">
                  <label>Image</label>
                  <div class="entity-image">
                    <img src={entity.img} alt={entity.name} />
                  </div>
                </div>
              {/if}

              <div class="detail-item full-width">
                <label>Name</label>
                <div class="value">{entity.name}</div>
              </div>

              <div class="detail-item">
                <label>Entity ID</label>
                <div class="value mono">{entity.entityId}</div>
              </div>

              <div class="detail-item">
                <label>Type</label>
                <div class="value">{entity.entityType}</div>
              </div>

              {#if entity.description}
                <div class="detail-item full-width">
                  <label>Description</label>
                  <div class="value description">{entity.description}</div>
                </div>
              {/if}

              {#if entity.templateId}
                <div class="detail-item">
                  <label>Template</label>
                  <div class="value mono">{entity.templateId}</div>
                </div>
              {/if}

              {#if entity.tags && entity.tags.length > 0}
                <div class="detail-item full-width">
                  <label>Tags</label>
                  <div class="tags">
                    {#each entity.tags as tag}
                      <span class="tag">{tag}</span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </section>

          <!-- Validation Status -->
          {#if entity.validationStatus !== 'valid' || (entity.validationErrors && entity.validationErrors.length > 0)}
            <section class="detail-section validation-section">
              <h2>Validation Status</h2>
              <div class="validation-content">
                <div
                  class="validation-status"
                  style="color: {getValidationStatusColor(entity.validationStatus)}"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                  <span>{entity.validationStatus}</span>
                </div>

                {#if entity.validationErrors && entity.validationErrors.length > 0}
                  <div class="validation-errors">
                    {#each entity.validationErrors as error}
                      <div class="validation-error" class:warning={error.severity === 'warning'}>
                        <div class="error-header">
                          <span class="error-type">{error.errorType}</span>
                          <span class="error-severity">{error.severity}</span>
                        </div>
                        <div class="error-message">{error.message}</div>
                        {#if error.propertyKey}
                          <div class="error-property">Property: {error.propertyKey}</div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </section>
          {/if}

          <!-- Properties -->
          {#if Object.keys(reconstructedData).length > 0}
            <section class="detail-section">
              <h2>Properties</h2>
              <div class="properties-content">
                <pre class="properties-json">{JSON.stringify(reconstructedData, null, 2)}</pre>
              </div>
            </section>
          {/if}

          <!-- Source Information -->
          {#if entity.sourcePath}
            <section class="detail-section">
              <h2>Source Information</h2>
              <div class="detail-grid">
                <div class="detail-item full-width">
                  <label>Source Path</label>
                  <div class="value mono">{entity.sourcePath}</div>
                </div>
                {#if entity.sourceLineNumber}
                  <div class="detail-item">
                    <label>Line Number</label>
                    <div class="value mono">{entity.sourceLineNumber}</div>
                  </div>
                {/if}
              </div>
            </section>
          {/if}
        </div>
      {:else}
        <div class="error-state">
          <p>Failed to load entity details</p>
        </div>
      {/if}
    </div>

    <footer class="modal-footer">
      <button class="button secondary" on:click={handleClose}>Close</button>
    </footer>
  </div>
</div>

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

  .modal-container {
    background-color: var(--color-bg-primary, #1a1a1a);
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

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .modal-header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .entity-type {
    background-color: rgba(74, 144, 226, 0.2);
    color: #4a90e2;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: capitalize;
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
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    gap: 1rem;
    color: var(--color-text-secondary, #888);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border, #333);
    border-top-color: #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .detail-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .detail-section {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .detail-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .detail-item label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
  }

  .detail-item .value {
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
  }

  .value.mono {
    font-family: 'Courier New', monospace;
    background-color: var(--color-bg-primary, #121212);
    padding: 0.5rem;
    border-radius: 4px;
  }

  .value.description {
    line-height: 1.6;
  }

  .entity-image {
    width: 100%;
    max-width: 300px;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    background-color: var(--color-bg-primary, #121212);
  }

  .entity-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tag {
    background-color: rgba(74, 144, 226, 0.2);
    color: #4a90e2;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .validation-section {
    border-left: 3px solid #ef4444;
  }

  .validation-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .validation-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .validation-status svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .validation-errors {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .validation-error {
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 4px;
    padding: 0.75rem;
  }

  .validation-error.warning {
    background-color: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .error-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .error-type {
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
  }

  .error-severity {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
  }

  .error-message {
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .error-property {
    margin-top: 0.5rem;
    color: var(--color-text-secondary, #888);
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
  }

  .properties-content {
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
    overflow: hidden;
  }

  .properties-json {
    margin: 0;
    padding: 1rem;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: var(--color-text-primary, #ffffff);
    overflow-x: auto;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button.secondary {
    background-color: var(--color-bg-secondary, #2d2d2d);
    color: var(--color-text-primary, #ffffff);
    border: 1px solid var(--color-border, #333);
  }

  .button.secondary:hover {
    background-color: var(--color-bg-primary, #1a1a1a);
  }

  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-container {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
