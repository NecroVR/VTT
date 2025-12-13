<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { formsStore } from '$lib/stores/forms';
  import * as formsApi from '$lib/api/forms';
  import FormRenderer from '$lib/components/forms/FormRenderer.svelte';
  import { sampleEntities, type SampleEntity } from '$lib/components/designer/sampleEntities';
  import TemplatesGallery from '$lib/components/designer/TemplatesGallery.svelte';
  import TemplatePreview from '$lib/components/designer/TemplatePreview.svelte';
  import type { FormDefinition } from '@vtt/shared';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let forms = $state<FormDefinition[]>(data.forms || []);
  let gameSystems = $state(data.gameSystems || []);
  let loading = $state(false);
  let error = $state<string | null>(data.error || null);
  let user = $state<any>(null);
  let searchQuery = $state('');
  let filterGameSystem = $state<string>('');
  let filterEntityType = $state<string>('');
  let previewModalOpen = $state(false);
  let previewForm = $state<FormDefinition | null>(null);
  let previewEntity = $state<SampleEntity>(sampleEntities[2]); // Default to fullCharacter
  let activeTab = $state<'forms' | 'templates'>('forms');
  let templatePreviewOpen = $state(false);
  let templateToPreview = $state<FormDefinition | null>(null);

  const unsubscribeAuth = authStore.subscribe(state => {
    user = state.user;
  });

  onMount(async () => {
    // Check if user is authenticated
    if (!user) {
      const isAuthenticated = await authStore.checkSession();
      if (!isAuthenticated) {
        goto('/login');
        return;
      }
    }

    // Refresh forms list
    await refreshForms();
  });

  async function refreshForms() {
    loading = true;
    error = null;

    try {
      const sessionId = localStorage.getItem('vtt_session_id');
      if (!sessionId) {
        error = 'Not authenticated';
        return;
      }

      // Fetch forms for all game systems
      const formsPromises = gameSystems.map(async (system: any) => {
        try {
          const systemForms = await formsApi.listForms(system.systemId);
          return systemForms;
        } catch (err) {
          console.error(`Failed to fetch forms for ${system.name}:`, err);
          return [];
        }
      });

      const formsArrays = await Promise.all(formsPromises);
      forms = formsArrays.flat();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load forms';
      console.error('Failed to refresh forms:', err);
    } finally {
      loading = false;
    }
  }

  function createNewForm() {
    goto('/forms/designer/new');
  }

  function editForm(formId: string) {
    goto(`/forms/designer/${formId}`);
  }

  async function duplicateFormHandler(form: FormDefinition) {
    const newName = prompt('Enter name for the duplicated form:', `Copy of ${form.name}`);
    if (!newName || newName.trim() === '') return;

    try {
      loading = true;
      const duplicated = await formsApi.duplicateForm(form.id, { name: newName.trim() });
      forms = [...forms, duplicated];
      // Show success message (you could add a toast notification here)
      alert(`Form "${newName}" created successfully!`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to duplicate form';
      alert(`Failed to duplicate form: ${error}`);
    } finally {
      loading = false;
    }
  }

  async function deleteFormHandler(form: FormDefinition) {
    if (!confirm(`Are you sure you want to delete "${form.name}"?`)) return;

    try {
      loading = true;
      await formsApi.deleteForm(form.id);
      forms = forms.filter(f => f.id !== form.id);
      // Show success message
      alert(`Form "${form.name}" deleted successfully!`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete form';
      alert(`Failed to delete form: ${error}`);
    } finally {
      loading = false;
    }
  }

  function openPreview(form: FormDefinition) {
    previewForm = form;
    previewModalOpen = true;
  }

  function closePreview() {
    previewModalOpen = false;
    previewForm = null;
  }

  // Template handlers
  async function handleSelectTemplate(template: FormDefinition) {
    const formName = prompt(`Create a new form from "${template.name.replace('[Template] ', '')}"\n\nEnter a name for the new form:`, `My ${template.name.replace('[Template] ', '')}`);

    if (!formName || formName.trim() === '') return;

    try {
      loading = true;
      const newForm = await formsStore.createFromTemplate(template.id, formName.trim());

      // Navigate to the new form's designer
      goto(`/forms/designer/${newForm.id}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create form from template';
      alert(`Failed to create form: ${error}`);
    } finally {
      loading = false;
    }
  }

  function handleTemplatePreview(template: FormDefinition) {
    templateToPreview = template;
    templatePreviewOpen = true;
  }

  function handleUseTemplate(template: FormDefinition) {
    templatePreviewOpen = false;
    handleSelectTemplate(template);
  }

  function getGameSystemName(gameSystemId: string): string {
    const system = gameSystems.find((s: any) => s.systemId === gameSystemId);
    return system ? system.name : 'Unknown System';
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Computed filtered forms
  let filteredForms = $derived(() => {
    let result = forms;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query)
      );
    }

    // Filter by game system
    if (filterGameSystem) {
      result = result.filter(f => f.gameSystemId === filterGameSystem);
    }

    // Filter by entity type
    if (filterEntityType) {
      result = result.filter(f => f.entityType === filterEntityType);
    }

    return result;
  });

  // Get unique entity types for filter
  let entityTypes = $derived(() => {
    const types = new Set(forms.map(f => f.entityType));
    return Array.from(types).sort();
  });
</script>

<svelte:head>
  <title>Form Manager - VTT</title>
</svelte:head>

<main class="container">
  <div class="header">
    <div class="header-left">
      <h1>Form Manager</h1>
      <a href="/docs/forms" class="docs-link" title="View Documentation">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="12" y1="6" x2="12" y2="10"/>
          <line x1="12" y1="14" x2="12.01" y2="14"/>
        </svg>
        Documentation
      </a>
    </div>
    <button class="btn btn-primary" onclick={createNewForm}>
      Create New Form
    </button>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'forms'}
      onclick={() => activeTab = 'forms'}
    >
      My Forms
    </button>
    <button
      class="tab"
      class:active={activeTab === 'templates'}
      onclick={() => activeTab = 'templates'}
    >
      Templates
    </button>
  </div>

  <!-- Filters (only show on forms tab) -->
  {#if activeTab === 'forms'}
  <div class="filters">
    <input
      type="text"
      placeholder="Search forms..."
      bind:value={searchQuery}
      class="search-input"
    />
    <select bind:value={filterGameSystem} class="filter-select">
      <option value="">All Game Systems</option>
      {#each gameSystems as system}
        <option value={system.systemId}>{system.name}</option>
      {/each}
    </select>
    <select bind:value={filterEntityType} class="filter-select">
      <option value="">All Entity Types</option>
      {#each entityTypes() as type}
        <option value={type}>{type}</option>
      {/each}
    </select>
  </div>

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button class="btn-text" onclick={() => error = null}>Dismiss</button>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <p>Loading forms...</p>
    </div>
  {:else if filteredForms().length === 0}
    <div class="empty-state">
      <h2>No forms found</h2>
      <p>{forms.length === 0 ? 'Create your first form to get started!' : 'Try adjusting your filters.'}</p>
      {#if forms.length === 0}
        <button class="btn btn-primary" onclick={createNewForm}>
          Create Form
        </button>
      {/if}
    </div>
  {:else}
    <div class="forms-grid">
      {#each filteredForms() as form (form.id)}
        <div class="form-card">
          <div class="form-card-header">
            <h2 onclick={() => editForm(form.id)} class="form-title">
              {form.name}
              {#if form.isDefault}
                <span class="badge badge-default">Default</span>
              {/if}
            </h2>
            <div class="form-card-actions">
              <button
                class="btn-icon"
                onclick={() => openPreview(form)}
                title="Preview form"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button
                class="btn-icon"
                onclick={() => editForm(form.id)}
                title="Edit form"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="btn-icon"
                onclick={() => duplicateFormHandler(form)}
                title="Duplicate form"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button
                class="btn-icon btn-danger"
                onclick={() => deleteFormHandler(form)}
                title="Delete form"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="form-card-body">
            {#if form.description}
              <p class="form-description">{form.description}</p>
            {/if}
            <div class="form-info">
              <span class="label">Game System:</span>
              <span class="badge badge-system">{getGameSystemName(form.gameSystemId)}</span>
            </div>
            <div class="form-info">
              <span class="label">Entity Type:</span>
              <span class="badge badge-entity">{form.entityType}</span>
            </div>
            <div class="form-info">
              <span class="label">Version:</span>
              <span class="value">{form.version}</span>
            </div>
            <div class="form-info">
              <span class="label">Updated:</span>
              <span class="value">{formatDate(form.updatedAt)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Templates Tab -->
  {#if activeTab === 'templates'}
    <TemplatesGallery
      gameSystemId={filterGameSystem}
      entityType={filterEntityType}
      onSelectTemplate={handleSelectTemplate}
    />
  {/if}
</main>

<!-- Template Preview Modal -->
<TemplatePreview
  template={templateToPreview}
  isOpen={templatePreviewOpen}
  onUse={handleUseTemplate}
  onClose={() => templatePreviewOpen = false}
/>

<!-- Preview Modal -->
{#if previewModalOpen && previewForm}
  <div class="modal-overlay" onclick={closePreview}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Preview: {previewForm.name}</h2>
        <div class="preview-controls">
          <select bind:value={previewEntity} class="entity-select">
            {#each sampleEntities as entity}
              <option value={entity}>{entity.name}</option>
            {/each}
          </select>
          <button class="btn-icon" onclick={closePreview} title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="modal-body">
        <FormRenderer
          form={previewForm}
          entity={previewEntity.data}
          mode="view"
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .header h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin: 0;
  }

  .docs-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    transition: background-color 0.2s, color 0.2s;
  }

  .docs-link:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
  }

  .docs-link svg {
    flex-shrink: 0;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .tab {
    padding: var(--spacing-sm) var(--spacing-lg);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: var(--font-size-md);
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: all 0.2s;
  }

  .tab:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .filters {
    display: flex;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .search-input {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .filter-select {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .error-message {
    background-color: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message p {
    color: #f87171;
    margin: 0;
  }

  .loading {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
    margin-top: var(--spacing-xl);
  }

  .empty-state h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-sm);
  }

  .empty-state p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
  }

  .forms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--spacing-lg);
  }

  .form-card {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .form-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .form-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  .form-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
    flex: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .form-title:hover {
    color: var(--color-primary);
  }

  .form-card-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .btn-icon {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    cursor: pointer;
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-icon:hover {
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .btn-icon.btn-danger:hover {
    background-color: rgba(248, 113, 113, 0.1);
    color: #f87171;
  }

  .form-card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .form-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .form-info .label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .form-info .value {
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

  .badge-default {
    background-color: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }

  .badge-system {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .badge-entity {
    background-color: rgba(168, 85, 247, 0.1);
    color: #a855f7;
  }

  .btn-text {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
    text-decoration: underline;
  }

  .btn-text:hover {
    color: var(--color-text-primary);
  }

  /* Modal Styles */
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
    padding: var(--spacing-lg);
  }

  .modal {
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-lg);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .preview-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .entity-select {
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }

  .entity-select:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg);
  }
</style>
