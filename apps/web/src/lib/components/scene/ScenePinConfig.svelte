<script lang="ts">
  import { scenePinsStore } from '$lib/stores/scenePins';
  import type { ScenePin, TextAnchor } from '@vtt/shared';

  // Props
  export let isOpen: boolean = false;
  export let pinId: string = '';
  export let sceneId: string = '';
  export let onClose: () => void = () => {};

  // Local state
  let pin: ScenePin | null = null;
  let x: number = 0;
  let y: number = 0;
  let icon: string = '';
  let hasCustomIcon: boolean = false;
  let iconSize: number = 1;
  let iconTint: string = '';
  let hasIconTint: boolean = false;
  let text: string = '';
  let fontSize: number = 14;
  let textAnchor: string = 'bottom';
  let textColor: string = '#ffffff';
  let journalId: string = '';
  let hasJournalLink: boolean = false;
  let pageId: string = '';
  let global: boolean = false;

  // Subscribe to store and load pin when pinId changes
  $: if (isOpen && pinId) {
    loadPin();
  }

  function loadPin() {
    scenePinsStore.subscribe(state => {
      const p = state.pins.get(pinId);
      if (p) {
        pin = p;
        x = p.x;
        y = p.y;
        icon = p.icon || '';
        hasCustomIcon = !!p.icon;
        iconSize = p.iconSize;
        iconTint = p.iconTint || '';
        hasIconTint = !!p.iconTint;
        text = p.text || '';
        fontSize = p.fontSize;
        textAnchor = p.textAnchor;
        textColor = p.textColor;
        journalId = p.journalId || '';
        hasJournalLink = !!p.journalId;
        pageId = p.pageId || '';
        global = p.global;
      }
    })();
  }

  async function handleSave() {
    if (!pin) return;

    const updates: Partial<ScenePin> = {
      x,
      y,
      icon: hasCustomIcon ? icon : null,
      iconSize,
      iconTint: hasIconTint ? iconTint : null,
      text: text || null,
      fontSize,
      textAnchor,
      textColor,
      journalId: hasJournalLink ? journalId : null,
      pageId: hasJournalLink && pageId ? pageId : null,
      global,
    };

    // Update via store (which calls API)
    await scenePinsStore.updatePin(pinId, updates);
    onClose();
  }

  async function handleDelete() {
    if (!pin) return;

    if (!confirm('Are you sure you want to delete this pin?')) {
      return;
    }

    // Delete via store (which calls API)
    await scenePinsStore.deletePin(pinId);
    onClose();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen && pin}
  <div class="modal-overlay" on:click={handleOverlayClick} role="presentation">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Edit Scene Pin</h2>
        <button class="close-button" on:click={onClose} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Position -->
        <div class="form-section">
          <h3 class="section-title">Position</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="pin-x">X Position</label>
              <input
                id="pin-x"
                type="number"
                bind:value={x}
                step="0.1"
                class="number-input"
              />
            </div>

            <div class="form-group">
              <label for="pin-y">Y Position</label>
              <input
                id="pin-y"
                type="number"
                bind:value={y}
                step="0.1"
                class="number-input"
              />
            </div>
          </div>
        </div>

        <!-- Icon Settings -->
        <div class="form-section">
          <h3 class="section-title">Icon</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={hasCustomIcon} />
              Use Custom Icon URL
            </label>
          </div>

          {#if hasCustomIcon}
            <div class="form-group">
              <label for="pin-icon">Icon URL</label>
              <input
                id="pin-icon"
                type="text"
                bind:value={icon}
                class="text-input"
                placeholder="https://example.com/icon.png"
              />
            </div>
          {/if}

          <div class="form-group">
            <label for="pin-icon-size">Icon Size: {iconSize.toFixed(1)} grid units</label>
            <input
              id="pin-icon-size"
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              bind:value={iconSize}
              class="slider"
            />
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={hasIconTint} />
              Apply Icon Tint
            </label>
          </div>

          {#if hasIconTint}
            <div class="form-group">
              <label for="pin-icon-tint">Icon Tint Color</label>
              <input
                id="pin-icon-tint"
                type="color"
                bind:value={iconTint}
                class="color-input"
              />
            </div>
          {/if}
        </div>

        <!-- Tooltip Text -->
        <div class="form-section">
          <h3 class="section-title">Tooltip</h3>

          <div class="form-group">
            <label for="pin-text">Tooltip Text</label>
            <input
              id="pin-text"
              type="text"
              bind:value={text}
              class="text-input"
              placeholder="Hover text"
            />
          </div>

          <div class="form-group">
            <label for="pin-font-size">Font Size: {fontSize}px</label>
            <input
              id="pin-font-size"
              type="range"
              min="10"
              max="24"
              step="1"
              bind:value={fontSize}
              class="slider"
            />
          </div>

          <div class="form-group">
            <label for="pin-text-anchor">Text Anchor</label>
            <select id="pin-text-anchor" bind:value={textAnchor} class="select">
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pin-text-color">Text Color</label>
            <input
              id="pin-text-color"
              type="color"
              bind:value={textColor}
              class="color-input"
            />
          </div>
        </div>

        <!-- Journal Link -->
        <div class="form-section">
          <h3 class="section-title">Journal Link</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={hasJournalLink} />
              Link to Journal Entry
            </label>
          </div>

          {#if hasJournalLink}
            <div class="form-group">
              <label for="pin-journal">Journal ID</label>
              <input
                id="pin-journal"
                type="text"
                bind:value={journalId}
                class="text-input"
                placeholder="Journal entry ID"
              />
            </div>

            <div class="form-group">
              <label for="pin-page">Page ID (optional)</label>
              <input
                id="pin-page"
                type="text"
                bind:value={pageId}
                class="text-input"
                placeholder="Specific page ID"
              />
            </div>
          {/if}
        </div>

        <!-- Visibility -->
        <div class="form-section">
          <h3 class="section-title">Visibility</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={global} />
              Global (show on all scenes)
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="button button-danger" on:click={handleDelete}>
          Delete
        </button>
        <div class="button-group">
          <button class="button button-secondary" on:click={onClose}>
            Cancel
          </button>
          <button class="button button-primary" on:click={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.5rem;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #374151;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .close-button:hover {
    color: #f9fafb;
    background-color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0 0 1rem 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #d1d5db;
    margin-bottom: 0.5rem;
  }

  .text-input,
  .number-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    color: #f9fafb;
    font-size: 0.875rem;
  }

  .select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    color: #f9fafb;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .color-input {
    width: 100%;
    height: 3rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    cursor: pointer;
    background-color: #111827;
  }

  .slider {
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #374151;
    outline: none;
    cursor: pointer;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-top: 1px solid #374151;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-primary {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .button-primary:hover {
    background-color: #2563eb;
  }

  .button-secondary {
    background-color: #374151;
    color: #d1d5db;
  }

  .button-secondary:hover {
    background-color: #4b5563;
  }

  .button-danger {
    background-color: #dc2626;
    color: #ffffff;
  }

  .button-danger:hover {
    background-color: #b91c1c;
  }

  input[type="checkbox"] {
    margin-right: 0.5rem;
    cursor: pointer;
  }
</style>
