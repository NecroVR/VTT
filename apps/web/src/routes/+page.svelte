<script lang="ts">
  import { goto } from '$app/navigation';

  let gameId = '';

  function createGame() {
    // Generate a random game ID
    const id = Math.random().toString(36).substring(2, 10);
    goto(`/game/${id}`);
  }

  function joinGame() {
    if (gameId.trim()) {
      goto(`/game/${gameId}`);
    }
  }

  function viewMyGames() {
    goto('/games');
  }
</script>

<svelte:head>
  <title>VTT - Virtual Tabletop</title>
</svelte:head>

<main class="container">
  <div class="hero">
    <h1>VTT</h1>
    <p class="subtitle">Virtual Tabletop for RPG Sessions</p>

    <div class="actions">
      <div class="card">
        <h2>My Games</h2>
        <p>View and manage your game sessions</p>
        <button class="btn" on:click={viewMyGames}>View My Games</button>
      </div>

      <div class="card">
        <h2>Create New Game</h2>
        <p>Start a new game session and invite your players</p>
        <button class="btn" on:click={createGame}>Create Game</button>
      </div>

      <div class="card">
        <h2>Join Game</h2>
        <p>Enter a game ID to join an existing session</p>
        <input
          type="text"
          bind:value={gameId}
          placeholder="Enter game ID"
          on:keydown={(e) => e.key === 'Enter' && joinGame()}
        />
        <button class="btn" on:click={joinGame} disabled={!gameId.trim()}>Join Game</button>
      </div>
    </div>
  </div>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero {
    text-align: center;
    width: 100%;
    max-width: 800px;
  }

  h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
    color: var(--color-accent);
  }

  .subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
    margin-top: var(--spacing-xl);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .card h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-xs);
  }

  .card p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  input {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
