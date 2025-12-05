# VTT Acceleration Roadmap

**Document Status**: Active Working Document
**Last Updated**: 2025-12-04
**Version**: 1.3 - Phase 2 Complete

---

## Executive Summary

### Vision
Achieve feature parity with Foundry VTT while delivering a superior user experience through modern web technologies, AI-powered content generation, and procedural map capabilities.

### Approach
- **Learn from Foundry's Architecture**: Leverage their proven document model and canvas layer system
- **Build Our Own Implementation**: Modern tech stack (Svelte + Fastify + PostgreSQL) vs Foundry's Electron/Express/NeDB
- **Innovate Beyond**: AI streaming, procedural maps, cloud-native architecture, marketplace

### Differentiators
1. **AI Content Streaming**: Real-time NPC dialogue, scene descriptions, and story assistance
2. **Procedural Map Generation**: Server-generated dynamic maps with AI/algorithms
3. **Modern Tech Stack**: React/Svelte instead of jQuery, PostgreSQL instead of NeDB, cloud-native design
4. **Marketplace Integration**: Built-in content marketplace from day one
5. **Superior Performance**: WebSocket optimization, better real-time sync, lower latency
6. **Cloud-Native**: Designed for web hosting from the start (vs Foundry's Electron desktop-first)

---

## Current State Assessment

### Completed Features

**Infrastructure** (Sessions 0001-0004):
- Turborepo monorepo with pnpm workspaces
- FastAPI server with TypeScript
- SvelteKit frontend
- PostgreSQL database (Drizzle ORM)
- Redis integration
- Docker containerization
- Shared types package (@vtt/shared)

**Authentication & User Management** (Session 0005):
- User registration and login (bcrypt password hashing)
- JWT session management
- Protected API routes with authentication middleware
- User profile endpoints

**Game Management** (Session 0006):
- Game CRUD operations (create, read, update, delete)
- Game ownership and access control
- REST API: `/api/v1/games`

**WebSocket Infrastructure** (Session 0007):
- Real-time bidirectional communication
- Game room management
- Player join/leave events
- Presence tracking
- Heartbeat mechanism for connection health

**Token System** (Session 0008):
- Basic token CRUD via WebSocket
- Real-time token movement synchronization
- Token selection and permissions
- REST API: `/scenes/:sceneId/tokens`

**Database Schema - Full VTT Document Types** (Session 0010):
- **8 new tables created**:
  - `scenes` - Maps/battlefields with grid, vision, fog settings
  - `actors` - Characters/NPCs with system-agnostic attributes
  - `items` - Equipment/inventory linked to actors
  - `walls` - Vision/movement blocking barriers
  - `ambient_lights` - Dynamic lighting sources
  - `combats` - Combat encounter tracking
  - `combatants` - Individual combatant initiative data
  - `chat_messages` - In-game chat and roll messages
- **tokens table rebuilt**: Changed from `gameId` to `sceneId` architecture (tokens now belong to scenes)
- Shared TypeScript types for all document types

**Scene System** (Sessions 0011-0012):
- Scene CRUD API (`/api/v1/games/:gameId/scenes`)
- Scene-based token architecture (Game → Scenes → Tokens)
- Multi-layered canvas renderer:
  1. Background layer (scene background image)
  2. Grid layer (square/hex support)
  3. Tokens layer
  4. Walls layer (GM-only)
  5. Controls layer
- Pan and zoom controls (0.25x-4x zoom)
- Grid snapping and configuration
- Scene switching with real-time sync
- WebSocket: `scene:switch`, `scene:update`, `wall:add/update/remove`

**Dice System** (Session 0013):
- Complete dice notation parser supporting:
  - Basic rolls: `1d20`, `2d6`, `d20`
  - Modifiers: `2d6+5`, `1d20-2`
  - Multiple groups: `2d6+1d4+3`
  - Keep highest/lowest: `4d6kh3`, `2d20kl1` (advantage/disadvantage)
  - Drop highest/lowest: `4d6dh1`, `4d6dl1`
  - Exploding dice: `4d6!`
  - Percentile: `d100`, `d%`
- Cryptographically secure random generation
- Full breakdown with strikethrough for dropped dice
- WebSocket integration: `dice:roll`, `dice:result`
- 54 unit tests (100% passing)

**API Routes** (Sessions 0016-0021):
- Actors CRUD (`/api/v1/games/:gameId/actors`) - ✅ Complete (30 tests)
- Items CRUD (`/api/v1/actors/:actorId/items`) - ✅ Complete (39 tests)
- Ambient Lights (`/api/v1/scenes/:sceneId/lights`) - ✅ Complete (36 tests)
- Chat Messages (`/api/v1/games/:gameId/chat`) - ✅ Complete (pagination, whispers, blind rolls)
- Walls CRUD (`/api/v1/scenes/:sceneId/walls`) - ✅ Complete
- GM Management (`/api/v1/games/:id/gms`) - ✅ Complete (add/remove/list GMs)

**Frontend Components** (Sessions 0024-0028):
- ActorSheet (character/NPC editor) - ✅ Complete (31 tests, tabbed interface)
- CombatTracker (initiative order UI) - ✅ Complete (19 tests, turn controls, HP bars)
- ChatPanel (messages and dice rolls) - ✅ Complete (37 tests, /roll command)
- SceneControls (toolbar for GM tools) - ✅ Complete (25 tests, keyboard shortcuts)
- WallDrawingTool (click-and-drag wall creation) - ✅ Complete (grid snapping, WebSocket sync)

**Canvas Features** (Sessions 0023, 0028):
- Scene Background Images - ✅ Complete (caching, error handling)
- Token Images - ✅ Complete (circular clipping, fallback to colored circles)

**WebSocket Handlers** (Session 0018):
- Actor events (create/update/delete) - ✅ Complete
- Combat events (start/end/add/update/remove combatants) - ✅ Complete
- Chat events (message/roll/whisper) - ✅ Complete
- Dice roll events (roll/result) - ✅ Complete

**Authentication & Roles** (Sessions 0029-0030):
- Token storage fix - ✅ Complete (consistent vtt_session_id key)
- GM Role System - ✅ Complete (owner-based + delegated GMs)
- Frontend isGM detection - ✅ Complete (reactive calculation)

### Phase 2 Complete ✅ (Sessions 0031-0043)

**All Phase 2 features implemented and deployed!**

**Phase 2A - UI Components** (Sessions 0031-0034):
- TokenConfig modal with actor linking ✅
- ItemSheet component for equipment editing ✅
- LightingConfig modal for ambient lights ✅
- token:update WebSocket handler and REST endpoints ✅

**Phase 2B - Active Effects System** (Sessions 0036-0039):
- Database schema: `active_effects` table ✅
- REST API: 9 endpoints for CRUD operations ✅
- WebSocket handlers: Real-time effect synchronization ✅
- UI: EffectsList, EffectConfig modal, effects store ✅
- Integration with ActorSheet (Effects tab) ✅

**Phase 2C - Combat REST API** (Session 0040):
- Verified existing implementation (already complete) ✅
- 8 endpoints for combat and combatant management ✅

**Phase 2D - GM Management UI** (Session 0041):
- GMManagement modal component ✅
- Add/remove GMs functionality ✅
- Owner protection ✅
- Integration with games list page ✅

**Phase 2E - Asset Upload & Management** (Sessions 0042-0043):
- Database schema: `assets` table ✅
- REST API: Upload, list, get, update, delete ✅
- Multipart file upload with sharp for thumbnails ✅
- Static file serving for uploads ✅
- UI: AssetUploader, AssetBrowser, AssetPicker ✅
- Integration with TokenConfig ✅

**Summary**:
- 8 development sessions
- 8 feature commits
- 27 new API endpoints
- 2 new database tables
- 6 new frontend components
- Full documentation in session notes

See: `docs/session_notes/2025-12-04-0044-Phase2-Complete.md` for complete summary

### Not Yet Started

**Phase 3 - Advanced Canvas & Vision** (Next Priority):
- Dynamic lighting and vision calculation
- Fog of war rendering
- Token vision system
- Advanced wall types (doors, windows)
- Canvas performance optimization

**Future Phases**:
- Rich text chat with formatting
- Journal system
- Compendium system
- Drawing tools
- Measurement tools

---

## Feature Parity Matrix

Comparison of Foundry VTT features vs our current implementation:

| Feature Category | Foundry VTT | Our VTT | Gap | Priority |
|-----------------|-------------|---------|-----|----------|
| **Core Infrastructure** |
| User Authentication | Session-based | JWT tokens | ✅ Complete | - |
| Game/World Management | NeDB files | PostgreSQL | ✅ Complete | - |
| Real-time Sync | Socket.io | Native WebSocket | ✅ Complete | - |
| **Canvas & Rendering** |
| Multi-layer Canvas | 11 layers (PixiJS) | 5 layers (Canvas 2D) | Need 6 more layers | P1 |
| Grid Types | Square, Hex, Gridless | Square, Hex | Add gridless mode | P2 |
| Pan & Zoom | ✅ Full support | ✅ Full support | ✅ Complete | - |
| Background Images | ✅ Full support | ✅ Cached loading | ✅ Complete | - |
| **Token Management** |
| Token Placement | ✅ Full support | ✅ Full support | ✅ Complete | - |
| Token Movement | ✅ Drag & drop | ✅ Drag & drop | ✅ Complete | - |
| Token Images | ✅ Full support | ✅ Circular clipping | ✅ Complete | - |
| Token Vision | ✅ Line-of-sight | ❌ None | Vision calculation | P2 |
| Token Resource Bars | ✅ HP/MP bars | ✅ TokenConfig modal | ✅ Complete | - |
| Token Rotation | ✅ Full support | Schema ready, no UI | UI implementation | P3 |
| Token Properties | ✅ Full support | ✅ TokenConfig modal | ✅ Complete | - |
| **Scene Management** |
| Scene CRUD | ✅ Full support | ✅ Full support | ✅ Complete | - |
| Scene Switching | ✅ Full support | ✅ Full support | ✅ Complete | - |
| Scene Grid Config | ✅ Full support | ✅ Full support | ✅ Complete | - |
| **Walls & Barriers** |
| Wall Drawing | ✅ Click-drag tool | ✅ WallDrawingTool | ✅ Complete | - |
| Wall Types | Wall, Door, Window | Basic walls only | Door/window mechanics | P2 |
| Vision Blocking | ✅ Full support | ❌ None | Vision calculation | P2 |
| Movement Blocking | ✅ Full support | ❌ None | Collision detection | P3 |
| **Lighting** |
| Ambient Lights | ✅ Full support | ✅ LightingConfig modal | ✅ Complete | - |
| Dynamic Lighting | ✅ Full support | ❌ None | Lighting engine | P2 |
| Light Animation | ✅ Torch, fog, etc. | ❌ None | Animation system | P3 |
| Darkness Levels | ✅ 0-1 scale | ❌ None | Lighting system | P2 |
| **Fog of War** |
| Fog Exploration | ✅ Per-user tracking | ❌ None | Full implementation | P2 |
| GM Reveal/Hide | ✅ Full support | ❌ None | GM tools | P2 |
| **Characters & NPCs** |
| Actor System | ✅ Full support | ✅ Full CRUD API | ✅ Complete | - |
| Character Sheets | ✅ Editable sheets | ✅ ActorSheet | ✅ Complete | - |
| Actor-Token Link | ✅ Full support | ✅ TokenConfig modal | ✅ Complete | - |
| **Items & Inventory** |
| Item System | ✅ Full support | ✅ Full CRUD API | ✅ Complete | - |
| Item Types | Equipment, spells, etc. | ✅ ItemSheet editor | ✅ Complete | - |
| Inventory UI | ✅ Drag-drop | ✅ ItemSheet modal | ✅ Complete | - |
| **Combat** |
| Combat Tracker | ✅ Full support | ✅ CombatTracker UI | ✅ Complete | - |
| Initiative Rolling | ✅ Full support | ✅ WebSocket events | ✅ Complete | - |
| Turn Management | ✅ Full support | ✅ TurnControls | ✅ Complete | - |
| **Dice Rolling** |
| Dice Parser | ✅ PEG parser | ✅ Regex parser | ✅ Complete | - |
| Roll Notation | ✅ Full D&D notation | ✅ Full D&D notation | ✅ Complete | - |
| Roll Display | ✅ Breakdown | ✅ Breakdown | ✅ Complete | - |
| **Chat System** |
| Text Chat | ✅ Full support | ✅ ChatPanel | ✅ Complete | - |
| Roll Integration | ✅ Inline rolls | ✅ /roll command | ✅ Complete | - |
| Whispers | ✅ Private messages | ✅ API + filtering | ✅ Complete | - |
| Rich Text | ✅ ProseMirror | ❌ None | Rich text editor | P3 |
| **Content Management** |
| Asset Upload | ✅ Full support | ✅ Multipart upload + thumbnails | ✅ Complete | - |
| Asset Library | ✅ Organized folders | ✅ Browse/search/filter | ✅ Complete | - |
| Journal System | ✅ Multi-page | ❌ None | Full implementation | P3 |
| Compendiums | ✅ Full support | ❌ None | Full implementation | P3 |
| **Active Effects** |
| Status Effects | ✅ Full support | ✅ Complete system | ✅ Complete | - |
| Effect Duration | ✅ Rounds/turns/time | ✅ Multiple duration types | ✅ Complete | - |
| Effect Application | ✅ Stat modifications | ✅ JSONB changes array | ✅ Complete | - |
| Effect UI | ✅ Effect indicators | ✅ EffectsList + EffectConfig | ✅ Complete | - |
| **GM Management** |
| GM Permissions | ✅ Owner + delegated | ✅ API + UI complete | ✅ Complete | - |
| Add/Remove GMs | ✅ Full support | ✅ GMManagement modal | ✅ Complete | - |
| **Audio** |
| Playlists | ✅ Full support | ❌ None | Full implementation | P4 |
| Ambient Sounds | ✅ Positional audio | ❌ None | Full implementation | P4 |
| **Extensibility** |
| Module System | ✅ Full support | ❌ None | Plugin architecture | P4 |
| Game Systems | ✅ D&D, PF2e, etc. | ❌ None | System support | P4 |
| API/Hooks | ✅ Extensive API | Basic REST/WS | Expand API | P3 |

**Legend**:
- ✅ = Complete
- ❌ = Not started
- Partial = Partially implemented
- P1 = Critical priority (MVP)
- P2 = High priority (enhance core experience)
- P3 = Medium priority (polish)
- P4 = Low priority (advanced features)

---

## Implementation Phases

### Phase 1: Core Canvas Experience (MVP) ✅ COMPLETE

**Status**: All Phase 1 features implemented and tested (Sessions 0016-0030)

**Features Completed**:
1. **Scene Background Images** ✅
   - Image caching mechanism (Map-based cache)
   - Loading/error state indicators
   - Optimized reactivity (only reloads on URL change)
   - Enhanced error handling with console logging

2. **Token Images** ✅
   - Token image loading with caching
   - Circular clipping for token images
   - Fallback to colored circles for missing/failed images
   - Error indicator for failed loads

3. **Actor System** ✅
   - Actor CRUD API (`/api/v1/games/:gameId/actors`) - 30 tests
   - ActorSheet component (tabbed interface: Stats, Inventory, Notes) - 31 tests
   - D&D ability scores with modifier calculation
   - System-agnostic data structure (JSONB for custom attributes)

4. **Combat Tracker** ✅
   - CombatTracker UI component - 19 tests
   - Initiative order display with HP bars
   - Turn controls (next turn, round tracking)
   - Combatant add/edit/remove
   - WebSocket integration for real-time sync

5. **Chat System** ✅
   - Chat message API with pagination, whispers, blind rolls
   - ChatPanel UI component - 37 tests
   - Text messages with timestamps
   - Dice roll integration (`/roll` command)
   - Auto-scroll to new messages

6. **Wall Drawing Tools** ✅
   - SceneControls toolbar (25 tests) with GM-only visibility
   - Click-to-place wall drawing with real-time preview
   - Wall selection and deletion
   - Grid snapping support
   - WebSocket persistence

7. **GM Role System** ✅ (Bonus feature)
   - Owner-based GM status
   - Delegated GM privileges via API
   - Frontend reactive isGM detection

**Success Criteria**: ✅ ALL MET
- ✅ GM can upload/generate a map with background image
- ✅ Players can move tokens with images on the map
- ✅ GM can draw walls for vision/movement blocking
- ✅ Combat tracker manages turn order
- ✅ Players can chat and roll dice
- ✅ All actions sync in real-time across clients

---

### Phase 2: Game Mechanics Enhancement ✅ COMPLETE (Sessions 0031-0043)

**Status**: All Phase 2 features implemented, tested, and deployed

**Phase 2A - UI Components** (Sessions 0031-0034):

1. **TokenConfig Modal** ✅
   - Double-click token to open editor
   - Edit token properties (name, image, size, vision range)
   - Actor linking (select actor from dropdown)
   - Full PATCH endpoint integration
   - Live canvas updates via WebSocket
   - Asset picker for token images

2. **ItemSheet Component** ✅
   - Comprehensive equipment editor
   - Type-specific fields (weapon damage, armor AC, consumable quantity, spell level)
   - Create/edit/delete operations
   - Integration with ActorSheet InventoryTab
   - Full CRUD API support

3. **LightingConfig Modal** ✅
   - Ambient light editor modal
   - Light properties (position, brightness, radius, angle, color, opacity)
   - Animation settings (torch, pulse, chroma, wave)
   - Live gradient preview
   - Full API integration with scene-based storage

4. **Token Update WebSocket Handler** ✅
   - `handleTokenUpdate()` handler in game.ts
   - PATCH `/api/v1/tokens/:tokenId` REST endpoint
   - POST `/api/v1/scenes/:sceneId/tokens` REST endpoint
   - Real-time token property synchronization

**Phase 2B - Active Effects System** (Sessions 0036-0039):

1. **Database Schema** ✅
   - `active_effects` table with comprehensive tracking
   - Support for buff, debuff, condition, aura, custom types
   - Duration management (rounds, turns, seconds, permanent, special)
   - Source tracking (actor, item)
   - JSONB changes array for stat modifications

2. **REST API** ✅
   - 9 endpoints for full CRUD operations
   - Filter by game, actor, token
   - Effect toggling (enable/disable)
   - Combat-triggered expiration

3. **WebSocket Handlers** ✅
   - Real-time effect synchronization
   - effect:add, effect:update, effect:remove, effect:toggle
   - Batch expiration notifications

4. **Frontend UI** ✅
   - EffectsList component (display, toggle, edit, delete)
   - EffectConfig modal (create/edit effects)
   - Effects store (state management)
   - Integration with ActorSheet (Effects tab)

**Phase 2C - Combat REST API** (Session 0040):

1. **Verification** ✅
   - Confirmed existing implementation from Phase 1
   - 8 endpoints for combat and combatant management
   - Already integrated with CombatTracker UI

**Phase 2D - GM Management UI** (Session 0041):

1. **GMManagement Component** ✅
   - Modal dialog for GM management
   - Add user as GM (by username)
   - Remove GM functionality
   - Owner protection (cannot remove owner)
   - Integration with games list page

**Phase 2E - Asset Upload & Management** (Sessions 0042-0043):

1. **Database Schema** ✅
   - `assets` table for file metadata
   - Asset types: map, token, portrait, tile, audio, document, other
   - Tag system and custom metadata

2. **Backend API** ✅
   - 5 endpoints (upload, list, get, update, delete)
   - Multipart file upload with Fastify
   - Automatic thumbnail generation (sharp library)
   - Static file serving from /uploads
   - Filter by type, game, user
   - Search functionality

3. **Frontend UI** ✅
   - AssetUploader component (drag-and-drop)
   - AssetBrowser component (grid/list views, search, filter)
   - AssetPicker modal (asset selection)
   - Assets store (state management)
   - Integration with TokenConfig

**Success Criteria**: ✅ ALL MET
- ✅ Players can manage character inventories
- ✅ Active effects system fully functional
- ✅ Visual effect indicators in UI
- ✅ Asset library with upload/browse/search
- ✅ Complete character sheet functionality
- ✅ GM team management
- ✅ All features tested and deployed

---

### Phase 3: Advanced Canvas & Vision

**Goal**: Implement dynamic lighting, fog of war, and vision systems

**Features**:
1. **Dynamic Lighting System**
   - Ambient light placement and configuration
   - Light radius (bright/dim)
   - Light color and intensity
   - Light animation (torch flicker, pulse, etc.)
   - Darkness levels
   - Attenuation and falloff

2. **Fog of War**
   - Per-user fog exploration tracking
   - Revealed vs unexplored areas
   - GM reveal/hide tools
   - Fog rendering layer
   - Persistent fog state

3. **Token Vision System**
   - Line-of-sight calculation
   - Vision range per token
   - Wall blocking (use existing walls for vision)
   - Darkvision and special vision modes
   - Vision radius rendering

4. **Advanced Wall Types**
   - Door mechanics (open/close, locked)
   - Window type (vision only, not movement)
   - Secret doors (GM-only visibility)
   - Wall endpoints editing

5. **Canvas Performance Optimization**
   - Layer caching (background, grid)
   - Entity culling (only render visible)
   - Dirty rectangle optimization
   - Consider PixiJS migration for WebGL

**Success Criteria**:
- Players see only what their tokens can see
- Dynamic lights illuminate scenes
- Fog of war tracks exploration
- Doors can open/close
- Smooth performance with 100+ tokens

---

### Phase 4: Content Management & Organization

**Goal**: Provide tools for organizing game content

**Features**:
1. **Journal System**
   - Journal entry CRUD
   - Multi-page journals
   - Rich text editor (markdown or WYSIWYG)
   - Image/PDF embedding
   - Folder organization

2. **Compendium System**
   - Compendium packs (monsters, spells, items)
   - Import/export functionality
   - Search and filtering
   - Drag-and-drop to scene

3. **Drawing Tools**
   - Freehand drawing on canvas
   - Shape tools (circle, rectangle, polygon)
   - Text annotations
   - Color and stroke settings
   - Drawing layer management

4. **Measurement Tools**
   - Ruler for distance measurement
   - Template tools (cone, circle, ray for AoE)
   - Grid snapping for measurements
   - Unit configuration (feet, meters, etc.)

5. **Advanced Scene Features**
   - Multiple map layers (background, foreground)
   - Tile system (overlay images)
   - Region system (trigger zones)
   - Scene notes/pins

**Success Criteria**:
- GMs can organize notes and content
- Compendiums provide quick access to game data
- Drawing tools enhance communication
- Templates visualize spell effects
- Advanced scene composition

---

### Phase 5: Extensibility & Game Systems

**Goal**: Support for specific game systems and extensibility

**Features**:
1. **Game System Architecture**
   - System definition framework
   - Custom character sheet templates
   - System-specific data models
   - Rule automation hooks

2. **D&D 5e System**
   - Complete 5e character sheet
   - Ability scores, skills, saves
   - Spell slots and management
   - Class/race/background
   - Automated calculations

3. **Pathfinder 2e System**
   - PF2e character sheet
   - Three-action economy
   - Skill proficiency system
   - Automated modifiers

4. **Module/Plugin System**
   - Plugin API definition
   - Plugin loading mechanism
   - Hook system for extending behavior
   - UI extension points
   - Package management

5. **Macro System**
   - Macro creation and storage
   - JavaScript execution sandbox
   - Roll macros
   - Action automation
   - Hotbar/favorites

**Success Criteria**:
- D&D 5e fully playable
- PF2e fully playable
- Third-party modules can extend functionality
- Macros automate common actions
- System-agnostic core architecture

---

### Phase 6: Premium & Differentiating Features

**Goal**: Deliver features that set us apart from Foundry

**Features**:
1. **AI Content Streaming**
   - LLM API integration (Claude, OpenAI)
   - GM-triggered content generation
   - NPC dialogue generation
   - Scene description generation
   - Story prompt assistance
   - Context management (session history)
   - Streaming responses
   - Generation history

2. **Procedural Map Generation**
   - Server-side map generation API
   - Multiple generation algorithms:
     - Dungeon generator (rooms and corridors)
     - Wilderness generator (terrain, features)
     - City generator (streets, buildings)
   - Configurable parameters (size, complexity, theme)
   - Auto-placement of walls, lights, tokens
   - Save/export generated maps
   - Seed-based regeneration

3. **Marketplace Integration**
   - Content creator accounts
   - Asset upload system (maps, tokens, modules)
   - Search and discovery
   - Asset preview
   - Free and paid content
   - Payment processing
   - Revenue sharing
   - Licensing management
   - Download and import to games

4. **Advanced Audio**
   - Background music playlists
   - Ambient sound effects
   - Positional audio (stereo panning)
   - Volume attenuation with distance
   - Audio triggers (regions)
   - Audio library management

5. **Mobile Optimization**
   - Responsive UI for tablets/phones
   - Touch controls for token movement
   - Mobile-optimized character sheets
   - Progressive Web App (PWA)
   - Offline capability for character sheets

**Success Criteria**:
- AI generates high-quality NPC dialogue and descriptions
- Procedural generator creates usable, interesting maps
- Marketplace has active content creators
- Audio enhances immersion
- Players can use tablets effectively

---

## API Routes Status

Complete list of REST API endpoints and their implementation status:

### Actors ✅ COMPLETE (Session 0016)
```
GET    /api/v1/games/:gameId/actors          - List all actors in game
GET    /api/v1/actors/:actorId                - Get single actor
POST   /api/v1/games/:gameId/actors          - Create new actor
PATCH  /api/v1/actors/:actorId                - Update actor
DELETE /api/v1/actors/:actorId                - Delete actor
```

### Items ✅ COMPLETE (Session 0021)
```
GET    /api/v1/actors/:actorId/items          - List actor's items
GET    /api/v1/items/:itemId                  - Get single item
POST   /api/v1/actors/:actorId/items          - Create item for actor
PATCH  /api/v1/items/:itemId                  - Update item
DELETE /api/v1/items/:itemId                  - Delete item
```

### Walls ✅ COMPLETE (Session 0027)
```
GET    /api/v1/scenes/:sceneId/walls          - List walls in scene
GET    /api/v1/walls/:wallId                  - Get single wall
POST   /api/v1/scenes/:sceneId/walls          - Create wall
PATCH  /api/v1/walls/:wallId                  - Update wall
DELETE /api/v1/walls/:wallId                  - Delete wall
```

### Ambient Lights ✅ COMPLETE (Session 0020)
```
GET    /api/v1/scenes/:sceneId/lights         - List lights in scene
GET    /api/v1/lights/:lightId                - Get single light
POST   /api/v1/scenes/:sceneId/lights         - Create light
PATCH  /api/v1/lights/:lightId                - Update light
DELETE /api/v1/lights/:lightId                - Delete light
```

### Chat Messages ✅ COMPLETE (Session 0017)
```
GET    /api/v1/games/:gameId/chat             - Get chat history (pagination, filtering)
POST   /api/v1/games/:gameId/chat             - Send chat message (prefer WebSocket)
DELETE /api/v1/chat/:messageId                - Delete message
```

### GM Management ✅ COMPLETE (Session 0030)
```
GET    /api/v1/games/:id/gms                  - List GMs for a game
POST   /api/v1/games/:id/gms                  - Add user as GM
DELETE /api/v1/games/:id/gms/:userId          - Remove user as GM
```

### Combat ✅ COMPLETE (Session 0017, verified Session 0040)
```
GET    /api/v1/games/:gameId/combats          - List combats in game
GET    /api/v1/combats/:combatId              - Get combat with combatants
POST   /api/v1/games/:gameId/combats          - Create combat encounter
PATCH  /api/v1/combats/:combatId              - Update combat (advance turn, etc.)
DELETE /api/v1/combats/:combatId              - Delete combat

POST   /api/v1/combats/:combatId/combatants   - Add combatant to combat
PATCH  /api/v1/combatants/:combatantId        - Update combatant (HP, initiative)
DELETE /api/v1/combatants/:combatantId        - Remove combatant
```
Note: Also managed via WebSocket events (combat:start, combat:end, etc.)

### Active Effects ✅ COMPLETE (Sessions 0036-0039)
```
GET    /api/v1/games/:gameId/effects          - List effects for game
GET    /api/v1/actors/:actorId/effects        - List effects for actor
GET    /api/v1/tokens/:tokenId/effects        - List effects for token
GET    /api/v1/effects/:effectId              - Get single effect
POST   /api/v1/games/:gameId/effects          - Create new effect
PATCH  /api/v1/effects/:effectId              - Update effect
DELETE /api/v1/effects/:effectId              - Delete effect
PUT    /api/v1/effects/:effectId/toggle       - Toggle effect on/off
POST   /api/v1/effects/expire                 - Expire effects (combat integration)
```

### Assets ✅ COMPLETE (Sessions 0042-0043)
```
GET    /api/v1/assets                         - List user's assets (with filters)
GET    /api/v1/assets/:assetId                - Get single asset
POST   /api/v1/assets/upload                  - Upload asset (multipart/form-data)
PATCH  /api/v1/assets/:assetId                - Update asset metadata
DELETE /api/v1/assets/:assetId                - Delete asset
```
Static serving: `/uploads/:userId/:filename`

### AI Content Generation
```
POST   /api/v1/ai/generate                    - Generate AI content (stream response)
       Body: { type: 'npc_dialogue' | 'scene_description', context: {...} }
```

### Procedural Maps
```
POST   /api/v1/maps/generate                  - Generate procedural map
       Body: { type: 'dungeon' | 'wilderness', size: number, seed?: string }
       Returns: { sceneId, imageUrl, walls: [], lights: [] }
```

---

## WebSocket Events Needed

Events organized by feature area:

### Actors
```
actor:create    - New actor created
actor:update    - Actor properties updated
actor:delete    - Actor deleted
```

### Items
```
item:add        - Item added to actor
item:update     - Item properties updated
item:remove     - Item removed from actor
```

### Combat
```
combat:start       - Combat encounter started
combat:end         - Combat encounter ended
combat:add_combatant    - Combatant added
combat:update_combatant - Combatant updated (HP, conditions)
combat:remove_combatant - Combatant removed
combat:next_turn        - Turn advanced to next combatant
combat:set_initiative   - Initiative order changed
```

### Chat (Enhanced)
```
chat:message    - Text chat message
chat:roll       - Dice roll result (already implemented via dice:result)
chat:whisper    - Private message to specific users
chat:emote      - /me style emote
```

### Lights
```
light:add       - Ambient light added
light:update    - Light properties updated
light:remove    - Light removed
```

### Fog of War
```
fog:reveal      - GM reveals area
fog:hide        - GM hides area
fog:reset       - GM resets all fog
```

### Drawing
```
drawing:add     - Drawing added to scene
drawing:update  - Drawing updated
drawing:delete  - Drawing deleted
```

### GM Tools
```
gm:ping         - GM pings location on map
gm:ruler        - GM draws measurement ruler
gm:template     - GM places AoE template
```

---

## Frontend Components Needed

### Core UI Components
```
ActorSheet.svelte          - Character/NPC editor with tabs (stats, inventory, bio)
ItemSheet.svelte           - Equipment/spell editor
CombatTracker.svelte       - Initiative order UI with turn controls
ChatPanel.svelte           - Chat message display and input
SceneControls.svelte       - Toolbar for GM tools (draw, walls, lights, etc.)
TokenConfig.svelte         - Token property editor modal
LightingConfig.svelte      - Ambient light editor modal
WallDrawingTool.svelte     - Interactive wall drawing overlay
SceneConfig.svelte         - Scene settings editor
```

### Actor Components
```
ActorHeader.svelte         - Actor portrait, name, level
AttributeBlock.svelte      - Ability scores display/editor
SkillsList.svelte          - Skills with modifiers
InventoryList.svelte       - Item list with drag-drop
EffectsList.svelte         - Active effects display
ActorNotes.svelte          - Biography/notes editor
```

### Combat Components
```
InitiativeOrder.svelte     - Ordered list of combatants
CombatantRow.svelte        - Single combatant with HP bar
TurnControls.svelte        - Next/previous turn buttons
InitiativeRoller.svelte    - Roll initiative modal
```

### Chat Components
```
ChatMessage.svelte         - Single message display
DiceRollResult.svelte      - Formatted dice roll display
ChatInput.svelte           - Message input with dice shortcuts
```

### Canvas Tools
```
DrawingTool.svelte         - Freehand/shape drawing controls
MeasurementRuler.svelte    - Distance measurement overlay
TemplateSelector.svelte    - AoE template placement
GridConfigurator.svelte    - Grid settings UI
```

### Asset Management
```
AssetBrowser.svelte        - File browser for maps/tokens
AssetUploader.svelte       - Drag-drop file upload
AssetPicker.svelte         - Modal for selecting assets
```

### Marketplace
```
MarketplaceBrowser.svelte  - Content marketplace UI
AssetPreview.svelte        - Asset preview modal
CreatorDashboard.svelte    - Content creator stats/uploads
```

---

## Technical Debt & Infrastructure

### Current Technical Debt
1. **Canvas 2D to PixiJS Migration**
   - Current: HTML5 Canvas 2D (5 layers)
   - Target: PixiJS v8 with WebGL/WebGPU
   - Reason: Better performance for lighting, fog, large scenes
   - Complexity: High (complete rendering rewrite)
   - Priority: Medium (defer until after MVP)

2. **Test Coverage**
   - Current: Only dice system has tests (54 tests)
   - Target: 80% coverage minimum
   - Missing: API route tests, WebSocket handler tests, component tests
   - Priority: High (implement alongside new features)

3. **Error Handling**
   - Current: Basic error handling in routes
   - Missing: Centralized error handling, error logging, user-friendly error messages
   - Priority: Medium

4. **Authentication Enhancement**
   - Current: Basic JWT
   - Missing: Refresh tokens, OAuth integration, password reset flow
   - Priority: Medium

5. **Rate Limiting**
   - Current: None
   - Target: Rate limit API routes, WebSocket events
   - Priority: Medium (before public launch)

6. **Database Migrations**
   - Current: Direct SQL migration
   - Missing: Proper migration system with rollback
   - Priority: High (implement before next schema change)

### Infrastructure Improvements Needed

1. **Logging & Monitoring**
   - Structured logging (Pino already used)
   - Error tracking (Sentry integration)
   - Performance monitoring (APM)
   - WebSocket connection metrics

2. **Deployment**
   - CI/CD pipeline (GitHub Actions)
   - Production Docker setup
   - Database backup strategy
   - Horizontal scaling strategy (Redis pub/sub for multi-server)

3. **Performance Optimization**
   - API response caching (Redis)
   - Asset CDN (Cloudflare)
   - Image optimization (thumbnails, WebP)
   - Database query optimization (indexes)
   - WebSocket message batching

4. **Security Hardening**
   - Input validation (Zod schemas)
   - CSRF protection
   - XSS prevention
   - SQL injection prevention (using Drizzle ORM)
   - File upload validation
   - Rate limiting per user

5. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - WebSocket event documentation
   - Developer guide for contributors
   - User documentation

---

## Success Metrics

### Functional Success (Feature Parity)

**Definition**: Can run a complete 4-hour game session using only our VTT

**Checklist**:
- [ ] GM can create and configure scenes with backgrounds
- [ ] GM can draw walls and place lights
- [ ] GM can create actors (NPCs and monsters)
- [ ] Players can create and edit characters
- [ ] Players can move tokens on the map
- [ ] Combat tracker manages initiative and turns
- [ ] Players can roll dice with full notation support
- [ ] Chat displays messages and roll results
- [ ] Fog of war tracks exploration
- [ ] Dynamic lighting works correctly
- [ ] All core Foundry document types supported (Scene, Actor, Item, Combat, Token, Wall, Light, Chat)

### Technical Success

**Performance Targets**:
- WebSocket latency: <100ms for token movement
- Canvas render: 60 FPS with 100+ tokens
- Scene load time: <2 seconds
- API response time: <200ms (p95)

**Reliability Targets**:
- Uptime: 99.5%
- WebSocket reconnection: Automatic with state restoration
- Data integrity: No data loss from crashes
- Concurrent sessions: Support 50+ simultaneous games

**Test Coverage**:
- Unit tests: 80% coverage minimum
- Integration tests: All API routes
- E2E tests: Critical user flows
- Load tests: 8-10 concurrent users per game

### User Success

**GM Usability**:
- Setup time: <15 minutes to create and run first session
- Learning curve: Core features understandable in <1 hour
- Satisfaction: 8/10 or higher

**Player Usability**:
- Join time: <2 minutes from invite to playing
- Character creation: <10 minutes for basic character
- Satisfaction: 8/10 or higher

**Session Stability**:
- Completion rate: 90%+ of sessions complete without technical interruptions
- Reconnection: Players can rejoin after disconnection without data loss

### Business Success (Validation)

**Proof of Concept**:
- Technical feasibility: All core systems functional
- Performance: Meets latency and FPS targets
- Scalability: Handles target concurrent users

**Market Validation**:
- Beta testers: 50+ active users
- Session count: 100+ sessions run on platform
- Feedback: Positive response to core value proposition

**Extensibility**:
- Successfully implement one game system (D&D 5e or PF2e)
- Plugin API allows third-party extensions
- Marketplace has 10+ content creators

---

## Appendix: Foundry Document Type Reference

Quick reference for Foundry's 36 document types and our equivalents:

### User-Created Content

| Foundry Type | Description | Our Implementation | Status |
|--------------|-------------|-------------------|--------|
| Actor | Characters/NPCs | `actors` table + CRUD API | Complete ✅ |
| Item | Equipment, abilities, spells | `items` table + CRUD API | Complete ✅ |
| JournalEntry | In-world documentation | Not yet implemented | ❌ |
| JournalEntryPage | Individual journal pages | Not yet implemented | ❌ |
| Macro | Automation scripts | Not yet implemented | ❌ |
| RollTable | Loot tables, random results | Not yet implemented | ❌ |
| Cards & Card | Deck systems | Not yet implemented | ❌ |
| Playlist & PlaylistSound | Audio management | Not yet implemented | ❌ |
| Adventure | Bundled content packages | Not yet implemented | ❌ |

### Scene/Canvas Content

| Foundry Type | Description | Our Implementation | Status |
|--------------|-------------|-------------------|--------|
| Scene | Maps/battlefields | `scenes` table + CRUD API | Complete ✅ |
| Token | Character representations | `tokens` table + CRUD API | Complete ✅ |
| Tile | Background/foreground images | Not yet implemented | ❌ |
| Wall | Blocking objects | `walls` table + CRUD API + Drawing Tool | Complete ✅ |
| Drawing | Freehand annotations | Not yet implemented | ❌ |
| AmbientLight | Static lighting | `ambient_lights` table + CRUD API | Complete ✅ |
| AmbientSound | Scene audio | Not yet implemented | ❌ |
| MeasuredTemplate | AoE indicators | Not yet implemented | ❌ |
| Note | Map annotations/pins | Not yet implemented | ❌ |
| Region | Trigger zones | Not yet implemented | ❌ |

### Game Data

| Foundry Type | Description | Our Implementation | Status |
|--------------|-------------|-------------------|--------|
| Combat | Turn-based encounters | `combats` table + WebSocket + UI | Complete ✅ |
| Combatant | Individual combatants | `combatants` table + WebSocket + UI | Complete ✅ |
| CombatantGroup | Initiative groups | Not yet implemented | ❌ |
| ActiveEffect | Status effects, modifiers | `active_effects` table + API + UI | Complete ✅ |
| FogExploration | Per-user fog tracking | Not yet implemented | ❌ |
| ActorDelta | Temporary modifications | Not yet implemented | ❌ |
| RegionBehavior | Trigger definitions | Not yet implemented | ❌ |
| Setting | World configuration | Not yet implemented | ❌ |

### Infrastructure

| Foundry Type | Description | Our Implementation | Status |
|--------------|-------------|-------------------|--------|
| User | Player accounts | `users` table + Auth | Complete ✅ |
| Folder | Document hierarchy | Not yet implemented | ❌ |
| ChatMessage | Chat messages | `chat_messages` + CRUD API + UI | Complete ✅ |
| Game | Game/World management | `games` table + CRUD API + GM role | Complete ✅ |

### Summary
- **Complete**: 14 (User, Scene, Token, Combats, Combatants, Actor, Item, Wall, Light, ChatMessage, Game, GM Role, ActiveEffect, Asset Management)
- **Schema Ready**: 0 (all schemas have API implementations)
- **Not Yet Implemented**: 22

---

## Next Steps

### Immediate (Next Session)
**Phase 2 COMPLETE** - Ready to begin Phase 3

Phase 3 priorities (Advanced Canvas & Vision):
1. **Dynamic Lighting System**: Light radius calculation, color, intensity, animations
2. **Fog of War**: Per-user fog tracking, GM reveal/hide tools, persistent state
3. **Token Vision System**: Line-of-sight calculation, vision ranges, darkvision
4. **Advanced Wall Types**: Doors (open/close), windows (vision only), secret doors
5. **Canvas Performance**: Layer caching, entity culling, dirty rectangles

### Short-term (Phase 3)
- Dynamic lighting engine with attenuation
- Fog of war system with exploration tracking
- Vision calculation integrated with walls
- Advanced wall mechanics (doors, windows)
- Canvas rendering optimization
- Consider PixiJS migration for WebGL performance

### Medium-term (Phase 3)
- Dynamic lighting engine
- Fog of war system
- Vision calculation
- Advanced wall types (doors, windows)
- Canvas performance optimization

### Long-term (Phases 4-6)
- Content Management (journals, compendiums)
- Game System Support (D&D 5e, PF2e)
- AI Content Streaming
- Procedural Map Generation
- Marketplace Integration

---

**Document Status**: Active working document to guide VTT development
**Maintain**: Update after each major milestone or architectural decision
**Reference**: Use this as the north star for development priorities

---

**End of Document**
