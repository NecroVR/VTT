<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import ContextMenuPortal from '$lib/components/ui/ContextMenuPortal.svelte';
</script>

<Header />
<slot />
<ContextMenuPortal />
