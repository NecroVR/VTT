import { writable, type Writable } from 'svelte/store';

type MessageHandler = (data: any) => void;

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

class WebSocketStore {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public state: Writable<WebSocketState> = writable({
    connected: false,
    reconnecting: false,
    error: null
  });

  /**
   * Connect to WebSocket server
   * @param url WebSocket server URL (e.g., 'ws://localhost:3000/ws')
   */
  connect(url: string): void {
    this.url = url;
    this.createConnection();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state.set({
      connected: false,
      reconnecting: false,
      error: null
    });
  }

  /**
   * Send message to WebSocket server
   * @param data Data to send (will be JSON stringified)
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
      this.state.update(s => ({ ...s, error: 'WebSocket is not connected' }));
    }
  }

  /**
   * Subscribe to incoming messages
   * @param handler Function to call when message is received
   * @returns Unsubscribe function
   */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Create WebSocket connection
   */
  private createConnection(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.state.set({
          connected: true,
          reconnecting: false,
          error: null
        });
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.state.update(s => ({ ...s, error: 'WebSocket error occurred' }));
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.state.update(s => ({ ...s, connected: false }));

        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }

        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.state.set({
        connected: false,
        reconnecting: false,
        error: 'Failed to create connection'
      });
    }
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.state.set({
        connected: false,
        reconnecting: false,
        error: 'Max reconnection attempts reached'
      });
      return;
    }

    this.reconnectAttempts++;
    this.state.update(s => ({ ...s, reconnecting: true }));

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }
}

// Export singleton instance
export const websocket = new WebSocketStore();
