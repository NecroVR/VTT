<script lang="ts">
  import type { ComponentType, SvelteComponent } from 'svelte';
  import { createEventDispatcher } from 'svelte';

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
  export let collapsed: boolean = false;

  const dispatch = createEventDispatcher();

  // Collapsed sidebar constants
  const COLLAPSED_WIDTH = 45;
  const FLYOUT_DELAY = 250; // ms delay before hiding flyout

  // Flyout state
  let flyoutVisible = false;
  let flyoutTabId: string | null = null;
  let hideTimeout: number | null = null;

  // If no active tab is set, use the first tab
  $: if (!activeTabId && tabs.length > 0) {
    activeTabId = tabs[0].id;
  }

  // Get the active tab object
  $: activeTab = tabs.find(tab => tab.id === activeTabId);

  function handleTabClick(tabId: string) {
    if (collapsed) {
      // In collapsed mode, show flyout
      showFlyout(tabId);
    } else {
      // In expanded mode, switch active tab normally
      activeTabId = tabId;
    }
  }

  function toggleCollapse() {
    collapsed = !collapsed;
    dispatch('collapse', { collapsed });

    // Hide flyout when expanding
    if (!collapsed) {
      hideFlyout();
    }
  }

  function showFlyout(tabId: string) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    flyoutTabId = tabId;
    flyoutVisible = true;
  }

  function scheduleFlyoutHide() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    hideTimeout = window.setTimeout(() => {
      hideFlyout();
    }, FLYOUT_DELAY);
  }

  function cancelFlyoutHide() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  function hideFlyout() {
    flyoutVisible = false;
    flyoutTabId = null;
  }

  function handleSidebarMouseLeave() {
    if (collapsed && flyoutVisible) {
      scheduleFlyoutHide();
    }
  }

  function handleSidebarMouseEnter() {
    if (collapsed) {
      cancelFlyoutHide();
    }
  }

  // Forward events from child components
  function forwardEvent(event: CustomEvent) {
    dispatch(event.type, event.detail);
  }

  // Get the tab to display in flyout or main content
  $: displayTab = collapsed && flyoutVisible && flyoutTabId
    ? tabs.find(tab => tab.id === flyoutTabId)
    : activeTab;
</script>

<div
  class="tabbed-sidebar"
  class:collapsed
  style="width: {collapsed ? COLLAPSED_WIDTH : sidebarWidth}px;"
  on:mouseenter={handleSidebarMouseEnter}
  on:mouseleave={handleSidebarMouseLeave}
  role="complementary"
>
  {#if collapsed}
    <!-- Collapsed sidebar with vertical tabs -->
    <div class="collapsed-bar">
      <button
        class="collapse-toggle"
        on:click={toggleCollapse}
        type="button"
        title="Expand sidebar"
      >
        &lt;&lt;
      </button>
      {#each tabs as tab}
        <button
          class="vertical-tab-button"
          class:active={flyoutTabId === tab.id}
          on:click={() => handleTabClick(tab.id)}
          on:mouseenter={() => showFlyout(tab.id)}
          type="button"
          title={tab.label}
        >
          <span class="vertical-label">{tab.label.charAt(0)}</span>
        </button>
      {/each}
    </div>

    <!-- Flyout panel -->
    {#if flyoutVisible && displayTab}
      <div
        class="flyout-panel"
        on:mouseenter={cancelFlyoutHide}
        on:mouseleave={scheduleFlyoutHide}
        role="dialog"
        aria-label="{displayTab.label} panel"
        style="width: {sidebarWidth}px;"
      >
        <div class="flyout-header">
          <h3>{displayTab.label}</h3>
        </div>
        <div class="flyout-content">
          <svelte:component
            this={displayTab.component}
            {...displayTab.props}
            on:create-actor={forwardEvent}
            on:edit-actor={forwardEvent}
            on:select-token={forwardEvent}
          />
        </div>
      </div>
    {/if}
  {:else}
    <!-- Expanded sidebar -->
    <div class="tab-bar">
      <button
        class="collapse-toggle"
        on:click={toggleCollapse}
        type="button"
        title="Collapse sidebar"
      >
        &gt;&gt;
      </button>
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
        <svelte:component
          this={activeTab.component}
          {...activeTab.props}
          on:create-actor={forwardEvent}
          on:edit-actor={forwardEvent}
          on:select-token={forwardEvent}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .tabbed-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    overflow: visible;
    transition: width 0.3s ease;
    position: relative;
  }

  .tabbed-sidebar.collapsed {
    overflow: visible;
  }

  /* Expanded sidebar styles */
  .tab-bar {
    display: flex;
    background-color: #111827;
    border-bottom: 2px solid #374151;
    flex-shrink: 0;
  }

  .collapse-toggle {
    width: 45px;
    padding: 0.75rem 0.5rem;
    background-color: transparent;
    border: none;
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border-right: 1px solid #374151;
    flex-shrink: 0;
  }

  .collapse-toggle:hover {
    background-color: #1f2937;
    color: #d1d5db;
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

  /* Collapsed sidebar styles */
  .collapsed-bar {
    display: flex;
    flex-direction: column;
    background-color: #111827;
    height: 100%;
    width: 100%;
  }

  .collapsed-bar .collapse-toggle {
    border-right: none;
    border-bottom: 1px solid #374151;
    width: 100%;
    padding: 0.75rem 0.5rem;
  }

  .vertical-tab-button {
    width: 100%;
    padding: 1rem 0.5rem;
    background-color: transparent;
    border: none;
    border-bottom: 1px solid #374151;
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vertical-tab-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
  }

  .vertical-tab-button.active {
    color: #60a5fa;
    background-color: #1f2937;
  }

  .vertical-tab-button.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: #3b82f6;
  }

  .vertical-label {
    display: block;
    font-size: 1rem;
    font-weight: 600;
  }

  /* Flyout panel styles */
  .flyout-panel {
    position: absolute;
    left: 100%;
    top: 0;
    height: 100%;
    background-color: #1f2937;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .flyout-header {
    background-color: #111827;
    border-bottom: 2px solid #374151;
    padding: 0.75rem 1rem;
    flex-shrink: 0;
  }

  .flyout-header h3 {
    margin: 0;
    color: #60a5fa;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .flyout-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .flyout-content > :global(*) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
