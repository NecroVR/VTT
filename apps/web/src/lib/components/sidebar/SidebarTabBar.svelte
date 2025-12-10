<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Tab interface
  export interface Tab {
    id: string;
    label: string;
    icon?: string;
  }

  // Props
  export let tabs: Tab[] = [];
  export let activeTabId: string = '';
  export let collapsed: boolean = false;
  export let onTabClick: (tabId: string) => void = () => {};
  export let onPopOut: (tabId: string) => void = () => {};
  export let onToggleCollapse: () => void = () => {};

  const dispatch = createEventDispatcher<{
    tabClick: string;
    popOut: string;
    toggleCollapse: void;
  }>();

  // Get icon for tab (either provided icon or first letter of label)
  function getTabIcon(tab: Tab): string {
    if (tab.icon) return tab.icon;
    return tab.label.charAt(0).toUpperCase();
  }

  // Get full icon mapping for common tabs
  function getDisplayIcon(tab: Tab): string {
    if (tab.icon) return tab.icon;

    // Map common tab names to icons
    const iconMap: Record<string, string> = {
      'chat': '💬',
      'combat': '⚔',
      'tracker': '⚔',
      'tokens': '🎭',
      'assets': '🖼',
      'admin': '⚙',
      'gm': '⚙',
    };

    const key = tab.label.toLowerCase();
    return iconMap[key] || tab.label.charAt(0).toUpperCase();
  }

  function handleTabClick(tabId: string) {
    activeTabId = tabId;
    onTabClick(tabId);
    dispatch('tabClick', tabId);
  }

  function handlePopOut(event: MouseEvent, tabId: string) {
    event.stopPropagation();
    onPopOut(tabId);
    dispatch('popOut', tabId);
  }

  function handleToggleCollapse() {
    onToggleCollapse();
    dispatch('toggleCollapse');
  }

  let hoveredTab: string | null = null;
</script>

<div class="tab-bar" class:collapsed>
  <!-- Toggle button -->
  <button
    class="toggle-button"
    on:click={handleToggleCollapse}
    type="button"
    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  >
    {collapsed ? '▶' : '◀'}
  </button>

  <!-- Tab buttons -->
  {#each tabs as tab}
    {#if collapsed}
      <!-- Collapsed mode: vertical icons -->
      <button
        class="tab-button vertical-tab"
        class:active={activeTabId === tab.id}
        on:click={() => handleTabClick(tab.id)}
        on:mouseenter={() => hoveredTab = tab.id}
        on:mouseleave={() => hoveredTab = null}
        type="button"
        title={tab.label}
      >
        <span class="tab-icon">{getDisplayIcon(tab)}</span>

        <!-- Tooltip -->
        {#if hoveredTab === tab.id}
          <div class="tooltip">{tab.label}</div>
        {/if}
      </button>
    {:else}
      <!-- Expanded mode: horizontal tabs -->
      <button
        class="tab-button horizontal-tab"
        class:active={activeTabId === tab.id}
        on:click={() => handleTabClick(tab.id)}
        on:mouseenter={() => hoveredTab = tab.id}
        on:mouseleave={() => hoveredTab = null}
        type="button"
      >
        <span class="tab-label">{tab.label}</span>

        <!-- Pop-out button on hover -->
        {#if hoveredTab === tab.id}
          <button
            class="popout-button"
            on:click={(e) => handlePopOut(e, tab.id)}
            type="button"
            title="Pop out {tab.label}"
          >
            ⤴
          </button>
        {/if}
      </button>
    {/if}
  {/each}
</div>

<style>
  .tab-bar {
    display: flex;
    background-color: #111827;
    border-bottom: 2px solid #374151;
    flex-shrink: 0;
    position: relative;
  }

  .tab-bar.collapsed {
    flex-direction: column;
    border-bottom: none;
    border-right: 2px solid #374151;
    width: 45px;
  }

  /* Toggle button */
  .toggle-button {
    padding: 0.5rem;
    background-color: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
  }

  .collapsed .toggle-button {
    width: 45px;
    height: 45px;
    border-bottom: 1px solid #374151;
  }

  /* Tab buttons */
  .tab-button {
    padding: 0.75rem 1rem;
    background-color: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .tab-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
  }

  .tab-button.active {
    color: #60a5fa;
    background-color: #1f2937;
  }

  /* Horizontal tab styles */
  .horizontal-tab {
    flex: 1;
    min-width: 0;
  }

  .horizontal-tab.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #3b82f6;
  }

  .tab-label {
    flex: 1;
    text-align: center;
  }

  /* Vertical tab styles */
  .vertical-tab {
    width: 45px;
    height: 45px;
    font-weight: 600;
    font-size: 1.125rem;
    border-bottom: 1px solid #374151;
  }

  .vertical-tab.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: #3b82f6;
  }

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Pop-out button */
  .popout-button {
    padding: 0.25rem 0.5rem;
    background-color: #374151;
    border: none;
    border-radius: 0.25rem;
    color: #9ca3af;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .popout-button:hover {
    background-color: #4b5563;
    color: #f3f4f6;
  }

  /* Tooltip for collapsed mode */
  .tooltip {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 0.5rem;
    padding: 0.5rem 0.75rem;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.25rem;
    color: #f3f4f6;
    font-size: 0.875rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1000;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }

  .tooltip::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: #374151;
  }
</style>
