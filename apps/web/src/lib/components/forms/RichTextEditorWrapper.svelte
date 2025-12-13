<script lang="ts">
  import { browser } from '$app/environment';

  interface Props {
    value?: string;
    readonly?: boolean;
    placeholder?: string;
    onChange?: (html: string) => void;
    ariaLabel?: string;
    ariaRequired?: boolean;
    ariaDescribedby?: string;
  }

  let {
    value = '',
    readonly = false,
    placeholder = 'Enter text...',
    onChange,
    ariaLabel = 'Rich text editor',
    ariaRequired = false,
    ariaDescribedby
  }: Props = $props();
</script>

{#if browser}
  {#await import('./RichTextEditor.svelte') then { default: RichTextEditor }}
    <RichTextEditor
      {value}
      {readonly}
      {placeholder}
      {onChange}
      {ariaLabel}
      {ariaRequired}
      {ariaDescribedby}
    />
  {/await}
{:else}
  <div class="richtext-editor-ssr-fallback">
    <textarea
      class="field-input field-textarea"
      value={value ?? ''}
      readonly={readonly}
      placeholder={placeholder}
      disabled
    ></textarea>
  </div>
{/if}

<style>
  .richtext-editor-ssr-fallback {
    min-height: 150px;
  }

  .field-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
  }

  .field-textarea {
    min-height: 150px;
  }
</style>
