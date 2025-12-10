<!--
  WindowManager.svelte

  Manages all floating windows for popped-out sidebar tabs.

  Usage:
    <WindowManager
      tabs={tabs}
      on:create-actor={handleCreateActor}
      on:edit-actor={handleEditActor}
      on:select-token={handleSelectToken}
    />
-->
<script lang="ts">
  import type { ComponentType, SvelteComponent } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { sidebarStore, floatingWindows } from '$lib/stores/sidebar';
  import FloatingWindow from './FloatingWindow.svelte';

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

  const dispatch = createEventDispatcher();

  // Subscribe to stores
  $: poppedOutTabs = $sidebarStore.poppedOutTabs;
  $: windows = $floatingWindows;

  // Get windows array for rendering
  $: windowsArray = Array.from(windows.values());

  // Get tab for a window
  function getTabForWindow(windowId: string) {
    const window = windows.get(windowId);
    if (!window) return null;

    return tabs.find(t => t.id === window.tabId);
  }

  // Handle window close (dock back to sidebar)
  function handleWindowClose(windowId: string) {
    const window = windows.get(windowId);
    if (!window) return;

    // Remove from popped out tabs
    sidebarStore.dockPopOutWindow(window.tabId);

    // Remove the floating window
    floatingWindows.removeWindow(windowId);

    // Set this tab as active in the sidebar
    sidebarStore.setActiveTab(window.tabId);
  }

  // Handle window focus (bring to front)
  function handleWindowFocus(windowId: string) {
    sidebarStore.bringToFront(windowId);
  }

  // Handle window move
  function handleWindowMove(windowId: string, position: { x: number; y: number }) {
    floatingWindows.updatePosition(windowId, position.x, position.y);
  }

  // Handle window resize
  function handleWindowResize(windowId: string, size: { width: number; height: number }) {
    floatingWindows.updateSize(windowId, size.width, size.height);
  }

  // Forward events from child components
  function forwardEvent(event: CustomEvent) {
    dispatch(event.type, event.detail);
  }
</script>

<!-- Render all floating windows -->
{#each windowsArray as window (window.id)}
  {@const tab = getTabForWindow(window.id)}
  {#if tab}
    <FloatingWindow
      id={window.id}
      title={tab.label}
      initialPosition={window.position}
      initialSize={window.size}
      zIndex={window.zIndex}
      on:close={() => handleWindowClose(window.id)}
      on:focus={() => handleWindowFocus(window.id)}
      on:move={(e) => handleWindowMove(window.id, e.detail)}
      on:resize={(e) => handleWindowResize(window.id, e.detail)}
    >
      <svelte:component
        this={tab.component}
        {...tab.props}
        on:create-actor={forwardEvent}
        on:edit-actor={forwardEvent}
        on:select-token={forwardEvent}
      />
    </FloatingWindow>
  {/if}
{/each}
