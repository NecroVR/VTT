<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { websocket } from '$lib/stores/websocket';
  import { authStore } from '$lib/stores/auth';
  import type { ChatMessagePayload, DiceResultPayload } from '@vtt/shared';
  import ChatMessage from './ChatMessage.svelte';
  import DiceRollResult from './DiceRollResult.svelte';
  import ChatInput from './ChatInput.svelte';

  // Props
  export let gameId: string;

  // Message state
  interface DisplayMessage {
    id: string;
    type: 'chat' | 'dice' | 'system';
    timestamp: number;
    username?: string;
    userId?: string;
    content?: string;
    diceResult?: DiceResultPayload;
    isLocalEcho?: boolean; // Track if this is a local echo
  }

  let messages: DisplayMessage[] = [];
  let messagesContainer: HTMLDivElement;
  let autoScroll = true;
  let currentUser: { id: string; username: string } | null = null;

  // WebSocket subscriptions
  let unsubscribeChatMessage: (() => void) | null = null;
  let unsubscribeDiceResult: (() => void) | null = null;

  // Subscribe to auth store to get current user info
  authStore.subscribe((state) => {
    if (state.user) {
      currentUser = {
        id: state.user.id,
        username: state.user.username
      };
      console.log('[ChatPanel] Current user:', currentUser);
    }
  });

  onMount(() => {
    console.log('[ChatPanel] Component mounted, setting up WebSocket subscriptions');

    // Wait for WebSocket to be connected before subscribing
    const unsubscribeState = websocket.state.subscribe((state) => {
      console.log('[ChatPanel] WebSocket state changed:', { connected: state.connected });
      if (state.connected && !unsubscribeChatMessage && !unsubscribeDiceResult) {
        console.log('[ChatPanel] WebSocket connected, registering message handlers');
        setupSubscriptions();
      }
    });

    return () => {
      unsubscribeState();
    };
  });

  function setupSubscriptions() {
    if (unsubscribeChatMessage || unsubscribeDiceResult) {
      console.log('[ChatPanel] Subscriptions already set up, skipping');
      return;
    }

    console.log('[ChatPanel] Setting up message subscriptions');

    // Subscribe to chat messages
    unsubscribeChatMessage = websocket.onChatMessage((payload: ChatMessagePayload) => {
      console.log('[ChatPanel] Received chat message:', payload);

      // Check if this is a local echo we should replace
      const localEchoIndex = messages.findIndex(
        m => m.isLocalEcho &&
        m.type === 'chat' &&
        m.userId === payload.userId &&
        m.content === payload.text &&
        Math.abs(m.timestamp - Date.now()) < 5000 // Within 5 seconds
      );

      if (localEchoIndex !== -1) {
        console.log('[ChatPanel] Replacing local echo with server message');
        // Replace local echo with server message
        messages = [
          ...messages.slice(0, localEchoIndex),
          {
            id: `chat-${payload.userId}-${Date.now()}`,
            type: 'chat',
            timestamp: Date.now(),
            username: payload.username,
            userId: payload.userId,
            content: payload.text,
            isLocalEcho: false
          },
          ...messages.slice(localEchoIndex + 1)
        ];
      } else {
        // Add new message from server
        const message: DisplayMessage = {
          id: `chat-${payload.userId}-${Date.now()}-${Math.random()}`,
          type: 'chat',
          timestamp: Date.now(),
          username: payload.username,
          userId: payload.userId,
          content: payload.text,
          isLocalEcho: false
        };
        console.log('[ChatPanel] Adding new chat message to array');
        messages = [...messages, message];
      }
      scrollToBottom();
    });

    // Subscribe to dice roll results
    unsubscribeDiceResult = websocket.onDiceResult((payload: DiceResultPayload) => {
      console.log('[ChatPanel] Received dice result:', payload);

      // Check if this is a local echo we should replace
      const localEchoIndex = messages.findIndex(
        m => m.isLocalEcho &&
        m.type === 'dice' &&
        m.userId === payload.userId &&
        m.diceResult?.notation === payload.notation &&
        Math.abs(m.timestamp - Date.now()) < 5000 // Within 5 seconds
      );

      if (localEchoIndex !== -1) {
        console.log('[ChatPanel] Replacing local dice roll echo with server result');
        // Replace local echo with server result
        messages = [
          ...messages.slice(0, localEchoIndex),
          {
            id: `dice-${payload.userId}-${Date.now()}`,
            type: 'dice',
            timestamp: Date.now(),
            username: payload.username,
            userId: payload.userId,
            diceResult: payload,
            isLocalEcho: false
          },
          ...messages.slice(localEchoIndex + 1)
        ];
      } else {
        // Add new dice result from server
        const message: DisplayMessage = {
          id: `dice-${payload.userId}-${Date.now()}-${Math.random()}`,
          type: 'dice',
          timestamp: Date.now(),
          username: payload.username,
          userId: payload.userId,
          diceResult: payload,
          isLocalEcho: false
        };
        console.log('[ChatPanel] Adding dice result to array');
        messages = [...messages, message];
      }
      scrollToBottom();
    });

    console.log('[ChatPanel] Subscriptions registered successfully');
  }

  onDestroy(() => {
    if (unsubscribeChatMessage) {
      unsubscribeChatMessage();
    }
    if (unsubscribeDiceResult) {
      unsubscribeDiceResult();
    }
  });

  function scrollToBottom() {
    if (autoScroll && messagesContainer) {
      setTimeout(() => {
        // Check if messagesContainer still exists (may be destroyed in tests)
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 0);
    }
  }

  function handleScroll() {
    if (!messagesContainer) return;

    // Check if user has scrolled up
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    autoScroll = isAtBottom;
  }

  function handleSendMessage(text: string) {
    console.log('[ChatPanel] Sending message:', text);

    // Check if it's a dice roll command
    const diceRollMatch = text.match(/^\/roll\s+(.+)$/i);

    if (diceRollMatch) {
      const notation = diceRollMatch[1].trim();
      console.log('[ChatPanel] Sending dice roll:', notation);

      // Add local echo for dice roll
      if (currentUser) {
        const localEchoMessage: DisplayMessage = {
          id: `dice-local-${Date.now()}-${Math.random()}`,
          type: 'dice',
          timestamp: Date.now(),
          username: currentUser.username,
          userId: currentUser.id,
          diceResult: {
            notation,
            total: 0,
            rolls: [],
            modifiers: 0,
            breakdown: 'Rolling...',
            username: currentUser.username,
            userId: currentUser.id
          },
          isLocalEcho: true
        };
        console.log('[ChatPanel] Adding local echo for dice roll');
        messages = [...messages, localEchoMessage];
        scrollToBottom();
      }

      websocket.sendDiceRoll({ notation });
    } else {
      console.log('[ChatPanel] Sending chat message:', text);

      // Add local echo for chat message
      if (currentUser) {
        const localEchoMessage: DisplayMessage = {
          id: `chat-local-${Date.now()}-${Math.random()}`,
          type: 'chat',
          timestamp: Date.now(),
          username: currentUser.username,
          userId: currentUser.id,
          content: text,
          isLocalEcho: true
        };
        console.log('[ChatPanel] Adding local echo for chat message');
        messages = [...messages, localEchoMessage];
        scrollToBottom();
      }

      websocket.sendChatMessage(text);
    }
  }
</script>

<div class="chat-panel">
  <div
    class="messages-container"
    bind:this={messagesContainer}
    on:scroll={handleScroll}
  >
    {#if messages.length === 0}
      <div class="no-messages">
        <p>No messages yet. Start chatting or roll some dice!</p>
        <p class="hint">Tip: Use <code>/roll 2d6+3</code> to roll dice</p>
      </div>
    {:else}
      {#each messages as message (message.id)}
        <div class:local-echo={message.isLocalEcho}>
          {#if message.type === 'chat'}
            <ChatMessage
              username={message.username || 'Unknown'}
              content={message.content || ''}
              timestamp={message.timestamp}
            />
          {:else if message.type === 'dice'}
            <DiceRollResult
              username={message.username || 'Unknown'}
              result={message.diceResult}
              timestamp={message.timestamp}
            />
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <ChatInput onSend={handleSendMessage} />
</div>

<style>
  .chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .messages-container::-webkit-scrollbar {
    width: 8px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .messages-container::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .no-messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #9ca3af;
    text-align: center;
    padding: 2rem;
  }

  .no-messages p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .hint code {
    background-color: #374151;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'Courier New', monospace;
    color: #60a5fa;
  }

  .local-echo {
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }
</style>
