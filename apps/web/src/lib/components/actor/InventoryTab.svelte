<script lang="ts">
  import type { Item } from '@vtt/shared';
  import { onMount } from 'svelte';

  // Props
  export let actorId: string;
  export let gameId: string;

  // State
  let items: Item[] = [];
  let loading = false;
  let error: string | null = null;

  // Add item form
  let showAddForm = false;
  let newItemName = '';
  let newItemType = 'item';
  let newItemQuantity = 1;
  let newItemWeight = 0;
  let newItemPrice = 0;
  let newItemDescription = '';

  // Edit item state
  let editingItemId: string | null = null;
  let editedItem: Partial<Item> = {};

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

  async function addItem() {
    if (!newItemName.trim()) return;

    try {
      const response = await fetch(`/api/v1/actors/${actorId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          actorId,
          name: newItemName.trim(),
          itemType: newItemType,
          quantity: newItemQuantity,
          weight: newItemWeight,
          price: newItemPrice,
          description: newItemDescription.trim() || null,
          equipped: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        items = [...items, data.item];
        resetAddForm();
      } else {
        error = 'Failed to add item';
      }
    } catch (err) {
      console.error('Error adding item:', err);
      error = 'Failed to add item';
    }
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
        editingItemId = null;
        editedItem = {};
      } else {
        error = 'Failed to update item';
      }
    } catch (err) {
      console.error('Error updating item:', err);
      error = 'Failed to update item';
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/v1/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        items = items.filter(item => item.id !== itemId);
      } else {
        error = 'Failed to delete item';
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      error = 'Failed to delete item';
    }
  }

  function startEditing(item: Item) {
    editingItemId = item.id;
    editedItem = { ...item };
  }

  function cancelEditing() {
    editingItemId = null;
    editedItem = {};
  }

  function saveEdit(itemId: string) {
    const updates: Partial<Item> = {};
    if (editedItem.name !== undefined) updates.name = editedItem.name;
    if (editedItem.itemType !== undefined) updates.itemType = editedItem.itemType;
    if (editedItem.quantity !== undefined) updates.quantity = editedItem.quantity;
    if (editedItem.weight !== undefined) updates.weight = editedItem.weight;
    if (editedItem.price !== undefined) updates.price = editedItem.price;
    if (editedItem.description !== undefined) updates.description = editedItem.description;
    if (editedItem.equipped !== undefined) updates.equipped = editedItem.equipped;

    updateItem(itemId, updates);
  }

  function resetAddForm() {
    newItemName = '';
    newItemType = 'item';
    newItemQuantity = 1;
    newItemWeight = 0;
    newItemPrice = 0;
    newItemDescription = '';
    showAddForm = false;
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
    <button class="add-item-btn" on:click={() => showAddForm = !showAddForm}>
      {showAddForm ? 'Cancel' : 'Add Item'}
    </button>
  </div>

  {#if showAddForm}
    <div class="add-item-form">
      <h4>Add New Item</h4>
      <div class="form-grid">
        <div class="form-field full-width">
          <label>Name</label>
          <input type="text" bind:value={newItemName} placeholder="Item name" />
        </div>

        <div class="form-field">
          <label>Type</label>
          <select bind:value={newItemType}>
            <option value="weapon">Weapon</option>
            <option value="armor">Armor</option>
            <option value="consumable">Consumable</option>
            <option value="item">Item</option>
            <option value="treasure">Treasure</option>
          </select>
        </div>

        <div class="form-field">
          <label>Quantity</label>
          <input type="number" bind:value={newItemQuantity} min="1" />
        </div>

        <div class="form-field">
          <label>Weight (lbs)</label>
          <input type="number" bind:value={newItemWeight} min="0" step="0.1" />
        </div>

        <div class="form-field">
          <label>Price (gp)</label>
          <input type="number" bind:value={newItemPrice} min="0" />
        </div>

        <div class="form-field full-width">
          <label>Description</label>
          <textarea bind:value={newItemDescription} placeholder="Item description" rows="2"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button class="save-btn" on:click={addItem}>Add Item</button>
        <button class="cancel-btn" on:click={resetAddForm}>Cancel</button>
      </div>
    </div>
  {/if}

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
            {#if editingItemId === item.id}
              <div class="item-edit-form">
                <div class="edit-grid">
                  <input type="text" bind:value={editedItem.name} class="edit-name" />
                  <select bind:value={editedItem.itemType} class="edit-type">
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="consumable">Consumable</option>
                    <option value="item">Item</option>
                    <option value="treasure">Treasure</option>
                  </select>
                  <input type="number" bind:value={editedItem.quantity} class="edit-qty" min="1" />
                  <input type="number" bind:value={editedItem.weight} class="edit-weight" min="0" step="0.1" />
                  <input type="number" bind:value={editedItem.price} class="edit-price" min="0" />
                </div>
                <div class="edit-actions">
                  <button class="save-btn-sm" on:click={() => saveEdit(item.id)}>Save</button>
                  <button class="cancel-btn-sm" on:click={cancelEditing}>Cancel</button>
                </div>
              </div>
            {:else}
              <div class="item-info">
                <div class="item-main">
                  <div class="item-name-section">
                    <h4 class="item-name">{item.name}</h4>
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
                <button class="edit-btn" on:click={() => startEditing(item)}>Edit</button>
                <button class="delete-btn" on:click={() => deleteItem(item.id)}>Delete</button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
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

  .add-item-form {
    background-color: #111827;
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #374151;
  }

  .add-item-form h4 {
    margin: 0 0 1rem 0;
    color: #f9fafb;
    font-size: 1rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-field.full-width {
    grid-column: span 2;
  }

  .form-field label {
    color: #d1d5db;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .form-field input,
  .form-field select,
  .form-field textarea {
    padding: 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
  }

  .form-field input:focus,
  .form-field select:focus,
  .form-field textarea:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .save-btn,
  .cancel-btn {
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .save-btn {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .save-btn:hover {
    background-color: #2563eb;
  }

  .cancel-btn {
    background-color: #374151;
    color: #d1d5db;
  }

  .cancel-btn:hover {
    background-color: #4b5563;
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

  .item-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
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

  .equip-btn,
  .edit-btn,
  .delete-btn {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .equip-btn {
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

  .edit-btn {
    background-color: #374151;
    color: #d1d5db;
  }

  .edit-btn:hover {
    background-color: #4b5563;
  }

  .delete-btn {
    background-color: #7f1d1d;
    color: #fca5a5;
  }

  .delete-btn:hover {
    background-color: #991b1b;
  }

  .item-edit-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .edit-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 0.5fr 0.75fr 0.75fr;
    gap: 0.5rem;
  }

  .edit-grid input,
  .edit-grid select {
    padding: 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
    font-size: 0.875rem;
  }

  .edit-grid input:focus,
  .edit-grid select:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .save-btn-sm,
  .cancel-btn-sm {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-size: 0.875rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .save-btn-sm {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .save-btn-sm:hover {
    background-color: #2563eb;
  }

  .cancel-btn-sm {
    background-color: #374151;
    color: #d1d5db;
  }

  .cancel-btn-sm:hover {
    background-color: #4b5563;
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
