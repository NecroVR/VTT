<script lang="ts">
  import type { FormDefinition } from '@vtt/shared';

  interface Props {
    isOpen: boolean;
    currentForm: FormDefinition | null;
    onSave: (templateName: string, description: string) => void;
    onClose: () => void;
  }

  let { isOpen, currentForm, onSave, onClose }: Props = $props();

  let templateName = $state('');
  let templateDescription = $state('');
  let errors = $state<{ name?: string }>({});

  // Reset form when opened
  $effect(() => {
    if (isOpen && currentForm) {
      templateName = currentForm.name;
      templateDescription = currentForm.description || '';
      errors = {};
    }
  });

  function validate(): boolean {
    const newErrors: { name?: string } = {};

    if (!templateName.trim()) {
      newErrors.name = 'Template name is required';
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) {
      return;
    }

    onSave(templateName.trim(), templateDescription.trim());

    // Reset form
    templateName = '';
    templateDescription = '';
    errors = {};
  }

  function handleCancel() {
    templateName = '';
    templateDescription = '';
    errors = {};
    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Save as Template</h2>
        <button class="btn-close" onclick={handleCancel} title="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <p class="description">
          Save this form as a reusable template. Templates can be used to quickly create new forms with the same structure.
        </p>

        <div class="form-group">
          <label for="template-name">
            Template Name <span class="required">*</span>
          </label>
          <input
            id="template-name"
            type="text"
            bind:value={templateName}
            placeholder="Enter template name..."
            class="form-input"
            class:error={errors.name}
            autofocus
          />
          {#if errors.name}
            <span class="error-message">{errors.name}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="template-description">
            Description
          </label>
          <textarea
            id="template-description"
            bind:value={templateDescription}
            placeholder="Describe what this template is for..."
            class="form-textarea"
            rows="4"
          />
          <span class="help-text">
            Optional: Add a description to help you remember what this template is for
          </span>
        </div>

        {#if currentForm}
          <div class="template-info">
            <h3>Template will include:</h3>
            <ul>
              <li><strong>Layout:</strong> {currentForm.layout.length} top-level components</li>
              <li><strong>Fragments:</strong> {currentForm.fragments.length} reusable fragments</li>
              <li><strong>Computed Fields:</strong> {currentForm.computedFields.length} computed fields</li>
              <li><strong>Styles:</strong> Current theme and custom CSS</li>
            </ul>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={handleCancel}>
          Cancel
        </button>
        <button class="btn btn-primary" onclick={handleSave}>
          Save Template
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
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
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

  .description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
    line-height: 1.5;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #000);
  }

  .required {
    color: #dc2626;
  }

  .form-input,
  .form-textarea {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .form-input.error {
    border-color: #dc2626;
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .error-message {
    font-size: 0.75rem;
    color: #dc2626;
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
  }

  .template-info {
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 4px;
    padding: 1rem;
  }

  .template-info h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .template-info ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .template-info li {
    font-size: 0.875rem;
    color: var(--text-secondary, #4b5563);
    margin-bottom: 0.25rem;
  }

  .template-info li:last-child {
    margin-bottom: 0;
  }

  .template-info li strong {
    font-weight: 600;
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
  }
</style>
