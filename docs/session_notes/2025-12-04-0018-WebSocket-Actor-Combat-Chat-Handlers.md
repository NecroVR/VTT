# Session Notes: WebSocket Actor, Combat, and Chat Handlers

**Date**: 2025-12-04
**Session ID**: 0018
**Topic**: Real-Time Synchronization for Actors, Combat, and Chat

---

## Overview

Implemented comprehensive WebSocket handlers to enable real-time synchronization of actors, combat encounters, and chat messages across all connected clients in a VTT game session. This completes the core real-time features needed for multiplayer gameplay.

---

## Objectives

- [x] Extend WebSocket message types in shared package
- [x] Create actor WebSocket handler with CRUD operations
- [x] Create combat WebSocket handler with turn tracking
- [x] Create chat WebSocket handler with whisper support
- [x] Integrate handlers into main WebSocket system
- [x] Verify build success with no TypeScript errors

---

## Implementation Details

### 1. WebSocket Message Types Extension

**File**: `packages/shared/src/types/websocket.ts`

Added new message types to `WSMessageType`:
- **Actor Events**: `actor:create`, `actor:created`, `actor:update`, `actor:updated`, `actor:delete`, `actor:deleted`
- **Combat Events**: `combat:start`, `combat:started`, `combat:end`, `combat:ended`, `combat:update`, `combat:updated`
- **Combatant Events**: `combatant:add`, `combatant:added`, `combatant:update`, `combatant:updated`, `combatant:remove`, `combatant:removed`
- **Combat Turn Events**: `combat:next-turn`, `combat:turn-changed`
- **Chat Events**: `chat:message`, `chat:delete`, `chat:deleted`, `chat:whisper`

Added 20+ new payload interfaces for type-safe message handling.

### 2. Actor WebSocket Handler

**File**: `apps/server/src/websocket/handlers/actors.ts`

**Features**:
- `handleActorCreate`: Creates new actors and broadcasts to all players
- `handleActorUpdate`: Updates actor properties (attributes, abilities, etc.)
- `handleActorDelete`: Removes actors and notifies all clients

**Key Characteristics**:
- Validates user is in a game room before processing
- Persists all changes to PostgreSQL database
- Broadcasts updates to entire room using `roomManager`
- Includes proper error handling and logging

### 3. Combat WebSocket Handler

**File**: `apps/server/src/websocket/handlers/combat.ts`

**Features**:
- `handleCombatStart`: Initiates combat encounter with optional initial combatants
- `handleCombatEnd`: Ends combat (cascades to delete all combatants)
- `handleCombatUpdate`: Updates combat properties (round, turn, active state)
- `handleCombatantAdd`: Adds combatant to active combat
- `handleCombatantUpdate`: Updates combatant (initiative, HP, conditions, defeated status)
- `handleCombatantRemove`: Removes combatant from combat
- `handleCombatNextTurn`: Advances turn with automatic round progression

**Turn Management Logic**:
```typescript
// Advances turn index
// If turn >= combatant count, increment round and reset to turn 0
// Returns current combatant ID for highlighting in UI
```

**Key Characteristics**:
- Supports multiple simultaneous combat encounters per game
- Tracks initiative order and turn state
- Automatic round progression when all combatants have acted
- Returns current combatant ID for client-side highlighting

### 4. Chat WebSocket Handler

**File**: `apps/server/src/websocket/handlers/chat.ts`

**Features**:
- `handleChatMessage`: Broadcasts public chat messages to all players
- `handleChatDelete`: Removes chat message and notifies room
- `handleChatWhisper`: Sends private messages to specific users

**Whisper Implementation**:
- Validates sender is in game room
- Sends message to sender (so they see their own whisper)
- Iterates through room sockets to find target users by userId
- Only sends to intended recipients (not broadcast to entire room)
- Persists whisper with `whisperTargets` array in database

**Key Characteristics**:
- Automatically attaches sender's userId and username
- Stores all messages in database for history/audit
- Supports different message types (chat, whisper, roll)
- Privacy-preserving whisper implementation

### 5. Main WebSocket Integration

**File**: `apps/server/src/websocket/handlers/game.ts`

**Changes**:
- Imported all three new handler modules
- Added case statements for all 14 new message types
- Replaced inline `handleChatMessage` with delegated handler
- Maintained existing token, scene, wall, and dice roll handlers

**Handler Delegation Pattern**:
```typescript
case 'actor:create':
  await handleActorCreate(socket, message as WSMessage<ActorCreatePayload>, request);
  break;
```

---

## Files Created

1. `apps/server/src/websocket/handlers/actors.ts` - Actor CRUD handlers
2. `apps/server/src/websocket/handlers/combat.ts` - Combat & combatant handlers
3. `apps/server/src/websocket/handlers/chat.ts` - Chat message handlers

---

## Files Modified

1. `packages/shared/src/types/websocket.ts` - Extended with new message types and payloads
2. `apps/server/src/websocket/handlers/game.ts` - Integrated new handlers into switch statement

---

## WebSocket Events Summary

### Actor Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `actor:create` | Client → Server | Create new actor |
| `actor:created` | Server → All Clients | Actor created successfully |
| `actor:update` | Client → Server | Update actor properties |
| `actor:updated` | Server → All Clients | Actor updated successfully |
| `actor:delete` | Client → Server | Delete actor |
| `actor:deleted` | Server → All Clients | Actor deleted successfully |

### Combat Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `combat:start` | Client → Server | Start new combat encounter |
| `combat:started` | Server → All Clients | Combat started with combatants |
| `combat:end` | Client → Server | End combat encounter |
| `combat:ended` | Server → All Clients | Combat ended |
| `combat:update` | Client → Server | Update combat properties |
| `combat:updated` | Server → All Clients | Combat updated |
| `combatant:add` | Client → Server | Add combatant to combat |
| `combatant:added` | Server → All Clients | Combatant added |
| `combatant:update` | Client → Server | Update combatant (initiative, HP, etc.) |
| `combatant:updated` | Server → All Clients | Combatant updated |
| `combatant:remove` | Client → Server | Remove combatant |
| `combatant:removed` | Server → All Clients | Combatant removed |
| `combat:next-turn` | Client → Server | Advance to next turn |
| `combat:turn-changed` | Server → All Clients | Turn advanced (includes current combatant ID) |

### Chat Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Client → Server | Send public chat message |
| `chat:message` | Server → All Clients | Broadcast chat message |
| `chat:delete` | Client → Server | Delete chat message |
| `chat:deleted` | Server → All Clients | Message deleted |
| `chat:whisper` | Client → Server | Send private message |
| `chat:whisper` | Server → Specific Clients | Private message (sender + recipients) |

---

## Database Integration

All handlers integrate with existing Drizzle ORM schema:

- **Actors**: `packages/database/src/schema/actors.ts`
  - Fields: id, gameId, name, actorType, img, ownerId, attributes, abilities, folderId, sort, data

- **Combats**: `packages/database/src/schema/combats.ts`
  - Fields: id, sceneId, gameId, active, round, turn, sort, data

- **Combatants**: `packages/database/src/schema/combats.ts`
  - Fields: id, combatId, actorId, tokenId, initiative, initiativeModifier, hidden, defeated, data

- **Chat Messages**: `packages/database/src/schema/chatMessages.ts`
  - Fields: id, gameId, userId, content, messageType, speaker, rollData, whisperTargets, blind, data

---

## Testing Instructions

### 1. Testing Actor Events

**Client-side test code**:
```javascript
// Create actor
ws.send(JSON.stringify({
  type: 'actor:create',
  payload: {
    gameId: 'your-game-id',
    name: 'Gandalf',
    actorType: 'character',
    attributes: { str: 10, dex: 12 },
    abilities: { fireball: { level: 3 } }
  },
  timestamp: Date.now()
}));

// Listen for confirmation
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'actor:created') {
    console.log('Actor created:', msg.payload.actor);

    // Update actor
    ws.send(JSON.stringify({
      type: 'actor:update',
      payload: {
        actorId: msg.payload.actor.id,
        updates: { attributes: { str: 12, dex: 12 } }
      },
      timestamp: Date.now()
    }));
  }
};
```

### 2. Testing Combat Events

**Starting combat**:
```javascript
// Start combat with initial combatants
ws.send(JSON.stringify({
  type: 'combat:start',
  payload: {
    gameId: 'your-game-id',
    sceneId: 'your-scene-id',
    combatants: [
      { actorId: 'actor-1', initiative: 18, initiativeModifier: 2 },
      { actorId: 'actor-2', initiative: 14, initiativeModifier: 0 }
    ]
  },
  timestamp: Date.now()
}));

// Listen for combat start
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'combat:started') {
    const combatId = msg.payload.combat.id;

    // Advance turn
    ws.send(JSON.stringify({
      type: 'combat:next-turn',
      payload: { combatId },
      timestamp: Date.now()
    }));
  }

  if (msg.type === 'combat:turn-changed') {
    console.log('Current turn:', msg.payload.currentCombatantId);
    console.log('Round:', msg.payload.combat.round);
    console.log('Turn:', msg.payload.combat.turn);
  }
};
```

### 3. Testing Chat Events

**Public message**:
```javascript
ws.send(JSON.stringify({
  type: 'chat:message',
  payload: {
    text: 'Hello everyone!'
  },
  timestamp: Date.now()
}));
```

**Whisper**:
```javascript
ws.send(JSON.stringify({
  type: 'chat:whisper',
  payload: {
    text: 'Secret message',
    targetUserIds: ['user-id-1', 'user-id-2']
  },
  timestamp: Date.now()
}));

// Both sender and recipients receive:
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'chat:whisper') {
    console.log('Whisper from:', msg.payload.username);
    console.log('Message:', msg.payload.text);
    console.log('Recipients:', msg.payload.targetUserIds);
  }
};
```

### 4. Integration Testing

Connect multiple WebSocket clients to the same game room and verify:
- Actor creation/update/deletion broadcasts to all clients
- Combat turn advancement updates all clients synchronously
- Public chat messages reach all clients
- Whispers only reach intended recipients (plus sender)
- Database persists all changes correctly

---

## Architecture Patterns

### 1. Handler Delegation
Main `game.ts` acts as router, delegating to specialized handlers for different entity types. This keeps code modular and maintainable.

### 2. Broadcast Pattern
All state changes follow the pattern:
1. Validate user is in game room
2. Update database
3. Broadcast change to all clients in room
4. Log operation

### 3. Type Safety
All messages use TypeScript interfaces from `@vtt/shared`, ensuring compile-time type checking across client and server.

### 4. Error Handling
All handlers use try-catch blocks and send error messages via WebSocket on failure.

---

## Current Status

**Build Status**: ✅ Success (no TypeScript errors)

**Completed**:
- All actor CRUD operations via WebSocket
- Full combat encounter management with turn tracking
- Chat messaging with whisper support
- Database persistence for all operations
- Type-safe message payloads
- Integration with existing WebSocket infrastructure

**Ready for**:
- Client-side UI implementation
- E2E testing with multiple clients
- Performance testing under load
- Security audit (permission checks)

---

## Next Steps

### Immediate
1. Add permission checks (ensure users can only modify entities they own/have access to)
2. Add REST API endpoints for initial data loading (GET /actors, GET /combats, etc.)
3. Test with multiple simultaneous clients
4. Add client-side state management for real-time updates

### Future Enhancements
1. Combat initiative rolling automation
2. Chat command parsing (e.g., `/roll 1d20`)
3. Dice roll integration with chat messages
4. Combat status effects and condition tracking
5. Whisper UI with recipient selection
6. Chat message editing and deletion permissions
7. Combat history logging

---

## Key Learnings

1. **Whisper Privacy**: Implemented selective socket sending by iterating room members rather than using broadcast
2. **Turn Management**: Automatic round progression requires careful index tracking
3. **Handler Modularity**: Separating handlers by entity type improves maintainability
4. **Type Safety**: Shared payload types catch integration issues at compile time
5. **Database Integration**: All WebSocket changes must persist to database for reconnection scenarios

---

## Files Summary

### Created (3 files)
- `apps/server/src/websocket/handlers/actors.ts` (217 lines)
- `apps/server/src/websocket/handlers/combat.ts` (462 lines)
- `apps/server/src/websocket/handlers/chat.ts` (196 lines)

### Modified (2 files)
- `packages/shared/src/types/websocket.ts` (+260 lines)
- `apps/server/src/websocket/handlers/game.ts` (+70 lines, -30 lines)

**Total**: 875 new lines of production code

---

## Conclusion

Successfully implemented real-time synchronization for actors, combat encounters, and chat messages. The VTT now supports full multiplayer gameplay with instant updates across all connected clients. The implementation follows best practices for WebSocket communication, maintains type safety, and integrates seamlessly with the existing database and room management infrastructure.

The system is now ready for client-side integration and comprehensive testing with multiple simultaneous players.
