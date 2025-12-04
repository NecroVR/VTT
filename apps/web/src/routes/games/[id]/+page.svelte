<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { websocket } from '$lib/stores/websocket';
  import { browser } from '$app/environment';

  // Get game ID from route params
  $: gameId = $page.params.id;

  // WebSocket state
  $: wsState = $websocket;

  // Local state
  let chatMessage = '';
  let chatMessages: Array<{ text: string; username: string; userId: string }> = [];

  // Get session token from localStorage (adjust based on your auth implementation)
  function getSessionToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('sessionToken') || sessionStorage.getItem('sessionToken');
  }

  // Setup WebSocket connection and join game
  onMount(() => {
    const token = getSessionToken();

    if (!token) {
      console.error('No session token found');
      return;
    }

    // Connect to WebSocket if not already connected
    if (!wsState.connected) {
      const wsUrl = `ws://localhost:3000/ws`;
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

    return () => {
      unsubscribe();
      unsubChat();
    };
  });

  // Cleanup on destroy
  onDestroy(() => {
    if (wsState.currentRoom === gameId) {
      websocket.leaveGame(gameId);
    }
  });

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
      <div class="game-canvas">
        <p>Game canvas will go here</p>
        <p>Token movements, maps, etc.</p>
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

  .game-canvas {
    background-color: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 0.5rem;
    padding: 2rem;
    min-height: 500px;
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
