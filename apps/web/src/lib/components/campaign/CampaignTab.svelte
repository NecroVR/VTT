<!--
  CampaignTab.svelte

  A tabbed container component for campaign-related content with three sub-tabs:
  - Modules: ModulesPanel for game system content browsing
  - Uploads: UploadsPanel for asset upload and file browsing
  - Custom: CustomPanel for custom item template management (GM-only)

  Usage:
    <CampaignTab
      campaignId="campaign-123"
      gameSystemId="dnd5e"
      isGM={true}
    />
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ModulesPanel from './ModulesPanel.svelte';
  import UploadsPanel from './UploadsPanel.svelte';
  import CustomPanel from './CustomPanel.svelte';

  // Props
  export let campaignId: string;
  export let gameSystemId: string | null = null;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher();

  // State
  type SubTab = 'modules' | 'uploads' | 'custom';
  let activeSubTab: SubTab = 'modules';

  // Available sub-tabs based on permissions
  interface TabConfig {
    id: SubTab;
    label: string;
    visible: boolean;
  }

  $: subTabs = [
    { id: 'modules' as SubTab, label: 'Modules', visible: true },
    { id: 'uploads' as SubTab, label: 'Uploads', visible: true },
    { id: 'custom' as SubTab, label: 'Custom', visible: isGM }
  ].filter(tab => tab.visible) as TabConfig[];

  // Ensure active tab is always valid
  $: if (!subTabs.find(t => t.id === activeSubTab)) {
    activeSubTab = subTabs[0]?.id || 'modules';
  }

  function handleTabClick(tabId: SubTab) {
    activeSubTab = tabId;
  }

  // Forward events from child components
  function forwardEvent(event: CustomEvent) {
    dispatch(event.type, event.detail);
  }
</script>

<div class="campaign-tab">
  <!-- Sub-tab navigation -->
  <div class="sub-tab-bar">
    {#each subTabs as tab}
      <button
        class="sub-tab-button"
        class:active={activeSubTab === tab.id}
        on:click={() => handleTabClick(tab.id)}
        type="button"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Sub-tab content -->
  <div class="sub-tab-content">
    {#if activeSubTab === 'modules'}
      <div class="content-panel">
        <ModulesPanel
          {campaignId}
          {gameSystemId}
        />
      </div>
    {:else if activeSubTab === 'uploads'}
      <div class="content-panel">
        <UploadsPanel
          {campaignId}
        />
      </div>
    {:else if activeSubTab === 'custom'}
      <div class="content-panel">
        <CustomPanel
          {campaignId}
          {gameSystemId}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .campaign-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: #1f2937;
    overflow: hidden;
  }

  /* Sub-tab navigation bar */
  .sub-tab-bar {
    display: flex;
    align-items: stretch;
    background-color: #111827;
    border-bottom: 2px solid #374151;
    flex-shrink: 0;
  }

  .sub-tab-button {
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

  .sub-tab-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
  }

  .sub-tab-button.active {
    color: #60a5fa;
    background-color: #1f2937;
  }

  .sub-tab-button.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #3b82f6;
  }

  /* Content area */
  .sub-tab-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .content-panel {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Make slotted content fill available space */
  .content-panel > :global(*) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* Placeholder and empty states */
  .placeholder-content,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    gap: 1rem;
    color: #9ca3af;
    text-align: center;
  }

  .placeholder-content p,
  .empty-state p {
    margin: 0;
    font-size: 0.9375rem;
  }

  .hint {
    font-size: 0.8125rem !important;
    color: #6b7280;
  }

  .empty-state svg {
    width: 64px;
    height: 64px;
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }
</style>
