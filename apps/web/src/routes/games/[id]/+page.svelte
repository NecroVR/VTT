<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { websocket } from '$lib/stores/websocket';
  import { tokensStore } from '$lib/stores/tokens';
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import { browser } from '$app/environment';
  import { getWebSocketUrl } from '/config/api';

  // Get game ID from route params
  $: gameId = $page.params.id;

  // WebSocket state
  $: wsState = $websocket;

  // Token state
  $: tokenState = $tokensStore;

  // Local state
  let chatMessage = '';
  let chatMessages: Array<{ text: string; username: string; userId: string }> = [];
  let showAddTokenForm = false;
  let newTokenName = '';
  let newTokenX = 5;
  let newTokenY = 5;

  // Get session token from localStorage (adjust based on your auth implementation)
  function getSessionToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('sessionToken') || sessionStorage.getItem('sessionToken');
  }

  // Setup WebSocket connection and join game
  onMount(async () => {
    const token = getSessionToken();

    if (!token) {
      console.error('No session token found');
      return;
    }

    // Load tokens from API
    await tokensStore.loadTokens(gameId);

    // Connect to WebSocket if not already connected
    if (!wsState.connected) {
      const wsUrl = getWebSocketUrl();
      websocket.connect(wsUrl);
    }

    // Wait for connection, then join game
    const unsubscribe = websocket.state.subscribe((state) => {
      if (state.connected && state.currentRoom !== gameId) {
        websocket.joinGame(gameId, token);
      }
    });

    // Setup chat message handler
    const unsubChat = websocket.onChatMessage((payload) => {
      chatMessages = [...chatMessages, {
        text: payload.text,
        username: payload.username,
        userId: payload.userId
      }];
    });

    // Setup token event handlers
    const unsubTokenAdded = websocket.onTokenAdded((payload) => {
      tokensStore.addToken(payload.token);
    });

    const unsubTokenMove = websocket.onTokenMove((payload) => {
      tokensStore.moveToken(payload.tokenId, payload.x, payload.y);
    });

    const unsubTokenRemoved = websocket.onTokenRemoved((payload) => {
      tokensStore.removeToken(payload.tokenId);
    });

    return () => {
      unsubscribe();
      unsubChat();
      unsubTokenAdded();
      unsubTokenMove();
      unsubTokenRemoved();
    };
  });

  // Cleanup on destroy
  onDestroy(() => {
    if (wsState.currentRoom === gameId) {
      websocket.leaveGame(gameId);
    }
    tokensStore.clear();
  });

  // Token interaction handlers
  function handleTokenClick(tokenId: string) {
    tokensStore.selectToken(tokenId);
  }

  function handleTokenMove(tokenId: string, x: number, y: number) {
    websocket.sendTokenMove({ tokenId, x, y });
  }

  function handleAddToken() {
    if (!newTokenName.trim()) return;

    websocket.sendTokenAdd({
      name: newTokenName.trim(),
      x: newTokenX,
      y: newTokenY,
      width: 1,
      height: 1,
      visible: true,
    });

    // Reset form
    newTokenName = '';
    newTokenX = 5;
    newTokenY = 5;
    showAddTokenForm = false;
  }

  function handleDeleteToken() {
    if (!tokenState.selectedTokenId) return;

    if (confirm('Are you sure you want to delete this token?')) {
      websocket.sendTokenRemove({ tokenId: tokenState.selectedTokenId });
    }
  }

  // Send chat message
  function sendChat() {
    if (chatMessage.trim()) {
      websocket.sendChatMessage(chatMessage);
      chatMessage = '';
    }
  }

  // Handle Enter key in chat input
  function handleChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  }
</script>

<div class="game-container">
  <header>
    <h1>Game: {gameId}</h1>
    <div class="connection-status">
      {#if wsState.connected}
        <span class="status-connected">Connected</span>
      {:else if wsState.reconnecting}
        <span class="status-reconnecting">Reconnecting...</span>
      {:else}
        <span class="status-disconnected">Disconnected</span>
      {/if}
    </div>
  </header>

  <div class="game-layout">
    <!-- Main game area -->
    <main class="game-area">
      <!-- Token controls -->
      <div class="token-controls">
        <button on:click={() => showAddTokenForm = !showAddTokenForm} disabled={!wsState.connected}>
          {showAddTokenForm ? 'Cancel' : 'Add Token'}
        </button>
        {#if tokenState.selectedTokenId}
          <button on:click={handleDeleteToken} disabled={!wsState.connected} class="danger">
            Delete Token
          </button>
          <span class="selected-token-info">
            Selected: {tokenState.tokens.get(tokenState.selectedTokenId)?.name || 'Unknown'}
          </span>
        {/if}
        {#if tokenState.loading}
          <span class="loading-indicator">Loading tokens...</span>
        {/if}
        {#if tokenState.error}
          <span class="error-indicator">{tokenState.error}</span>
        {/if}
      </div>

      <!-- Add token form -->
      {#if showAddTokenForm}
        <div class="add-token-form">
          <h3>Add New Token</h3>
          <div class="form-group">
            <label for="tokenName">Name:</label>
            <input
              id="tokenName"
              type="text"
              bind:value={newTokenName}
              placeholder="Token name"
              required
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="tokenX">X Position:</label>
              <input id="tokenX" type="number" bind:value={newTokenX} min="0" />
            </div>
            <div class="form-group">
              <label for="tokenY">Y Position:</label>
              <input id="tokenY" type="number" bind:value={newTokenY} min="0" />
            </div>
          </div>
          <div class="form-actions">
            <button on:click={handleAddToken} disabled={!newTokenName.trim()}>
              Create Token
            </button>
            <button on:click={() => showAddTokenForm = false} class="secondary">
              Cancel
            </button>
          </div>
        </div>
      {/if}

      <!-- Game canvas -->
      <div class="game-canvas">
        <GameCanvas
          tokens={tokenState.tokens}
          selectedTokenId={tokenState.selectedTokenId}
          onTokenClick={handleTokenClick}
          onTokenMove={handleTokenMove}
        />
      </div>
    </main>

    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Players list -->
      <section class="players-section">
        <h2>Players ({wsState.players.length})</h2>
        <ul class="players-list">
          {#each wsState.players as player (player.userId)}
            <li class="player-item">
              <span class="player-name">{player.username}</span>
            </li>
          {/each}
        </ul>
      </section>

      <!-- Chat -->
      <section class="chat-section">
        <h2>Chat</h2>
        <div class="chat-messages">
          {#each chatMessages as message (message.userId + message.text)}
            <div class="chat-message">
              <strong>{message.username}:</strong>
              <span>{message.text}</span>
            </div>
          {/each}
        </div>
        <div class="chat-input">
          <input
            type="text"
            bind:value={chatMessage}
            on:keydown={handleChatKeydown}
            placeholder="Type a message..."
            disabled={!wsState.connected}
          />
          <button on:click={sendChat} disabled={!wsState.connected || !chatMessage.trim()}>
            Send
          </button>
        </div>
      </section>
    </aside>
  </div>
</div>

<style>
  .game-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #1a1a1a;
    color: #ffffff;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #2a2a2a;
    border-bottom: 1px solid #3a3a3a;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-connected {
    color: #4ade80;
  }

  .status-reconnecting {
    color: #fbbf24;
  }

  .status-disconnected {
    color: #ef4444;
  }

  .game-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .game-area {
    flex: 1;
    padding: 2rem;
    overflow: auto;
  }

  .token-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 0.5rem;
  }

  .token-controls button {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    border: none;
    border-radius: 0.25rem;
    color: #ffffff;
    cursor: pointer;
    font-weight: 500;
  }

  .token-controls button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .token-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .token-controls button.danger {
    background-color: #ef4444;
  }

  .token-controls button.danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .selected-token-info {
    color: #fbbf24;
    font-weight: 500;
  }

  .loading-indicator {
    color: #fbbf24;
  }

  .error-indicator {
    color: #ef4444;
  }

  .add-token-form {
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 0.5rem;
  }

  .add-token-form h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: #9ca3af;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    color: #9ca3af;
    font-size: 0.9rem;
  }

  .form-group input {
    width: 100%;
    padding: 0.5rem;
    background-color: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 0.25rem;
    color: #ffffff;
  }

  .form-row {
    display: flex;
    gap: 1rem;
  }

  .form-row .form-group {
    flex: 1;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
  }

  .form-actions button {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    border: none;
    border-radius: 0.25rem;
    color: #ffffff;
    cursor: pointer;
    font-weight: 500;
  }

  .form-actions button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .form-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-actions button.secondary {
    background-color: #6b7280;
  }

  .form-actions button.secondary:hover {
    background-color: #4b5563;
  }

  .game-canvas {
    background-color: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 0.5rem;
    height: 600px;
    overflow: hidden;
  }

  .sidebar {
    width: 300px;
    background-color: #2a2a2a;
    border-left: 1px solid #3a3a3a;
    display: flex;
    flex-direction: column;
  }

  .players-section,
  .chat-section {
    padding: 1rem;
  }

  .players-section {
    border-bottom: 1px solid #3a3a3a;
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: #9ca3af;
  }

  .players-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .player-item {
    padding: 0.5rem;
    background-color: #1a1a1a;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .player-name {
    font-weight: 500;
  }

  .chat-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #1a1a1a;
    border-radius: 0.25rem;
  }

  .chat-message {
    margin-bottom: 0.5rem;
    word-wrap: break-word;
  }

  .chat-message strong {
    color: #60a5fa;
    margin-right: 0.5rem;
  }

  .chat-input {
    display: flex;
    gap: 0.5rem;
  }

  .chat-input input {
    flex: 1;
    padding: 0.5rem;
    background-color: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 0.25rem;
    color: #ffffff;
  }

  .chat-input input:focus {
    outline: none;
    border-color: #60a5fa;
  }

  .chat-input input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chat-input button {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    border: none;
    border-radius: 0.25rem;
    color: #ffffff;
    cursor: pointer;
    font-weight: 500;
  }

  .chat-input button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .chat-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
