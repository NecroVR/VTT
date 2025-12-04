<script lang="ts">
  import type { Actor } from '@vtt/shared';

  // Props
  export let actor: Actor;
  export let isEditing: boolean = false;
  export let onUpdate: (updates: Partial<Actor>) => void;

  // Local state
  let editedName = actor.name;
  let isEditingName = false;

  function handleNameEdit() {
    isEditingName = true;
  }

  function handleNameSave() {
    if (editedName.trim() && editedName !== actor.name) {
      onUpdate({ name: editedName.trim() });
    }
    isEditingName = false;
  }

  function handleNameCancel() {
    editedName = actor.name;
    isEditingName = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleNameSave();
    } else if (event.key === 'Escape') {
      handleNameCancel();
    }
  }
</script>

<div class="actor-header">
  <div class="portrait-container">
    {#if actor.img}
      <img src={actor.img} alt={actor.name} class="actor-portrait" />
    {:else}
      <div class="actor-portrait-placeholder">
        <span class="portrait-icon">{actor.name.charAt(0).toUpperCase()}</span>
      </div>
    {/if}
  </div>

  <div class="actor-info">
    {#if isEditingName}
      <div class="name-edit-container">
        <input
          type="text"
          bind:value={editedName}
          on:keydown={handleKeyDown}
          on:blur={handleNameSave}
          class="name-input"
          autofocus
        />
      </div>
    {:else}
      <h2 class="actor-name" on:click={handleNameEdit}>
        {actor.name}
      </h2>
    {/if}

    <div class="actor-type-badge" class:pc={actor.actorType === 'pc'} class:npc={actor.actorType === 'npc'}>
      {actor.actorType.toUpperCase()}
    </div>
  </div>
</div>

<style>
  .actor-header {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background-color: #111827;
    border-bottom: 2px solid #374151;
  }

  .portrait-container {
    flex-shrink: 0;
  }

  .actor-portrait,
  .actor-portrait-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 0.5rem;
    object-fit: cover;
    border: 2px solid #374151;
  }

  .actor-portrait-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  }

  .portrait-icon {
    font-size: 2rem;
    font-weight: 700;
    color: #9ca3af;
  }

  .actor-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
  }

  .actor-name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f9fafb;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .actor-name:hover {
    color: #3b82f6;
  }

  .name-edit-container {
    display: flex;
    align-items: center;
  }

  .name-input {
    padding: 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
    font-size: 1.5rem;
    font-weight: 700;
    width: 100%;
  }

  .name-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .actor-type-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    width: fit-content;
  }

  .actor-type-badge.pc {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .actor-type-badge.npc {
    background-color: #ef4444;
    color: #ffffff;
  }
</style>
