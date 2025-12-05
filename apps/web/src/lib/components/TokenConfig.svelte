<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Token, Actor } from '@vtt/shared';
  import { websocket } from '$stores/websocket';
  import { actorsStore } from '$lib/stores/actors';
  import { AssetPicker } from '$lib/components/assets';

  // Props
  export let token: Token;
  export let gameId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
    delete: void;
  }>();

  // Form state
  let formData = {
    name: token.name,
    imageUrl: token.imageUrl || '',
    width: token.width || 50,
    height: token.height || 50,
    x: token.x,
    y: token.y,
    rotation: token.rotation || 0,
    elevation: token.elevation || 0,
    locked: token.locked || false,
    visible: token.visible !== undefined ? token.visible : true,
    vision: token.vision || false,
    visionRange: token.visionRange || 0,
    actorId: token.actorId || '',
    lightBright: token.lightBright || 0,
    lightDim: token.lightDim || 0,
    lightColor: token.lightColor || '#ffffff',
    lightAngle: token.lightAngle || 360,
  };

  // Actors list
  let actors: Actor[] = [];
  $: actors = Array.from($actorsStore.actors.values());

  // Asset picker state
  let showAssetPicker = false;

  // Load actors on mount
  onMount(async () => {
    await actorsStore.loadActors(gameId);
  });

  function handleSave() {
    const updates: Partial<Token> = {
      name: formData.name,
      imageUrl: formData.imageUrl || null,
      width: formData.width,
      height: formData.height,
      x: formData.x,
      y: formData.y,
      rotation: formData.rotation,
      elevation: formData.elevation,
      locked: formData.locked,
      visible: formData.visible,
      vision: formData.vision,
      visionRange: formData.visionRange,
      actorId: formData.actorId || null,
      lightBright: formData.lightBright,
      lightDim: formData.lightDim,
      lightColor: formData.lightColor || null,
      lightAngle: formData.lightAngle,
    };

    websocket.sendTokenUpdate({
      tokenId: token.id,
      updates,
    });

    dispatch('close');
  }

  function handleCancel() {
    dispatch('close');
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete token "${token.name}"?`)) {
      websocket.sendTokenRemove({ tokenId: token.id });
      dispatch('delete');
    }
  }

  function handleActorChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedActorId = target.value;
    formData.actorId = selectedActorId;

    // If an actor is selected, optionally sync name and image
    if (selectedActorId) {
      const actor = actors.find(a => a.id === selectedActorId);
      if (actor) {
        // Ask user if they want to sync
        if (confirm(`Sync token name and image from actor "${actor.name}"?`)) {
          formData.name = actor.name;
          formData.imageUrl = actor.img || '';
        }
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleAssetSelect(event: CustomEvent<{ asset: any; url: string }>) {
    formData.imageUrl = event.detail.url;
    showAssetPicker = false;
  }

  function handleAssetPickerCancel() {
    showAssetPicker = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick}>
  <div class="modal-content" on:click|stopPropagation>
    <header class="modal-header">
      <h2>Configure Token</h2>
      <button class="close-button" on:click={handleCancel} aria-label="Close">
        &times;
      </button>
    </header>

    <div class="modal-body">
      <form on:submit|preventDefault={handleSave}>
        <!-- Basic Properties -->
        <section class="form-section">
          <h3>Basic Properties</h3>

          <div class="form-row">
            <label for="token-name">
              Name
              <input
                id="token-name"
                type="text"
                bind:value={formData.name}
                required
              />
            </label>
          </div>

          <div class="form-row">
            <label for="token-image">
              Image URL
              <div class="image-url-input">
                <input
                  id="token-image"
                  type="text"
                  bind:value={formData.imageUrl}
                  placeholder="https://example.com/image.png"
                />
                <button
                  type="button"
                  class="button-browse"
                  on:click={() => (showAssetPicker = true)}
                >
                  Browse
                </button>
              </div>
            </label>
          </div>

          {#if formData.imageUrl}
            <div class="image-preview">
              <img src={formData.imageUrl} alt="Token preview" />
            </div>
          {/if}
        </section>

        <!-- Actor Linking -->
        <section class="form-section">
          <h3>Actor Linking</h3>

          <div class="form-row">
            <label for="token-actor">
              Linked Actor
              <select
                id="token-actor"
                bind:value={formData.actorId}
                on:change={handleActorChange}
              >
                <option value="">None</option>
                {#each actors as actor}
                  <option value={actor.id}>{actor.name}</option>
                {/each}
              </select>
            </label>
          </div>

          {#if formData.actorId}
            <div class="info-text">
              Token is linked to actor: {actors.find(a => a.id === formData.actorId)?.name || 'Unknown'}
            </div>
          {/if}
        </section>

        <!-- Size and Position -->
        <section class="form-section">
          <h3>Size and Position</h3>

          <div class="form-row-split">
            <label for="token-width">
              Width
              <input
                id="token-width"
                type="number"
                bind:value={formData.width}
                min="1"
                step="1"
              />
            </label>

            <label for="token-height">
              Height
              <input
                id="token-height"
                type="number"
                bind:value={formData.height}
                min="1"
                step="1"
              />
            </label>
          </div>

          <div class="form-row-split">
            <label for="token-x">
              X Position
              <input
                id="token-x"
                type="number"
                bind:value={formData.x}
                step="1"
              />
            </label>

            <label for="token-y">
              Y Position
              <input
                id="token-y"
                type="number"
                bind:value={formData.y}
                step="1"
              />
            </label>
          </div>

          <div class="form-row-split">
            <label for="token-rotation">
              Rotation (0-360)
              <input
                id="token-rotation"
                type="number"
                bind:value={formData.rotation}
                min="0"
                max="360"
                step="1"
              />
            </label>

            <label for="token-elevation">
              Elevation
              <input
                id="token-elevation"
                type="number"
                bind:value={formData.elevation}
                step="1"
              />
            </label>
          </div>
        </section>

        <!-- Visibility and Control -->
        <section class="form-section">
          <h3>Visibility and Control</h3>

          <div class="form-row-checkbox">
            <label>
              <input type="checkbox" bind:checked={formData.locked} />
              Locked (prevents movement)
            </label>
          </div>

          <div class="form-row-checkbox">
            <label>
              <input type="checkbox" bind:checked={formData.visible} />
              Visible to players
            </label>
          </div>
        </section>

        <!-- Vision -->
        <section class="form-section">
          <h3>Vision</h3>

          <div class="form-row-checkbox">
            <label>
              <input type="checkbox" bind:checked={formData.vision} />
              Has vision
            </label>
          </div>

          {#if formData.vision}
            <div class="form-row">
              <label for="token-vision-range">
                Vision Range
                <input
                  id="token-vision-range"
                  type="number"
                  bind:value={formData.visionRange}
                  min="0"
                  step="10"
                />
              </label>
            </div>
          {/if}
        </section>

        <!-- Lighting -->
        <section class="form-section">
          <h3>Light Settings</h3>

          <div class="form-row-split">
            <label for="token-light-bright">
              Bright Light Radius
              <input
                id="token-light-bright"
                type="number"
                bind:value={formData.lightBright}
                min="0"
                step="5"
              />
            </label>

            <label for="token-light-dim">
              Dim Light Radius
              <input
                id="token-light-dim"
                type="number"
                bind:value={formData.lightDim}
                min="0"
                step="5"
              />
            </label>
          </div>

          <div class="form-row-split">
            <label for="token-light-color">
              Light Color
              <input
                id="token-light-color"
                type="color"
                bind:value={formData.lightColor}
              />
            </label>

            <label for="token-light-angle">
              Light Angle (0-360)
              <input
                id="token-light-angle"
                type="number"
                bind:value={formData.lightAngle}
                min="0"
                max="360"
                step="15"
              />
            </label>
          </div>
        </section>
      </form>
    </div>

    <footer class="modal-footer">
      <div class="footer-left">
        {#if isGM}
          <button class="button-danger" on:click={handleDelete}>
            Delete Token
          </button>
        {/if}
      </div>
      <div class="footer-right">
        <button class="button-secondary" on:click={handleCancel}>
          Cancel
        </button>
        <button class="button-primary" on:click={handleSave}>
          Save Changes
        </button>
      </div>
    </footer>
  </div>
</div>

<!-- Asset Picker Modal -->
<AssetPicker
  bind:isOpen={showAssetPicker}
  {gameId}
  allowedTypes={['token', 'portrait']}
  title="Select Token Image"
  on:select={handleAssetSelect}
  on:cancel={handleAssetPickerCancel}
/>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    border-bottom: 1px solid var(--color-border, #333);
    padding-bottom: 0.5rem;
  }

  .form-row {
    margin-bottom: 1rem;
  }

  .form-row-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-row-checkbox {
    margin-bottom: 0.75rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.25rem;
  }

  .form-row-checkbox label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  input[type="text"],
  input[type="number"],
  input[type="color"],
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  input[type="text"]:focus,
  input[type="number"]:focus,
  input[type="color"]:focus,
  select:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  input[type="color"] {
    height: 2.5rem;
    cursor: pointer;
  }

  .image-url-input {
    display: flex;
    gap: 0.5rem;
  }

  .image-url-input input {
    flex: 1;
  }

  .button-browse {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    white-space: nowrap;
  }

  .button-browse:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
    border-color: #4a90e2;
  }

  .image-preview {
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
  }

  .image-preview img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 50%;
    border: 2px solid var(--color-border, #333);
  }

  .info-text {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #aaa);
    font-style: italic;
    margin-top: 0.5rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .footer-left,
  .footer-right {
    display: flex;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active {
    transform: scale(0.98);
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .button-danger {
    background-color: #ef4444;
    color: white;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }

    .form-row-split {
      grid-template-columns: 1fr;
    }
  }
</style>
