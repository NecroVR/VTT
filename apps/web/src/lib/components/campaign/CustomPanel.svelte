<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { ItemTemplate, ItemCategory, CustomItemTemplate } from '@vtt/shared';
  import ItemTemplateEditor from '../admin/ItemTemplateEditor.svelte';
  import { API_BASE_URL } from '$lib/config/api';

  // Props
  export let campaignId: string;
  export let gameSystemId: string | null;

  // State
  let templates: CustomItemTemplate[] = [];
  let filteredTemplates: CustomItemTemplate[] = [];
  let loading = true;
  let error: string | null = null;

  // Filter state
  let searchQuery = '';
  let selectedCategory: ItemCategory | 'all' = 'all';

  // Editor state
  let editorOpen = false;
  let editingTemplate: ItemTemplate | null = null;

  // Get auth token
  let token = '';
  if (browser) {
    token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || '';
  }

  // Category options
  const categories: { value: ItemCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'weapon', label: 'Weapons' },
    { value: 'armor', label: 'Armor' },
    { value: 'spell', label: 'Spells' },
    { value: 'consumable', label: 'Consumables' },
    { value: 'feature', label: 'Features' },
    { value: 'tool', label: 'Tools' },
    { value: 'loot', label: 'Loot' },
    { value: 'container', label: 'Containers' },
    { value: 'class', label: 'Classes' },
    { value: 'race', label: 'Races' },
    { value: 'background', label: 'Backgrounds' },
    { value: 'custom', label: 'Custom' },
  ];

  onMount(() => {
    loadTemplates();
  });

  async function loadTemplates() {
    loading = true;
    error = null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/item-templates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load item templates');
      }

      const data = await response.json();
      // Only show custom templates (those with dbId)
      templates = (data.templates?.custom || []).filter((t: ItemTemplate) => 'dbId' in t);
      applyFilters();
    } catch (err) {
      console.error('Error loading templates:', err);
      error = err instanceof Error ? err.message : 'Failed to load templates';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    filteredTemplates = templates.filter((template) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesId = template.id.toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }

  // Apply filters when search or filter values change
  $: {
    searchQuery;
    selectedCategory;
    applyFilters();
  }

  function openEditor(template: ItemTemplate | null = null) {
    editingTemplate = template;
    editorOpen = true;
  }

  function closeEditor() {
    editorOpen = false;
    editingTemplate = null;
  }

  function handleTemplateSaved(event: CustomEvent<ItemTemplate>) {
    // Reload templates to get the updated list
    loadTemplates();
  }

  function handleTemplateDeleted(event: CustomEvent<string>) {
    // Remove the deleted template from the list
    templates = templates.filter((t) => t.id !== event.detail);
    applyFilters();
  }

  function isCustomTemplate(template: ItemTemplate): template is CustomItemTemplate {
    return 'dbId' in template;
  }

  function getCategoryBadgeColor(category: ItemCategory): string {
    const colors: Record<ItemCategory, string> = {
      weapon: '#ef4444',
      armor: '#3b82f6',
      spell: '#8b5cf6',
      consumable: '#10b981',
      feature: '#f59e0b',
      tool: '#6366f1',
      loot: '#eab308',
      container: '#06b6d4',
      class: '#ec4899',
      race: '#14b8a6',
      background: '#a855f7',
      custom: '#64748b',
    };
    return colors[category] || '#64748b';
  }

  function handleDuplicate(template: CustomItemTemplate) {
    // Create a copy for duplication
    const copy = { ...template };
    delete (copy as any).id;
    delete (copy as any).dbId;
    copy.name = `${copy.name} (Copy)`;
    openEditor(copy);
  }
</script>

<div class="custom-panel-container">
  <header class="panel-header">
    <div class="header-content">
      <div class="title-section">
        <h2>Custom Content</h2>
        <p class="subtitle">Manage custom items, races, classes, spells, and properties for your campaign</p>
      </div>
      <button class="button-primary" on:click={() => openEditor(null)}> + Create Custom Template </button>
    </div>

    <div class="filters">
      <div class="search-box">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search custom templates..."
          class="search-input"
        />
      </div>

      <div class="filter-row">
        <select bind:value={selectedCategory} class="category-filter">
          {#each categories as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </header>

  <div class="panel-body">
    {#if loading}
      <div class="loading-state">
        <p>Loading custom templates...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p>Error: {error}</p>
        <button class="button-secondary" on:click={loadTemplates}>Retry</button>
      </div>
    {:else if filteredTemplates.length === 0}
      <div class="empty-state">
        {#if templates.length === 0}
          <h3>No Custom Templates</h3>
          <p>Create custom content specific to your campaign that extends beyond the base game system.</p>
          <p class="help-text">Custom templates can include unique items, spells, races, classes, or any other content you need.</p>
          <button class="button-primary" on:click={() => openEditor(null)}>
            Create Your First Template
          </button>
        {:else}
          <h3>No Matching Templates</h3>
          <p>Try adjusting your search or filters</p>
        {/if}
      </div>
    {:else}
      <div class="templates-grid">
        {#each filteredTemplates as template}
          <div class="template-card">
            <div class="card-header">
              <h3 class="template-name">{template.name}</h3>
              <span
                class="category-badge"
                style="background-color: {getCategoryBadgeColor(template.category)}"
              >
                {template.category}
              </span>
            </div>

            <div class="card-body">
              <div class="template-info">
                <div class="info-row">
                  <span class="info-label">ID:</span>
                  <span class="info-value">{template.id}</span>
                </div>

                {#if template.extends}
                  <div class="info-row">
                    <span class="info-label">Extends:</span>
                    <span class="info-value">{template.extends}</span>
                  </div>
                {/if}

                <div class="info-row">
                  <span class="info-label">Fields:</span>
                  <span class="info-value">{template.fields?.length || 0}</span>
                </div>

                {#if template.effects}
                  <div class="info-row">
                    <span class="info-label">Effects:</span>
                    <span class="info-value">{template.effects.length}</span>
                  </div>
                {/if}

                <div class="info-row">
                  <span class="info-label">Source:</span>
                  <span class="info-value custom-source">
                    Custom
                  </span>
                </div>
              </div>

              <div class="template-features">
                {#if template.physical}
                  <span class="feature-tag">Physical</span>
                {/if}
                {#if template.equippable}
                  <span class="feature-tag">Equippable</span>
                {/if}
                {#if template.activation}
                  <span class="feature-tag">Activatable</span>
                {/if}
                {#if template.consumes}
                  <span class="feature-tag">Consumes</span>
                {/if}
                {#if template.container}
                  <span class="feature-tag">Container</span>
                {/if}
              </div>
            </div>

            <div class="card-footer">
              <button
                class="button-secondary button-sm"
                on:click={() => openEditor(template)}
              >
                Edit
              </button>
              <button
                class="button-secondary button-sm"
                on:click={() => handleDuplicate(template)}
              >
                Duplicate
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if editorOpen}
  <ItemTemplateEditor
    isOpen={editorOpen}
    template={editingTemplate}
    {campaignId}
    systemId={gameSystemId || ''}
    {token}
    readOnly={false}
    on:close={closeEditor}
    on:save={handleTemplateSaved}
    on:delete={handleTemplateDeleted}
  />
{/if}

<style>
  .custom-panel-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-primary, #121212);
  }

  .panel-header {
    padding: 1.5rem;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-bottom: 1px solid var(--color-border, #333);
  }

  .header-content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .title-section {
    flex: 1;
  }

  .title-section h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #aaa);
    line-height: 1.4;
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
    flex: 1;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .filter-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .category-filter {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .category-filter:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-state p,
  .error-state p,
  .empty-state p {
    color: var(--color-text-secondary, #aaa);
    margin: 0.5rem 0;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .empty-state .help-text {
    font-size: 0.875rem;
    color: var(--color-text-tertiary, #888);
    max-width: 500px;
  }

  .empty-state button {
    margin-top: 1.5rem;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .template-card {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .template-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .card-header {
    padding: 1rem;
    background-color: var(--color-bg-tertiary, #0d0d0d);
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .template-name {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .card-body {
    padding: 1rem;
  }

  .template-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .info-label {
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    min-width: 70px;
  }

  .info-value {
    color: var(--color-text-primary, #ffffff);
    font-family: monospace;
  }

  .custom-source {
    color: #10b981;
  }

  .template-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .feature-tag {
    padding: 0.25rem 0.5rem;
    background-color: rgba(74, 144, 226, 0.2);
    color: #4a90e2;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .card-footer {
    padding: 1rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    gap: 0.5rem;
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

  .button-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    flex: 1;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
    white-space: nowrap;
  }

  .button-primary:hover {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  @media (max-width: 768px) {
    .templates-grid {
      grid-template-columns: 1fr;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .button-primary {
      width: 100%;
    }

    .filter-row {
      flex-direction: column;
      align-items: stretch;
    }

    .category-filter {
      width: 100%;
    }
  }
</style>
