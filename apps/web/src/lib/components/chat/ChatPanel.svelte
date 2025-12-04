<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { websocket } from '$lib/stores/websocket';
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
  }

  let messages: DisplayMessage[] = [];
  let messagesContainer: HTMLDivElement;
  let autoScroll = true;

  // WebSocket subscriptions
  let unsubscribeChatMessage: (() => void) | null = null;
  let unsubscribeDiceResult: (() => void) | null = null;

  onMount(() => {
    // Subscribe to chat messages
    unsubscribeChatMessage = websocket.onChatMessage((payload: ChatMessagePayload) => {
      const message: DisplayMessage = {
        id: `chat-${Date.now()}-${Math.random()}`,
        type: 'chat',
        timestamp: Date.now(),
        username: payload.username,
        userId: payload.userId,
        content: payload.text,
      };
      messages = [...messages, message];
      scrollToBottom();
    });

    // Subscribe to dice roll results
    unsubscribeDiceResult = websocket.onDiceResult((payload: DiceResultPayload) => {
      const message: DisplayMessage = {
        id: `dice-${Date.now()}-${Math.random()}`,
        type: 'dice',
        timestamp: Date.now(),
        username: payload.username,
        userId: payload.userId,
        diceResult: payload,
      };
      messages = [...messages, message];
      scrollToBottom();
    });
  });

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
    // Check if it's a dice roll command
    const diceRollMatch = text.match(/^\/roll\s+(.+)$/i);

    if (diceRollMatch) {
      const notation = diceRollMatch[1].trim();
      websocket.sendDiceRoll({ notation });
    } else {
      websocket.sendChatMessage(text);
    }
  }
</script>

<div class="chat-panel">
  <div class="chat-header">
    <h3>Chat</h3>
  </div>

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
    border-left: 1px solid #374151;
  }

  .chat-header {
    padding: 1rem;
    border-bottom: 1px solid #374151;
    background-color: #111827;
  }

  .chat-header h3 {
    margin: 0;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
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
</style>
