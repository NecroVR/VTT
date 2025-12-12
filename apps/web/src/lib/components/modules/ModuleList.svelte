<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Module } from '@vtt/shared';

  export let modules: Module[];
  export let selectedModuleId: string | null = null;
  export let campaignModuleIds: Set<string> = new Set();

  const dispatch = createEventDispatcher<{
    select: string;
  }>();

  function handleModuleClick(moduleId: string) {
    dispatch('select', moduleId);
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
</script>

<div class="module-list">
  <div class="list-header">
    <h3>Modules</h3>
    <span class="count">{modules.length}</span>
  </div>

  <div class="list-content">
    {#if modules.length === 0}
      <div class="empty-message">
        <p>No modules available</p>
      </div>
    {:else}
      {#each modules as module (module.id)}
        <button
          class="module-item"
          class:selected={selectedModuleId === module.id}
          class:loaded={campaignModuleIds.has(module.id)}
          on:click={() => handleModuleClick(module.id)}
        >
          <div class="module-header">
            <div class="module-name">{module.name}</div>
            {#if campaignModuleIds.has(module.id)}
              <span class="loaded-badge" title="Loaded in campaign">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              </span>
            {/if}
          </div>

          <div class="module-meta">
            <span class="version">v{module.version}</span>
            {#if module.author}
              <span class="author">{module.author}</span>
            {/if}
          </div>

          {#if module.description}
            <div class="module-description">
              {module.description}
            </div>
          {/if}

          <div class="module-footer">
            <span
              class="validation-badge"
              style="color: {getValidationStatusColor(module.validationStatus)}"
              title="Validation: {module.validationStatus}"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="6" />
              </svg>
              {module.validationStatus}
            </span>

            {#if module.isOfficial}
              <span class="official-badge" title="Official content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Official
              </span>
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .module-list {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .list-header {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .list-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .count {
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-secondary, #aaa);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .list-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .empty-message {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-secondary, #888);
  }

  .module-item {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .module-item:hover {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .module-item.selected {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
  }

  .module-item.loaded {
    border-left: 3px solid #10b981;
  }

  .module-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .module-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .loaded-badge {
    display: flex;
    align-items: center;
    color: #10b981;
  }

  .loaded-badge svg {
    width: 1rem;
    height: 1rem;
  }

  .module-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
  }

  .version {
    font-weight: 500;
  }

  .author:before {
    content: '•';
    margin-right: 0.5rem;
  }

  .module-description {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #aaa);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .module-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .validation-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .validation-badge svg {
    width: 0.75rem;
    height: 0.75rem;
  }

  .official-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #f59e0b;
    font-weight: 500;
  }

  .official-badge svg {
    width: 0.875rem;
    height: 0.875rem;
  }
</style>
