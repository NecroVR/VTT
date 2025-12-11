<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Door, DoorStatus } from '@vtt/shared';

  export let doors: Door[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
  }>();

  $: door = doors.length === 1 ? doors[0] : null;
  $: isMultiple = doors.length > 1;

  const doorStatuses: { value: DoorStatus; label: string }[] = [
    { value: 'closed', label: 'Closed' },
    { value: 'open', label: 'Open' },
    { value: 'broken', label: 'Broken' },
  ];

  function handleChange(property: string, value: any) {
    if (door) {
      dispatch('change', { objectId: door.id, property, value });
    }
  }

  function handleDelete() {
    if (door && confirm('Delete this door?')) {
      dispatch('delete', door.id);
    }
  }

  function toggleStatus() {
    if (!door) return;
    const newStatus: DoorStatus = door.status === 'open' ? 'closed' : 'open';
    handleChange('status', newStatus);
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Doors Selected</div>
    <div class="info-text">{doors.length} doors selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', doors[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if door}
  <div class="property-panel">
    <div class="section-header">Door Properties</div>

    <!-- Position Display -->
    <div class="section">
      <div class="section-title">Position</div>
      <div class="info-text">
        From ({door.x1.toFixed(0)}, {door.y1.toFixed(0)}) to ({door.x2.toFixed(0)}, {door.y2.toFixed(0)})
      </div>
    </div>

    <!-- Status -->
    <div class="section">
      <label for="door-status">
        Status
        <select
          id="door-status"
          value={door.status}
          on:change={(e) => handleChange('status', e.currentTarget.value)}
        >
          {#each doorStatuses as status}
            <option value={status.value}>{status.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <!-- Quick Toggle -->
    <div class="section">
      <button
        class="button-full button-primary"
        on:click={toggleStatus}
        disabled={door.status === 'broken'}
      >
        {door.status === 'open' ? 'Close Door' : 'Open Door'}
      </button>
    </div>

    <!-- Locked -->
    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={door.isLocked}
          on:change={(e) => handleChange('isLocked', e.currentTarget.checked)}
        />
        Locked
      </label>
    </div>

    <!-- Actions -->
    <div class="section">
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Door
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .property-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: #1e1e1e;
    color: #e0e0e0;
    font-size: 0.875rem;
  }

  .section-header {
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #aaa;
  }

  .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  select {
    width: 100%;
    padding: 0.375rem;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 0.75rem;
  }

  select:focus {
    outline: none;
    border-color: #4a9eff;
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .button-full {
    width: 100%;
    padding: 0.5rem;
    background-color: #333;
    color: #e0e0e0;
    border: 1px solid #404040;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .button-full:hover:not(:disabled) {
    background-color: #404040;
  }

  .button-full:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-primary {
    background-color: #4a9eff;
    border-color: #4a9eff;
    color: #ffffff;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #3a8eef;
  }

  .button-danger {
    background-color: #ef4444;
    border-color: #ef4444;
    color: #ffffff;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  .info-text {
    font-size: 0.75rem;
    color: #aaa;
    font-style: italic;
  }
</style>
