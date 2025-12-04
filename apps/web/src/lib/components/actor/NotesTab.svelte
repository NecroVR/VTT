<script lang="ts">
  import type { Actor } from '@vtt/shared';

  // Props
  export let actor: Actor;
  export let isGM: boolean = false;
  export let onUpdate: (updates: Partial<Actor>) => void;

  // Extract notes from data or use defaults
  $: biography = (actor.data?.biography as string) || '';
  $: gmNotes = (actor.data?.gmNotes as string) || '';

  // Local state
  let editedBiography = biography;
  let editedGMNotes = gmNotes;
  let hasChanges = false;

  // Update local state when actor changes
  $: {
    editedBiography = biography;
    editedGMNotes = gmNotes;
  }

  // Track changes
  $: hasChanges = editedBiography !== biography || editedGMNotes !== gmNotes;

  function handleSave() {
    onUpdate({
      data: {
        ...actor.data,
        biography: editedBiography.trim() || '',
        gmNotes: editedGMNotes.trim() || ''
      }
    });
    hasChanges = false;
  }

  function handleDiscard() {
    editedBiography = biography;
    editedGMNotes = gmNotes;
    hasChanges = false;
  }
</script>

<div class="notes-tab">
  <section class="notes-section">
    <div class="section-header">
      <h3 class="section-title">Biography</h3>
      <span class="section-subtitle">Character background, appearance, and personality</span>
    </div>

    <textarea
      bind:value={editedBiography}
      class="notes-textarea"
      placeholder="Enter character biography..."
      rows="10"
    ></textarea>
  </section>

  {#if isGM}
    <section class="notes-section gm-only">
      <div class="section-header">
        <h3 class="section-title">
          GM Notes
          <span class="gm-badge">GM Only</span>
        </h3>
        <span class="section-subtitle">Private notes visible only to the Game Master</span>
      </div>

      <textarea
        bind:value={editedGMNotes}
        class="notes-textarea gm-notes"
        placeholder="Enter GM notes..."
        rows="10"
      ></textarea>
    </section>
  {/if}

  {#if hasChanges}
    <div class="save-actions">
      <button class="save-btn" on:click={handleSave}>
        Save Changes
      </button>
      <button class="discard-btn" on:click={handleDiscard}>
        Discard Changes
      </button>
    </div>
  {/if}
</div>

<style>
  .notes-tab {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .notes-section {
    background-color: #111827;
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #374151;
  }

  .notes-section.gm-only {
    border-color: #7c2d12;
    background: linear-gradient(135deg, #111827 0%, #1c1917 100%);
  }

  .section-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #374151;
  }

  .section-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f9fafb;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .gm-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    background-color: #ea580c;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-subtitle {
    font-size: 0.875rem;
    color: #9ca3af;
  }

  .notes-textarea {
    width: 100%;
    padding: 1rem;
    background-color: #1f2937;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
    font-size: 0.9375rem;
    line-height: 1.6;
    resize: vertical;
    font-family: inherit;
  }

  .notes-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    background-color: #374151;
  }

  .notes-textarea.gm-notes {
    border-color: #ea580c;
  }

  .notes-textarea.gm-notes:focus {
    border-color: #f97316;
  }

  .save-actions {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background-color: #111827;
    border-radius: 0.5rem;
    border: 1px solid #374151;
    position: sticky;
    bottom: 0;
  }

  .save-btn,
  .discard-btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 1rem;
  }

  .save-btn {
    background-color: #10b981;
    color: #ffffff;
  }

  .save-btn:hover {
    background-color: #059669;
  }

  .discard-btn {
    background-color: #374151;
    color: #d1d5db;
  }

  .discard-btn:hover {
    background-color: #4b5563;
  }
</style>
