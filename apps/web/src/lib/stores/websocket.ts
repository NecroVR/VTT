import { writable, type Writable } from 'svelte/store';
import type {
  WSMessage,
  WSMessageType,
  Token,
  TokenMovePayload,
  TokenAddPayload,
  TokenAddedPayload,
  TokenUpdatePayload,
  TokenUpdatedPayload,
  TokenRemovePayload,
  TokenRemovedPayload,
  DiceRollPayload,
  DiceResultPayload,
  CampaignJoinPayload,
  CampaignLeavePayload,
  CampaignPlayersPayload,
  CampaignPlayerJoinedPayload,
  CampaignPlayerLeftPayload,
  ChatMessagePayload,
  PlayerInfo,
  SceneSwitchPayload,
  SceneSwitchedPayload,
  SceneUpdatePayload,
  SceneUpdatedPayload,
  WallAddPayload,
  WallAddedPayload,
  WallUpdatePayload,
  WallUpdatedPayload,
  WallRemovePayload,
  WallRemovedPayload,
  LightAddPayload,
  LightAddedPayload,
  LightUpdatePayload,
  LightUpdatedPayload,
  LightRemovePayload,
  LightRemovedPayload,
  CombatStartPayload,
  CombatStartedPayload,
  CombatEndPayload,
  CombatEndedPayload,
  CombatUpdatePayload,
  CombatUpdatedPayload,
  CombatantAddPayload,
  CombatantAddedPayload,
  CombatantUpdatePayload,
  CombatantUpdatedPayload,
  CombatantRemovePayload,
  CombatantRemovedPayload,
  CombatNextTurnPayload,
  CombatTurnChangedPayload,
  EffectAddPayload,
  EffectAddedPayload,
  EffectUpdatePayload,
  EffectUpdatedPayload,
  EffectRemovePayload,
  EffectRemovedPayload,
  EffectTogglePayload,
  EffectToggledPayload,
  DrawingCreatePayload,
  DrawingCreatedPayload,
  DrawingUpdatePayload,
  DrawingUpdatedPayload,
  DrawingDeletePayload,
  DrawingDeletedPayload,
  DrawingStreamPayload,
  DrawingStreamedPayload
} from '@vtt/shared';

type MessageHandler<T = unknown> = (message: WSMessage<T>) => void;
type TypedMessageHandler<T = unknown> = (payload: T) => void;

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  currentRoom: string | null;
  players: PlayerInfo[];
}

class WebSocketStore {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler<any>> = new Set();
  private typedHandlers: Map<WSMessageType, Set<TypedMessageHandler<any>>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  public state: Writable<WebSocketState> = writable({
    connected: false,
    reconnecting: false,
    error: null,
    currentRoom: null,
    players: []
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
      error: null,
      currentRoom: null,
      players: []
    });
  }

  /**
   * Send typed message to WebSocket server
   * @param type Message type
   * @param payload Message payload
   */
  send<T = unknown>(type: WSMessageType, payload: T): void {
    const message: WSMessage<T> = {
      type,
      payload,
      timestamp: Date.now()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      this.state.update(s => ({ ...s, error: 'WebSocket is not connected' }));
    }
  }

  /**
   * Subscribe to all incoming messages
   * @param handler Function to call when any message is received
   * @returns Unsubscribe function
   */
  subscribe<T = unknown>(handler: MessageHandler<T>): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to specific message type
   * @param type Message type to listen for
   * @param handler Function to call when message of this type is received
   * @returns Unsubscribe function
   */
  on<T = unknown>(type: WSMessageType, handler: TypedMessageHandler<T>): () => void {
    if (!this.typedHandlers.has(type)) {
      this.typedHandlers.set(type, new Set());
    }
    this.typedHandlers.get(type)!.add(handler);

    return () => {
      const handlers = this.typedHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.typedHandlers.delete(type);
        }
      }
    };
  }

  /**
   * Typed helper methods for common message types
   */

  // Token methods
  sendTokenAdd(payload: TokenAddPayload): void {
    this.send('token:add', payload);
  }

  sendTokenMove(payload: TokenMovePayload): void {
    this.send('token:move', payload);
  }

  sendTokenUpdate(payload: TokenUpdatePayload): void {
    this.send('token:update', payload);
  }

  sendTokenRemove(payload: TokenRemovePayload): void {
    this.send('token:remove', payload);
  }

  onTokenAdded(handler: TypedMessageHandler<TokenAddedPayload>): () => void {
    return this.on('token:added', handler);
  }

  onTokenMove(handler: TypedMessageHandler<TokenMovePayload>): () => void {
    return this.on('token:move', handler);
  }

  onTokenUpdated(handler: TypedMessageHandler<TokenUpdatedPayload>): () => void {
    return this.on('token:updated', handler);
  }

  onTokenRemoved(handler: TypedMessageHandler<TokenRemovedPayload>): () => void {
    return this.on('token:removed', handler);
  }

  // Dice methods
  sendDiceRoll(payload: DiceRollPayload): void {
    this.send('dice:roll', payload);
  }

  onDiceResult(handler: TypedMessageHandler<DiceResultPayload>): () => void {
    return this.on('dice:result', handler);
  }

  // Scene methods
  sendSceneSwitch(payload: SceneSwitchPayload): void {
    this.send('scene:switch', payload);
  }

  sendSceneUpdate(payload: SceneUpdatePayload): void {
    this.send('scene:update', payload);
  }

  onSceneSwitched(handler: TypedMessageHandler<SceneSwitchedPayload>): () => void {
    return this.on('scene:switched', handler);
  }

  onSceneUpdated(handler: TypedMessageHandler<SceneUpdatedPayload>): () => void {
    return this.on('scene:updated', handler);
  }

  // Wall methods
  sendWallAdd(payload: WallAddPayload): void {
    this.send('wall:add', payload);
  }

  sendWallUpdate(payload: WallUpdatePayload): void {
    this.send('wall:update', payload);
  }

  sendWallRemove(payload: WallRemovePayload): void {
    this.send('wall:remove', payload);
  }

  onWallAdded(handler: TypedMessageHandler<WallAddedPayload>): () => void {
    return this.on('wall:added', handler);
  }

  onWallUpdated(handler: TypedMessageHandler<WallUpdatedPayload>): () => void {
    return this.on('wall:updated', handler);
  }

  onWallRemoved(handler: TypedMessageHandler<WallRemovedPayload>): () => void {
    return this.on('wall:removed', handler);
  }

  // Light methods
  sendLightAdd(payload: LightAddPayload): void {
    this.send('light:add', payload);
  }

  sendLightUpdate(payload: LightUpdatePayload): void {
    this.send('light:update', payload);
  }

  sendLightRemove(payload: LightRemovePayload): void {
    this.send('light:remove', payload);
  }

  onLightAdded(handler: TypedMessageHandler<LightAddedPayload>): () => void {
    return this.on('light:added', handler);
  }

  onLightUpdated(handler: TypedMessageHandler<LightUpdatedPayload>): () => void {
    return this.on('light:updated', handler);
  }

  onLightRemoved(handler: TypedMessageHandler<LightRemovedPayload>): () => void {
    return this.on('light:removed', handler);
  }

  /**
   * campaign room methods
   */
  joinCampaign(campaignId: string, token: string): void {
    const payload: CampaignJoinPayload = { campaignId, token };
    this.send('campaign:join', payload);
    this.state.update(s => ({ ...s, currentRoom: campaignId }));
  }

  leaveCampaign(campaignId: string): void {
    const payload: CampaignLeavePayload = { campaignId };
    this.send('campaign:leave', payload);
    this.state.update(s => ({ ...s, currentRoom: null, players: [] }));
  }

  sendChatMessage(text: string): void {
    // User info will be filled in by server
    const payload: ChatMessagePayload = {
      text,
      userId: '', // Will be set by server
      username: '' // Will be set by server
    };
    this.send('chat:message', payload);
  }

  onCampaignPlayers(handler: TypedMessageHandler<CampaignPlayersPayload>): () => void {
    return this.on('campaign:players', handler);
  }

  onPlayerJoined(handler: TypedMessageHandler<CampaignPlayerJoinedPayload>): () => void {
    return this.on('campaign:player-joined', handler);
  }

  onPlayerLeft(handler: TypedMessageHandler<CampaignPlayerLeftPayload>): () => void {
    return this.on('campaign:player-left', handler);
  }

  onChatMessage(handler: TypedMessageHandler<ChatMessagePayload>): () => void {
    return this.on('chat:message', handler);
  }

  /**
   * Combat methods
   */
  sendCombatStart(payload: CombatStartPayload): void {
    this.send('combat:start', payload);
  }

  sendCombatEnd(payload: CombatEndPayload): void {
    this.send('combat:end', payload);
  }

  sendCombatUpdate(payload: CombatUpdatePayload): void {
    this.send('combat:update', payload);
  }

  sendCombatNextTurn(payload: CombatNextTurnPayload): void {
    this.send('combat:next-turn', payload);
  }

  onCombatStarted(handler: TypedMessageHandler<CombatStartedPayload>): () => void {
    return this.on('combat:started', handler);
  }

  onCombatEnded(handler: TypedMessageHandler<CombatEndedPayload>): () => void {
    return this.on('combat:ended', handler);
  }

  onCombatUpdated(handler: TypedMessageHandler<CombatUpdatedPayload>): () => void {
    return this.on('combat:updated', handler);
  }

  onCombatTurnChanged(handler: TypedMessageHandler<CombatTurnChangedPayload>): () => void {
    return this.on('combat:turn-changed', handler);
  }

  // Combatant methods
  sendCombatantAdd(payload: CombatantAddPayload): void {
    this.send('combatant:add', payload);
  }

  sendCombatantUpdate(payload: CombatantUpdatePayload): void {
    this.send('combatant:update', payload);
  }

  sendCombatantRemove(payload: CombatantRemovePayload): void {
    this.send('combatant:remove', payload);
  }

  onCombatantAdded(handler: TypedMessageHandler<CombatantAddedPayload>): () => void {
    return this.on('combatant:added', handler);
  }

  onCombatantUpdated(handler: TypedMessageHandler<CombatantUpdatedPayload>): () => void {
    return this.on('combatant:updated', handler);
  }

  onCombatantRemoved(handler: TypedMessageHandler<CombatantRemovedPayload>): () => void {
    return this.on('combatant:removed', handler);
  }

  /**
   * Effect methods
   */
  sendEffectAdd(payload: EffectAddPayload): void {
    this.send('effect:add', payload);
  }

  sendEffectUpdate(payload: EffectUpdatePayload): void {
    this.send('effect:update', payload);
  }

  sendEffectRemove(payload: EffectRemovePayload): void {
    this.send('effect:remove', payload);
  }

  sendEffectToggle(payload: EffectTogglePayload): void {
    this.send('effect:toggle', payload);
  }

  onEffectAdded(handler: TypedMessageHandler<EffectAddedPayload>): () => void {
    return this.on('effect:added', handler);
  }

  onEffectUpdated(handler: TypedMessageHandler<EffectUpdatedPayload>): () => void {
    return this.on('effect:updated', handler);
  }

  onEffectRemoved(handler: TypedMessageHandler<EffectRemovedPayload>): () => void {
    return this.on('effect:removed', handler);
  }

  onEffectToggled(handler: TypedMessageHandler<EffectToggledPayload>): () => void {
    return this.on('effect:toggled', handler);
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
        this.state.update(s => ({
          ...s,
          connected: true,
          reconnecting: false,
          error: null
        }));
        this.startHeartbeat();
        this.setupCampaignHandlers();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          // Call general message handlers
          this.messageHandlers.forEach(handler => handler(message));

          // Call type-specific handlers
          const handlers = this.typedHandlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message.payload));
          }
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
        this.send('ping', {});
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Setup handlers for campaign-related messages
   */
  private setupCampaignHandlers(): void {
    // Handle initial player list
    this.on<CampaignPlayersPayload>('campaign:players', (payload) => {
      this.state.update(s => ({ ...s, players: payload.players }));
    });

    // Handle player joined
    this.on<CampaignPlayerJoinedPayload>('campaign:player-joined', (payload) => {
      this.state.update(s => ({
        ...s,
        players: [...s.players, payload.player]
      }));
    });

    // Handle player left
    this.on<CampaignPlayerLeftPayload>('campaign:player-left', (payload) => {
      this.state.update(s => ({
        ...s,
        players: s.players.filter(p => p.userId !== payload.userId)
      }));
    });
  }
}

// Export singleton instance
export const websocket = new WebSocketStore();
