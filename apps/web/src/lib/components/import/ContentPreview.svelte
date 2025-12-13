<script lang="ts">
  import type { FoundryExportData, ContentType } from '@vtt/shared';
  import { createEventDispatcher } from 'svelte';

  export let preview: FoundryExportData;
  export let selectedTypes: Set<ContentType> = new Set();

  const dispatch = createEventDispatcher<{
    selectionChange: Set<ContentType>;
  }>();

  let searchQuery = '';
  let expandedSections: Set<ContentType> = new Set();

  interface ContentTypeInfo {
    type: ContentType;
    label: string;
    count: number;
    items: Array<{ name: string; type?: string }>;
  }

  $: availableTypes = getAvailableTypes(preview);

  function getAvailableTypes(data: FoundryExportData): ContentTypeInfo[] {
    const types: ContentTypeInfo[] = [];

    if (data.actors && data.actors.length > 0) {
      types.push({
        type: 'actor',
        label: 'Actors',
        count: data.actors.length,
        items: data.actors.map(a => ({ name: a.name, type: a.type })),
      });
    }

    if (data.items && data.items.length > 0) {
      types.push({
        type: 'item',
        label: 'Items',
        count: data.items.length,
        items: data.items.map(i => ({ name: i.name, type: i.type })),
      });
    }

    if (data.scenes && data.scenes.length > 0) {
      types.push({
        type: 'scene',
        label: 'Scenes',
        count: data.scenes.length,
        items: data.scenes.map(s => ({ name: s.name })),
      });
    }

    if (data.journals && data.journals.length > 0) {
      types.push({
        type: 'journal',
        label: 'Journals',
        count: data.journals.length,
        items: data.journals.map(j => ({ name: j.name })),
      });
    }

    if (data.tables && data.tables.length > 0) {
      types.push({
        type: 'rolltable',
        label: 'Roll Tables',
        count: data.tables.length,
        items: data.tables.map(t => ({ name: t.name })),
      });
    }

    if (data.playlists && data.playlists.length > 0) {
      types.push({
        type: 'playlist',
        label: 'Playlists',
        count: data.playlists.length,
        items: data.playlists.map(p => ({ name: p.name })),
      });
    }

    return types;
  }

  function toggleType(type: ContentType) {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    selectedTypes = newSelected;
    dispatch('selectionChange', newSelected);
  }

  function toggleSection(type: ContentType) {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    expandedSections = newExpanded;
  }

  function selectAll() {
    const newSelected = new Set(availableTypes.map(t => t.type));
    selectedTypes = newSelected;
    dispatch('selectionChange', newSelected);
  }

  function selectNone() {
    selectedTypes = new Set();
    dispatch('selectionChange', new Set());
  }

  function filterItems(items: Array<{ name: string; type?: string }>, query: string) {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.type && item.type.toLowerCase().includes(lowerQuery))
    );
  }
</script>

<div class="content-preview">
  <!-- System Info -->
  <div class="system-info">
    <div class="info-row">
      <span class="info-label">System:</span>
      <span class="system-badge">{preview.system || 'Unknown'}</span>
    </div>
    {#if preview.systemVersion}
      <div class="info-row">
        <span class="info-label">System Version:</span>
        <span class="info-value">{preview.systemVersion}</span>
      </div>
    {/if}
    {#if preview.foundryVersion}
      <div class="info-row">
        <span class="info-label">Foundry Version:</span>
        <span class="info-value">{preview.foundryVersion}</span>
      </div>
    {/if}
    <div class="info-row">
      <span class="info-label">Export Type:</span>
      <span class="info-value">{preview.type || 'Unknown'}</span>
    </div>
  </div>

  <!-- Selection Controls -->
  <div class="selection-controls">
    <h3>Select Content to Import</h3>
    <div class="control-buttons">
      <button class="button-link" on:click={selectAll}>Select All</button>
      <button class="button-link" on:click={selectNone}>Select None</button>
    </div>
  </div>

  <!-- Content Types -->
  <div class="content-types">
    {#each availableTypes as typeInfo}
      <div class="content-type-section">
        <div class="type-header">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={selectedTypes.has(typeInfo.type)}
              on:change={() => toggleType(typeInfo.type)}
            />
            <span class="type-label">
              {typeInfo.label}
              <span class="type-count">({typeInfo.count})</span>
            </span>
          </label>
          <button
            class="expand-button"
            on:click={() => toggleSection(typeInfo.type)}
            aria-label={expandedSections.has(typeInfo.type) ? 'Collapse' : 'Expand'}
          >
            {expandedSections.has(typeInfo.type) ? '−' : '+'}
          </button>
        </div>

        {#if expandedSections.has(typeInfo.type)}
          <div class="type-items">
            <div class="search-box">
              <input
                type="text"
                placeholder="Search {typeInfo.label.toLowerCase()}..."
                bind:value={searchQuery}
              />
            </div>
            <div class="items-list">
              {#each filterItems(typeInfo.items, searchQuery) as item}
                <div class="item-row">
                  <span class="item-name">{item.name}</span>
                  {#if item.type}
                    <span class="item-type">{item.type}</span>
                  {/if}
                </div>
              {:else}
                <div class="no-results">No items match your search</div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}

    {#if availableTypes.length === 0}
      <div class="no-content">
        No importable content found in this file.
      </div>
    {/if}
  </div>

  <!-- Summary -->
  <div class="import-summary">
    <strong>Selected:</strong>
    {selectedTypes.size} content type{selectedTypes.size !== 1 ? 's' : ''}
    ({availableTypes.filter(t => selectedTypes.has(t.type)).reduce((sum, t) => sum + t.count, 0)} items)
  </div>
</div>

<style>
  .content-preview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .system-info {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 1rem;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-weight: 600;
    color: var(--color-text-secondary, #aaa);
    min-width: 140px;
  }

  .info-value {
    color: var(--color-text-primary, #ffffff);
  }

  .system-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: #4a90e2;
    color: white;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .selection-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .selection-controls h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .control-buttons {
    display: flex;
    gap: 1rem;
  }

  .button-link {
    background: none;
    border: none;
    color: #4a90e2;
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .button-link:hover {
    color: #357abd;
  }

  .content-types {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .content-type-section {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    overflow: hidden;
  }

  .type-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.02);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    flex: 1;
  }

  .checkbox-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .type-label {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
  }

  .type-count {
    color: var(--color-text-secondary, #666);
    font-weight: normal;
  }

  .expand-button {
    background: none;
    border: 1px solid var(--color-border, #333);
    color: var(--color-text-secondary, #aaa);
    width: 2rem;
    height: 2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .expand-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .type-items {
    padding: 1rem;
    border-top: 1px solid var(--color-border, #333);
  }

  .search-box {
    margin-bottom: 0.75rem;
  }

  .search-box input {
    width: 100%;
    padding: 0.5rem;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
  }

  .search-box input::placeholder {
    color: var(--color-text-secondary, #666);
  }

  .items-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    font-size: 0.875rem;
  }

  .item-row:last-child {
    border-bottom: none;
  }

  .item-name {
    color: var(--color-text-primary, #ffffff);
  }

  .item-type {
    color: var(--color-text-secondary, #666);
    font-size: 0.75rem;
    text-transform: capitalize;
  }

  .no-results,
  .no-content {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary, #666);
    font-style: italic;
  }

  .import-summary {
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
  }

  .import-summary strong {
    color: #4a90e2;
  }
</style>
