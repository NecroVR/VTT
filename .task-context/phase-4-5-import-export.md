# Phase 4.5: Form Import/Export Implementation Task

## Overview
Implement complete import/export functionality for the VTT Form Designer, allowing users to export forms as JSON files and import them back.

## Context Files
- Types: `packages/shared/src/types/forms.ts`
- Backend API: `apps/server/src/routes/api/v1/forms.ts`
- Frontend API: `apps/web/src/lib/api/forms.ts`
- Forms Store: `apps/web/src/lib/stores/forms.ts`
- Form Designer: `apps/web/src/lib/components/designer/FormDesigner.svelte`

## Implementation Steps

### 1. Add Type Definitions (packages/shared/src/types/forms.ts)

Add after `GrantFormLicenseRequest` interface:

```typescript
/**
 * Request to import a form
 */
export interface ImportFormRequest {
  formData: FormExport;
  conflictResolution?: {
    nameConflict?: 'rename' | 'replace';
    fragmentConflict?: 'regenerate' | 'keep';
  };
}

// ============================================================================
// Form Import/Export
// ============================================================================

/**
 * Form export format - complete standalone form package
 */
export interface FormExport {
  exportVersion: string;
  exportedAt: string;
  form: {
    name: string;
    description?: string;
    entityType: string;
    gameSystemId?: string;
    version: number;
    layout: LayoutNode[];
    fragments: FormFragment[];
    computedFields: FormComputedField[];
    styles: FormStyles;
    scripts?: string[];
  };
  metadata: {
    exportedBy?: string;
    sourceUrl?: string;
    license?: string;
    notes?: string;
  };
}

/**
 * Form import validation result
 */
export interface FormImportValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
  conflicts: {
    nameConflict?: boolean;
    fragmentIdConflicts?: string[];
    gameSystemMismatch?: boolean;
    gameSystemId?: string;
    missingDependencies?: string[];
  };
}

/**
 * Form export response
 */
export interface FormExportResponse {
  export: FormExport;
}

/**
 * Form import response
 */
export interface FormImportResponse {
  form: FormDefinition;
  validation: FormImportValidation;
}
```

Also update the API Response Types section to export these types.

### 2. Backend Export Endpoint

Add to `apps/server/src/routes/api/v1/forms.ts` before the final export:

```typescript
/**
 * GET /api/v1/forms/:formId/export - Export a form as JSON
 * Returns complete form definition with metadata for standalone use
 */
fastify.get<{ Params: { formId: string } }>(
  '/forms/:formId/export',
  { preHandler: authenticate },
  async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const { formId } = request.params;

    try {
      // Fetch form
      const [form] = await fastify.db
        .select()
        .from(forms)
        .where(eq(forms.id, formId))
        .limit(1);

      if (!form) {
        return reply.status(404).send({ error: 'Form not found' });
      }

      // Check access
      const isPublic = form.visibility === 'public' || form.visibility === 'marketplace';
      const isOwner = form.ownerId === request.user.id;

      if (!isPublic && !isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Build export object
      const exportData: FormExport = {
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        form: {
          name: form.name,
          description: form.description ?? undefined,
          entityType: form.entityType,
          gameSystemId: form.gameSystemId,
          version: parseInt(form.version, 10),
          layout: form.layout as any,
          fragments: form.fragments as any,
          computedFields: form.computedFields as any,
          styles: form.styles as any,
          scripts: form.scripts ? (form.scripts as any) : undefined,
        },
        metadata: {
          exportedBy: request.user.username || request.user.email,
          sourceUrl: `${process.env.BASE_URL || 'http://localhost'}/forms/${formId}`,
          license: form.licenseType || 'free',
          notes: `Exported from VTT Platform on ${new Date().toLocaleDateString()}`,
        },
      };

      return reply.status(200).send({ export: exportData });
    } catch (error) {
      fastify.log.error(error, 'Failed to export form');
      return reply.status(500).send({ error: 'Failed to export form' });
    }
  }
);
```

### 3. Backend Import Endpoint

Add to `apps/server/src/routes/api/v1/forms.ts`:

```typescript
/**
 * POST /api/v1/game-systems/:systemId/forms/import - Import a form from JSON
 * Validates and imports form with conflict resolution
 */
fastify.post<{
  Params: { systemId: string };
  Body: ImportFormRequest;
}>(
  '/game-systems/:systemId/forms/import',
  { preHandler: authenticate },
  async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const { systemId } = request.params;
    const { formData, conflictResolution } = request.body;

    try {
      // Validate export version
      if (formData.exportVersion !== '1.0') {
        return reply.status(400).send({
          error: `Unsupported export version: ${formData.exportVersion}`,
        });
      }

      // Validate required fields
      if (!formData.form.name || !formData.form.entityType) {
        return reply.status(400).send({
          error: 'Invalid form data: name and entityType are required',
        });
      }

      // Check for game system compatibility
      const warnings: string[] = [];
      const errors: string[] = [];
      const conflicts: FormImportValidation['conflicts'] = {};

      if (formData.form.gameSystemId && formData.form.gameSystemId !== systemId) {
        conflicts.gameSystemMismatch = true;
        conflicts.gameSystemId = formData.form.gameSystemId;
        warnings.push(
          `Form was created for game system ${formData.form.gameSystemId} but importing to ${systemId}`
        );
      }

      // Check for name conflicts
      const [existingForm] = await fastify.db
        .select()
        .from(forms)
        .where(
          and(
            eq(forms.gameSystemId, systemId),
            eq(forms.name, formData.form.name),
            eq(forms.ownerId, request.user.id)
          )
        )
        .limit(1);

      if (existingForm) {
        conflicts.nameConflict = true;
        if (conflictResolution?.nameConflict === 'rename') {
          formData.form.name = `${formData.form.name} (Imported)`;
        } else if (conflictResolution?.nameConflict !== 'replace') {
          errors.push(`Form with name "${formData.form.name}" already exists`);
        }
      }

      // Check for fragment ID conflicts (regenerate if needed)
      const fragmentIdConflicts: string[] = [];
      if (conflictResolution?.fragmentConflict === 'regenerate') {
        // Regenerate all fragment IDs
        const oldToNewIds = new Map<string, string>();

        formData.form.fragments = formData.form.fragments.map(fragment => {
          const newId = `fragment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          oldToNewIds.set(fragment.id, newId);
          return { ...fragment, id: newId };
        });

        // Update fragment references in layout
        const updateFragmentRefs = (nodes: any[]): any[] => {
          return nodes.map(node => {
            if (node.type === 'fragmentRef' && oldToNewIds.has(node.fragmentId)) {
              return { ...node, fragmentId: oldToNewIds.get(node.fragmentId) };
            }
            if (node.children) {
              return { ...node, children: updateFragmentRefs(node.children) };
            }
            if (node.tabs) {
              return {
                ...node,
                tabs: node.tabs.map((tab: any) => ({
                  ...tab,
                  children: updateFragmentRefs(tab.children),
                })),
              };
            }
            return node;
          });
        };

        formData.form.layout = updateFragmentRefs(formData.form.layout);
      }

      // If there are errors, return validation result
      if (errors.length > 0) {
        return reply.status(400).send({
          validation: {
            valid: false,
            warnings,
            errors,
            conflicts,
          },
        });
      }

      // Create the imported form
      const [newForm] = await fastify.db
        .insert(forms)
        .values({
          name: formData.form.name.trim(),
          description: formData.form.description ?? null,
          gameSystemId: systemId,
          entityType: formData.form.entityType.trim(),
          version: '1',
          isDefault: false,
          isLocked: false,
          visibility: 'private',
          licenseType: 'free',
          price: '0.00',
          ownerId: request.user.id,
          layout: formData.form.layout ?? [],
          fragments: formData.form.fragments ?? [],
          styles: formData.form.styles ?? {},
          computedFields: formData.form.computedFields ?? [],
          scripts: formData.form.scripts ?? [],
        })
        .returning();

      // Format response
      const formattedForm: FormDefinition = {
        id: newForm.id,
        name: newForm.name,
        description: newForm.description ?? undefined,
        gameSystemId: newForm.gameSystemId,
        entityType: newForm.entityType,
        version: parseInt(newForm.version, 10),
        isDefault: newForm.isDefault,
        isLocked: newForm.isLocked,
        visibility: newForm.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
        licenseType: (newForm.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
        price: newForm.price ? parseFloat(newForm.price) : undefined,
        ownerId: newForm.ownerId,
        layout: newForm.layout as any,
        fragments: newForm.fragments as any,
        styles: newForm.styles as any,
        computedFields: newForm.computedFields as any,
        scripts: newForm.scripts ? (newForm.scripts as any) : undefined,
        createdAt: newForm.createdAt,
        updatedAt: newForm.updatedAt,
      };

      return reply.status(201).send({
        form: formattedForm,
        validation: {
          valid: true,
          warnings,
          errors: [],
          conflicts,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to import form');
      return reply.status(500).send({ error: 'Failed to import form' });
    }
  }
);
```

### 4. Frontend API Client

Add to `apps/web/src/lib/api/forms.ts`:

```typescript
/**
 * Export a form as JSON
 */
export async function exportForm(formId: string): Promise<FormExport> {
  const response = await fetch(`${BASE_URL}/forms/${formId}/export`, {
    headers: getAuthHeaders()
  });

  const data = await handleResponse<FormExportResponse>(response);
  return data.export;
}

/**
 * Import a form from JSON
 */
export async function importForm(
  systemId: string,
  request: ImportFormRequest
): Promise<{ form: FormDefinition; validation: FormImportValidation }> {
  const response = await fetch(`${BASE_URL}/game-systems/${systemId}/forms/import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  });

  const data = await handleResponse<FormImportResponse>(response);
  return data;
}
```

### 5. Forms Store Updates

Add to `apps/web/src/lib/stores/forms.ts`:

```typescript
/**
 * Export a form
 */
async exportForm(formId: string): Promise<FormExport> {
  update(s => ({ ...s, error: null }));

  try {
    const exportData = await formsApi.exportForm(formId);
    return exportData;
  } catch (err) {
    update(s => ({
      ...s,
      error: err instanceof Error ? err.message : 'Failed to export form'
    }));
    throw err;
  }
},

/**
 * Import a form
 */
async importForm(
  systemId: string,
  request: Parameters<typeof formsApi.importForm>[1]
): Promise<{ form: FormDefinition; validation: FormImportValidation }> {
  update(s => ({ ...s, error: null }));

  try {
    const result = await formsApi.importForm(systemId, request);

    update(s => {
      const newForms = new Map(s.forms);
      newForms.set(result.form.id, result.form);

      const newFormsBySystem = new Map(s.formsBySystem);
      const systemForms = newFormsBySystem.get(systemId) || [];
      newFormsBySystem.set(systemId, [...systemForms, result.form.id]);

      return { ...s, forms: newForms, formsBySystem: newFormsBySystem };
    });

    return result;
  } catch (err) {
    update(s => ({
      ...s,
      error: err instanceof Error ? err.message : 'Failed to import form'
    }));
    throw err;
  }
},
```

### 6. Form Designer Export Button

Add to `apps/web/src/lib/components/designer/FormDesigner.svelte` in the toolbar section:

```typescript
// Add to script section
async function handleExport() {
  if (!formDefinition.id) return;

  try {
    const exportData = await formsStore.exportForm(formDefinition.id);

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `form-${formDefinition.name.toLowerCase().replace(/\s+/g, '-')}-v${formDefinition.version}-${timestamp}.json`;

    // Download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    saveError = err instanceof Error ? err.message : 'Failed to export form';
  }
}

// Add button to toolbar (find the toolbar div and add)
<button
  onclick={handleExport}
  class="btn btn-sm btn-secondary"
  title="Export Form"
>
  <i class="fas fa-download"></i>
  Export
</button>
```

### 7. Import Form Modal Component

Create `apps/web/src/lib/components/designer/ImportFormModal.svelte`:

```svelte
<script lang="ts">
  import type { FormExport, FormImportValidation } from '@vtt/shared';
  import { formsStore } from '$lib/stores/forms';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    gameSystemId: string;
    isOpen: boolean;
  }

  let { gameSystemId, isOpen = $bindable() }: Props = $props();

  const dispatch = createEventDispatcher();

  let fileInput: HTMLInputElement;
  let formData: FormExport | null = $state(null);
  let validation: FormImportValidation | null = $state(null);
  let error: string | null = $state(null);
  let importing = $state(false);
  let conflictResolution = $state<{
    nameConflict?: 'rename' | 'replace';
    fragmentConflict?: 'regenerate' | 'keep';
  }>({
    nameConflict: 'rename',
    fragmentConflict: 'regenerate',
  });

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        formData = JSON.parse(content);
        error = null;
        validation = null;
      } catch (err) {
        error = 'Invalid JSON file';
        formData = null;
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!formData) return;

    importing = true;
    error = null;

    try {
      const result = await formsStore.importForm(gameSystemId, {
        formData,
        conflictResolution,
      });

      validation = result.validation;

      if (result.validation.valid) {
        dispatch('imported', result.form);
        handleClose();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to import form';
    } finally {
      importing = false;
    }
  }

  function handleClose() {
    isOpen = false;
    formData = null;
    validation = null;
    error = null;
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={handleClose}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Import Form</h2>
        <button class="close-btn" onclick={handleClose}>&times;</button>
      </div>

      <div class="modal-body">
        {#if !formData}
          <div class="file-upload">
            <input
              bind:this={fileInput}
              type="file"
              accept=".json"
              onchange={handleFileSelect}
              class="file-input"
            />
            <label class="file-label">
              <i class="fas fa-upload"></i>
              Choose JSON file to import
            </label>
          </div>
        {:else}
          <div class="form-preview">
            <h3>Form Details</h3>
            <dl>
              <dt>Name:</dt>
              <dd>{formData.form.name}</dd>

              <dt>Entity Type:</dt>
              <dd>{formData.form.entityType}</dd>

              <dt>Version:</dt>
              <dd>{formData.form.version}</dd>

              {#if formData.form.description}
                <dt>Description:</dt>
                <dd>{formData.form.description}</dd>
              {/if}

              <dt>Exported:</dt>
              <dd>{new Date(formData.exportedAt).toLocaleString()}</dd>
            </dl>

            {#if formData.form.gameSystemId && formData.form.gameSystemId !== gameSystemId}
              <div class="warning">
                <i class="fas fa-exclamation-triangle"></i>
                This form was created for a different game system ({formData.form.gameSystemId})
              </div>
            {/if}

            <div class="conflict-resolution">
              <h4>Conflict Resolution</h4>

              <label>
                <span>If name exists:</span>
                <select bind:value={conflictResolution.nameConflict}>
                  <option value="rename">Rename (add "Imported" suffix)</option>
                  <option value="replace">Replace existing</option>
                </select>
              </label>

              <label>
                <span>Fragment IDs:</span>
                <select bind:value={conflictResolution.fragmentConflict}>
                  <option value="regenerate">Regenerate all IDs</option>
                  <option value="keep">Keep original IDs</option>
                </select>
              </label>
            </div>

            {#if validation}
              {#if validation.warnings.length > 0}
                <div class="warnings">
                  <h4>Warnings</h4>
                  <ul>
                    {#each validation.warnings as warning}
                      <li>{warning}</li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if validation.errors.length > 0}
                <div class="errors">
                  <h4>Errors</h4>
                  <ul>
                    {#each validation.errors as error}
                      <li>{error}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            {/if}

            {#if error}
              <div class="error-message">{error}</div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={handleClose}>
          Cancel
        </button>
        {#if formData}
          <button
            class="btn btn-primary"
            onclick={handleImport}
            disabled={importing}
          >
            {#if importing}
              <i class="fas fa-spinner fa-spin"></i>
              Importing...
            {:else}
              <i class="fas fa-file-import"></i>
              Import Form
            {/if}
          </button>
        {/if}
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .file-upload {
    text-align: center;
    padding: 3rem 1rem;
  }

  .file-input {
    display: none;
  }

  .file-label {
    display: inline-block;
    padding: 1rem 2rem;
    background: #3b82f6;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .file-label:hover {
    background: #2563eb;
  }

  .form-preview {
    space-y: 1rem;
  }

  .form-preview dl {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-preview dt {
    font-weight: 600;
    color: #64748b;
  }

  .form-preview dd {
    margin: 0;
  }

  .warning {
    padding: 1rem;
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    margin: 1rem 0;
    border-radius: 4px;
  }

  .conflict-resolution {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .conflict-resolution h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .conflict-resolution label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .conflict-resolution select {
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
  }

  .warnings, .errors {
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .warnings {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
  }

  .errors {
    background: #fee2e2;
    border-left: 4px solid #ef4444;
  }

  .warnings h4, .errors h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  .warnings ul, .errors ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .error-message {
    padding: 1rem;
    background: #fee2e2;
    color: #b91c1c;
    border-radius: 8px;
    margin-top: 1rem;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-secondary:hover {
    background: #cbd5e1;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

## Testing Requirements

1. **Type Check**: Run `pnpm run typecheck` from root
2. **Build**: Run `pnpm run build` from root
3. **Manual Testing**:
   - Export a form from the designer
   - Verify JSON file format matches FormExport schema
   - Import the form back
   - Import to different game system (test warning)
   - Import form with same name (test conflict resolution)

## Edge Cases

- Invalid/corrupted JSON files
- Missing required fields
- Incompatible game systems
- Fragment ID conflicts
- Very large forms (>1MB)
- Circular fragment references
- Missing computed field dependencies

## Success Criteria

- All endpoints return correct status codes
- Export includes all form data and metadata
- Import validates and handles conflicts
- UI provides clear feedback
- Regression tests pass
- Docker deployment works
