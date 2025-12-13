<script lang="ts">
  import type { FormDefinition } from '@vtt/shared';
  import FormRenderer from '$lib/components/forms/FormRenderer.svelte';

  interface Props {
    template: FormDefinition | null;
    isOpen: boolean;
    onUse: (template: FormDefinition) => void;
    onClose: () => void;
  }

  let { template, isOpen, onUse, onClose }: Props = $props();

  // Sample data for preview
  const sampleData = {
    name: 'Sample Character',
    description: 'This is a preview of how your form will look',
    attributes: {
      strength: 10,
      dexterity: 12,
      constitution: 14,
      intelligence: 13,
      wisdom: 11,
      charisma: 15
    },
    abilities: {
      strength: 10,
      dexterity: 12,
      constitution: 14,
      intelligence: 13,
      wisdom: 11,
      charisma: 15
    },
    health: {
      current: 25,
      max: 30
    },
    armorClass: 15,
    image: 'https://via.placeholder.com/150',
    itemType: 'weapon',
    weight: 5.5,
    value: 100,
    quantity: 1,
    rarity: 'rare',
    creatureType: 'humanoid',
    size: 'medium',
    speed: {
      walk: 30,
      fly: 0,
      swim: 15,
      burrow: 0
    },
    specialAbilities: [
      {
        name: 'Sample Ability',
        description: 'This is a sample special ability'
      }
    ],
    actions: [
      {
        name: 'Sample Action',
        description: 'This is a sample action'
      }
    ]
  };

  function handleUse() {
    if (template) {
      onUse(template);
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen && template}
  <div class="modal-overlay" onclick={handleBackdropClick}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div class="header-content">
          <h2>{template.name.replace('[Template] ', '')}</h2>
          {#if template.description}
            <p class="template-description">
              {template.description.replace('Template: ', '')}
            </p>
          {/if}
        </div>
        <button class="btn-close" onclick={onClose} title="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="template-info">
          <div class="info-item">
            <strong>Entity Type:</strong>
            <span>{template.entityType}</span>
          </div>
          <div class="info-item">
            <strong>Version:</strong>
            <span>{template.version}</span>
          </div>
          {#if template.id.startsWith('builtin-template-')}
            <div class="info-item">
              <span class="badge badge-builtin">Built-in Template</span>
            </div>
          {/if}
        </div>

        <div class="preview-container">
          <h3>Preview</h3>
          <div class="form-preview">
            <FormRenderer
              form={template}
              entity={sampleData}
              mode="view"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={onClose}>
          Cancel
        </button>
        <button class="btn btn-primary" onclick={handleUse}>
          Use This Template
        </button>
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
    padding: 1.5rem;
  }

  .modal {
    background-color: var(--bg-primary, white);
    border-radius: 8px;
    width: 100%;
    max-width: 1000px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color, #ddd);
    gap: 1rem;
  }

  .header-content {
    flex: 1;
  }

  .modal-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .template-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
    line-height: 1.5;
  }

  .btn-close {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--text-muted, #6c757d);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-close:hover {
    background-color: var(--bg-secondary, #f5f5f5);
    color: var(--text-primary, #000);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .template-info {
    display: flex;
    gap: 2rem;
    padding: 1rem;
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 4px;
  }

  .info-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.875rem;
  }

  .info-item strong {
    font-weight: 600;
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

  .preview-container h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .form-preview {
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    padding: 1.5rem;
    background: var(--bg-primary, white);
    max-height: 500px;
    overflow-y: auto;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid var(--border-color, #ddd);
  }

  .btn {
    padding: 0.5rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn-secondary {
    background: var(--bg-secondary, #6c757d);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--bg-secondary-hover, #5a6268);
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  @media (max-width: 768px) {
    .modal {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
    }

    .template-info {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
