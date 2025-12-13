<script lang="ts">
  import type { StaticNode, LocalizedString } from '@vtt/shared';
  import LocaleKeyPicker from '../LocaleKeyPicker.svelte';

  interface Props {
    node: StaticNode;
    onUpdate: (updates: Partial<StaticNode>) => void;
  }

  let { node, onUpdate }: Props = $props();

  const contentTypes = ['text', 'html', 'markdown', 'image', 'icon'];

  // Generate locale key prefix based on node ID
  function getLocaleKeyPrefix(property: string): string {
    return `form.{formName}.${node.id}.${property}`;
  }
</script>

<div class="static-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Content</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Content Type</span>
        <select
          value={node.contentType || 'text'}
          onchange={(e) => onUpdate({ contentType: (e.target as HTMLSelectElement).value as typeof node.contentType })}
        >
          {#each contentTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </label>

      {#if node.contentType === 'text' || node.contentType === 'html' || node.contentType === 'markdown'}
        <div class="content-wrapper">
          <LocaleKeyPicker
            bind:value={node.content}
            label="Content"
            placeholder="Enter content..."
            suggestedPrefix={getLocaleKeyPrefix('content')}
            onchange={(value) => onUpdate({ content: value })}
          />
          <span class="help-text">
            {#if node.contentType === 'text'}
              Plain text content
            {:else if node.contentType === 'html'}
              HTML content (use with caution)
            {:else if node.contentType === 'markdown'}
              Markdown formatted text
            {/if}
          </span>
        </div>
      {:else if node.contentType === 'image'}
        <LocaleKeyPicker
          bind:value={node.content}
          label="Image URL"
          placeholder="https://example.com/image.png or {{binding}}"
          suggestedPrefix={getLocaleKeyPrefix('content')}
          onchange={(value) => onUpdate({ content: value })}
        />

        <label>
          <span>Alt Text</span>
          <input
            type="text"
            value={node.alt || ''}
            oninput={(e) => onUpdate({ alt: (e.target as HTMLInputElement).value })}
            placeholder="Image description"
          />
        </label>

        <div class="inline-fields">
          <label>
            <span>Width</span>
            <input
              type="text"
              value={node.width || ''}
              oninput={(e) => onUpdate({ width: (e.target as HTMLInputElement).value })}
              placeholder="auto"
            />
          </label>

          <label>
            <span>Height</span>
            <input
              type="text"
              value={node.height || ''}
              oninput={(e) => onUpdate({ height: (e.target as HTMLInputElement).value })}
              placeholder="auto"
            />
          </label>
        </div>
      {:else if node.contentType === 'icon'}
        <LocaleKeyPicker
          bind:value={node.content}
          label="Icon Name"
          placeholder="icon-name or 🎲"
          suggestedPrefix={getLocaleKeyPrefix('content')}
          onchange={(value) => onUpdate({ content: value })}
        />

        <label>
          <span>Size</span>
          <input
            type="text"
            value={node.size || ''}
            oninput={(e) => onUpdate({ size: (e.target as HTMLInputElement).value })}
            placeholder="1.5rem"
          />
        </label>
      {/if}
    </div>
  </div>

  {#if node.contentType === 'text' || node.contentType === 'html' || node.contentType === 'markdown'}
    <div class="property-group">
      <div class="group-header">
        <h4>HTML Tag</h4>
      </div>
      <div class="group-content">
        <label>
          <span>Tag</span>
          <input
            type="text"
            value={node.tag || 'div'}
            oninput={(e) => onUpdate({ tag: (e.target as HTMLInputElement).value })}
            placeholder="div"
          />
          <span class="help-text">HTML element to use (e.g., div, p, span, h1, h2)</span>
        </label>
      </div>
    </div>
  {/if}
</div>

<style>
  .property-group {
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .group-header {
    padding: 0.75rem 1rem;
    background: var(--group-header-bg, #f8f9fa);
  }

  .group-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #212529);
  }

  .group-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  label > span {
    font-weight: 500;
    color: var(--label-color, #495057);
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-weight: normal;
  }

  input[type="text"],
  textarea,
  select {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .inline-fields {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
</style>
