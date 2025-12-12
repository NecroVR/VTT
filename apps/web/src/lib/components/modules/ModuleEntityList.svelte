<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ModuleEntity, ModuleEntityType } from '@vtt/shared';

  export let entities: ModuleEntity[];
  export let selectedEntityId: string | null = null;
  export let loading: boolean = false;
  export let viewMode: 'grid' | 'list' = 'grid';
  export let searchQuery: string = '';
  export let filterEntityType: ModuleEntityType | 'all' = 'all';

  const dispatch = createEventDispatcher<{
    select: ModuleEntity;
  }>();

  // Filter entities based on search query and entity type
  $: filteredEntities = entities.filter((entity) => {
    // Filter by entity type
    if (filterEntityType !== 'all' && entity.entityType !== filterEntityType) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        entity.name.toLowerCase().includes(query) ||
        entity.description?.toLowerCase().includes(query) ||
        entity.searchText?.toLowerCase().includes(query) ||
        entity.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  function handleEntityClick(entity: ModuleEntity) {
    dispatch('select', entity);
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

  function getEntityTypeIcon(entityType: string): string {
    const icons: Record<string, string> = {
      item: '\u{1F5E1}',        // Sword
      spell: '\u2728',           // Sparkles
      monster: '\u{1F47E}',      // Alien Monster
      race: '\u{1F9D1}',         // Person
      class: '\u{1F6E1}',        // Shield
      background: '\u{1F4DC}',   // Scroll
      feature: '\u2B50',         // Star
      feat: '\u{1F4AA}',         // Muscle
      condition: '\u{1F915}',    // Face with thermometer
      skill: '\u{1F4DA}',        // Books
      vehicle: '\u{1F6E0}',      // Hammer and wrench
      hazard: '\u26A0',          // Warning
      custom: '\u{1F4C4}',       // Page
    };
    return icons[entityType] || '\u{1F4C4}';
  }
</script>

<div class="entity-list">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading entities...</p>
    </div>
  {:else if filteredEntities.length === 0}
    <div class="empty-state">
      {#if searchQuery || filterEntityType !== 'all'}
        <p>No entities match your filters</p>
        <p class="hint">Try adjusting your search or filters</p>
      {:else}
        <p>This module has no entities</p>
      {/if}
    </div>
  {:else if viewMode === 'grid'}
    <div class="entities-grid">
      {#each filteredEntities as entity (entity.id)}
        <button
          class="entity-card"
          class:selected={selectedEntityId === entity.id}
          class:invalid={entity.validationStatus === 'invalid'}
          on:click={() => handleEntityClick(entity)}
        >
          <div class="card-thumbnail">
            {#if entity.img}
              <img src={entity.img} alt={entity.name} />
            {:else}
              <div class="card-icon">{getEntityTypeIcon(entity.entityType)}</div>
            {/if}
          </div>

          <div class="card-content">
            <div class="card-name">{entity.name}</div>
            <div class="card-type">{entity.entityType}</div>

            {#if entity.tags && entity.tags.length > 0}
              <div class="card-tags">
                {#each entity.tags.slice(0, 2) as tag}
                  <span class="tag">{tag}</span>
                {/each}
                {#if entity.tags.length > 2}
                  <span class="tag-more">+{entity.tags.length - 2}</span>
                {/if}
              </div>
            {/if}

            {#if entity.validationStatus !== 'valid'}
              <div
                class="validation-indicator"
                style="background-color: {getValidationStatusColor(entity.validationStatus)}"
                title="Validation: {entity.validationStatus}"
              />
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="entities-list">
      {#each filteredEntities as entity (entity.id)}
        <button
          class="entity-row"
          class:selected={selectedEntityId === entity.id}
          class:invalid={entity.validationStatus === 'invalid'}
          on:click={() => handleEntityClick(entity)}
        >
          <div class="row-thumbnail">
            {#if entity.img}
              <img src={entity.img} alt={entity.name} />
            {:else}
              <div class="row-icon">{getEntityTypeIcon(entity.entityType)}</div>
            {/if}
          </div>

          <div class="row-info">
            <div class="row-name">{entity.name}</div>
            <div class="row-meta">
              <span class="entity-type">{entity.entityType}</span>
              {#if entity.tags && entity.tags.length > 0}
                <span class="tags-preview">• {entity.tags.slice(0, 3).join(', ')}</span>
              {/if}
            </div>
          </div>

          <div class="row-validation">
            <span
              class="validation-dot"
              style="background-color: {getValidationStatusColor(entity.validationStatus)}"
              title="{entity.validationStatus}"
            />
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .entity-list {
    height: 100%;
    overflow-y: auto;
    padding: 1rem;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--color-text-secondary, #888);
  }

  .empty-state .hint {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
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

  /* Grid View */
  .entities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .entity-card {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden;
    text-align: left;
    position: relative;
  }

  .entity-card:hover {
    border-color: #4a90e2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .entity-card.selected {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
  }

  .entity-card.invalid {
    border-left: 3px solid #ef4444;
  }

  .card-thumbnail {
    width: 100%;
    aspect-ratio: 1;
    background-color: var(--color-bg-primary, #121212);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .card-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-icon {
    font-size: 3rem;
  }

  .card-content {
    padding: 0.75rem;
  }

  .card-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.25rem;
  }

  .card-type {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    text-transform: capitalize;
    margin-bottom: 0.5rem;
  }

  .card-tags {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .tag {
    background-color: rgba(74, 144, 226, 0.2);
    color: #4a90e2;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
  }

  .tag-more {
    color: var(--color-text-secondary, #888);
    font-size: 0.625rem;
  }

  .validation-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
  }

  /* List View */
  .entities-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .entity-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--color-bg-secondary, #1e1e1e);
    text-align: left;
  }

  .entity-row:hover {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .entity-row.selected {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
  }

  .entity-row.invalid {
    border-left: 3px solid #ef4444;
  }

  .row-thumbnail {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--color-bg-primary, #121212);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .row-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .row-icon {
    font-size: 1.5rem;
  }

  .row-info {
    flex: 1;
    min-width: 0;
  }

  .row-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-meta {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entity-type {
    text-transform: capitalize;
  }

  .row-validation {
    flex-shrink: 0;
  }

  .validation-dot {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
  }
</style>
