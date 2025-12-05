<script lang="ts">
  import type { Item } from '@vtt/shared';
  import { onMount } from 'svelte';
  import ItemSheet from '../ItemSheet.svelte';

  // Props
  export let actorId: string;
  export let gameId: string;

  // State
  let items: Item[] = [];
  let loading = false;
  let error: string | null = null;

  // ItemSheet modal state
  let showItemSheet = false;
  let selectedItem: Item | null = null;

  onMount(async () => {
    await loadItems();
  });

  async function loadItems() {
    loading = true;
    error = null;

    try {
      const response = await fetch(`/api/v1/actors/${actorId}/items`);
      if (response.ok) {
        const data = await response.json();
        items = data.items || [];
      } else {
        error = 'Failed to load items';
      }
    } catch (err) {
      console.error('Error loading items:', err);
      error = 'Failed to load items';
    } finally {
      loading = false;
    }
  }

  function openItemSheet(item: Item | null = null) {
    selectedItem = item;
    showItemSheet = true;
  }

  function closeItemSheet() {
    showItemSheet = false;
    selectedItem = null;
  }

  function handleItemSave(event: CustomEvent<Item>) {
    const savedItem = event.detail;

    // Update or add item to list
    const existingIndex = items.findIndex(item => item.id === savedItem.id);
    if (existingIndex >= 0) {
      items[existingIndex] = savedItem;
      items = items; // Trigger reactivity
    } else {
      items = [...items, savedItem];
    }
  }

  function handleItemDelete(event: CustomEvent<string>) {
    const deletedItemId = event.detail;
    items = items.filter(item => item.id !== deletedItemId);
  }

  async function updateItem(itemId: string, updates: Partial<Item>) {
    try {
      const response = await fetch(`/api/v1/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        items = items.map(item => item.id === itemId ? data.item : item);
      } else {
        error = 'Failed to update item';
      }
    } catch (err) {
      console.error('Error updating item:', err);
      error = 'Failed to update item';
    }
  }

  function toggleEquipped(item: Item) {
    updateItem(item.id, { equipped: !item.equipped });
  }

  // Calculate total weight
  $: totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
</script>

<div class="inventory-tab">
  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <div class="inventory-header">
    <div class="header-info">
      <h3>Inventory</h3>
      <span class="total-weight">Total Weight: {totalWeight.toFixed(1)} lbs</span>
    </div>
    <button class="add-item-btn" on:click={() => openItemSheet()}>
      Add Item
    </button>
  </div>

  <div class="items-container">
    {#if loading}
      <div class="loading">Loading items...</div>
    {:else if items.length === 0}
      <div class="no-items">
        <p>No items in inventory.</p>
        <p class="hint">Click "Add Item" to add items to this character's inventory.</p>
      </div>
    {:else}
      <div class="items-list">
        {#each items as item (item.id)}
          <div class="item-row" class:equipped={item.equipped}>
            <div class="item-info">
              <div class="item-main">
                <div class="item-name-section">
                  <button class="item-name-btn" on:click={() => openItemSheet(item)}>
                    <h4 class="item-name">{item.name}</h4>
                  </button>
                  <span class="item-type">{item.itemType}</span>
                </div>
                {#if item.description}
                  <p class="item-description">{item.description}</p>
                {/if}
              </div>

              <div class="item-stats">
                <div class="stat">
                  <span class="stat-label">Qty</span>
                  <span class="stat-value">{item.quantity}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Wt</span>
                  <span class="stat-value">{item.weight} lbs</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Price</span>
                  <span class="stat-value">{item.price} gp</span>
                </div>
              </div>
            </div>

            <div class="item-actions">
              <button
                class="equip-btn"
                class:equipped={item.equipped}
                on:click={() => toggleEquipped(item)}
                title={item.equipped ? 'Unequip' : 'Equip'}
              >
                {item.equipped ? 'E' : 'U'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- ItemSheet Modal -->
  <ItemSheet
    isOpen={showItemSheet}
    item={selectedItem}
    {actorId}
    {gameId}
    on:close={closeItemSheet}
    on:save={handleItemSave}
    on:delete={handleItemDelete}
  />
</div>

<style>
  .inventory-tab {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .error-message {
    padding: 1rem;
    background-color: #7f1d1d;
    color: #fca5a5;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .inventory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid #374151;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .inventory-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f9fafb;
  }

  .total-weight {
    font-size: 0.875rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .add-item-btn {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .add-item-btn:hover {
    background-color: #2563eb;
  }


  .items-container {
    flex: 1;
    overflow-y: auto;
  }

  .loading,
  .no-items {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    color: #9ca3af;
    text-align: center;
  }

  .no-items p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .item-row {
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    transition: border-color 0.2s ease;
  }

  .item-row.equipped {
    border-color: #3b82f6;
  }

  .item-row:hover {
    border-color: #4b5563;
  }

  .item-info {
    flex: 1;
    display: flex;
    gap: 1rem;
  }

  .item-main {
    flex: 1;
  }

  .item-name-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .item-name-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    transition: opacity 0.2s ease;
  }

  .item-name-btn:hover {
    opacity: 0.8;
  }

  .item-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
  }

  .item-name-btn:hover .item-name {
    text-decoration: underline;
  }

  .item-type {
    font-size: 0.75rem;
    color: #9ca3af;
    background-color: #374151;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
  }

  .item-description {
    margin: 0;
    font-size: 0.875rem;
    color: #d1d5db;
  }

  .item-stats {
    display: flex;
    gap: 1rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
  }

  .stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f9fafb;
  }

  .item-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .equip-btn {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    background-color: #374151;
    color: #d1d5db;
  }

  .equip-btn.equipped {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .equip-btn:hover {
    background-color: #4b5563;
  }

  .equip-btn.equipped:hover {
    background-color: #2563eb;
  }

  .items-container::-webkit-scrollbar {
    width: 8px;
  }

  .items-container::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .items-container::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .items-container::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
