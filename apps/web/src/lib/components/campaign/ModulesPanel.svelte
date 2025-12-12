<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { ModuleEntity } from '@vtt/shared';
  import { modulesStore } from '$lib/stores/modules';
  import { API_BASE_URL } from '$lib/config/api';

  // Props
  export let campaignId: string;
  export let gameSystemId: string | null;

  // State
  let entities: ModuleEntity[] = [];
  let loading = false;
  let error: string | null = null;
  let searchQuery = '';
  let selectedEntityType: string = 'all';
  let page = 1;
  let pageSize = 20;
  let total = 0;
  let hasMore = false;
  let openDropdownId: string | null = null;
  let availableEntityTypes: string[] = [];
  let selectedModuleId: string | null = null;

  // Get campaign modules from store
  $: campaignModules = $modulesStore.campaignModules.get(campaignId) || [];
  $: activeModules = campaignModules.filter(cm => cm.isActive);

  // Reactive search/filter
  $: if (browser && selectedModuleId) {
    page = 1;
    loadEntities();
  }

  onMount(() => {
    loadCampaignModules();
  });

  async function loadCampaignModules() {
    if (!browser) return;

    try {
      const loadedModules = await modulesStore.loadCampaignModules(campaignId);

      // Select first active module by default using returned data directly
      // (avoids race condition with reactive statements)
      const active = loadedModules.filter(cm => cm.isActive);
      if (active.length > 0) {
        // Use the nested module's id if available (guaranteed correct), fallback to moduleId
        const firstModule = active[0] as any;
        selectedModuleId = firstModule.module?.id || active[0].moduleId;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load campaign modules';
      console.error('Error loading campaign modules:', err);
    }
  }

  async function loadEntities() {
    if (!browser || !selectedModuleId) return;

    loading = true;
    error = null;

    try {
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      if (selectedEntityType && selectedEntityType !== 'all') {
        params.append('entityType', selectedEntityType);
      }

      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const url = `${API_BASE_URL}/api/v1/modules/${selectedModuleId}/entities/search?${params}`;
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch module entities: ${response.statusText}`);
      }

      const data = await response.json();

      if (page === 1) {
        entities = data.entities || [];
        // Extract unique entity types
        const types = new Set<string>();
        entities.forEach(e => types.add(e.entityType));
        availableEntityTypes = Array.from(types).sort();
      } else {
        entities = [...entities, ...(data.entities || [])];
      }

      total = data.total || 0;
      hasMore = (page * pageSize) < total;

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load module entities';
      console.error('Error loading entities:', err);
    } finally {
      loading = false;
    }
  }

  async function loadMore() {
    if (!hasMore || loading) return;
    page += 1;
    await loadEntities();
  }

  function toggleDropdown(entityId: string, event: Event) {
    event.stopPropagation();
    openDropdownId = openDropdownId === entityId ? null : entityId;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  function handleModuleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedModuleId = target.value;
    selectedEntityType = 'all';
    page = 1;
    entities = [];
  }

  function getEntityTypeLabel(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1) + 's';
  }

  function truncateDescription(description: string | null | undefined, maxLength: number = 100): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  }
</script>

<svelte:window on:click={closeDropdown} />

<div class="modules-panel">
  <!-- Module Selection and Filters -->
  <div class="panel-toolbar">
    <div class="module-selector">
      <label for="module-select">Module:</label>
      <select
        id="module-select"
        class="module-select"
        value={selectedModuleId || ''}
        on:change={handleModuleChange}
        disabled={activeModules.length === 0}
      >
        {#if activeModules.length === 0}
          <option value="">No modules available</option>
        {:else}
          {#each activeModules as cm}
            {@const cmAny = cm as any}
            {@const moduleId = cmAny.module?.id || cm.moduleId}
            {@const module = $modulesStore.modules.get(moduleId) || cmAny.module}
            {#if module}
              <option value={moduleId}>{module.name}</option>
            {/if}
          {/each}
        {/if}
      </select>
    </div>

    {#if selectedModuleId && availableEntityTypes.length > 0}
      <div class="type-selector">
        <label for="type-select">Type:</label>
        <select
          id="type-select"
          class="type-select"
          bind:value={selectedEntityType}
          on:change={() => { page = 1; loadEntities(); }}
        >
          <option value="all">All Types</option>
          {#each availableEntityTypes as type}
            <option value={type}>{getEntityTypeLabel(type)}</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if selectedModuleId}
      <input
        type="text"
        class="search-input"
        placeholder="Search entities..."
        bind:value={searchQuery}
        on:input={() => { page = 1; loadEntities(); }}
      />
    {/if}
  </div>

  <!-- Content -->
  <div class="panel-content">
    {#if !selectedModuleId}
      <div class="empty-state">
        <p>No module selected</p>
        {#if activeModules.length === 0}
          <p class="empty-hint">Add a module to this campaign to browse its content</p>
        {/if}
      </div>
    {:else if loading && entities.length === 0}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading module content...</p>
      </div>
    {:else if error && entities.length === 0}
      <div class="empty-state">
        <p>Error: {error}</p>
        <button class="button-secondary" on:click={loadEntities}>
          Try Again
        </button>
      </div>
    {:else if entities.length === 0}
      <div class="empty-state">
        <p>No entities found</p>
        {#if searchQuery}
          <p class="empty-hint">Try adjusting your search</p>
        {/if}
      </div>
    {:else}
      <div class="entities-list">
        {#each entities as entity (entity.id)}
          <div class="entity-card">
            <div class="entity-info">
              <div class="entity-header">
                <div class="entity-name">{entity.name}</div>
                <div class="entity-type-badge">{entity.entityType}</div>
              </div>
              {#if entity.description}
                <div class="entity-description">
                  {truncateDescription(entity.description)}
                </div>
              {/if}
            </div>
            <div class="entity-actions">
              <div class="dropdown-wrapper">
                <button
                  class="button-secondary"
                  on:click={(e) => toggleDropdown(entity.id, e)}
                >
                  Actions
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3.5 6.5a.5.5 0 0 1 .5.5L8 11l4-4a.5.5 0 0 1 .707.707l-4.5 4.5a.5.5 0 0 1-.707 0l-4.5-4.5A.5.5 0 0 1 3.5 6.5z"/>
                  </svg>
                </button>
                {#if openDropdownId === entity.id}
                  <div class="actions-dropdown" on:click|stopPropagation>
                    <button class="dropdown-item" disabled>
                      View Details
                    </button>
                    <button class="dropdown-item" disabled>
                      Edit Override
                    </button>
                    <button class="dropdown-item" disabled>
                      Exclude from Campaign
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if hasMore}
        <div class="load-more-container">
          <button
            class="button-secondary load-more"
            on:click={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
          <span class="result-count">
            Showing {entities.length} of {total}
          </span>
        </div>
      {:else if total > 0}
        <div class="end-message">
          Showing all {total} {selectedEntityType === 'all' ? 'entities' : getEntityTypeLabel(selectedEntityType).toLowerCase()}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .modules-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  .notification {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 100;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .notification.success {
    background-color: rgba(74, 222, 128, 0.2);
    color: #4ade80;
    border: 1px solid #4ade80;
  }

  .notification.error {
    background-color: rgba(248, 113, 113, 0.2);
    color: #f87171;
    border: 1px solid #f87171;
  }

  .panel-toolbar {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 0.75rem;
    border-bottom: 1px solid #374151;
    background-color: #1f2937;
    flex-wrap: wrap;
  }

  .module-selector,
  .type-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .module-selector label,
  .type-selector label {
    font-size: 0.875rem;
    color: #d1d5db;
    white-space: nowrap;
  }

  .module-select,
  .type-select {
    padding: 0.5rem;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    background-color: #374151;
    color: #f9fafb;
    font-size: 0.875rem;
    min-width: 150px;
  }

  .module-select:focus,
  .type-select:focus {
    outline: none;
    border-color: #60a5fa;
  }

  .module-select:disabled,
  .type-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .search-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    background-color: #374151;
    color: #f9fafb;
    font-size: 0.875rem;
    min-width: 200px;
  }

  .search-input:focus {
    outline: none;
    border-color: #60a5fa;
  }

  .search-input::placeholder {
    color: #6b7280;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .panel-content::-webkit-scrollbar {
    width: 8px;
  }

  .panel-content::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .panel-content::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .panel-content::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: #9ca3af;
  }

  .empty-hint {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #374151;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .entities-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .entity-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    transition: all 0.2s;
  }

  .entity-card:hover {
    border-color: #60a5fa;
    background-color: #1f2937;
  }

  .entity-info {
    flex: 1;
    min-width: 0;
  }

  .entity-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .entity-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f9fafb;
  }

  .entity-type-badge {
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    background-color: #374151;
    color: #9ca3af;
    font-size: 0.75rem;
    text-transform: capitalize;
  }

  .entity-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .entity-actions {
    flex-shrink: 0;
  }

  .dropdown-wrapper {
    position: relative;
  }

  .button-primary {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .button-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-primary.loading {
    opacity: 0.7;
  }

  .button-secondary {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: #9ca3af;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-secondary:hover {
    background-color: #374151;
    color: #d1d5db;
  }

  .actions-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 100;
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
  }

  .dropdown-item {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #d1d5db;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover:not(:disabled) {
    background-color: #374151;
  }

  .dropdown-item:disabled {
    color: #6b7280;
    cursor: not-allowed;
  }

  .load-more-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #374151;
  }

  .load-more {
    min-width: 120px;
  }

  .result-count {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .end-message {
    text-align: center;
    padding: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
    border-top: 1px solid #374151;
    margin-top: 1rem;
  }
</style>
