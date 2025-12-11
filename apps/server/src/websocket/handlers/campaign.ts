import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  WSMessageType,
  Token,
  Scene,
  Wall,
  Window,
  AmbientLight,
  TokenMovePayload,
  TokenAddPayload,
  TokenAddedPayload,
  TokenUpdatePayload,
  TokenUpdatedPayload,
  TokenRemovePayload,
  TokenRemovedPayload,
  DiceRollPayload,
  DiceResultPayload,
  DiceRollGroup,
  CampaignJoinPayload,
  CampaignLeavePayload,
  CampaignPlayersPayload,
  CampaignPlayerJoinedPayload,
  CampaignPlayerLeftPayload,
  ChatMessagePayload,
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
  WindowAddPayload,
  WindowAddedPayload,
  WindowUpdatePayload,
  WindowUpdatedPayload,
  WindowRemovePayload,
  WindowRemovedPayload,
  LightAddPayload,
  LightAddedPayload,
  LightUpdatePayload,
  LightUpdatedPayload,
  LightRemovePayload,
  LightRemovedPayload,
  PathAddPayload,
  PathAddedPayload,
  PathUpdatePayload,
  PathUpdatedPayload,
  PathRemovePayload,
  PathRemovedPayload,
  PathPoint,
  PathPointAddPayload,
  PathPointAddedPayload,
  PathPointUpdatePayload,
  PathPointUpdatedPayload,
  PathPointRemovePayload,
  PathPointRemovedPayload,
  ActorCreatePayload,
  ActorUpdatePayload,
  ActorDeletePayload,
  CombatStartPayload,
  CombatEndPayload,
  CombatUpdatePayload,
  CombatantAddPayload,
  CombatantUpdatePayload,
  CombatantRemovePayload,
  CombatNextTurnPayload,
  ChatDeletePayload,
  ChatWhisperPayload,
  EffectAddPayload,
  EffectUpdatePayload,
  EffectRemovePayload,
  EffectTogglePayload,
  JournalCreatePayload,
  JournalUpdatePayload,
  JournalDeletePayload,
  JournalShowPayload,
  PageCreatePayload,
  PageUpdatePayload,
  PageDeletePayload,
  FolderCreatePayload,
  FolderUpdatePayload,
  FolderDeletePayload,
  MeasureStartPayload,
  MeasureUpdatePayload,
  MeasureEndPayload,
  TemplatePlacePayload,
  TemplateUpdatePayload,
  TemplateRemovePayload,
  DrawingCreatePayload,
  DrawingUpdatePayload,
  DrawingDeletePayload,
  DrawingStreamPayload,
  TileAddPayload,
  TileUpdatePayload,
  TileRemovePayload,
  RegionAddPayload,
  RegionUpdatePayload,
  RegionRemovePayload,
  PinAddPayload,
  PinUpdatePayload,
  PinRemovePayload,
  PinClickPayload,
  CompendiumCreatePayload,
  CompendiumUpdatePayload,
  CompendiumDeletePayload,
  CompendiumEntryCreatePayload,
  CompendiumEntryUpdatePayload,
  CompendiumEntryDeletePayload,
  ErrorPayload
} from '@vtt/shared';
import { parseDiceNotation, type DiceGroup } from '@vtt/shared/dice';
import { roomManager } from '../rooms.js';
import { validateSession, extractSessionToken } from '../auth.js';
import { tokens, scenes, walls, windows, ambientLights, paths, pathPoints } from '@vtt/database';
import { eq, and, asc } from 'drizzle-orm';
import {
  handleActorCreate,
  handleActorUpdate,
  handleActorDelete,
} from './actors.js';
import {
  handleCombatStart,
  handleCombatEnd,
  handleCombatUpdate,
  handleCombatantAdd,
  handleCombatantUpdate,
  handleCombatantRemove,
  handleCombatNextTurn,
} from './combat.js';
import {
  handleChatMessage as handleChatMessageHandler,
  handleChatDelete,
  handleChatWhisper,
} from './chat.js';
import {
  handleEffectAdd,
  handleEffectUpdate,
  handleEffectRemove,
  handleEffectToggle,
} from './effects.js';
import {
  handleJournalCreate,
  handleJournalUpdate,
  handleJournalDelete,
  handleJournalShow,
  handlePageCreate,
  handlePageUpdate,
  handlePageDelete,
  handleFolderCreate,
  handleFolderUpdate,
  handleFolderDelete,
} from './journals.js';
import {
  handleMeasureStart,
  handleMeasureUpdate,
  handleMeasureEnd,
  handleTemplatePlace,
  handleTemplateUpdate,
  handleTemplateRemove,
} from './templates.js';
import {
  handleDrawingCreate,
  handleDrawingUpdate,
  handleDrawingDelete,
  handleDrawingStream,
} from './drawings.js';
import {
  handleTileAdd,
  handleTileUpdate,
  handleTileRemove,
} from './tiles.js';
import {
  handleRegionAdd,
  handleRegionUpdate,
  handleRegionRemove,
} from './regions.js';
import {
  handlePinAdd,
  handlePinUpdate,
  handlePinRemove,
  handlePinClick,
} from './pins.js';
import {
  handleCompendiumCreate,
  handleCompendiumUpdate,
  handleCompendiumDelete,
  handleCompendiumEntryCreate,
  handleCompendiumEntryUpdate,
  handleCompendiumEntryDelete,
} from './compendiums.js';
import {
  handleWindowAdd,
  handleWindowUpdate,
  handleWindowRemove,
} from './windows.js';

/**
 * Campaign session WebSocket handler
 * Manages real-time communication for campaign sessions
 */
export async function handleCampaignWebSocket(
  connection: WebSocket,
  request: FastifyRequest
) {
  const socket = connection;
  const clientId = request.id;

  request.log.info(`WebSocket client connected: ${clientId}`);

  // Handle incoming messages
  socket.on('message', async (rawMessage: Buffer) => {
    try {
      const message = JSON.parse(rawMessage.toString()) as WSMessage;

      request.log.debug({ message }, 'Received WebSocket message');

      // Handle different message types
      switch (message.type) {
        case 'ping':
          handlePing(socket);
          break;

        case 'campaign:join':
          await handleCampaignJoin(socket, message as WSMessage<CampaignJoinPayload>, request);
          break;

        case 'campaign:leave':
          handleCampaignLeave(socket, message as WSMessage<CampaignLeavePayload>, request);
          break;

        case 'token:move':
          await handleTokenMove(socket, message as WSMessage<TokenMovePayload>, request);
          break;

        case 'token:add':
          await handleTokenAdd(socket, message as WSMessage<TokenAddPayload>, request);
          break;

        case 'token:update':
          await handleTokenUpdate(socket, message as WSMessage<TokenUpdatePayload>, request);
          break;

        case 'token:remove':
          await handleTokenRemove(socket, message as WSMessage<TokenRemovePayload>, request);
          break;

        case 'dice:roll':
          handleDiceRoll(socket, message as WSMessage<DiceRollPayload>, request);
          break;

        case 'chat:message':
          await handleChatMessageHandler(socket, message as WSMessage<ChatMessagePayload>, request);
          break;

        case 'chat:delete':
          await handleChatDelete(socket, message as WSMessage<ChatDeletePayload>, request);
          break;

        case 'chat:whisper':
          await handleChatWhisper(socket, message as WSMessage<ChatWhisperPayload>, request);
          break;

        case 'actor:create':
          await handleActorCreate(socket, message as WSMessage<ActorCreatePayload>, request);
          break;

        case 'actor:update':
          await handleActorUpdate(socket, message as WSMessage<ActorUpdatePayload>, request);
          break;

        case 'actor:delete':
          await handleActorDelete(socket, message as WSMessage<ActorDeletePayload>, request);
          break;

        case 'combat:start':
          await handleCombatStart(socket, message as WSMessage<CombatStartPayload>, request);
          break;

        case 'combat:end':
          await handleCombatEnd(socket, message as WSMessage<CombatEndPayload>, request);
          break;

        case 'combat:update':
          await handleCombatUpdate(socket, message as WSMessage<CombatUpdatePayload>, request);
          break;

        case 'combatant:add':
          await handleCombatantAdd(socket, message as WSMessage<CombatantAddPayload>, request);
          break;

        case 'combatant:update':
          await handleCombatantUpdate(socket, message as WSMessage<CombatantUpdatePayload>, request);
          break;

        case 'combatant:remove':
          await handleCombatantRemove(socket, message as WSMessage<CombatantRemovePayload>, request);
          break;

        case 'combat:next-turn':
          await handleCombatNextTurn(socket, message as WSMessage<CombatNextTurnPayload>, request);
          break;

        case 'scene:switch':
          await handleSceneSwitch(socket, message as WSMessage<SceneSwitchPayload>, request);
          break;

        case 'scene:update':
          await handleSceneUpdate(socket, message as WSMessage<SceneUpdatePayload>, request);
          break;

        case 'wall:add':
          await handleWallAdd(socket, message as WSMessage<WallAddPayload>, request);
          break;

        case 'wall:update':
          await handleWallUpdate(socket, message as WSMessage<WallUpdatePayload>, request);
          break;

        case 'wall:remove':
          await handleWallRemove(socket, message as WSMessage<WallRemovePayload>, request);
          break;

        case 'window:add':
          await handleWindowAdd(socket, message as WSMessage<WindowAddPayload>, request);
          break;

        case 'window:update':
          await handleWindowUpdate(socket, message as WSMessage<WindowUpdatePayload>, request);
          break;

        case 'window:remove':
          await handleWindowRemove(socket, message as WSMessage<WindowRemovePayload>, request);
          break;

        case 'light:add':
          await handleLightAdd(socket, message as WSMessage<LightAddPayload>, request);
          break;

        case 'light:update':
          await handleLightUpdate(socket, message as WSMessage<LightUpdatePayload>, request);
          break;

        case 'light:remove':
          await handleLightRemove(socket, message as WSMessage<LightRemovePayload>, request);
          break;

        case 'path:add':
          await handlePathAdd(socket, message as WSMessage<PathAddPayload>, request);
          break;

        case 'path:update':
          await handlePathUpdate(socket, message as WSMessage<PathUpdatePayload>, request);
          break;

        case 'path:remove':
          await handlePathRemove(socket, message as WSMessage<PathRemovePayload>, request);
          break;

        case 'pathPoint:add':
          await handlePathPointAdd(socket, message as WSMessage<PathPointAddPayload>, request);
          break;

        case 'pathPoint:update':
          await handlePathPointUpdate(socket, message as WSMessage<PathPointUpdatePayload>, request);
          break;

        case 'pathPoint:remove':
          await handlePathPointRemove(socket, message as WSMessage<PathPointRemovePayload>, request);
          break;

        case 'effect:add':
          await handleEffectAdd(socket, message as WSMessage<EffectAddPayload>, request);
          break;

        case 'effect:update':
          await handleEffectUpdate(socket, message as WSMessage<EffectUpdatePayload>, request);
          break;

        case 'effect:remove':
          await handleEffectRemove(socket, message as WSMessage<EffectRemovePayload>, request);
          break;

        case 'effect:toggle':
          await handleEffectToggle(socket, message as WSMessage<EffectTogglePayload>, request);
          break;

        case 'journal:create':
          await handleJournalCreate(socket, message as WSMessage<JournalCreatePayload>, request);
          break;

        case 'journal:update':
          await handleJournalUpdate(socket, message as WSMessage<JournalUpdatePayload>, request);
          break;

        case 'journal:delete':
          await handleJournalDelete(socket, message as WSMessage<JournalDeletePayload>, request);
          break;

        case 'journal:show':
          await handleJournalShow(socket, message as WSMessage<JournalShowPayload>, request);
          break;

        case 'page:create':
          await handlePageCreate(socket, message as WSMessage<PageCreatePayload>, request);
          break;

        case 'page:update':
          await handlePageUpdate(socket, message as WSMessage<PageUpdatePayload>, request);
          break;

        case 'page:delete':
          await handlePageDelete(socket, message as WSMessage<PageDeletePayload>, request);
          break;

        case 'folder:create':
          await handleFolderCreate(socket, message as WSMessage<FolderCreatePayload>, request);
          break;

        case 'folder:update':
          await handleFolderUpdate(socket, message as WSMessage<FolderUpdatePayload>, request);
          break;

        case 'folder:delete':
          await handleFolderDelete(socket, message as WSMessage<FolderDeletePayload>, request);
          break;

        case 'measure:start':
          await handleMeasureStart(socket, message as WSMessage<MeasureStartPayload>, request);
          break;

        case 'measure:update':
          await handleMeasureUpdate(socket, message as WSMessage<MeasureUpdatePayload>, request);
          break;

        case 'measure:end':
          await handleMeasureEnd(socket, message as WSMessage<MeasureEndPayload>, request);
          break;

        case 'template:place':
          await handleTemplatePlace(socket, message as WSMessage<TemplatePlacePayload>, request);
          break;

        case 'template:update':
          await handleTemplateUpdate(socket, message as WSMessage<TemplateUpdatePayload>, request);
          break;

        case 'template:remove':
          await handleTemplateRemove(socket, message as WSMessage<TemplateRemovePayload>, request);
          break;

        case 'drawing:create':
          await handleDrawingCreate(socket, message as WSMessage<DrawingCreatePayload>, request);
          break;

        case 'drawing:update':
          await handleDrawingUpdate(socket, message as WSMessage<DrawingUpdatePayload>, request);
          break;

        case 'drawing:delete':
          await handleDrawingDelete(socket, message as WSMessage<DrawingDeletePayload>, request);
          break;

        case 'drawing:stream':
          await handleDrawingStream(socket, message as WSMessage<DrawingStreamPayload>, request);
          break;

        case 'tile:add':
          await handleTileAdd(socket, message as WSMessage<TileAddPayload>, request);
          break;

        case 'tile:update':
          await handleTileUpdate(socket, message as WSMessage<TileUpdatePayload>, request);
          break;

        case 'tile:remove':
          await handleTileRemove(socket, message as WSMessage<TileRemovePayload>, request);
          break;

        case 'region:add':
          await handleRegionAdd(socket, message as WSMessage<RegionAddPayload>, request);
          break;

        case 'region:update':
          await handleRegionUpdate(socket, message as WSMessage<RegionUpdatePayload>, request);
          break;

        case 'region:remove':
          await handleRegionRemove(socket, message as WSMessage<RegionRemovePayload>, request);
          break;

        case 'pin:add':
          await handlePinAdd(socket, message as WSMessage<PinAddPayload>, request);
          break;

        case 'pin:update':
          await handlePinUpdate(socket, message as WSMessage<PinUpdatePayload>, request);
          break;

        case 'pin:remove':
          await handlePinRemove(socket, message as WSMessage<PinRemovePayload>, request);
          break;

        case 'pin:click':
          await handlePinClick(socket, message as WSMessage<PinClickPayload>, request);
          break;

        case 'compendium:create':
          await handleCompendiumCreate(socket, message as WSMessage<CompendiumCreatePayload>, request);
          break;

        case 'compendium:update':
          await handleCompendiumUpdate(socket, message as WSMessage<CompendiumUpdatePayload>, request);
          break;

        case 'compendium:delete':
          await handleCompendiumDelete(socket, message as WSMessage<CompendiumDeletePayload>, request);
          break;

        case 'compendium:entry-create':
          await handleCompendiumEntryCreate(socket, message as WSMessage<CompendiumEntryCreatePayload>, request);
          break;

        case 'compendium:entry-update':
          await handleCompendiumEntryUpdate(socket, message as WSMessage<CompendiumEntryUpdatePayload>, request);
          break;

        case 'compendium:entry-delete':
          await handleCompendiumEntryDelete(socket, message as WSMessage<CompendiumEntryDeletePayload>, request);
          break;

        default:
          request.log.warn({ type: message.type }, 'Unknown message type');
          sendMessage(socket, 'error', { message: 'Unknown message type' });
      }
    } catch (error) {
      request.log.error({ error }, 'Error processing WebSocket message');
      sendMessage(socket, 'error', { message: 'Invalid message format' });
    }
  });

  // Handle connection close
  socket.on('close', () => {
    request.log.info(`WebSocket client disconnected: ${clientId}`);

    // Clean up: remove player from their room
    const campaignId = roomManager.getRoomForSocket(socket);
    if (campaignId) {
      const playerInfo = roomManager.getPlayerInfo(socket);
      roomManager.leave(socket);

      // Notify other players
      if (playerInfo) {
        const payload: CampaignPlayerLeftPayload = { userId: playerInfo.userId };
        roomManager.broadcast(campaignId, {
          type: 'campaign:player-left',
          payload,
          timestamp: Date.now(),
        });
      }
    }
  });

  // Handle errors
  socket.on('error', (error: Error) => {
    request.log.error({ error }, 'WebSocket error');
  });

  // Send welcome message
  sendMessage(socket, 'campaign:state', { clientId });
}

/**
 * Helper function to send type-safe WebSocket messages
 */
function sendMessage<T>(
  socket: WebSocket,
  type: WSMessageType,
  payload: T
): void {
  const message: WSMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
  };
  socket.send(JSON.stringify(message));
}

/**
 * Handle ping message - respond with pong
 */
function handlePing(socket: WebSocket): void {
  sendMessage(socket, 'pong', {});
}

/**
 * Handle campaign join request
 */
async function handleCampaignJoin(
  socket: WebSocket,
  message: WSMessage<CampaignJoinPayload>,
  request: FastifyRequest
): Promise<void> {
  const { campaignId, token } = message.payload;

  request.log.info({ campaignId }, 'Client joining campaign session');

  // Validate session token
  const user = await validateSession(request.server, token);

  if (!user) {
    const errorPayload: ErrorPayload = {
      message: 'Invalid or expired session',
      code: 'UNAUTHORIZED',
    };
    sendMessage(socket, 'error', errorPayload);
    return;
  }

  // Add player to room
  roomManager.join(campaignId, socket, {
    userId: user.userId,
    username: user.username,
  });

  // Get current players in room
  const players = roomManager.getPlayersInRoom(campaignId);

  // Send player list to the joining player
  const playersPayload: CampaignPlayersPayload = { players };
  sendMessage(socket, 'campaign:players', playersPayload);

  // Notify other players that someone joined
  const joinedPayload: CampaignPlayerJoinedPayload = {
    player: {
      userId: user.userId,
      username: user.username,
    },
  };

  roomManager.broadcast(
    campaignId,
    {
      type: 'campaign:player-joined',
      payload: joinedPayload,
      timestamp: Date.now(),
    },
    socket // Exclude the joining player
  );

  request.log.info({
    campaignId,
    userId: user.userId,
    playerCount: players.length,
  }, 'Player joined campaign session');
}

/**
 * Handle campaign leave request
 */
function handleCampaignLeave(
  socket: WebSocket,
  message: WSMessage<CampaignLeavePayload>,
  request: FastifyRequest
): void {
  const { campaignId } = message.payload;

  request.log.info({ campaignId }, 'Client leaving campaign session');

  // Get player info before removing
  const playerInfo = roomManager.getPlayerInfo(socket);

  // Remove player from room
  roomManager.leave(socket);

  // Notify other players
  if (playerInfo) {
    const payload: CampaignPlayerLeftPayload = { userId: playerInfo.userId };
    roomManager.broadcast(campaignId, {
      type: 'campaign:player-left',
      payload,
      timestamp: Date.now(),
    });

    request.log.info({
      campaignId,
      userId: playerInfo.userId,
    }, 'Player left campaign session');
  }
}

/**
 * Handle token move action
 */
async function handleTokenMove(
  socket: WebSocket,
  message: WSMessage<TokenMovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Token move');

  const { tokenId, x, y } = message.payload;

  // Get the campaign room for this socket
  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Update token position in database
    const updatedTokens = await request.server.db
      .update(tokens)
      .set({ x, y })
      .where(eq(tokens.id, tokenId))
      .returning();

    if (updatedTokens.length === 0) {
      sendMessage(socket, 'error', { message: 'Token not found' });
      return;
    }

    // Broadcast to all players in the campaign (including sender for confirmation)
    roomManager.broadcast(campaignId, {
      type: 'token:move',
      payload: { tokenId, x, y },
      timestamp: Date.now(),
    });
  } catch (error) {
    request.log.error({ error, tokenId }, 'Error updating token position');
    sendMessage(socket, 'error', { message: 'Failed to update token position' });
  }
}

/**
 * Handle token add action
 */
async function handleTokenAdd(
  socket: WebSocket,
  message: WSMessage<TokenAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Token add');

  const campaignId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!campaignId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    const {
      name,
      x,
      y,
      width = 1,
      height = 1,
      imageUrl = null,
      visible = true,
      data = {},
      sceneId,
      actorId = null,
      elevation = 0,
      rotation = 0,
      locked = false,
      vision = false,
      visionRange = 0,
      bars = {},
      lightBright = 0,
      lightDim = 0,
      lightColor = null,
      lightAngle = 360
    } = message.payload;

    // Validate that sceneId is provided
    if (!sceneId) {
      sendMessage(socket, 'error', { message: 'sceneId is required to add a token' });
      return;
    }

    // Create token in database
    const newTokens = await request.server.db
      .insert(tokens)
      .values({
        sceneId,
        actorId,
        name,
        x,
        y,
        width,
        height,
        elevation,
        rotation,
        locked,
        imageUrl,
        visible,
        vision,
        visionRange,
        bars,
        lightBright,
        lightDim,
        lightColor,
        lightAngle,
        data,
        ownerId: playerInfo.userId
      })
      .returning();

    const newToken = newTokens[0];

    // Convert token to match Token interface
    const tokenPayload: Token = {
      id: newToken.id,
      sceneId: newToken.sceneId,
      actorId: newToken.actorId,
      name: newToken.name,
      imageUrl: newToken.imageUrl,
      x: newToken.x,
      y: newToken.y,
      width: newToken.width,
      height: newToken.height,
      elevation: newToken.elevation,
      rotation: newToken.rotation,
      locked: newToken.locked,
      ownerId: newToken.ownerId,
      visible: newToken.visible,
      vision: newToken.vision,
      visionRange: newToken.visionRange,
      bars: newToken.bars as Record<string, unknown>,
      lightBright: newToken.lightBright,
      lightDim: newToken.lightDim,
      lightColor: newToken.lightColor,
      lightAngle: newToken.lightAngle,
      followPathName: newToken.followPathName ?? null,
      pathSpeed: newToken.pathSpeed ?? null,
      data: newToken.data as Record<string, unknown>,
      createdAt: newToken.createdAt,
      updatedAt: newToken.updatedAt
    };

    // Broadcast to all players with full token including ID
    const addedPayload: TokenAddedPayload = { token: tokenPayload };
    roomManager.broadcast(campaignId, {
      type: 'token:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tokenId: newToken.id, sceneId, campaignId }, 'Token created');
  } catch (error) {
    request.log.error({ error }, 'Error creating token');
    sendMessage(socket, 'error', { message: 'Failed to create token' });
  }
}

/**
 * Handle token update action
 */
async function handleTokenUpdate(
  socket: WebSocket,
  message: WSMessage<TokenUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Token update');

  const { tokenId, updates } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Update token in database
    const updatedTokens = await request.server.db
      .update(tokens)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tokens.id, tokenId))
      .returning();

    if (updatedTokens.length === 0) {
      sendMessage(socket, 'error', { message: 'Token not found' });
      return;
    }

    const updatedToken = updatedTokens[0];

    // Convert to Token interface
    const tokenPayload: Token = {
      id: updatedToken.id,
      sceneId: updatedToken.sceneId,
      actorId: updatedToken.actorId,
      name: updatedToken.name,
      imageUrl: updatedToken.imageUrl,
      x: updatedToken.x,
      y: updatedToken.y,
      width: updatedToken.width,
      height: updatedToken.height,
      elevation: updatedToken.elevation,
      rotation: updatedToken.rotation,
      locked: updatedToken.locked,
      ownerId: updatedToken.ownerId,
      visible: updatedToken.visible,
      vision: updatedToken.vision,
      visionRange: updatedToken.visionRange,
      bars: updatedToken.bars as Record<string, unknown>,
      lightBright: updatedToken.lightBright,
      lightDim: updatedToken.lightDim,
      lightColor: updatedToken.lightColor,
      lightAngle: updatedToken.lightAngle,
      followPathName: updatedToken.followPathName ?? null,
      pathSpeed: updatedToken.pathSpeed ?? null,
      data: updatedToken.data as Record<string, unknown>,
      createdAt: updatedToken.createdAt,
      updatedAt: updatedToken.updatedAt,
    };

    // Broadcast to all players
    const updatedPayload: TokenUpdatedPayload = { token: tokenPayload };
    roomManager.broadcast(campaignId, {
      type: 'token:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tokenId, campaignId }, 'Token updated');
  } catch (error) {
    request.log.error({ error, tokenId }, 'Error updating token');
    sendMessage(socket, 'error', { message: 'Failed to update token' });
  }
}

/**
 * Handle token remove action
 */
async function handleTokenRemove(
  socket: WebSocket,
  message: WSMessage<TokenRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Token remove');

  const { tokenId } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Delete token from database
    const deletedTokens = await request.server.db
      .delete(tokens)
      .where(eq(tokens.id, tokenId))
      .returning();

    if (deletedTokens.length === 0) {
      sendMessage(socket, 'error', { message: 'Token not found' });
      return;
    }

    // Broadcast to all players
    const removedPayload: TokenRemovedPayload = { tokenId };
    roomManager.broadcast(campaignId, {
      type: 'token:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tokenId, campaignId }, 'Token removed');
  } catch (error) {
    request.log.error({ error, tokenId }, 'Error removing token');
    sendMessage(socket, 'error', { message: 'Failed to remove token' });
  }
}

/**
 * Handle dice roll request
 */
function handleDiceRoll(
  socket: WebSocket,
  message: WSMessage<DiceRollPayload>,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Dice roll');

  const { notation, label } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!campaignId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Parse and roll dice
    const diceRoll = parseDiceNotation(notation);

    // Convert to WebSocket payload format
    const rolls: DiceRollGroup[] = diceRoll.rolls.map((group: DiceGroup) => {
      let diceStr = `${group.count}d${group.sides}`;

      // Add keep/drop notation
      if (group.keep) {
        if ('highest' in group.keep) {
          diceStr += `kh${group.keep.highest}`;
        } else {
          diceStr += `kl${group.keep.lowest}`;
        }
      } else if (group.drop) {
        if ('highest' in group.drop) {
          diceStr += `dh${group.drop.highest}`;
        } else {
          diceStr += `dl${group.drop.lowest}`;
        }
      }

      // Add exploding notation
      if (group.exploding) {
        diceStr += '!';
      }

      return {
        dice: diceStr,
        results: group.results,
        kept: group.kept,
        subtotal: group.subtotal,
      };
    });

    // Calculate total modifiers
    const groupTotal = diceRoll.rolls.reduce((sum: number, group: DiceGroup) => sum + group.subtotal, 0);
    const modifiers = diceRoll.total - groupTotal;

    const result: DiceResultPayload = {
      notation,
      rolls,
      modifiers,
      total: diceRoll.total,
      breakdown: diceRoll.breakdown,
      label,
      userId: playerInfo.userId,
      username: playerInfo.username,
    };

    request.log.info({
      notation,
      total: result.total,
      breakdown: result.breakdown
    }, 'Dice rolled');

    // Broadcast dice result to all players
    roomManager.broadcast(campaignId, {
      type: 'dice:result',
      payload: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    request.log.error({ error, notation }, 'Error rolling dice');
    sendMessage(socket, 'error', {
      message: error instanceof Error ? error.message : 'Invalid dice notation'
    });
  }
}

/**
 * Handle scene switch request
 */
async function handleSceneSwitch(
  socket: WebSocket,
  message: WSMessage<SceneSwitchPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Scene switch');

  const { sceneId } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Fetch the scene from database
    const [scene] = await request.server.db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      sendMessage(socket, 'error', { message: 'Scene not found' });
      return;
    }

    // Convert to Scene interface
    const scenePayload: Scene = {
      id: scene.id,
      campaignId: scene.campaignId,
      name: scene.name,
      active: scene.active,
      backgroundImage: scene.backgroundImage,
      backgroundWidth: scene.backgroundWidth,
      backgroundHeight: scene.backgroundHeight,
      gridType: scene.gridType,
      gridSize: scene.gridSize,
      gridColor: scene.gridColor,
      gridAlpha: scene.gridAlpha,
      gridVisible: scene.gridVisible,
      gridLineWidth: scene.gridLineWidth,
      gridDistance: scene.gridDistance,
      gridUnits: scene.gridUnits,
      tokenVision: scene.tokenVision,
      fogExploration: scene.fogExploration,
      globalLight: scene.globalLight,
      darkness: scene.darkness,
      initialX: scene.initialX,
      initialY: scene.initialY,
      initialScale: scene.initialScale,
      navOrder: scene.navOrder,
      data: scene.data as Record<string, unknown>,
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt,
    };

    // Broadcast to all players
    const switchedPayload: SceneSwitchedPayload = { scene: scenePayload };
    roomManager.broadcast(campaignId, {
      type: 'scene:switched',
      payload: switchedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ sceneId, campaignId }, 'Scene switched');
  } catch (error) {
    request.log.error({ error, sceneId }, 'Error switching scene');
    sendMessage(socket, 'error', { message: 'Failed to switch scene' });
  }
}

/**
 * Handle scene update request
 */
async function handleSceneUpdate(
  socket: WebSocket,
  message: WSMessage<SceneUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Scene update');

  const { sceneId, updates } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Update scene in database
    const updatedScenes = await request.server.db
      .update(scenes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId))
      .returning();

    if (updatedScenes.length === 0) {
      sendMessage(socket, 'error', { message: 'Scene not found' });
      return;
    }

    const updatedScene = updatedScenes[0];

    // Convert to Scene interface
    const scenePayload: Scene = {
      id: updatedScene.id,
      campaignId: updatedScene.campaignId,
      name: updatedScene.name,
      active: updatedScene.active,
      backgroundImage: updatedScene.backgroundImage,
      backgroundWidth: updatedScene.backgroundWidth,
      backgroundHeight: updatedScene.backgroundHeight,
      gridType: updatedScene.gridType,
      gridSize: updatedScene.gridSize,
      gridColor: updatedScene.gridColor,
      gridAlpha: updatedScene.gridAlpha,
      gridVisible: updatedScene.gridVisible,
      gridLineWidth: updatedScene.gridLineWidth,
      gridDistance: updatedScene.gridDistance,
      gridUnits: updatedScene.gridUnits,
      tokenVision: updatedScene.tokenVision,
      fogExploration: updatedScene.fogExploration,
      globalLight: updatedScene.globalLight,
      darkness: updatedScene.darkness,
      initialX: updatedScene.initialX,
      initialY: updatedScene.initialY,
      initialScale: updatedScene.initialScale,
      navOrder: updatedScene.navOrder,
      data: updatedScene.data as Record<string, unknown>,
      createdAt: updatedScene.createdAt,
      updatedAt: updatedScene.updatedAt,
    };

    // Broadcast to all players
    const updatedPayload: SceneUpdatedPayload = { scene: scenePayload };
    roomManager.broadcast(campaignId, {
      type: 'scene:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ sceneId, campaignId }, 'Scene updated');
  } catch (error) {
    request.log.error({ error, sceneId }, 'Error updating scene');
    sendMessage(socket, 'error', { message: 'Failed to update scene' });
  }
}

/**
 * Handle wall add request
 */
async function handleWallAdd(
  socket: WebSocket,
  message: WSMessage<WallAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Wall add');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    const {
      sceneId,
      x1,
      y1,
      x2,
      y2,
      wallType = 'wall',
      move = 'block',
      sense = 'block',
      sound = 'block',
      door = 'none',
      doorState = 'closed',
      snapToGrid = false,
      data = {},
      wallShape = 'straight',
      controlPoints = [],
    } = message.payload;

    // Create wall in database
    const newWalls = await request.server.db
      .insert(walls)
      .values({
        sceneId,
        x1,
        y1,
        x2,
        y2,
        wallType,
        move,
        sense,
        sound,
        wallShape,
        controlPoints,
        door,
        doorState,
        snapToGrid,
        data,
      })
      .returning();

    const newWall = newWalls[0];

    // Convert to Wall interface
    const wallPayload: Wall = {
      id: newWall.id,
      sceneId: newWall.sceneId,
      x1: newWall.x1,
      y1: newWall.y1,
      x2: newWall.x2,
      y2: newWall.y2,
      wallShape: newWall.wallShape as 'straight' | 'curved',
      controlPoints: newWall.controlPoints as Array<{ x: number; y: number }> || [],
      wallType: newWall.wallType,
      move: newWall.move,
      sense: newWall.sense,
      sound: newWall.sound,
      door: newWall.door,
      doorState: newWall.doorState,
      snapToGrid: newWall.snapToGrid,
      data: newWall.data as Record<string, unknown>,
      createdAt: newWall.createdAt,
    };

    // Broadcast to all players
    const addedPayload: WallAddedPayload = { wall: wallPayload };
    roomManager.broadcast(campaignId, {
      type: 'wall:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ wallId: newWall.id, sceneId, campaignId }, 'Wall created');
  } catch (error) {
    request.log.error({ error }, 'Error creating wall');
    sendMessage(socket, 'error', { message: 'Failed to create wall' });
  }
}

/**
 * Handle wall update request
 */
async function handleWallUpdate(
  socket: WebSocket,
  message: WSMessage<WallUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Wall update');

  const { wallId, updates } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Update wall in database
    const updatedWalls = await request.server.db
      .update(walls)
      .set(updates)
      .where(eq(walls.id, wallId))
      .returning();

    if (updatedWalls.length === 0) {
      sendMessage(socket, 'error', { message: 'Wall not found' });
      return;
    }

    const updatedWall = updatedWalls[0];

    // Convert to Wall interface
    const wallPayload: Wall = {
      id: updatedWall.id,
      sceneId: updatedWall.sceneId,
      x1: updatedWall.x1,
      y1: updatedWall.y1,
      x2: updatedWall.x2,
      y2: updatedWall.y2,
      wallShape: updatedWall.wallShape as 'straight' | 'curved',
      controlPoints: updatedWall.controlPoints as Array<{ x: number; y: number }> || [],
      wallType: updatedWall.wallType,
      move: updatedWall.move,
      sense: updatedWall.sense,
      sound: updatedWall.sound,
      door: updatedWall.door,
      doorState: updatedWall.doorState,
      snapToGrid: updatedWall.snapToGrid,
      data: updatedWall.data as Record<string, unknown>,
      createdAt: updatedWall.createdAt,
    };

    // Broadcast to all players
    const updatedPayload: WallUpdatedPayload = { wall: wallPayload };
    roomManager.broadcast(campaignId, {
      type: 'wall:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ wallId, campaignId }, 'Wall updated');
  } catch (error) {
    request.log.error({ error, wallId }, 'Error updating wall');
    sendMessage(socket, 'error', { message: 'Failed to update wall' });
  }
}

/**
 * Handle wall remove request
 */
async function handleWallRemove(
  socket: WebSocket,
  message: WSMessage<WallRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Wall remove');

  const { wallId } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Delete wall from database
    const deletedWalls = await request.server.db
      .delete(walls)
      .where(eq(walls.id, wallId))
      .returning();

    if (deletedWalls.length === 0) {
      sendMessage(socket, 'error', { message: 'Wall not found' });
      return;
    }

    // Broadcast to all players
    const removedPayload: WallRemovedPayload = { wallId };
    roomManager.broadcast(campaignId, {
      type: 'wall:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ wallId, campaignId }, 'Wall removed');
  } catch (error) {
    request.log.error({ error, wallId }, 'Error removing wall');
    sendMessage(socket, 'error', { message: 'Failed to remove wall' });
  }
}

/**
 * Handle light add request
 */
async function handleLightAdd(
  socket: WebSocket,
  message: WSMessage<LightAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Light add');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    const {
      sceneId,
      x,
      y,
      rotation = 0,
      bright = 20,
      dim = 40,
      angle = 360,
      color = '#ffffff',
      alpha = 0.5,
      animationType = null,
      animationSpeed = 5,
      animationIntensity = 5,
      walls = true,
      vision = false,
      data = {},
    } = message.payload;

    // Create light in database
    const newLights = await request.server.db
      .insert(ambientLights)
      .values({
        sceneId,
        x,
        y,
        rotation,
        bright,
        dim,
        angle,
        color,
        alpha,
        animationType,
        animationSpeed,
        animationIntensity,
        walls,
        vision,
        data,
      })
      .returning();

    const newLight = newLights[0];

    // Convert to AmbientLight interface
    const lightPayload: AmbientLight = {
      id: newLight.id,
      sceneId: newLight.sceneId,
      x: newLight.x,
      y: newLight.y,
      rotation: newLight.rotation,
      bright: newLight.bright,
      dim: newLight.dim,
      angle: newLight.angle,
      color: newLight.color,
      alpha: newLight.alpha,
      animationType: newLight.animationType,
      animationSpeed: newLight.animationSpeed,
      animationIntensity: newLight.animationIntensity,
      animationReverse: newLight.animationReverse ?? false,
      walls: newLight.walls,
      vision: newLight.vision,
      snapToGrid: newLight.snapToGrid ?? false,
      negative: newLight.negative ?? false,
      priority: newLight.priority ?? 0,
      luminosity: newLight.luminosity ?? 0.5,
      saturation: newLight.saturation ?? 0,
      contrast: newLight.contrast ?? 0,
      shadows: newLight.shadows ?? 0,
      attenuation: newLight.attenuation ?? 0.5,
      coloration: newLight.coloration ?? 1,
      darknessMin: newLight.darknessMin ?? 0,
      darknessMax: newLight.darknessMax ?? 1,
      hidden: newLight.hidden ?? false,
      elevation: newLight.elevation ?? 0,
      followPathName: newLight.followPathName ?? null,
      pathSpeed: newLight.pathSpeed ?? null,
      data: newLight.data as Record<string, unknown>,
      createdAt: newLight.createdAt,
    };

    // Broadcast to all players
    const addedPayload: LightAddedPayload = { light: lightPayload };
    roomManager.broadcast(campaignId, {
      type: 'light:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ lightId: newLight.id, sceneId, campaignId }, 'Light created');
  } catch (error) {
    request.log.error({ error }, 'Error creating light');
    sendMessage(socket, 'error', { message: 'Failed to create light' });
  }
}

/**
 * Handle light update request
 */
async function handleLightUpdate(
  socket: WebSocket,
  message: WSMessage<LightUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Light update');

  const { lightId, updates } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Update light in database
    const updatedLights = await request.server.db
      .update(ambientLights)
      .set(updates)
      .where(eq(ambientLights.id, lightId))
      .returning();

    if (updatedLights.length === 0) {
      sendMessage(socket, 'error', { message: 'Light not found' });
      return;
    }

    const updatedLight = updatedLights[0];

    // Convert to AmbientLight interface
    const lightPayload: AmbientLight = {
      id: updatedLight.id,
      sceneId: updatedLight.sceneId,
      x: updatedLight.x,
      y: updatedLight.y,
      rotation: updatedLight.rotation,
      bright: updatedLight.bright,
      dim: updatedLight.dim,
      angle: updatedLight.angle,
      color: updatedLight.color,
      alpha: updatedLight.alpha,
      animationType: updatedLight.animationType,
      animationSpeed: updatedLight.animationSpeed,
      animationIntensity: updatedLight.animationIntensity,
      animationReverse: updatedLight.animationReverse ?? false,
      walls: updatedLight.walls,
      vision: updatedLight.vision,
      snapToGrid: updatedLight.snapToGrid ?? false,
      negative: updatedLight.negative ?? false,
      priority: updatedLight.priority ?? 0,
      luminosity: updatedLight.luminosity ?? 0.5,
      saturation: updatedLight.saturation ?? 0,
      contrast: updatedLight.contrast ?? 0,
      shadows: updatedLight.shadows ?? 0,
      attenuation: updatedLight.attenuation ?? 0.5,
      coloration: updatedLight.coloration ?? 1,
      darknessMin: updatedLight.darknessMin ?? 0,
      darknessMax: updatedLight.darknessMax ?? 1,
      hidden: updatedLight.hidden ?? false,
      elevation: updatedLight.elevation ?? 0,
      followPathName: updatedLight.followPathName ?? null,
      pathSpeed: updatedLight.pathSpeed ?? null,
      data: updatedLight.data as Record<string, unknown>,
      createdAt: updatedLight.createdAt,
    };

    // Broadcast to all players
    const updatedPayload: LightUpdatedPayload = { light: lightPayload };
    roomManager.broadcast(campaignId, {
      type: 'light:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ lightId, campaignId }, 'Light updated');
  } catch (error) {
    request.log.error({ error, lightId }, 'Error updating light');
    sendMessage(socket, 'error', { message: 'Failed to update light' });
  }
}

/**
 * Handle light remove request
 */
async function handleLightRemove(
  socket: WebSocket,
  message: WSMessage<LightRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Light remove');

  const { lightId } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Delete light from database
    const deletedLights = await request.server.db
      .delete(ambientLights)
      .where(eq(ambientLights.id, lightId))
      .returning();

    if (deletedLights.length === 0) {
      sendMessage(socket, 'error', { message: 'Light not found' });
      return;
    }

    // Broadcast to all players
    const removedPayload: LightRemovedPayload = { lightId };
    roomManager.broadcast(campaignId, {
      type: 'light:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ lightId, campaignId }, 'Light removed');
  } catch (error) {
    request.log.error({ error, lightId }, 'Error removing light');
    sendMessage(socket, 'error', { message: 'Failed to remove light' });
  }
}

/**
 * Handle path:add message (bulk operation - creates points + settings)
 */
async function handlePathAdd(
  socket: WebSocket,
  message: WSMessage<PathAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Path add (bulk)');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    const {
      sceneId,
      pathName,
      points,
      speed = 50,
      loop = true,
      visible = true,
      color = '#00ff00',
      assignedObjectId,
      assignedObjectType,
    } = message.payload;

    // Validate points
    if (!points || !Array.isArray(points) || points.length < 2) {
      sendMessage(socket, 'error', { message: 'Path must have at least 2 points' });
      return;
    }

    // Create path points with color and visible on each point
    const pointValues = points.map((point, index) => ({
      sceneId,
      pathName,
      pathIndex: index,
      x: point.x,
      y: point.y,
      color,
      visible,
      data: {},
    }));

    const createdPoints = await request.server.db
      .insert(pathPoints)
      .values(pointValues)
      .returning();

    // Format assembled path (color and visible from first point)
    const firstPoint = createdPoints[0];
    const assembledPath = {
      pathName,
      sceneId,
      points: createdPoints.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        pathIndex: p.pathIndex,
      })),
      color: firstPoint?.color ?? '#ffff00',
      visible: firstPoint?.visible ?? true,
    };

    // Broadcast to all players
    const addedPayload: PathAddedPayload = { assembledPath };
    roomManager.broadcast(campaignId, {
      type: 'path:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pathName, sceneId, campaignId }, 'Path added (bulk)');
  } catch (error) {
    request.log.error({ error, sceneId: message.payload.sceneId }, 'Error adding path');
    sendMessage(socket, 'error', { message: 'Failed to add path' });
  }
}

/**
 * Handle path:update message (bulk operation - updates points and/or settings)
 */
async function handlePathUpdate(
  socket: WebSocket,
  message: WSMessage<PathUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Path update (bulk)');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    const { sceneId, pathName, points, speed, loop, assignedObjectId, assignedObjectType, visible, color } = message.payload;

    // Update points if provided
    if (points !== undefined) {
      if (!Array.isArray(points) || points.length < 2) {
        sendMessage(socket, 'error', { message: 'Path must have at least 2 points' });
        return;
      }

      // Delete existing points
      await request.server.db
        .delete(pathPoints)
        .where(and(eq(pathPoints.sceneId, sceneId), eq(pathPoints.pathName, pathName)));

      // Create new points with color and visible
      const pointValues = points.map((point, index) => ({
        sceneId,
        pathName,
        pathIndex: index,
        x: point.x,
        y: point.y,
        color: color ?? '#ffff00',
        visible: visible ?? true,
        data: {},
      }));

      await request.server.db
        .insert(pathPoints)
        .values(pointValues);
    }

    // Update color/visible on all points if provided
    if (visible !== undefined || color !== undefined) {
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (visible !== undefined) updateData.visible = visible;
      if (color !== undefined) updateData.color = color;

      await request.server.db
        .update(pathPoints)
        .set(updateData)
        .where(and(eq(pathPoints.sceneId, sceneId), eq(pathPoints.pathName, pathName)));
    }

    // Fetch updated data
    const updatedPoints = await request.server.db
      .select()
      .from(pathPoints)
      .where(and(eq(pathPoints.sceneId, sceneId), eq(pathPoints.pathName, pathName)))
      .orderBy(asc(pathPoints.pathIndex));

    // Format assembled path (color and visible from first point)
    const firstPoint = updatedPoints[0];
    const assembledPath = {
      pathName,
      sceneId,
      points: updatedPoints.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        pathIndex: p.pathIndex,
      })),
      color: firstPoint?.color ?? '#ffff00',
      visible: firstPoint?.visible ?? true,
    };

    // Broadcast to all players
    const updatedPayload: PathUpdatedPayload = { assembledPath };
    roomManager.broadcast(campaignId, {
      type: 'path:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pathName, sceneId, campaignId }, 'Path updated (bulk)');
  } catch (error) {
    request.log.error({ error, sceneId: message.payload.sceneId, pathName: message.payload.pathName }, 'Error updating path');
    sendMessage(socket, 'error', { message: 'Failed to update path' });
  }
}

/**
 * Handle path:remove message (bulk operation - removes points and settings)
 */
async function handlePathRemove(
  socket: WebSocket,
  message: WSMessage<PathRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Path remove (bulk)');

  const { sceneId, pathName } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Delete all path points for this path
    await request.server.db
      .delete(pathPoints)
      .where(and(eq(pathPoints.sceneId, sceneId), eq(pathPoints.pathName, pathName)));

    // Broadcast to all players
    const removedPayload: PathRemovedPayload = { sceneId, pathName };
    roomManager.broadcast(campaignId, {
      type: 'path:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pathName, sceneId, campaignId }, 'Path removed (bulk)');
  } catch (error) {
    request.log.error({ error, sceneId, pathName }, 'Error removing path');
    sendMessage(socket, 'error', { message: 'Failed to remove path' });
  }
}

/**
 * Handle pathPoint:add message
 */
async function handlePathPointAdd(
  socket: WebSocket,
  message: WSMessage<PathPointAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'PathPoint add');

  const { sceneId, pathName, pathIndex, x, y, color, visible, data } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Create path point in database
    const newPoints = await request.server.db
      .insert(pathPoints)
      .values({
        sceneId,
        pathName,
        pathIndex,
        x,
        y,
        color: color ?? '#ffff00',
        visible: visible ?? true,
        data: data ?? {},
      })
      .returning();

    const newPoint = newPoints[0];

    // Format path point
    const formattedPoint: PathPoint = {
      id: newPoint.id,
      sceneId: newPoint.sceneId,
      pathName: newPoint.pathName,
      pathIndex: newPoint.pathIndex,
      x: newPoint.x,
      y: newPoint.y,
      color: newPoint.color,
      visible: newPoint.visible,
      data: newPoint.data as Record<string, unknown>,
      createdAt: newPoint.createdAt,
      updatedAt: newPoint.updatedAt,
    };

    // Broadcast to all players
    const addedPayload: PathPointAddedPayload = { pathPoint: formattedPoint };
    roomManager.broadcast(campaignId, {
      type: 'pathPoint:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pathPointId: newPoint.id, pathName, campaignId }, 'PathPoint added');
  } catch (error) {
    request.log.error({ error, pathName }, 'Error adding path point');
    sendMessage(socket, 'error', { message: 'Failed to add path point' });
  }
}

/**
 * Handle pathPoint:update message
 */
async function handlePathPointUpdate(
  socket: WebSocket,
  message: WSMessage<PathPointUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'PathPoint update');

  const { pathPointId, updates } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.pathName !== undefined) {
      updateData.pathName = updates.pathName;
    }
    if (updates.pathIndex !== undefined) {
      updateData.pathIndex = updates.pathIndex;
    }
    if (updates.x !== undefined) {
      updateData.x = updates.x;
    }
    if (updates.y !== undefined) {
      updateData.y = updates.y;
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }
    if (updates.visible !== undefined) {
      updateData.visible = updates.visible;
    }
    if (updates.data !== undefined) {
      updateData.data = updates.data;
    }

    // Update path point in database
    const updatedPoints = await request.server.db
      .update(pathPoints)
      .set(updateData)
      .where(eq(pathPoints.id, pathPointId))
      .returning();

    if (updatedPoints.length === 0) {
      sendMessage(socket, 'error', { message: 'Path point not found' });
      return;
    }

    const updatedPoint = updatedPoints[0];

    // Format path point
    const formattedPoint: PathPoint = {
      id: updatedPoint.id,
      sceneId: updatedPoint.sceneId,
      pathName: updatedPoint.pathName,
      pathIndex: updatedPoint.pathIndex,
      x: updatedPoint.x,
      y: updatedPoint.y,
      color: updatedPoint.color,
      visible: updatedPoint.visible,
      data: updatedPoint.data as Record<string, unknown>,
      createdAt: updatedPoint.createdAt,
      updatedAt: updatedPoint.updatedAt,
    };

    // Broadcast to all players
    const updatedPayload: PathPointUpdatedPayload = { pathPoint: formattedPoint };
    roomManager.broadcast(campaignId, {
      type: 'pathPoint:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pathPointId, campaignId }, 'PathPoint updated');
  } catch (error) {
    request.log.error({ error, pathPointId }, 'Error updating path point');
    sendMessage(socket, 'error', { message: 'Failed to update path point' });
  }
}

/**
 * Handle pathPoint:remove message
 */
async function handlePathPointRemove(
  socket: WebSocket,
  message: WSMessage<PathPointRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'PathPoint remove');

  const { pathPointId } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Delete path point from database
    const deletedPoints = await request.server.db
      .delete(pathPoints)
      .where(eq(pathPoints.id, pathPointId))
      .returning();

    if (deletedPoints.length === 0) {
      sendMessage(socket, 'error', { message: 'Path point not found' });
      return;
    }

    // Broadcast to all players
    const removedPayload: PathPointRemovedPayload = { pathPointId };
    roomManager.broadcast(campaignId, {
      type: 'pathPoint:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pathPointId, campaignId }, 'PathPoint removed');
  } catch (error) {
    request.log.error({ error, pathPointId }, 'Error removing path point');
    sendMessage(socket, 'error', { message: 'Failed to remove path point' });
  }
}

