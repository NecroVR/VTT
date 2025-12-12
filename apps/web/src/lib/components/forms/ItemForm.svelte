<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { ModuleEntity, ModuleEntityWithProperties } from '@vtt/shared';
  import type { ItemRarity, AttunementState } from '@vtt/shared';
  import { browser } from '$app/environment';

  // Props
  export let entity: ModuleEntity;
  export let moduleId: string;
  export let isDerived: boolean = false;
  export let campaignId: string | null = null;

  const dispatch = createEventDispatcher<{
    createDerived: void;
    save: FormData;
  }>();

  // State
  let entityWithProperties: ModuleEntityWithProperties | null = null;
  let loading = true;
  let error: string | null = null;
  let saving = false;

  // Collapsible sections
  let sectionsOpen = {
    basic: true,
    properties: true,
    details: true,
    source: false,
  };

  // Form data for derived mode
  let formData = {
    name: '',
    img: '',
    description: '',
    quantity: 1,
    weight: 0,
    price: 0,
    equipped: false,
    identified: true,
    rarity: 'common' as ItemRarity,
    attunement: 'none' as AttunementState,
    data: {} as Record<string, unknown>,
  };

  // Get auth token
  let token = '';
  if (browser) {
    token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || '';
  }

  // Fetch entity with properties on mount
  onMount(async () => {
    await fetchEntityWithProperties();
  });

  async function fetchEntityWithProperties() {
    loading = true;
    error = null;

    try {
      const response = await fetch(
        `/api/v1/modules/${moduleId}/entities/${entity.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch entity properties');
      }

      const data = await response.json();
      entityWithProperties = data.entity;

      // Initialize form data if in derived mode
      if (isDerived) {
        initializeFormData();
      }
    } catch (err) {
      console.error('Error fetching entity properties:', err);
      error = err instanceof Error ? err.message : 'Failed to load entity';
    } finally {
      loading = false;
    }
  }

  function initializeFormData() {
    if (!entityWithProperties) return;

    const props = entityWithProperties.properties || {};

    formData = {
      name: entityWithProperties.name,
      img: entityWithProperties.img || '',
      description: entityWithProperties.description || '',
      quantity: 1,
      weight: (props.weight as number) || 0,
      price: (props.price as number) || 0,
      equipped: false,
      identified: true,
      rarity: (props.rarity as ItemRarity) || 'common',
      attunement: (props.attunement as AttunementState) || 'none',
      data: { ...props },
    };
  }

  function toggleSection(section: keyof typeof sectionsOpen) {
    sectionsOpen[section] = !sectionsOpen[section];
  }

  function handleCreateDerived() {
    dispatch('createDerived');
  }

  async function handleSave() {
    if (!campaignId) {
      error = 'Campaign ID is required';
      return;
    }

    if (!formData.name.trim()) {
      error = 'Item name is required';
      return;
    }

    saving = true;
    error = null;

    try {
      dispatch('save', formData as any);
    } catch (err) {
      console.error('Error saving derived item:', err);
      error = err instanceof Error ? err.message : 'Failed to save item';
    } finally {
      saving = false;
    }
  }

  // Helper functions
  function formatRarity(rarity: string | null | undefined): string {
    if (!rarity) return 'Common';
    return rarity.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  function formatAttunement(attunement: string | null | undefined): string {
    if (!attunement || attunement === 'none') return 'No attunement required';
    if (attunement === 'required') return 'Requires attunement';
    if (attunement === 'attuned') return 'Attuned';
    return attunement;
  }

  function getItemType(entity: ModuleEntity): string {
    const props = (entityWithProperties?.properties || {}) as Record<string, unknown>;
    return (props.itemType as string) || entity.data?.itemType || 'equipment';
  }

  function renderPropertyValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  // Reactive property getters
  $: properties = entityWithProperties?.properties || {};
  $: itemType = getItemType(entity);
  $: weight = properties.weight || 0;
  $: price = properties.price || 0;
  $: rarity = properties.rarity;
  $: attunement = properties.attunement;
  $: damage = properties.damage;
  $: damageType = properties.damageType;
  $: armorClass = properties.armorClass;
  $: weaponProperties = properties.properties;
</script>

{#if loading}
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Loading item details...</p>
  </div>
{:else if error}
  <div class="error-container">
    <div class="error-message">{error}</div>
    <button class="button-secondary" on:click={fetchEntityWithProperties}>
      Retry
    </button>
  </div>
{:else if entityWithProperties}
  <div class="item-form">
    <!-- Header -->
    <div class="item-header">
      {#if entityWithProperties.img}
        <img
          src={entityWithProperties.img}
          alt={entityWithProperties.name}
          class="item-thumbnail"
        />
      {:else}
        <div class="item-thumbnail-placeholder">
          <span class="placeholder-icon">📦</span>
        </div>
      {/if}
      <div class="item-header-info">
        {#if isDerived}
          <input
            type="text"
            bind:value={formData.name}
            class="item-name-input"
            placeholder="Item name"
          />
        {:else}
          <h2 class="item-name">{entityWithProperties.name}</h2>
        {/if}
        <div class="item-type">{itemType}</div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="item-content">
      <!-- Basic Info Section -->
      <section class="form-section">
        <button
          class="section-header"
          on:click={() => toggleSection('basic')}
          type="button"
        >
          <span class="section-title">Basic Information</span>
          <span class="section-toggle">{sectionsOpen.basic ? '▼' : '▶'}</span>
        </button>

        {#if sectionsOpen.basic}
          <div class="section-content">
            {#if isDerived}
              <div class="form-row">
                <label for="item-image">
                  Image URL
                  <input
                    id="item-image"
                    type="text"
                    bind:value={formData.img}
                    placeholder="https://example.com/item.png"
                    class="text-input"
                  />
                </label>
              </div>
            {:else}
              {#if entityWithProperties.img}
                <div class="property-row">
                  <span class="property-label">Image</span>
                  <span class="property-value">{entityWithProperties.img}</span>
                </div>
              {/if}
            {/if}

            <div class="property-row">
              <span class="property-label">Type</span>
              <span class="property-value">{itemType}</span>
            </div>

            {#if isDerived}
              <div class="form-row">
                <label for="item-description">
                  Description
                  <textarea
                    id="item-description"
                    bind:value={formData.description}
                    rows="4"
                    class="textarea-input"
                    placeholder="Item description"
                  />
                </label>
              </div>
            {:else if entityWithProperties.description}
              <div class="property-row">
                <span class="property-label">Description</span>
                <div class="property-value description">
                  {entityWithProperties.description}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </section>

      <!-- Properties Section -->
      <section class="form-section">
        <button
          class="section-header"
          on:click={() => toggleSection('properties')}
          type="button"
        >
          <span class="section-title">Properties</span>
          <span class="section-toggle">{sectionsOpen.properties ? '▼' : '▶'}</span>
        </button>

        {#if sectionsOpen.properties}
          <div class="section-content">
            {#if isDerived}
              <div class="form-row-split">
                <label for="item-weight">
                  Weight (lbs)
                  <input
                    id="item-weight"
                    type="number"
                    bind:value={formData.weight}
                    min="0"
                    step="0.1"
                    class="number-input"
                  />
                </label>

                <label for="item-price">
                  Price (gp)
                  <input
                    id="item-price"
                    type="number"
                    bind:value={formData.price}
                    min="0"
                    step="0.01"
                    class="number-input"
                  />
                </label>
              </div>

              <div class="form-row-split">
                <label for="item-quantity">
                  Quantity
                  <input
                    id="item-quantity"
                    type="number"
                    bind:value={formData.quantity}
                    min="1"
                    step="1"
                    class="number-input"
                  />
                </label>

                <label for="item-rarity">
                  Rarity
                  <select id="item-rarity" bind:value={formData.rarity} class="select-input">
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="very_rare">Very Rare</option>
                    <option value="legendary">Legendary</option>
                    <option value="artifact">Artifact</option>
                  </select>
                </label>
              </div>

              <div class="form-row-split">
                <label for="item-attunement">
                  Attunement
                  <select id="item-attunement" bind:value={formData.attunement} class="select-input">
                    <option value="none">No attunement required</option>
                    <option value="required">Requires attunement</option>
                    <option value="attuned">Attuned</option>
                  </select>
                </label>

                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    bind:checked={formData.equipped}
                    class="checkbox-input"
                  />
                  Equipped
                </label>
              </div>
            {:else}
              <div class="property-row">
                <span class="property-label">Weight</span>
                <span class="property-value">{weight} lbs</span>
              </div>

              <div class="property-row">
                <span class="property-label">Price</span>
                <span class="property-value">{price} gp</span>
              </div>

              {#if rarity}
                <div class="property-row">
                  <span class="property-label">Rarity</span>
                  <span class="property-value">{formatRarity(rarity as string)}</span>
                </div>
              {/if}

              {#if attunement}
                <div class="property-row">
                  <span class="property-label">Attunement</span>
                  <span class="property-value">{formatAttunement(attunement as string)}</span>
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      </section>

      <!-- Details Section (item type specific) -->
      {#if itemType === 'weapon' || itemType.includes('weapon') || damage}
        <section class="form-section">
          <button
            class="section-header"
            on:click={() => toggleSection('details')}
            type="button"
          >
            <span class="section-title">Weapon Details</span>
            <span class="section-toggle">{sectionsOpen.details ? '▼' : '▶'}</span>
          </button>

          {#if sectionsOpen.details}
            <div class="section-content">
              {#if damage}
                <div class="property-row">
                  <span class="property-label">Damage</span>
                  <span class="property-value">{renderPropertyValue(damage)}</span>
                </div>
              {/if}

              {#if damageType}
                <div class="property-row">
                  <span class="property-label">Damage Type</span>
                  <span class="property-value">{renderPropertyValue(damageType)}</span>
                </div>
              {/if}

              {#if weaponProperties}
                <div class="property-row">
                  <span class="property-label">Properties</span>
                  <span class="property-value">{renderPropertyValue(weaponProperties)}</span>
                </div>
              {/if}
            </div>
          {/if}
        </section>
      {/if}

      {#if itemType === 'armor' || itemType.includes('armor') || armorClass}
        <section class="form-section">
          <button
            class="section-header"
            on:click={() => toggleSection('details')}
            type="button"
          >
            <span class="section-title">Armor Details</span>
            <span class="section-toggle">{sectionsOpen.details ? '▼' : '▶'}</span>
          </button>

          {#if sectionsOpen.details}
            <div class="section-content">
              {#if armorClass}
                <div class="property-row">
                  <span class="property-label">Armor Class</span>
                  <span class="property-value">{renderPropertyValue(armorClass)}</span>
                </div>
              {/if}

              {#if properties.dexBonus !== undefined}
                <div class="property-row">
                  <span class="property-label">Max Dex Bonus</span>
                  <span class="property-value">{renderPropertyValue(properties.dexBonus)}</span>
                </div>
              {/if}

              {#if properties.stealthDisadvantage !== undefined}
                <div class="property-row">
                  <span class="property-label">Stealth Disadvantage</span>
                  <span class="property-value">{renderPropertyValue(properties.stealthDisadvantage)}</span>
                </div>
              {/if}
            </div>
          {/if}
        </section>
      {/if}

      <!-- Source Section -->
      <section class="form-section">
        <button
          class="section-header"
          on:click={() => toggleSection('source')}
          type="button"
        >
          <span class="section-title">Source</span>
          <span class="section-toggle">{sectionsOpen.source ? '▼' : '▶'}</span>
        </button>

        {#if sectionsOpen.source}
          <div class="section-content">
            <div class="property-row">
              <span class="property-label">Module ID</span>
              <span class="property-value">{moduleId}</span>
            </div>

            <div class="property-row">
              <span class="property-label">Entity ID</span>
              <span class="property-value">{entity.entityId}</span>
            </div>

            {#if entity.sourcePath}
              <div class="property-row">
                <span class="property-label">Source File</span>
                <span class="property-value">{entity.sourcePath}</span>
              </div>
            {/if}

            {#if entity.sourceLineNumber}
              <div class="property-row">
                <span class="property-label">Line Number</span>
                <span class="property-value">{entity.sourceLineNumber}</span>
              </div>
            {/if}
          </div>
        {/if}
      </section>
    </div>

    <!-- Action Buttons -->
    <div class="item-actions">
      {#if isDerived}
        <button
          class="button-primary"
          on:click={handleSave}
          disabled={saving || !formData.name.trim()}
        >
          {saving ? 'Saving...' : 'Save Item'}
        </button>
      {:else if campaignId}
        <button class="button-primary" on:click={handleCreateDerived}>
          Create Derived Copy
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
  }

  .spinner {
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #4a90e2;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    padding: 1rem;
    background-color: #7f1d1d;
    color: #fca5a5;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .item-form {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-secondary, #1f2937);
    color: var(--color-text-primary, #ffffff);
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #374151);
    background-color: var(--color-bg-primary, #111827);
  }

  .item-thumbnail,
  .item-thumbnail-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid var(--color-border, #374151);
  }

  .item-thumbnail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-tertiary, #0f172a);
  }

  .placeholder-icon {
    font-size: 2rem;
  }

  .item-header-info {
    flex: 1;
  }

  .item-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .item-name-input {
    width: 100%;
    font-size: 1.5rem;
    font-weight: 600;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #374151);
    border-radius: 4px;
    background-color: var(--color-bg-tertiary, #0f172a);
    color: var(--color-text-primary, #ffffff);
  }

  .item-name-input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .item-type {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #9ca3af);
    text-transform: capitalize;
  }

  .item-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .form-section {
    margin-bottom: 1rem;
    border: 1px solid var(--color-border, #374151);
    border-radius: 8px;
    overflow: hidden;
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: var(--color-bg-primary, #111827);
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .section-header:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .section-toggle {
    color: var(--color-text-secondary, #9ca3af);
    font-size: 0.875rem;
  }

  .section-content {
    padding: 1rem;
    background-color: var(--color-bg-secondary, #1f2937);
  }

  .property-row {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .property-row:last-child {
    border-bottom: none;
  }

  .property-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #9ca3af);
  }

  .property-value {
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
  }

  .property-value.description {
    white-space: pre-wrap;
    line-height: 1.5;
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

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #9ca3af);
    margin-bottom: 0.25rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-top: 1.5rem;
  }

  .text-input,
  .textarea-input,
  .number-input,
  .select-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #374151);
    border-radius: 4px;
    background-color: var(--color-bg-tertiary, #0f172a);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .text-input:focus,
  .textarea-input:focus,
  .number-input:focus,
  .select-input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .textarea-input {
    resize: vertical;
    font-family: inherit;
  }

  .checkbox-input {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .item-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #374151);
    background-color: var(--color-bg-primary, #111827);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .button-primary,
  .button-secondary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
  }

  .button-primary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .button-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #9ca3af);
    border: 1px solid var(--color-border, #374151);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  @media (max-width: 640px) {
    .property-row {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }

    .form-row-split {
      grid-template-columns: 1fr;
    }
  }
</style>
