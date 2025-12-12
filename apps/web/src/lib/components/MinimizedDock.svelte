<script lang="ts">
  import { slide, fade } from 'svelte/transition';
  import { minimizedForms, restoreForm, closeForm } from '$lib/stores/entityForms';
  import type { EntityFormState } from '$lib/stores/entityForms';

  // Entity type to icon mapping
  function getEntityIcon(entityType: string): string {
    const icons: Record<string, string> = {
      item: '⚔️',
      spell: '✨',
      monster: '👹',
      character: '🧙',
      npc: '👤',
      location: '🏰',
      quest: '📜',
    };
    return icons[entityType.toLowerCase()] || '📄';
  }

  // Truncate entity name if too long
  function truncateName(name: string, maxLength: number = 20): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  }

  // Handle restore click
  function handleRestore(formId: string) {
    restoreForm(formId);
  }

  // Handle close click
  function handleClose(event: MouseEvent, formId: string) {
    event.stopPropagation(); // Prevent triggering restore
    closeForm(formId);
  }
</script>

{#if $minimizedForms.length > 0}
  <div class="minimized-dock" transition:slide={{ duration: 200 }}>
    <div class="dock-container">
      {#each $minimizedForms as form (form.id)}
        <div
          class="minimized-tab"
          on:click={() => handleRestore(form.id)}
          on:keydown={(e) => e.key === 'Enter' && handleRestore(form.id)}
          role="button"
          tabindex="0"
          aria-label="Restore {form.title}"
          transition:fade={{ duration: 150 }}
        >
          <span class="tab-icon" aria-hidden="true">
            {getEntityIcon(form.entityType)}
          </span>
          <span class="tab-title">
            {truncateName(form.title)}
          </span>
          <button
            class="close-button"
            on:click={(e) => handleClose(e, form.id)}
            aria-label="Close {form.title}"
            title="Close"
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .minimized-dock {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 400;
    pointer-events: auto;
  }

  .dock-container {
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    padding: 8px;
    display: flex;
    gap: 8px;
    align-items: center;
    max-width: calc(100vw - 32px);
    overflow-x: auto;
    overflow-y: hidden;
  }

  .dock-container::-webkit-scrollbar {
    height: 6px;
  }

  .dock-container::-webkit-scrollbar-track {
    background: #111827;
    border-radius: 3px;
  }

  .dock-container::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }

  .dock-container::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .minimized-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, transform 0.1s;
    white-space: nowrap;
    user-select: none;
    min-width: 0;
  }

  .minimized-tab:hover {
    background-color: #1f2937;
    border-color: #4b5563;
    transform: translateY(-2px);
  }

  .minimized-tab:active {
    transform: translateY(0);
  }

  .minimized-tab:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .tab-icon {
    font-size: 1rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .tab-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #f9fafb;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-button {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
    flex-shrink: 0;
    margin-left: 4px;
  }

  .close-button:hover {
    background-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .close-button:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 1px;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .minimized-dock {
      bottom: 8px;
      left: 8px;
      right: 8px;
      transform: none;
    }

    .dock-container {
      max-width: 100%;
    }

    .tab-title {
      max-width: 100px;
    }
  }
</style>
