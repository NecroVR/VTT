<!--
  EntityFormManager.svelte

  Manages all floating windows for entity forms (items, spells, monsters, etc.)

  Renders a FloatingWindow for each open (non-minimized) entity form.
  Uses the appropriate form component based on entity type:
  - item: ItemForm
  - spell: SpellForm (placeholder)
  - monster: MonsterForm (placeholder)
  - etc.

  Usage:
    <EntityFormManager {campaignId} />
-->
<script lang="ts">
  import { openForms, closeForm, minimizeForm, bringToFront, updatePosition, updateSize } from '$lib/stores/entityForms';
  import FloatingWindow from './sidebar/FloatingWindow.svelte';
  import ItemForm from './forms/ItemForm.svelte';

  // Props
  export let campaignId: string | null = null;

  // Subscribe to open forms
  $: forms = $openForms;

  // Handle window close
  function handleClose(formId: string) {
    closeForm(formId);
  }

  // Handle window minimize
  function handleMinimize(formId: string) {
    minimizeForm(formId);
  }

  // Handle window focus (bring to front)
  function handleFocus(formId: string) {
    bringToFront(formId);
  }

  // Handle window move
  function handleMove(formId: string, position: { x: number; y: number }) {
    updatePosition(formId, position);
  }

  // Handle window resize
  function handleResize(formId: string, size: { width: number; height: number }) {
    updateSize(formId, size);
  }

  // Handle create derived request from ItemForm
  function handleCreateDerived(formId: string) {
    // For now, just log - in the future this could open a new form in derived mode
    console.log('Create derived requested for form:', formId);
  }

  // Handle save from ItemForm (derived mode)
  function handleSave(formId: string, event: CustomEvent) {
    const formData = event.detail;
    console.log('Save requested for form:', formId, 'data:', formData);
    // In the future, this would create the campaign item via API
    // and then close the form
  }
</script>

<!-- Render all open (non-minimized) entity forms -->
{#each forms as form (form.id)}
  <FloatingWindow
    id={form.id}
    title={form.title}
    initialPosition={form.position}
    initialSize={form.size}
    zIndex={form.zIndex}
    minimizable={true}
    closeable={true}
    on:close={() => handleClose(form.id)}
    on:minimize={() => handleMinimize(form.id)}
    on:focus={() => handleFocus(form.id)}
    on:move={(e) => handleMove(form.id, e.detail)}
    on:resize={(e) => handleResize(form.id, e.detail)}
  >
    <!-- Render appropriate form based on entity type -->
    {#if form.entityType === 'item'}
      <ItemForm
        entity={form.entity}
        moduleId={form.moduleId}
        isDerived={form.isDerived}
        {campaignId}
        on:createDerived={() => handleCreateDerived(form.id)}
        on:save={(e) => handleSave(form.id, e)}
      />
    {:else}
      <!-- Placeholder for other entity types (spell, monster, etc.) -->
      <div class="entity-form-placeholder">
        <div class="placeholder-header">
          <h3>Entity Form</h3>
          <span class="entity-type-badge">{form.entityType}</span>
        </div>

        <div class="placeholder-content">
          <div class="info-row">
            <span class="label">Entity ID:</span>
            <span class="value">{form.entityId}</span>
          </div>

          <div class="info-row">
            <span class="label">Module ID:</span>
            <span class="value">{form.moduleId}</span>
          </div>

          <div class="info-row">
            <span class="label">Form Type:</span>
            <span class="value">
              {form.isDerived ? 'Creating Derived Copy' : 'Viewing Entity'}
            </span>
          </div>
        </div>

        <div class="placeholder-note">
          <p>Form not yet implemented</p>
          <p class="note-detail">
            The {form.entityType} form component has not been implemented yet.
            Only item forms are currently available.
          </p>
        </div>
      </div>
    {/if}
  </FloatingWindow>
{/each}

<style>
  .entity-form-placeholder {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    color: #f9fafb;
  }

  .placeholder-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #374151;
  }

  .placeholder-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f9fafb;
  }

  .entity-type-badge {
    padding: 4px 8px;
    background-color: #3b82f6;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .placeholder-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .info-row {
    display: flex;
    gap: 8px;
    font-size: 0.875rem;
  }

  .info-row .label {
    font-weight: 600;
    color: #9ca3af;
    min-width: 100px;
  }

  .info-row .value {
    color: #f9fafb;
    font-family: 'Courier New', monospace;
    word-break: break-all;
  }

  .placeholder-note {
    margin-top: 16px;
    padding: 12px;
    background-color: rgba(245, 158, 11, 0.1);
    border-left: 3px solid #f59e0b;
    border-radius: 4px;
  }

  .placeholder-note p {
    margin: 0;
    color: #f9fafb;
    font-size: 0.875rem;
  }

  .placeholder-note p:first-child {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .note-detail {
    color: #9ca3af;
    font-size: 0.75rem;
    line-height: 1.5;
  }
</style>
