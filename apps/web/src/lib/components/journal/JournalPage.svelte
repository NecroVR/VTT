<script lang="ts">
  import type { JournalPage } from '@vtt/shared';

  // Props
  export let page: JournalPage | null;
  export let editMode: boolean = false;
  export let onUpdate: ((updates: Partial<JournalPage>) => Promise<void>) | null = null;

  // Local state
  let editContent = '';
  let saving = false;

  // Initialize edit content when page changes
  $: if (page && editMode) {
    editContent = page.content || '';
  }

  async function handleSave() {
    if (!page || !onUpdate) return;

    saving = true;
    try {
      await onUpdate({ content: editContent });
    } catch (error) {
      console.error('Error saving page:', error);
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    if (page) {
      editContent = page.content || '';
    }
  }
</script>

<div class="journal-page">
  {#if !page}
    <div class="no-page">
      <p>Select a page to view its content</p>
    </div>
  {:else if page.pageType === 'text'}
    {#if editMode}
      <div class="edit-mode">
        <div class="edit-header">
          <h3>Editing: {page.name}</h3>
          <div class="edit-actions">
            <button class="button-secondary" on:click={handleCancel} disabled={saving}>
              Cancel
            </button>
            <button class="button-primary" on:click={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <textarea
          class="content-editor"
          bind:value={editContent}
          placeholder="Enter page content (supports HTML and markdown)"
        ></textarea>
      </div>
    {:else}
      <div class="view-mode">
        <div class="content">
          {@html page.content || '<p class="empty-content">This page is empty</p>'}
        </div>
      </div>
    {/if}
  {:else if page.pageType === 'image'}
    <div class="image-page">
      {#if page.src}
        <img src={page.src} alt={page.name} />
      {:else}
        <p class="empty-content">No image source provided</p>
      {/if}
    </div>
  {:else if page.pageType === 'pdf'}
    <div class="pdf-page">
      {#if page.src}
        <iframe
          src={page.src}
          title={page.name}
          width="100%"
          height="100%"
        ></iframe>
      {:else}
        <p class="empty-content">No PDF source provided</p>
      {/if}
    </div>
  {:else if page.pageType === 'video'}
    <div class="video-page">
      {#if page.src}
        <video controls src={page.src}>
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      {:else}
        <p class="empty-content">No video source provided</p>
      {/if}
    </div>
  {:else}
    <div class="unknown-page">
      <p>Unknown page type: {page.pageType}</p>
    </div>
  {/if}
</div>

<style>
  .journal-page {
    height: 100%;
    overflow: auto;
    background-color: var(--color-bg-primary, #121212);
  }

  .no-page,
  .unknown-page {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-secondary, #9ca3af);
    padding: 2rem;
    text-align: center;
  }

  .edit-mode {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .edit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .edit-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .content-editor {
    flex: 1;
    padding: 1.5rem;
    border: none;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    resize: none;
  }

  .content-editor:focus {
    outline: none;
  }

  .view-mode {
    padding: 2rem;
  }

  .content {
    max-width: 800px;
    margin: 0 auto;
    color: var(--color-text-primary, #ffffff);
    line-height: 1.7;
  }

  .content :global(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: var(--color-text-primary, #ffffff);
  }

  .content :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: var(--color-text-primary, #ffffff);
  }

  .content :global(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--color-text-primary, #ffffff);
  }

  .content :global(p) {
    margin-bottom: 1rem;
  }

  .content :global(ul),
  .content :global(ol) {
    margin-bottom: 1rem;
    padding-left: 2rem;
  }

  .content :global(li) {
    margin-bottom: 0.5rem;
  }

  .content :global(blockquote) {
    border-left: 4px solid var(--color-border, #333);
    padding-left: 1rem;
    margin: 1rem 0;
    color: var(--color-text-secondary, #aaa);
    font-style: italic;
  }

  .content :global(code) {
    background-color: var(--color-bg-secondary, #1e1e1e);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'Courier New', monospace;
    font-size: 0.875em;
  }

  .content :global(pre) {
    background-color: var(--color-bg-secondary, #1e1e1e);
    padding: 1rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    margin: 1rem 0;
  }

  .content :global(pre code) {
    background-color: transparent;
    padding: 0;
  }

  .content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.375rem;
    margin: 1rem 0;
  }

  .content :global(a) {
    color: #60a5fa;
    text-decoration: none;
  }

  .content :global(a:hover) {
    text-decoration: underline;
  }

  .empty-content {
    color: var(--color-text-secondary, #9ca3af);
    font-style: italic;
  }

  .image-page,
  .pdf-page,
  .video-page {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    height: 100%;
  }

  .image-page img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 0.375rem;
  }

  .pdf-page iframe {
    border: none;
    border-radius: 0.375rem;
  }

  .video-page video {
    max-width: 100%;
    max-height: 100%;
    border-radius: 0.375rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }
</style>
