<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { websocket } from '$lib';
  import type { WSMessage, DiceResultPayload, TokenMovePayload } from '$lib';

  let wsState: { connected: boolean; reconnecting: boolean; error: string | null };
  let messages: WSMessage[] = [];
  let diceResults: DiceResultPayload[] = [];
  let tokenMoves: TokenMovePayload[] = [];

  // Form values
  let diceNotation = '2d6';
  let diceLabel = 'Attack roll';
  let tokenId = 'token-1';
  let tokenX = 0;
  let tokenY = 0;

  // Subscribe to WebSocket state
  const unsubscribeState = websocket.state.subscribe(state => {
    wsState = state;
  });

  onMount(() => {
    // Connect to WebSocket
    const wsUrl = import.meta.env.DEV
      ? 'ws://localhost:3000/ws'
      : `ws://${window.location.host}/ws`;

    websocket.connect(wsUrl);

    // Subscribe to all messages
    const unsubscribeAll = websocket.subscribe((message) => {
      messages = [message, ...messages].slice(0, 20); // Keep last 20 messages
    });

    // Subscribe to dice results
    const unsubscribeDice = websocket.onDiceResult((result) => {
      diceResults = [result, ...diceResults].slice(0, 10); // Keep last 10 results
    });

    // Subscribe to token moves
    const unsubscribeTokens = websocket.onTokenMove((move) => {
      tokenMoves = [move, ...tokenMoves].slice(0, 10); // Keep last 10 moves
    });

    return () => {
      unsubscribeAll();
      unsubscribeDice();
      unsubscribeTokens();
    };
  });

  onDestroy(() => {
    unsubscribeState();
    websocket.disconnect();
  });

  function sendPing() {
    websocket.send('ping', {});
  }

  function rollDice() {
    websocket.sendDiceRoll({
      notation: diceNotation,
      label: diceLabel || undefined
    });
  }

  function moveToken() {
    websocket.sendTokenMove({
      tokenId,
      x: tokenX,
      y: tokenY
    });
  }

  function clearMessages() {
    messages = [];
    diceResults = [];
    tokenMoves = [];
  }
</script>

<svelte:head>
  <title>WebSocket Test - VTT</title>
</svelte:head>

<main class="container">
  <div class="header">
    <h1>WebSocket Integration Test</h1>
    <div class="connection-status">
      {#if wsState?.connected}
        <span class="status-indicator connected">Connected</span>
      {:else if wsState?.reconnecting}
        <span class="status-indicator reconnecting">Reconnecting...</span>
      {:else}
        <span class="status-indicator disconnected">Disconnected</span>
      {/if}
    </div>
  </div>

  {#if wsState?.error}
    <div class="error-banner">
      <strong>Error:</strong> {wsState.error}
    </div>
  {/if}

  <div class="content">
    <!-- Actions Panel -->
    <div class="panel">
      <h2>Actions</h2>

      <div class="action-section">
        <h3>Basic</h3>
        <button class="btn" on:click={sendPing} disabled={!wsState?.connected}>
          Send Ping
        </button>
      </div>

      <div class="action-section">
        <h3>Dice Roll</h3>
        <div class="form-group">
          <label for="dice-notation">Notation</label>
          <input
            id="dice-notation"
            type="text"
            bind:value={diceNotation}
            placeholder="2d6"
          />
        </div>
        <div class="form-group">
          <label for="dice-label">Label (optional)</label>
          <input
            id="dice-label"
            type="text"
            bind:value={diceLabel}
            placeholder="Attack roll"
          />
        </div>
        <button class="btn" on:click={rollDice} disabled={!wsState?.connected}>
          Roll Dice
        </button>
      </div>

      <div class="action-section">
        <h3>Token Movement</h3>
        <div class="form-group">
          <label for="token-id">Token ID</label>
          <input
            id="token-id"
            type="text"
            bind:value={tokenId}
            placeholder="token-1"
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="token-x">X</label>
            <input
              id="token-x"
              type="number"
              bind:value={tokenX}
            />
          </div>
          <div class="form-group">
            <label for="token-y">Y</label>
            <input
              id="token-y"
              type="number"
              bind:value={tokenY}
            />
          </div>
        </div>
        <button class="btn" on:click={moveToken} disabled={!wsState?.connected}>
          Move Token
        </button>
      </div>

      <button class="btn btn-secondary" on:click={clearMessages}>
        Clear Messages
      </button>
    </div>

    <!-- Results Panel -->
    <div class="panel">
      <h2>Results</h2>

      <div class="result-section">
        <h3>Dice Results ({diceResults.length})</h3>
        <div class="result-list">
          {#each diceResults as result}
            <div class="result-item">
              <div class="result-header">
                <strong>{result.notation}</strong>
                {#if result.label}
                  <span class="result-label">{result.label}</span>
                {/if}
              </div>
              <div class="result-details">
                <span>Rolls: [{result.rolls.join(', ')}]</span>
                <span class="result-total">Total: {result.total}</span>
              </div>
              <div class="result-meta">User: {result.userId}</div>
            </div>
          {/each}
          {#if diceResults.length === 0}
            <p class="empty-state">No dice results yet</p>
          {/if}
        </div>
      </div>

      <div class="result-section">
        <h3>Token Moves ({tokenMoves.length})</h3>
        <div class="result-list">
          {#each tokenMoves as move}
            <div class="result-item">
              <div class="result-header">
                <strong>{move.tokenId}</strong>
              </div>
              <div class="result-details">
                <span>Position: ({move.x}, {move.y})</span>
              </div>
            </div>
          {/each}
          {#if tokenMoves.length === 0}
            <p class="empty-state">No token moves yet</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- All Messages Panel -->
    <div class="panel messages-panel">
      <h2>All Messages ({messages.length})</h2>
      <div class="message-list">
        {#each messages as message}
          <div class="message-item">
            <div class="message-header">
              <span class="message-type">{message.type}</span>
              <span class="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <pre class="message-payload">{JSON.stringify(message.payload, null, 2)}</pre>
          </div>
        {/each}
        {#if messages.length === 0}
          <p class="empty-state">No messages yet</p>
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
  main {
    padding: var(--spacing-lg);
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
  }

  h2 {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-bottom: var(--spacing-md);
  }

  h3 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-secondary);
  }

  .connection-status {
    display: flex;
    align-items: center;
  }

  .status-indicator {
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .status-indicator.connected {
    background-color: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }

  .status-indicator.reconnecting {
    background-color: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  .status-indicator.disconnected {
    background-color: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }

  .error-banner {
    padding: var(--spacing-md);
    background-color: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: var(--border-radius-sm);
    margin-bottom: var(--spacing-lg);
    color: #f87171;
  }

  .content {
    display: grid;
    grid-template-columns: 350px 350px 1fr;
    gap: var(--spacing-lg);
  }

  .panel {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-lg);
  }

  .action-section {
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .action-section:last-of-type {
    border-bottom: none;
  }

  .form-group {
    margin-bottom: var(--spacing-sm);
  }

  .form-group label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .form-group input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }

  .btn {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-accent);
    color: white;
    border: none;
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-md);
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .result-section {
    margin-bottom: var(--spacing-lg);
  }

  .result-section:last-child {
    margin-bottom: 0;
  }

  .result-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .result-item {
    padding: var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
  }

  .result-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .result-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xs);
  }

  .result-total {
    font-weight: 600;
    color: var(--color-accent);
  }

  .result-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .messages-panel {
    max-height: calc(100vh - 200px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .message-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .message-item {
    padding: var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }

  .message-type {
    font-weight: 600;
    font-family: monospace;
    color: var(--color-accent);
  }

  .message-time {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .message-payload {
    font-size: var(--font-size-sm);
    font-family: monospace;
    margin: 0;
    padding: var(--spacing-sm);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-sm);
    overflow-x: auto;
  }

  .empty-state {
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    padding: var(--spacing-lg);
  }

  @media (max-width: 1200px) {
    .content {
      grid-template-columns: 1fr;
    }

    .messages-panel {
      max-height: 400px;
    }
  }
</style>
