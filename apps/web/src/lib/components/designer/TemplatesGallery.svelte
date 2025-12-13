<script lang="ts">
  import type { FormDefinition } from '@vtt/shared';
  import { formsStore } from '$lib/stores/forms';
  import { onMount } from 'svelte';

  interface Props {
    gameSystemId?: string;
    entityType?: string;
    onSelectTemplate: (template: FormDefinition) => void;
  }

  let { gameSystemId, entityType, onSelectTemplate }: Props = $props();

  let templates = $state<FormDefinition[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let activeCategory = $state<'all' | 'builtin' | 'user'>('all');

  onMount(async () => {
    await loadTemplates();
  });

  async function loadTemplates() {
    loading = true;
    error = null;

    try {
      const result = await formsStore.listTemplates(gameSystemId, entityType);
      templates = result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load templates';
      console.error('Error loading templates:', err);
    } finally {
      loading = false;
    }
  }

  async function handleDeleteTemplate(template: FormDefinition) {
    if (template.id.startsWith('builtin-template-')) {
      alert('Cannot delete built-in templates');
      return;
    }

    if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      return;
    }

    try {
      await formsStore.deleteTemplate(template.id);
      await loadTemplates(); // Refresh list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    }
  }

  // Filter templates based on search and category
  let filteredTemplates = $derived(() => {
    let result = templates;

    // Filter by category
    if (activeCategory === 'builtin') {
      result = result.filter(t => t.id.startsWith('builtin-template-'));
    } else if (activeCategory === 'user') {
      result = result.filter(t => !t.id.startsWith('builtin-template-'));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    return result;
  });

  // Get count for each category
  let builtinCount = $derived(templates.filter(t => t.id.startsWith('builtin-template-')).length);
  let userCount = $derived(templates.filter(t => !t.id.startsWith('builtin-template-')).length);
</script>

<div class="templates-gallery">
  <div class="gallery-header">
    <h2>Form Templates</h2>
    <div class="search-box">
      <input
        type="text"
        placeholder="Search templates..."
        bind:value={searchQuery}
        class="search-input"
      />
    </div>
  </div>

  <!-- Category Tabs -->
  <div class="category-tabs">
    <button
      class="tab"
      class:active={activeCategory === 'all'}
      onclick={() => activeCategory = 'all'}
    >
      All ({templates.length})
    </button>
    <button
      class="tab"
      class:active={activeCategory === 'builtin'}
      onclick={() => activeCategory = 'builtin'}
    >
      Built-in ({builtinCount})
    </button>
    <button
      class="tab"
      class:active={activeCategory === 'user'}
      onclick={() => activeCategory = 'user'}
    >
      My Templates ({userCount})
    </button>
  </div>

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button class="btn-text" onclick={() => error = null}>Dismiss</button>
    </div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <p>Loading templates...</p>
    </div>
  {:else if filteredTemplates().length === 0}
    <div class="empty-state">
      <h3>No templates found</h3>
      <p>
        {#if searchQuery.trim()}
          Try adjusting your search query.
        {:else if activeCategory === 'user'}
          You haven't created any templates yet. Save a form as a template to see it here.
        {:else}
          No templates available.
        {/if}
      </p>
    </div>
  {:else}
    <div class="templates-grid">
      {#each filteredTemplates() as template (template.id)}
        <div class="template-card">
          <div class="template-card-header">
            <h3 class="template-title">
              {template.name.replace('[Template] ', '')}
            </h3>
            {#if template.id.startsWith('builtin-template-')}
              <span class="badge badge-builtin">Built-in</span>
            {/if}
          </div>

          {#if template.description}
            <p class="template-description">
              {template.description.replace('Template: ', '')}
            </p>
          {/if}

          <div class="template-meta">
            <span class="meta-item">
              <strong>Type:</strong> {template.entityType}
            </span>
            <span class="meta-item">
              <strong>Fields:</strong> {template.layout.length}
            </span>
          </div>

          <div class="template-actions">
            <button
              class="btn btn-primary"
              onclick={() => onSelectTemplate(template)}
            >
              Use Template
            </button>
            {#if !template.id.startsWith('builtin-template-')}
              <button
                class="btn btn-danger-outline"
                onclick={() => handleDeleteTemplate(template)}
                title="Delete template"
              >
                Delete
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .templates-gallery {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.5rem;
  }

  .gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .gallery-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .search-box {
    flex: 0 0 300px;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .category-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .tab {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted, #6c757d);
    transition: all 0.2s;
  }

  .tab:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .tab.active {
    color: var(--primary-color, #007bff);
    border-bottom-color: var(--primary-color, #007bff);
  }

  .error-message {
    background-color: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message p {
    color: #f87171;
    margin: 0;
  }

  .btn-text {
    background: none;
    border: none;
    color: var(--text-muted, #6c757d);
    cursor: pointer;
    font-size: 0.875rem;
    text-decoration: underline;
  }

  .loading-state,
  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
    color: var(--text-muted, #6c757d);
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    flex: 1;
    overflow-y: auto;
  }

  .template-card {
    background: var(--bg-secondary, white);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .template-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .template-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .template-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    flex: 1;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .badge-builtin {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .template-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
    line-height: 1.5;
  }

  .template-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  .meta-item {
    color: var(--text-secondary, #4b5563);
  }

  .meta-item strong {
    font-weight: 600;
  }

  .template-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
    flex: 1;
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  .btn-danger-outline {
    background: transparent;
    color: #dc2626;
    border: 1px solid #dc2626;
  }

  .btn-danger-outline:hover {
    background: rgba(220, 38, 38, 0.1);
  }
</style>
