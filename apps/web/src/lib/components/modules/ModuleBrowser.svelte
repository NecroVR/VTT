<script lang="ts">
  import { onMount } from 'svelte';
  import { modulesStore } from '$lib/stores/modules';
  import type { Module, ModuleEntity, ModuleEntityType } from '@vtt/shared';
  import ModuleList from './ModuleList.svelte';
  import ModuleEntityList from './ModuleEntityList.svelte';
  import ModuleEntityDetail from './ModuleEntityDetail.svelte';
  import ModuleValidationStatus from './ModuleValidationStatus.svelte';

  export let campaignId: string;
  export let gameSystemId: string;
  export let isGM: boolean = false;

  // State
  let searchQuery = '';
  let viewMode: 'grid' | 'list' = 'grid';
  let filterEntityType: ModuleEntityType | 'all' = 'all';
  let selectedEntity: ModuleEntity | null = null;
  let showEntityDetail = false;
  let showValidationStatus = false;

  // Reactive data
  $: modules = Array.from($modulesStore.modules.values());
  $: campaignModules = $modulesStore.campaignModules.get(campaignId) || [];
  $: entities = Array.from($modulesStore.entities.values());
  $: selectedModuleId = $modulesStore.selectedModuleId;
  $: selectedModule = selectedModuleId
    ? $modulesStore.modules.get(selectedModuleId)
    : null;

  // Filter modules by game system
  $: filteredModules = modules.filter(m => m.gameSystemId === gameSystemId);

  // Check if module is loaded in campaign
  $: campaignModuleIds = new Set(campaignModules.map(cm => cm.moduleId));

  onMount(async () => {
    await modulesStore.loadModules(gameSystemId);
    await modulesStore.loadCampaignModules(campaignId);
  });

  async function handleModuleSelect(event: CustomEvent<string>) {
    const moduleId = event.detail;
    modulesStore.selectModule(moduleId);
    await modulesStore.loadModuleEntities(moduleId);
  }

  async function handleAddModuleToCampaign(moduleId: string) {
    const success = await modulesStore.addModuleToCampaign(campaignId, {
      moduleId,
      isActive: true,
    });

    if (success) {
      // Reload campaign modules
      await modulesStore.loadCampaignModules(campaignId);
    } else {
      alert('Failed to add module to campaign');
    }
  }

  async function handleRemoveModuleFromCampaign(moduleId: string) {
    const campaignModule = campaignModules.find(cm => cm.moduleId === moduleId);
    if (!campaignModule) return;

    if (confirm(`Remove this module from the campaign?`)) {
      const success = await modulesStore.removeModuleFromCampaign(
        campaignId,
        campaignModule.id
      );
      if (!success) {
        alert('Failed to remove module from campaign');
      }
    }
  }

  function handleEntitySelect(event: CustomEvent<ModuleEntity>) {
    selectedEntity = event.detail;
    showEntityDetail = true;
  }

  function handleEntityDetailClose() {
    showEntityDetail = false;
    selectedEntity = null;
  }

  function handleShowValidation() {
    if (selectedModule) {
      showValidationStatus = true;
    }
  }

  function handleValidationClose() {
    showValidationStatus = false;
  }
</script>

<div class="module-browser">
  <div class="browser-toolbar">
    <div class="toolbar-left">
      <input
        type="text"
        class="search-input"
        placeholder="Search entities..."
        bind:value={searchQuery}
      />

      <select class="filter-select" bind:value={filterEntityType}>
        <option value="all">All Types</option>
        <option value="item">Items</option>
        <option value="spell">Spells</option>
        <option value="monster">Monsters</option>
        <option value="race">Races</option>
        <option value="class">Classes</option>
        <option value="background">Backgrounds</option>
        <option value="feature">Features</option>
        <option value="feat">Feats</option>
      </select>
    </div>

    <div class="toolbar-right">
      {#if selectedModule}
        <button
          class="toolbar-button"
          on:click={handleShowValidation}
          title="Validation Status"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
          Validation
        </button>

        {#if isGM}
          {#if campaignModuleIds.has(selectedModule.id)}
            <button
              class="toolbar-button danger"
              on:click={() => handleRemoveModuleFromCampaign(selectedModule.id)}
              title="Remove from Campaign"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Remove
            </button>
          {:else}
            <button
              class="toolbar-button"
              on:click={() => handleAddModuleToCampaign(selectedModule.id)}
              title="Add to Campaign"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add to Campaign
            </button>
          {/if}
        {/if}
      {/if}

      <div class="view-mode-toggle">
        <button
          class="view-mode-button"
          class:active={viewMode === 'grid'}
          on:click={() => (viewMode = 'grid')}
          title="Grid view"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>

        <button
          class="view-mode-button"
          class:active={viewMode === 'list'}
          on:click={() => (viewMode = 'list')}
          title="List view"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="browser-content">
    <div class="sidebar">
      <ModuleList
        {modules}
        {selectedModuleId}
        {campaignModuleIds}
        on:select={handleModuleSelect}
      />
    </div>

    <div class="main-area">
      {#if !selectedModuleId}
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <p>Select a module to view its contents</p>
        </div>
      {:else}
        <ModuleEntityList
          {entities}
          selectedEntityId={selectedEntity?.id || null}
          loading={$modulesStore.loading}
          {viewMode}
          {searchQuery}
          {filterEntityType}
          on:select={handleEntitySelect}
        />
      {/if}
    </div>
  </div>
</div>

<!-- Modals -->
{#if showEntityDetail && selectedEntity && selectedModuleId}
  <ModuleEntityDetail
    entity={selectedEntity}
    moduleId={selectedModuleId}
    on:close={handleEntityDetailClose}
  />
{/if}

{#if showValidationStatus && selectedModule}
  <ModuleValidationStatus
    module={selectedModule}
    on:close={handleValidationClose}
  />
{/if}

<style>
  .module-browser {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .browser-toolbar {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background-color: var(--color-bg-secondary, #2d2d2d);
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .search-input {
    flex: 1;
    max-width: 300px;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .filter-select {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toolbar-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background-color: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-secondary, #aaa);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toolbar-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
    border-color: #4a90e2;
  }

  .toolbar-button.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .toolbar-button svg {
    width: 1rem;
    height: 1rem;
  }

  .view-mode-toggle {
    display: flex;
    gap: 0.25rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    padding: 0.125rem;
  }

  .view-mode-button {
    padding: 0.5rem;
    background: none;
    border: none;
    border-radius: 3px;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    transition: all 0.2s;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-mode-button svg {
    width: 1rem;
    height: 1rem;
  }

  .view-mode-button:hover {
    color: #4a90e2;
  }

  .view-mode-button.active {
    background-color: #4a90e2;
    color: white;
  }

  .browser-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .sidebar {
    width: 280px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid var(--color-border, #333);
  }

  .main-area {
    flex: 1;
    overflow-y: auto;
    background-color: var(--color-bg-primary, #1a1a1a);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--color-text-secondary, #888);
  }

  .empty-state svg {
    width: 64px;
    height: 64px;
    opacity: 0.5;
  }

  @media (max-width: 1024px) {
    .sidebar {
      width: 240px;
    }
  }

  @media (max-width: 768px) {
    .browser-content {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      max-height: 200px;
      border-right: none;
      border-bottom: 1px solid var(--color-border, #333);
    }
  }
</style>
