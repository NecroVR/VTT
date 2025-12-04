# Foundry VTT Feature Analysis

> Reference document for achieving feature parity with Foundry VTT.
> This is a feature/architecture analysis only - no source code was copied.

---

## Architecture Overview

### Technology Stack
| Component | Technology |
|-----------|-----------|
| Runtime | Electron + Node.js 20+ |
| Web Server | Express.js |
| Real-time | Socket.io |
| Rendering | Pixi.js (WebGL) |
| Database | NeDB / LevelDB |
| Template Engine | Handlebars |
| Rich Text | ProseMirror |
| Code Editor | CodeMirror |
| RTC/P2P | Simple-Peer / WebRTC |
| Storage | NeDB, AWS S3 support |
| Logging | Winston |

---

## Core Document Types (36 Total)

### User-Created Content
- **Actor** - Characters/NPCs with full client & server implementations
- **Item** - Equipment, abilities, spells, resources
- **JournalEntry** - In-world documentation with categories
- **JournalEntryPage** - Individual pages (text, markdown, PDF, image, video)
- **Macro** - Automation scripts
- **RollTable** - Loot tables, random results
- **Cards** & **Card** - Deck systems
- **Playlist** & **PlaylistSound** - Audio management
- **Adventure** - Bundled content packages

### Scene/Map Content (Canvas Objects)
- **Scene** - Maps/battlefields
- **Token** - Character/monster representations on maps
- **Tile** - Background/foreground images
- **Wall** - Blocking objects (movement, sight, sound)
- **Drawing** - Freehand annotations
- **AmbientLight** - Static lighting with shadows
- **AmbientSound** - Scene audio effects
- **MeasuredTemplate** - AoE indicators (cone, circle, ray)
- **Note** - Map annotations/pins
- **Region** - Trigger zones for automation

### Game Data
- **Combat** & **Combatant** - Turn-based encounter tracking
- **CombatantGroup** - Initiative group management
- **ActiveEffect** - Status effects and stat modifiers
- **FogExploration** - Fog of war tracking per user
- **ActorDelta** - Temporary actor modifications
- **RegionBehavior** - Trigger/automation definitions
- **Setting** - World configuration metadata

### Infrastructure
- **User** - Player accounts with permissions
- **Folder** - Document hierarchy organization

---

## Canvas System Architecture

### 11-Layer System (Rendering Priority)
1. **Grid Layer** - Coordinate system display
2. **Tiles Layer** - Background/foreground images
3. **Drawings Layer** - Freehand annotations
4. **Tokens Layer** - Characters and creatures
5. **Templates Layer** - Spell templates (AoE indicators)
6. **Walls Layer** - Collision/line-of-sight blockers
7. **Lighting Layer** - Dynamic light sources
8. **Sounds Layer** - Positioned audio effects
9. **Notes Layer** - Map annotations
10. **Regions Layer** - Trigger zones
11. **Controls Layer** - Selection UI

### Grid Types
- Square Grid (D&D, Pathfinder)
- Hexagonal Grid (multiple offset types)
- Gridless (continuous coordinates)

### Rendering System
- Pixi.js-based WebGL rendering
- Batching system for performance
- Shader system with filters (lighting, blur)
- Texture extraction for optimization
- Animation framework with easing functions

---

## Canvas Placeables (10 Types)

### 1. Token
- Vision calculation
- Combat tracking
- Character data linking
- Status indicators
- Resource bars (HP, etc.)

### 2. Wall
- Door mechanics with lock states
- Movement blocking
- Vision blocking
- Sound propagation

### 3. Light
- Color configuration
- Bright/dim radius
- Animation effects (torch, fog, sunburst)
- Attenuation and darkness falloff

### 4. Drawing
- Multiple shapes (line, circle, polygon, freehand, text)
- Color fills and strokes
- Z-depth management

### 5. Tile
- Video support (animated textures)
- Occlusion (overhead/below)
- Z-depth with roof mechanics

### 6. Template
- Cone, circle, ray shapes
- Rotation and measurement
- Template effects preview

### 7. Note
- Icon selection
- Text labels
- Journal entry integration

### 8. Sound
- Stereo panning
- Volume attenuation with distance
- Easing functions

### 9. Region
- Behavior automation
- Environment configuration
- Elevation management

---

## Perception System

### Vision Features
- Detection modes (normal, darkvision, tremorsense)
- Line-of-sight calculation with wall blocking
- Lighting-dependent vision
- Darkness levels (0-1 scale)
- Fog of war (explored vs unexplored)

### Interaction Tools
- Ruler tool - Distance measurement with grid snapping
- Ping system - Point indicators for players
- Selection tools - Rectangle select, click select
- Object manipulation - Move, rotate, resize

---

## User Interface System

### Application Types
- Form applications with validation
- Dialog windows (confirmation, input)
- Sheet applications for document editing
- HUD elements (chat bubbles, status)

### Sidebar Tabs
1. Chat - In-game messaging with dice rolls
2. Combat - Initiative tracker
3. Playlist - Audio management
4. Actors - Character directory
5. Scenes - Map management

### Sheet Types
- Actor Sheet - Character/NPC editor
- Item Sheet - Equipment/ability editor
- Journal Sheet - Document editor
- Playlist Sheet - Music library editor
- Roll Table Sheet - Loot table editor
- Active Effect Sheet - Status effect editor
- Token Configuration - Token settings

---

## Chat & Dice System

### Chat Features
- Real-time messaging via Socket.io
- Rich text editor (ProseMirror-based)
- Message types (chat, roll, action)
- Emote support (/me commands)
- Whisper system (private messages)
- Speaker identification (token/actor attribution)

### Dice System
- PEG parser for roll formulas
- Multiple dice types (d4, d6, d8, d12, d20, d100)
- Operators (+, -, *, /, min, max)
- Dice pools with explosion/reroll
- Roll result display with breakdown

---

## Audio System

### Features
- Positional audio (stereo panning, volume attenuation)
- Audio caching for performance
- Convolver reverb - Spatial audio effects
- Biquad filters - Audio EQ
- Playlist management
- Background music
- SFX triggers

### Video Support
- Tile video playback (animated textures)
- WebM/MP4 compatibility
- Looping and autoplay
- Volume control per video

### A/V Conference
- WebRTC P2P audio/video
- Master client management
- Settings management

---

## Package System

### Three Package Types

1. **World** - Standalone game instance
   - Contains all maps, characters, items
   - Associated system and modules

2. **System** - Game rules implementation
   - Character sheet templates
   - Item types and properties
   - Compendium data
   - Rules automation

3. **Module** - Feature extensions
   - Modify core functionality
   - Add new sheet types
   - Extend automation
   - Provide tools and utilities

---

## Data Structure Examples

### Scene Structure
```json
{
  "_id": "string",
  "name": "string",
  "navigation": true,
  "navOrder": 0,
  "background": { "src": "", "scaleX": 1, "scaleY": 1, "offsetX": 0, "offsetY": 0 },
  "width": 4000,
  "height": 3000,
  "padding": 0.25,
  "initial": { "x": null, "y": null, "scale": null },
  "backgroundColor": "#999999",
  "grid": { "type": 1, "size": 100, "color": "#000000", "alpha": 0.2, "distance": 5, "units": "ft" },
  "tokenVision": true,
  "fogExploration": true,
  "globalLight": true,
  "darkness": 0,
  "drawings": [],
  "tokens": [],
  "lights": [],
  "notes": [],
  "sounds": [],
  "templates": [],
  "tiles": [],
  "walls": [],
  "flags": {}
}
```

### Light Configuration
```json
{
  "x": 1000,
  "y": 1000,
  "rotation": 0,
  "walls": true,
  "vision": false,
  "config": {
    "alpha": 0.5,
    "angle": 360,
    "bright": 20,
    "dim": 40,
    "color": "#ff9900",
    "coloration": 1,
    "attenuation": 0.5,
    "luminosity": 0.5,
    "animation": { "type": "torch", "speed": 5, "intensity": 5 },
    "darkness": { "min": 0, "max": 1 }
  }
}
```

---

## Feature Categories for Competitive VTT

### 1. Core Mapping & Visualization
- Multi-layer canvas rendering system
- Multiple grid types (square, hex, gridless)
- Dynamic lighting with shadows
- Fog of war
- Token placement and management
- Wall collision/vision blocking
- Drawing tools

### 2. Character Management
- Actor/Character sheet systems
- Item inventory management
- Active effects (status modifiers)
- Character delta (temporary modifications)
- Folder organization
- Permission system (owner, limited, observer)

### 3. Turn-Based Combat
- Initiative tracking
- Combatant management
- Round/turn progression
- Combat state persistence

### 4. Chat & Social
- Real-time messaging
- Dice rolling with complex formulas
- Rich text editor (WYSIWYG)
- Whisper/private messages
- Roll history

### 5. Content Organization
- Journal/document system with categories
- Multi-page journals (text, markdown, PDF, image, video)
- Compendium packs
- Folder hierarchy
- Adventure bundling

### 6. Game Automation
- Macro system
- Roll tables (random results)
- Active effects (automation triggers)
- Region-based automation

### 7. Audio/Music
- Positional audio for map effects
- Playlist management
- Background music
- Audio conference (voice/video)

### 8. Extensibility
- Module system (plugins)
- System support for custom rules
- API for developers
- Override/hook system

### 9. Data Management
- Import/export functionality
- Multiple storage backends
- Session persistence
- Backup/recovery

### 10. User Interface
- Responsive web interface
- Settings management
- Multiple sheet types
- Sidebar navigation
- Drag-and-drop support
- File picker

### 11. Accessibility
- Internationalization (i18n)
- Multiple languages support
- UI customization

### 12. Performance
- WebGL rendering optimization
- Texture atlasing
- Batching system
- Asset caching
- Database optimization

---

## Potential Differentiators for Our VTT

1. **Superior map editor UX** - More intuitive tools
2. **Better real-time sync** - Lower latency multiplayer
3. **Performance at scale** - Handle larger battles
4. **Modern tech stack** - React/TypeScript vs jQuery
5. **Better mobile support** - Responsive design
6. **Simplified system creation** - Easier game system authoring
7. **Cloud-native** - Built for web hosting from start
8. **Better accessibility** - Screen reader support, keyboard nav

---

*Document created: 2025-12-04*
*Source: Feature analysis of Foundry VTT installation (no code copied)*
