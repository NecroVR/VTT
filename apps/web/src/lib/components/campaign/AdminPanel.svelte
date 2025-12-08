<script lang="ts">
  import { campaignsStore } from '$lib/stores/campaigns';

  export let campaignId: string;

  let error: string | null = null;
  let saving = false;

  // Read settings from the campaigns store (reactive)
  $: currentCampaign = $campaignsStore.currentCampaign;
  $: snapToGrid = currentCampaign?.settings?.snapToGrid ?? false;
  $: loading = $campaignsStore.loading;

  async function handleToggleSnapToGrid() {
    saving = true;
    error = null;

    try {
      // Use the store's updateCampaign method - this updates currentCampaign
      const success = await campaignsStore.updateCampaign(campaignId, {
        settings: {
          snapToGrid: !snapToGrid,
        },
      });

      if (!success) {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      error = 'Failed to save settings';
    } finally {
      saving = false;
    }
  }
</script>

<div class="admin-panel">
  <div class="panel-header">
    <h2>Campaign Settings</h2>
  </div>

  <div class="panel-content">
    {#if loading}
      <div class="loading">Loading settings...</div>
    {:else if error}
      <div class="error-message">{error}</div>
    {:else}
      <section class="settings-section">
        <h3>Grid Settings</h3>

        <div class="setting-item">
          <div class="setting-info">
            <label for="snap-to-grid">Grid Snapping</label>
            <p class="setting-description">
              When enabled, tokens automatically snap to the center of grid cells when dropped
            </p>
          </div>
          <label class="toggle-switch">
            <input
              id="snap-to-grid"
              type="checkbox"
              checked={snapToGrid}
              disabled={saving}
              on:change={handleToggleSnapToGrid}
            />
            <span class="slider"></span>
          </label>
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .admin-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    color: #e5e7eb;
    overflow: hidden;
  }

  .panel-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #374151;
    flex-shrink: 0;
  }

  .panel-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f3f4f6;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
  }

  .error-message {
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    font-size: 0.875rem;
  }

  .settings-section {
    margin-bottom: 2rem;
  }

  .settings-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f3f4f6;
    border-bottom: 1px solid #374151;
    padding-bottom: 0.5rem;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 6px;
  }

  .setting-info {
    flex: 1;
  }

  .setting-info label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #f3f4f6;
    margin-bottom: 0.25rem;
    cursor: pointer;
  }

  .setting-description {
    margin: 0;
    font-size: 0.75rem;
    color: #9ca3af;
    line-height: 1.4;
  }

  /* Toggle Switch Styles */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #374151;
    transition: 0.3s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: #9ca3af;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #3b82f6;
  }

  input:checked + .slider:before {
    background-color: white;
    transform: translateX(24px);
  }

  input:disabled + .slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input:focus + .slider {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  /* Hover effects */
  .slider:hover {
    background-color: #4b5563;
  }

  input:checked + .slider:hover {
    background-color: #2563eb;
  }
</style>
