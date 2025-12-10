<!--
  OverlaySidebar.svelte

  A fixed-position sidebar that overlays the canvas without affecting its size.
  Supports docked/collapsed states and tab-based content.

  Usage:
    <OverlaySidebar
      tabs={[
        { id: 'chat', label: 'Chat', icon: 'chat', component: ChatPanel, props: {} },
        { id: 'actors', label: 'Actors', icon: 'person', component: ActorPanel, props: {} }
      ]}
      activeTabId="chat"
      width={350}
      headerHeight={calculatedHeaderHeight}
      on:create-actor={handleCreateActor}
      on:edit-actor={handleEditActor}
      on:select-token={handleSelectToken}
    />

  Note: headerHeight should be calculated from the actual header element height
  to ensure proper alignment with the content area.
-->
<script lang="ts">
  import type { ComponentType, SvelteComponent } from 'svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { sidebarStore, floatingWindows } from '$lib/stores/sidebar';
  import FloatingWindow from './FloatingWindow.svelte';
  import {
    ChatIcon,
    SwordsIcon,
    PersonIcon,
    ImageIcon,
    GearIcon,
  } from '$lib/components/icons';

  // Tab interface
  interface Tab {
    id: string;
    label: string;
    icon?: string;
    component: ComponentType<SvelteComponent>;
    props?: Record<string, any>;
  }

  // Props
  export let tabs: Tab[] = [];
  export let activeTabId: string = '';
  export let headerHeight: number = 60;

  const dispatch = createEventDispatcher();

  // Subscribe to sidebar store
  $: docked = $sidebarStore.docked;
  $: collapsed = $sidebarStore.collapsed;
  $: dockedWidth = $sidebarStore.dockedWidth;

  // Track if tabs should show text or icon-only based on available width
  let tabBarElement: HTMLElement | null = null;
  let showTabText = true;

  // Calculate the minimum width needed for all tabs with text
  // Each tab needs roughly: icon(16px) + gap(8px) + text(~50px avg) + padding(32px) = ~106px
  // Plus collapse buttons: 2 * 45px = 90px
  // For 5 tabs: 5 * 70px (compressed) + 90px = 440px as comfortable threshold
  const MIN_WIDTH_FOR_TEXT = 340; // Width threshold below which we hide text

  // Reactive check based on dockedWidth
  $: {
    if (docked && !collapsed) {
      showTabText = dockedWidth >= MIN_WIDTH_FOR_TEXT;
    } else {
      showTabText = true; // Always show text in floating mode
    }
  }


  // Filter out popped-out tabs
  $: visibleTabs = tabs.filter(t => !$sidebarStore.poppedOutTabs.has(t.id));

  // If no active tab is set, use the first visible tab
  $: if (!activeTabId && visibleTabs.length > 0) {
    activeTabId = visibleTabs[0].id;
  }

  // Get the active tab object
  $: activeTab = visibleTabs.find((tab) => tab.id === activeTabId);

  // Map icon names to components
  const iconMap: Record<string, ComponentType<SvelteComponent>> = {
    chat: ChatIcon,
    swords: SwordsIcon,
    person: PersonIcon,
    image: ImageIcon,
    gear: GearIcon,
  };

  function handleTabClick(tabId: string) {
    if (!collapsed) {
      activeTabId = tabId;
      sidebarStore.setActiveTab(tabId);
    } else {
      // If collapsed, expand and set active tab
      sidebarStore.toggleCollapse();
      activeTabId = tabId;
      sidebarStore.setActiveTab(tabId);
    }
  }

  function toggleCollapse() {
    sidebarStore.toggleCollapse();
  }

  function toggleDock() {
    sidebarStore.toggleDock();
  }

  // Forward events from child components
  function forwardEvent(event: CustomEvent) {
    dispatch(event.type, event.detail);
  }

  // Handle floating sidebar position and size updates
  function handleFloatingMove(e: CustomEvent) {
    sidebarStore.updateFloatingPosition(e.detail.x, e.detail.y);
  }

  function handleFloatingResize(e: CustomEvent) {
    sidebarStore.updateFloatingSize(e.detail.width, e.detail.height);
  }

  // Handle pop-out tab
  function handlePopOut(tabId: string) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Add to popped out tabs set
    sidebarStore.popOutTab(tabId);

    // Create a floating window for this tab
    floatingWindows.addWindow({
      id: `window-${tabId}`,
      tabId: tabId,
      title: tab.label,
      position: { x: 100, y: 100 },
      size: { width: 350, height: 400 },
      zIndex: $sidebarStore.highestZIndex,
      minimized: false
    });

    // If this was the active tab, switch to another
    if (activeTabId === tabId) {
      const remainingTabs = visibleTabs.filter(t => t.id !== tabId);
      if (remainingTabs.length > 0) {
        activeTabId = remainingTabs[0].id;
        sidebarStore.setActiveTab(remainingTabs[0].id);
      }
    }
  }
</script>

{#if !docked}
  <!-- Undocked/Floating mode: Sidebar as a floating window -->
  <FloatingWindow
    id="sidebar-main"
    title="Sidebar"
    initialPosition={$sidebarStore.floatingPosition}
    initialSize={$sidebarStore.floatingSize}
    zIndex={500}
    closeable={false}
    on:move={handleFloatingMove}
    on:resize={handleFloatingResize}
  >
    <!-- Tab bar and content -->
    <div class="floating-sidebar-content">
      <div class="tab-bar">
        {#each visibleTabs as tab}
          <button
            class="tab-button"
            class:active={activeTabId === tab.id}
            on:click={() => handleTabClick(tab.id)}
            on:contextmenu|preventDefault={() => handlePopOut(tab.id)}
            type="button"
            title="Right-click to pop out"
          >
            {#if tab.icon && iconMap[tab.icon]}
              <svelte:component this={iconMap[tab.icon]} size={16} />
            {/if}
            <span class="tab-label">{tab.label}</span>
          </button>
        {/each}

        <button
          class="collapse-button"
          on:click={toggleDock}
          type="button"
          title="Dock sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6v12M6 12h12" />
          </svg>
        </button>
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
    </div>
  </FloatingWindow>
{:else}
  <!-- Docked mode: Relative positioned sidebar -->
  <div
    class="overlay-sidebar"
    class:collapsed
  >
    {#if collapsed}
      <!-- Collapsed state: Vertical icon strip -->
      <div class="collapsed-strip">
        <button
          class="toggle-button"
          on:click={toggleCollapse}
          type="button"
          title="Expand sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div class="icon-tabs">
          {#each visibleTabs as tab}
            <button
              class="icon-tab-button"
              class:active={activeTabId === tab.id}
              on:click={() => handleTabClick(tab.id)}
              type="button"
              title={tab.label}
            >
              {#if tab.icon && iconMap[tab.icon]}
                <svelte:component this={iconMap[tab.icon]} size={20} />
              {:else}
                <span class="tab-label-char">{tab.label.charAt(0)}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Expanded state: Tab bar and content -->
      <div class="tab-bar" class:icon-only={!showTabText}>
        {#each visibleTabs as tab}
          <button
            class="tab-button"
            class:active={activeTabId === tab.id}
            class:icon-only={!showTabText}
            on:click={() => handleTabClick(tab.id)}
            on:contextmenu|preventDefault={() => handlePopOut(tab.id)}
            type="button"
            title={showTabText ? "Right-click to pop out" : `${tab.label} (Right-click to pop out)`}
          >
            {#if tab.icon && iconMap[tab.icon]}
              <svelte:component this={iconMap[tab.icon]} size={showTabText ? 16 : 18} />
            {/if}
            {#if showTabText}
              <span class="tab-label">{tab.label}</span>
            {/if}
          </button>
        {/each}

        <button
          class="collapse-button"
          on:click={toggleDock}
          type="button"
          title="Undock sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>

        <button
          class="collapse-button"
          on:click={toggleCollapse}
          type="button"
          title="Collapse sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
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
{/if}

<style>
  .overlay-sidebar {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    background-color: #1f2937;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  }

  /* Collapsed state styles */
  .collapsed-strip {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
  }

  .toggle-button {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #111827;
    border: none;
    border-bottom: 1px solid #374151;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toggle-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
  }

  .icon-tabs {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .icon-tab-button {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    border-bottom: 1px solid #374151;
  }

  .icon-tab-button:hover {
    background-color: #374151;
    color: #d1d5db;
  }

  .icon-tab-button.active {
    color: #60a5fa;
    background-color: #1e3a5f;
    border-left: 3px solid #3b82f6;
  }

  .tab-label-char {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* Expanded state styles */
  .tab-bar {
    display: flex;
    background-color: #111827;
    border-bottom: 2px solid #374151;
    flex-shrink: 0;
    align-items: center;
  }

  /* When in icon-only mode, center the tabs and let them share space evenly */
  .tab-bar.icon-only {
    justify-content: flex-start;
  }

  .tab-bar.icon-only .tab-button {
    flex: 1 1 auto;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-width: 0; /* Allow shrinking */
  }

  /* Icon-only mode for tabs when sidebar is narrow */
  .tab-button.icon-only {
    flex: 0 0 auto;
    padding: 0.75rem 0.5rem;
    min-width: 36px;
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

  .tab-label {
    display: inline-block;
  }

  .collapse-button {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    border-left: 1px solid #374151;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .collapse-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
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

  /* Hide scrollbar but allow scrolling for collapsed icon tabs */
  .icon-tabs::-webkit-scrollbar {
    width: 0;
    display: none;
  }

  .icon-tabs {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Floating sidebar content */
  .floating-sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
</style>
