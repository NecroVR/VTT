<script lang="ts">
  import type { ComponentType, SvelteComponent } from 'svelte';

  // Tab interface
  export interface Tab {
    id: string;
    label: string;
    component: ComponentType<SvelteComponent>;
    props?: Record<string, any>;
  }

  // Props
  export let tabs: Tab[] = [];
  export let activeTabId: string = '';
  export let sidebarWidth: number = 350;

  // If no active tab is set, use the first tab
  $: if (!activeTabId && tabs.length > 0) {
    activeTabId = tabs[0].id;
  }

  // Get the active tab object
  $: activeTab = tabs.find(tab => tab.id === activeTabId);

  function handleTabClick(tabId: string) {
    activeTabId = tabId;
  }
</script>

<div class="tabbed-sidebar" style="width: {sidebarWidth}px;">
  <div class="tab-bar">
    {#each tabs as tab}
      <button
        class="tab-button"
        class:active={activeTabId === tab.id}
        on:click={() => handleTabClick(tab.id)}
        type="button"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="tab-content">
    {#if activeTab}
      <svelte:component this={activeTab.component} {...activeTab.props} />
    {/if}
  </div>
</div>

<style>
  .tabbed-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    overflow: hidden;
  }

  .tab-bar {
    display: flex;
    background-color: #111827;
    border-bottom: 2px solid #374151;
    flex-shrink: 0;
  }

  .tab-button {
    flex: 1;
    padding: 0.75rem 1rem;
    background-color: transparent;
    border: none;
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    white-space: nowrap;
    text-align: center;
  }

  .tab-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
  }

  .tab-button.active {
    color: #60a5fa;
    background-color: #1f2937;
  }

  .tab-button.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #3b82f6;
  }

  .tab-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Only the direct child component should fill the space */
  .tab-content > :global(*) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
