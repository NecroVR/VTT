<script lang="ts">
  import type { PageData } from './$types';
  import FormDesigner from '$lib/components/designer/FormDesigner.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>Form Designer - {data.form.name}</title>
</svelte:head>

<FormDesigner formDefinition={data.form} />

<style>
  /* Page-level styles if needed */
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style>
