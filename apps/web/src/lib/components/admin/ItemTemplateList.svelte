<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { ItemTemplate, ItemCategory, CustomItemTemplate } from '@vtt/shared';
  import ItemTemplateEditor from './ItemTemplateEditor.svelte';
  import { API_BASE_URL } from '$lib/config/api';

  // Props
  export let campaignId: string;
  export let systemId: string;

  // State
  let templates: ItemTemplate[] = [];
  let filteredTemplates: ItemTemplate[] = [];
  let loading = true;
  let error: string | null = null;

  // Filter state
  let searchQuery = '';
  let selectedCategory: ItemCategory | 'all' = 'all';
  let showGameSystemTemplates = true;
  let showCustomTemplates = true;

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
      // Combine game system templates and custom templates into one array
      templates = [
        ...(data.templates?.gameSystem || []),
        ...(data.templates?.custom || []),
      ];
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

      // Source filter (game system vs custom)
      const isCustom = 'dbId' in template;
      if (!showGameSystemTemplates && !isCustom) return false;
      if (!showCustomTemplates && isCustom) return false;

      return true;
    });
  }

  // Apply filters when search or filter values change
  $: {
    searchQuery;
    selectedCategory;
    showGameSystemTemplates;
    showCustomTemplates;
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
</script>

<div class="template-list-container">
  <header class="list-header">
    <div class="header-content">
      <h2>Item Templates</h2>
      <button class="button-primary" on:click={() => openEditor(null)}> + Create Template </button>
    </div>

    <div class="filters">
      <div class="search-box">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search templates..."
          class="search-input"
        />
      </div>

      <div class="filter-row">
        <select bind:value={selectedCategory} class="category-filter">
          {#each categories as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>

        <div class="source-filters">
          <label class="filter-checkbox">
            <input type="checkbox" bind:checked={showGameSystemTemplates} />
            Game System
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" bind:checked={showCustomTemplates} />
            Custom
          </label>
        </div>
      </div>
    </div>
  </header>

  <div class="list-body">
    {#if loading}
      <div class="loading-state">
        <p>Loading templates...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p>Error: {error}</p>
        <button class="button-secondary" on:click={loadTemplates}>Retry</button>
      </div>
    {:else if filteredTemplates.length === 0}
      <div class="empty-state">
        {#if templates.length === 0}
          <h3>No Item Templates</h3>
          <p>Get started by creating your first custom item template</p>
          <button class="button-primary" on:click={() => openEditor(null)}>
            Create Item Template
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
                  <span class="info-value {isCustomTemplate(template) ? 'custom-source' : 'system-source'}">
                    {isCustomTemplate(template) ? 'Custom' : 'Game System'}
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
                {isCustomTemplate(template) ? 'Edit' : 'View'}
              </button>
              {#if isCustomTemplate(template)}
                <button
                  class="button-secondary button-sm"
                  on:click={() => {
                    // Create a copy for duplication
                    const copy = { ...template };
                    delete copy.id;
                    copy.name = `${copy.name} (Copy)`;
                    openEditor(copy);
                  }}
                >
                  Duplicate
                </button>
              {/if}
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
    {systemId}
    {token}
    readOnly={editingTemplate ? !isCustomTemplate(editingTemplate) : false}
    on:close={closeEditor}
    on:save={handleTemplateSaved}
    on:delete={handleTemplateDeleted}
  />
{/if}

<style>
  .template-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-primary, #121212);
  }

  .list-header {
    padding: 1.5rem;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-bottom: 1px solid var(--color-border, #333);
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .header-content h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
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

  .source-filters {
    display: flex;
    gap: 1rem;
  }

  .filter-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
  }

  .filter-checkbox input {
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
  }

  .list-body {
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

  .system-source {
    color: #3b82f6;
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
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
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
      align-items: flex-start;
      gap: 1rem;
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
