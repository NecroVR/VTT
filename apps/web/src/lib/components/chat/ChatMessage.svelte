<script lang="ts">
  export let username: string;
  export let content: string;
  export let timestamp: number;

  function formatTime(ts: number): string {
    const date = new Date(ts);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
</script>

<div class="chat-message">
  <div class="message-header">
    <span class="username">{username}</span>
    <span class="timestamp">{formatTime(timestamp)}</span>
  </div>
  <div class="message-content">
    {content}
  </div>
</div>

<style>
  .chat-message {
    background-color: #374151;
    border-radius: 0.5rem;
    padding: 0.75rem;
    transition: background-color 0.2s;
  }

  .chat-message:hover {
    background-color: #4b5563;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .username {
    font-weight: 600;
    color: #60a5fa;
    font-size: 0.875rem;
  }

  .timestamp {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .message-content {
    color: #e5e7eb;
    font-size: 0.875rem;
    line-height: 1.5;
    word-wrap: break-word;
  }
</style>
