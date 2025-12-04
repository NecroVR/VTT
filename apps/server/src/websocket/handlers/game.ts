import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  WSMessageType,
  Token,
  Scene,
  Wall,
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
  GameJoinPayload,
  GameLeavePayload,
  GamePlayersPayload,
  GamePlayerJoinedPayload,
  GamePlayerLeftPayload,
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
  ErrorPayload
} from '@vtt/shared';
import { parseDiceNotation, type DiceGroup } from '@vtt/shared/dice';
import { roomManager } from '../rooms';
import { validateSession, extractSessionToken } from '../auth';
import { tokens, scenes, walls } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Game session WebSocket handler
 * Manages real-time communication for game sessions
 */
export async function handleGameWebSocket(
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

        case 'game:join':
          await handleGameJoin(socket, message as WSMessage<GameJoinPayload>, request);
          break;

        case 'game:leave':
          handleGameLeave(socket, message as WSMessage<GameLeavePayload>, request);
          break;

        case 'token:move':
          await handleTokenMove(socket, message as WSMessage<TokenMovePayload>, request);
          break;

        case 'token:add':
          await handleTokenAdd(socket, message as WSMessage<TokenAddPayload>, request);
          break;

        case 'token:remove':
          await handleTokenRemove(socket, message as WSMessage<TokenRemovePayload>, request);
          break;

        case 'dice:roll':
          handleDiceRoll(socket, message as WSMessage<DiceRollPayload>, request);
          break;

        case 'chat:message':
          handleChatMessage(socket, message as WSMessage<ChatMessagePayload>, request);
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
    const gameId = roomManager.getRoomForSocket(socket);
    if (gameId) {
      const playerInfo = roomManager.getPlayerInfo(socket);
      roomManager.leave(socket);

      // Notify other players
      if (playerInfo) {
        const payload: GamePlayerLeftPayload = { userId: playerInfo.userId };
        roomManager.broadcast(gameId, {
          type: 'game:player-left',
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
  sendMessage(socket, 'game:state', { clientId });
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
 * Handle game join request
 */
async function handleGameJoin(
  socket: WebSocket,
  message: WSMessage<GameJoinPayload>,
  request: FastifyRequest
): Promise<void> {
  const { gameId, token } = message.payload;

  request.log.info({ gameId }, 'Client joining game session');

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
  roomManager.join(gameId, socket, {
    userId: user.userId,
    username: user.username,
  });

  // Get current players in room
  const players = roomManager.getPlayersInRoom(gameId);

  // Send player list to the joining player
  const playersPayload: GamePlayersPayload = { players };
  sendMessage(socket, 'game:players', playersPayload);

  // Notify other players that someone joined
  const joinedPayload: GamePlayerJoinedPayload = {
    player: {
      userId: user.userId,
      username: user.username,
    },
  };

  roomManager.broadcast(
    gameId,
    {
      type: 'game:player-joined',
      payload: joinedPayload,
      timestamp: Date.now(),
    },
    socket // Exclude the joining player
  );

  request.log.info({
    gameId,
    userId: user.userId,
    playerCount: players.length,
  }, 'Player joined game session');
}

/**
 * Handle game leave request
 */
function handleGameLeave(
  socket: WebSocket,
  message: WSMessage<GameLeavePayload>,
  request: FastifyRequest
): void {
  const { gameId } = message.payload;

  request.log.info({ gameId }, 'Client leaving game session');

  // Get player info before removing
  const playerInfo = roomManager.getPlayerInfo(socket);

  // Remove player from room
  roomManager.leave(socket);

  // Notify other players
  if (playerInfo) {
    const payload: GamePlayerLeftPayload = { userId: playerInfo.userId };
    roomManager.broadcast(gameId, {
      type: 'game:player-left',
      payload,
      timestamp: Date.now(),
    });

    request.log.info({
      gameId,
      userId: playerInfo.userId,
    }, 'Player left game session');
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

  // Get the game room for this socket
  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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

    // Broadcast to all players in the game (including sender for confirmation)
    roomManager.broadcast(gameId, {
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

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
      data: newToken.data as Record<string, unknown>,
      createdAt: newToken.createdAt,
      updatedAt: newToken.updatedAt
    };

    // Broadcast to all players with full token including ID
    const addedPayload: TokenAddedPayload = { token: tokenPayload };
    roomManager.broadcast(gameId, {
      type: 'token:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tokenId: newToken.id, sceneId, gameId }, 'Token created');
  } catch (error) {
    request.log.error({ error }, 'Error creating token');
    sendMessage(socket, 'error', { message: 'Failed to create token' });
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

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
    roomManager.broadcast(gameId, {
      type: 'token:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tokenId, gameId }, 'Token removed');
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

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
    roomManager.broadcast(gameId, {
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
 * Handle chat message
 */
function handleChatMessage(
  socket: WebSocket,
  message: WSMessage<ChatMessagePayload>,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Chat message');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  // Ensure the message has the correct user info
  const chatPayload: ChatMessagePayload = {
    text: message.payload.text,
    userId: playerInfo.userId,
    username: playerInfo.username,
  };

  // Broadcast to all players
  roomManager.broadcast(gameId, {
    type: 'chat:message',
    payload: chatPayload,
    timestamp: Date.now(),
  });
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

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
      gameId: scene.gameId,
      name: scene.name,
      active: scene.active,
      backgroundImage: scene.backgroundImage,
      backgroundWidth: scene.backgroundWidth,
      backgroundHeight: scene.backgroundHeight,
      gridType: scene.gridType,
      gridSize: scene.gridSize,
      gridColor: scene.gridColor,
      gridAlpha: scene.gridAlpha,
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
    roomManager.broadcast(gameId, {
      type: 'scene:switched',
      payload: switchedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ sceneId, gameId }, 'Scene switched');
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

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
      gameId: updatedScene.gameId,
      name: updatedScene.name,
      active: updatedScene.active,
      backgroundImage: updatedScene.backgroundImage,
      backgroundWidth: updatedScene.backgroundWidth,
      backgroundHeight: updatedScene.backgroundHeight,
      gridType: updatedScene.gridType,
      gridSize: updatedScene.gridSize,
      gridColor: updatedScene.gridColor,
      gridAlpha: updatedScene.gridAlpha,
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
    roomManager.broadcast(gameId, {
      type: 'scene:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ sceneId, gameId }, 'Scene updated');
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

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
      data = {},
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
        door,
        doorState,
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
      wallType: newWall.wallType,
      move: newWall.move,
      sense: newWall.sense,
      sound: newWall.sound,
      door: newWall.door,
      doorState: newWall.doorState,
      data: newWall.data as Record<string, unknown>,
      createdAt: newWall.createdAt,
    };

    // Broadcast to all players
    const addedPayload: WallAddedPayload = { wall: wallPayload };
    roomManager.broadcast(gameId, {
      type: 'wall:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ wallId: newWall.id, sceneId, gameId }, 'Wall created');
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

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
      wallType: updatedWall.wallType,
      move: updatedWall.move,
      sense: updatedWall.sense,
      sound: updatedWall.sound,
      door: updatedWall.door,
      doorState: updatedWall.doorState,
      data: updatedWall.data as Record<string, unknown>,
      createdAt: updatedWall.createdAt,
    };

    // Broadcast to all players
    const updatedPayload: WallUpdatedPayload = { wall: wallPayload };
    roomManager.broadcast(gameId, {
      type: 'wall:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ wallId, gameId }, 'Wall updated');
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

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
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
    roomManager.broadcast(gameId, {
      type: 'wall:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ wallId, gameId }, 'Wall removed');
  } catch (error) {
    request.log.error({ error, wallId }, 'Error removing wall');
    sendMessage(socket, 'error', { message: 'Failed to remove wall' });
  }
}
