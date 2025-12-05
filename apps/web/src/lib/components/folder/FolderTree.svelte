<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Folder } from '@vtt/shared';

  // Props
  export let folders: Folder[] = [];
  export let selectedFolderId: string | null = null;
  export let expandedFolders: Set<string> = new Set();
  export let level: number = 0;

  const dispatch = createEventDispatcher<{
    select: string | null;
    toggle: string;
    contextmenu: { folderId: string; event: MouseEvent };
  }>();

  function handleFolderClick(folderId: string) {
    dispatch('select', folderId);
  }

  function handleToggle(folderId: string, event: Event) {
    event.stopPropagation();
    dispatch('toggle', folderId);
  }

  function handleContextMenu(folderId: string, event: MouseEvent) {
    event.preventDefault();
    dispatch('contextmenu', { folderId, event });
  }

  function getSubfolders(parentId: string | null): Folder[] {
    return folders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => a.sort - b.sort);
  }

  // Get root folders (no parent)
  $: rootFolders = level === 0 ? getSubfolders(null) : folders;
</script>

<div class="folder-tree" style="padding-left: {level * 1}rem;">
  {#each rootFolders as folder (folder.id)}
    {@const hasChildren = folders.some(f => f.parentId === folder.id)}
    {@const isExpanded = expandedFolders.has(folder.id)}
    {@const isSelected = selectedFolderId === folder.id}

    <div class="folder-item">
      <div
        class="folder-header"
        class:selected={isSelected}
        on:click={() => handleFolderClick(folder.id)}
        on:contextmenu={(e) => handleContextMenu(folder.id, e)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && handleFolderClick(folder.id)}
      >
        {#if hasChildren}
          <button
            class="expand-button"
            on:click={(e) => handleToggle(folder.id, e)}
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            <span class="expand-icon" class:expanded={isExpanded}>▶</span>
          </button>
        {:else}
          <span class="expand-spacer"></span>
        {/if}

        <span class="folder-icon" style="color: {folder.color || '#9ca3af'};">📁</span>
        <span class="folder-name">{folder.name}</span>
      </div>

      {#if hasChildren && isExpanded}
        <svelte:self
          folders={getSubfolders(folder.id)}
          {selectedFolderId}
          {expandedFolders}
          level={level + 1}
          on:select
          on:toggle
          on:contextmenu
        />
      {/if}
    </div>
  {/each}
</div>

<style>
  .folder-tree {
    user-select: none;
  }

  .folder-item {
    margin-bottom: 0.125rem;
  }

  .folder-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .folder-header:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .folder-header.selected {
    background-color: rgba(59, 130, 246, 0.2);
  }

  .expand-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    color: var(--color-text-secondary, #9ca3af);
  }

  .expand-icon {
    display: inline-block;
    font-size: 0.625rem;
    transition: transform 0.15s;
  }

  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  .expand-spacer {
    width: 1rem;
    height: 1rem;
  }

  .folder-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .folder-name {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-text-primary, #f9fafb);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
