<script lang="ts">
  import { onMount } from 'svelte';
  import ContextMenu from './ContextMenu.svelte';
  import { subscribeToContextMenu, closeContextMenu, type ContextMenuState } from '$lib/actions/contextMenu';

  let contextMenuState = $state<ContextMenuState | null>(null);

  onMount(() => {
    const unsubscribe = subscribeToContextMenu((state) => {
      contextMenuState = state;
    });

    return unsubscribe;
  });
</script>

{#if contextMenuState}
  <ContextMenu
    items={contextMenuState.items}
    x={contextMenuState.x}
    y={contextMenuState.y}
    onClose={closeContextMenu}
  />
{/if}
