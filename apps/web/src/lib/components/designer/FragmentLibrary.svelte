<script lang="ts">
  import type { FormFragment } from '@vtt/shared';
  import { formDesignerStore } from '$lib/stores/formDesigner';

  interface Props {
    fragments: FormFragment[];
    onCreateFragment: () => void;
    onEditFragment: (fragment: FormFragment) => void;
    onDeleteFragment: (fragmentId: string) => void;
    onDragStart?: (fragment: FormFragment, event: DragEvent) => void;
  }

  let {
    fragments,
    onCreateFragment,
    onEditFragment,
    onDeleteFragment,
    onDragStart
  }: Props = $props();

  // Local state
  let searchQuery = $state('');
  let deletingFragmentId = $state<string | null>(null);

  // Filter fragments based on search
  const filteredFragments = $derived(() => {
    if (!searchQuery.trim()) {
      return fragments;
    }

    const query = searchQuery.toLowerCase();
    return fragments.filter(fragment =>
      fragment.name.toLowerCase().includes(query) ||
      fragment.description?.toLowerCase().includes(query)
    );
  });

  // Handle delete with confirmation
  function handleDeleteClick(fragment: FormFragment) {
    deletingFragmentId = fragment.id;
  }

  function confirmDelete() {
    if (deletingFragmentId) {
      onDeleteFragment(deletingFragmentId);
      deletingFragmentId = null;
    }
  }

  function cancelDelete() {
    deletingFragmentId = null;
  }

  // Handle drag start
  function handleDragStart(fragment: FormFragment, event: DragEvent) {
    if (onDragStart) {
      onDragStart(fragment, event);
    } else {
      // Default drag behavior - set fragment data
      event.dataTransfer!.effectAllowed = 'copy';
      event.dataTransfer!.setData('application/vtt-fragment', JSON.stringify({
        fragmentId: fragment.id,
        type: 'fragmentRef'
      }));
    }
  }
</script>

<div class="fragment-library">
  <!-- Header -->
  <div class="library-header">
    <h4>Fragments</h4>
    <button
      type="button"
      class="btn btn-primary btn-sm"
      onclick={onCreateFragment}
      title="Create new fragment"
    >
      + New
    </button>
  </div>

  <!-- Search -->
  <div class="library-search">
    <input
      type="text"
      placeholder="Search fragments..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <!-- Fragment List -->
  <div class="library-content">
    {#if filteredFragments().length === 0}
      {#if fragments.length === 0}
        <div class="empty-message">
          <p>No fragments yet</p>
          <p class="hint">Create reusable form sections</p>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            onclick={onCreateFragment}
          >
            Create First Fragment
          </button>
        </div>
      {:else}
        <div class="empty-message">
          <p>No fragments found</p>
          <p class="hint">Try a different search term</p>
        </div>
      {/if}
    {:else}
      {#each filteredFragments() as fragment (fragment.id)}
        <div
          class="fragment-item"
          draggable="true"
          ondragstart={(e) => handleDragStart(fragment, e)}
        >
          <div class="fragment-info">
            <div class="fragment-icon">🔗</div>
            <div class="fragment-details">
              <div class="fragment-name">{fragment.name}</div>
              {#if fragment.description}
                <div class="fragment-description">{fragment.description}</div>
              {/if}
              {#if fragment.parameters.length > 0}
                <div class="fragment-params">
                  {fragment.parameters.length} parameter{fragment.parameters.length !== 1 ? 's' : ''}
                </div>
              {/if}
            </div>
          </div>

          <div class="fragment-actions">
            <button
              type="button"
              class="btn-icon"
              onclick={() => onEditFragment(fragment)}
              title="Edit fragment"
            >
              ✎
            </button>
            <button
              type="button"
              class="btn-icon btn-danger"
              onclick={() => handleDeleteClick(fragment)}
              title="Delete fragment"
            >
              🗑
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Delete Confirmation Modal -->
  {#if deletingFragmentId}
    {@const fragment = fragments.find(f => f.id === deletingFragmentId)}
    <div class="modal-overlay" onclick={cancelDelete}>
      <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h3>Delete Fragment</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete the fragment "{fragment?.name}"?</p>
          <p class="warning-text">This action cannot be undone. Any fragment references using this fragment will need to be updated.</p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            onclick={cancelDelete}
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger"
            onclick={confirmDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .fragment-library {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* Header */
  .library-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: var(--panel-header-bg, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .library-header h4 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted, #6c757d);
  }

  /* Search */
  .library-search {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  /* Content */
  .library-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.5rem;
  }

  /* Empty State */
  .empty-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
    color: var(--text-muted, #6c757d);
  }

  .empty-message p {
    margin: 0 0 0.5rem 0;
  }

  .hint {
    font-size: 0.75rem;
    font-style: italic;
    margin-bottom: 1rem;
  }

  /* Fragment Item */
  .fragment-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: white;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    cursor: grab;
    transition: all 0.2s;
  }

  .fragment-item:hover {
    border-color: var(--primary-color, #007bff);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .fragment-item:active {
    cursor: grabbing;
  }

  .fragment-info {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .fragment-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .fragment-details {
    flex: 1;
    min-width: 0;
  }

  .fragment-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #212529);
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fragment-description {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fragment-params {
    font-size: 0.7rem;
    color: var(--text-muted, #6c757d);
    font-style: italic;
  }

  .fragment-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  /* Buttons */
  .btn {
    padding: 0.375rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  .btn-secondary {
    background: var(--secondary-bg, #6c757d);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--secondary-bg-hover, #5a6268);
  }

  .btn-danger {
    background: var(--danger-bg, #dc3545);
    color: white;
  }

  .btn-danger:hover {
    background: var(--danger-bg-hover, #c82333);
  }

  .btn-icon {
    background: transparent;
    border: none;
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    color: var(--text-muted, #6c757d);
    transition: color 0.2s;
  }

  .btn-icon:hover {
    color: var(--text-color, #212529);
  }

  .btn-icon.btn-danger:hover {
    color: var(--danger-bg, #dc3545);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: auto;
  }

  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-color, #212529);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-body p {
    margin: 0 0 1rem 0;
  }

  .warning-text {
    font-size: 0.875rem;
    color: var(--warning-color, #856404);
    background: var(--warning-bg, #fff3cd);
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid var(--warning-border, #ffeaa7);
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #e0e0e0);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  /* Scrollbar styling */
  .library-content::-webkit-scrollbar {
    width: 6px;
  }

  .library-content::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #f1f1f1);
  }

  .library-content::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #c1c1c1);
    border-radius: 3px;
  }

  .library-content::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover, #a8a8a8);
  }
</style>
