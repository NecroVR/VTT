<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Compendium, CompendiumEntityType } from '@vtt/shared';

  export let compendiums: Compendium[];
  export let selectedCompendiumId: string | null = null;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    select: string;
    create: void;
  }>();

  function handleSelect(compendiumId: string) {
    dispatch('select', compendiumId);
  }

  function handleCreate() {
    dispatch('create');
  }

  function getEntityIcon(type: CompendiumEntityType): string {
    switch (type) {
      case 'Actor':
        return '👤';
      case 'Item':
        return '⚔️';
      case 'JournalEntry':
        return '📖';
      case 'Scene':
        return '🗺️';
      default:
        return '📄';
    }
  }

  // Group compendiums by entity type
  $: groupedCompendiums = compendiums.reduce((groups, compendium) => {
    const type = compendium.entityType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(compendium);
    return groups;
  }, {} as Record<CompendiumEntityType, Compendium[]>);
</script>

<div class="compendium-list">
  <div class="list-header">
    <h3>Compendiums</h3>
    {#if isGM}
      <button class="button-create" on:click={handleCreate} title="Create Compendium">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    {/if}
  </div>

  <div class="list-content">
    {#if compendiums.length === 0}
      <div class="empty-state">
        <p>No compendiums available</p>
        {#if isGM}
          <button class="button-secondary" on:click={handleCreate}>
            Create Compendium
          </button>
        {/if}
      </div>
    {:else}
      {#each Object.entries(groupedCompendiums) as [entityType, typeCompendiums]}
        <div class="compendium-group">
          <div class="group-header">
            <span class="group-icon">{getEntityIcon(entityType as CompendiumEntityType)}</span>
            <span class="group-label">{entityType}s</span>
            <span class="group-count">{typeCompendiums.length}</span>
          </div>
          <div class="group-items">
            {#each typeCompendiums as compendium (compendium.id)}
              <div
                class="compendium-item"
                class:selected={selectedCompendiumId === compendium.id}
                on:click={() => handleSelect(compendium.id)}
                on:keydown={(e) => e.key === 'Enter' && handleSelect(compendium.id)}
                role="button"
                tabindex="0"
              >
                <div class="item-icon">{getEntityIcon(compendium.entityType)}</div>
                <div class="item-info">
                  <div class="item-label" title={compendium.label}>
                    {compendium.label}
                  </div>
                  {#if compendium.private}
                    <span class="item-badge private" title="Private">🔒</span>
                  {/if}
                  {#if compendium.locked}
                    <span class="item-badge locked" title="Locked">🔐</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .compendium-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-right: 1px solid var(--color-border, #333);
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .list-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .button-create {
    width: 2rem;
    height: 2rem;
    padding: 0.25rem;
    background-color: #4a90e2;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button-create:hover {
    background-color: #357abd;
  }

  .button-create svg {
    width: 100%;
    height: 100%;
  }

  .list-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    gap: 1rem;
    color: var(--color-text-secondary, #888);
    text-align: center;
  }

  .compendium-group {
    margin-bottom: 1rem;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary, #aaa);
    border-bottom: 1px solid var(--color-border, #333);
  }

  .group-icon {
    font-size: 1rem;
  }

  .group-label {
    flex: 1;
  }

  .group-count {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 12px;
  }

  .group-items {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.25rem 0;
  }

  .compendium-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .compendium-item:hover {
    background-color: rgba(74, 144, 226, 0.1);
  }

  .compendium-item.selected {
    background-color: rgba(74, 144, 226, 0.2);
    border-left: 3px solid #4a90e2;
    padding-left: calc(0.5rem - 3px);
  }

  .item-icon {
    font-size: 1.25rem;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .item-label {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-badge {
    font-size: 0.75rem;
  }

  .button-secondary {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }
</style>
