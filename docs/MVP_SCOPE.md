# MVP Scope - Virtual Tabletop Platform

**Version**: 1.0
**Last Updated**: 2025-12-04
**Status**: Active

---

## MVP Vision

Build a **functional, real-time virtual tabletop platform** that enables Game Masters and players to run tabletop RPG sessions online with essential tools: dice rolling, maps (custom and dynamically generated), tokens, real-time synchronization, chat, and AI-powered content streaming. The MVP focuses on proving the core architecture and user experience before expanding to specific game systems or premium features.

**Core Philosophy**: Build a solid, extensible foundation with generic game mechanics that can later support specific game systems (D&D 5e, Pathfinder 2e, Daggerheart, etc.) without requiring MVP users to commit to any particular ruleset.

---

## MVP Features (Priority Order)

### 1. Dice System
**Priority**: Critical - First Implementation

- Virtual dice rolling with standard polyhedral dice (d4, d6, d8, d10, d12, d20, d100)
- Dice expression parser (e.g., "2d6+3", "1d20+5 advantage")
- Roll history and results visible to all players
- GM ability to make hidden rolls
- Roll modifiers and basic arithmetic operations

**Success Criteria**: Players can roll any standard dice combination and see results instantly across all connected clients.

---

### 2. Maps
**Priority**: Critical - Second Implementation

Two map types supported:

#### A. Custom User-Uploaded Maps
- Image upload (PNG, JPEG, WebP)
- GM sets grid size and alignment
- Optional grid overlay (configurable on/off)
- Pan and zoom controls
- Map dimensions and metadata storage

#### B. Server-Generated Dynamic Maps
- Procedural map generation using AI/algorithms
- Configurable parameters (size, terrain type, complexity)
- Export/save generated maps for reuse
- Grid automatically aligned to generation

**Grid System**:
- GM-configurable grid snapping (on/off per map)
- Support for square and hex grids
- Configurable grid size (5ft, 10ft, etc.)

**Success Criteria**: GM can upload a custom map or generate a dynamic map, configure grid settings, and display it to all players in real-time.

---

### 3. Tokens
**Priority**: Critical - Third Implementation

- Token creation (image upload or placeholder icons)
- Drag-and-drop token placement on maps
- Grid snapping (respects map settings)
- Token visibility controls (player-owned vs GM-owned)
- Basic token properties:
  - Name
  - Size (1x1, 2x2, etc. grid squares)
  - Owner assignment
  - Visibility state (visible to all, GM only, specific players)
- Token selection and movement permissions
- Token layer management (tokens, objects, background)

**Success Criteria**: Players can move their assigned tokens on the map with proper permissions, while GM can control all tokens and manage visibility.

---

### 4. Basic Real-Time Synchronization
**Priority**: Critical - Fourth Implementation

- WebSocket-based real-time communication
- State synchronization across all connected clients:
  - Map changes (upload, switch, grid updates)
  - Token positions and properties
  - Dice rolls and results
  - Chat messages
- Conflict resolution for simultaneous edits
- Reconnection handling with state restoration
- Session persistence (save/restore game state)

**Success Criteria**: All players see the same game state within 100ms of any change, with graceful handling of disconnections.

---

### 5. Chat System
**Priority**: Core - Fifth Implementation

- Text-based chat interface
- Message types:
  - In-character (IC) messages
  - Out-of-character (OOC) messages
  - GM announcements (highlighted)
  - System messages (dice rolls, token movements)
- Chat history persistence
- Basic formatting (bold, italic, links)
- Whisper/private messages to GM or specific players
- Timestamp display

**Success Criteria**: Players can communicate via chat with proper message routing and history retention.

---

### 6. AI Content Streaming
**Priority**: Core - Sixth Implementation

- Integration with LLM API (e.g., Claude, OpenAI)
- GM-triggered content generation:
  - NPC dialogue and descriptions
  - Scene descriptions and flavor text
  - Quick story prompts and improvisation aids
- Streaming responses (progressive display)
- Context management (session history, character info)
- Generation history and re-roll capability

**Success Criteria**: GM can request AI-generated content that streams in real-time and enhances storytelling without disrupting gameplay.

---

### 7. Marketplace Foundation
**Priority**: Enhancement - Seventh Implementation

- User registration and profiles
- Content creator accounts (verified badge system)
- Asset upload system:
  - Maps (static images)
  - Tokens/character art
  - Content packs (bundled assets)
- Basic search and discovery
- Free asset downloads
- Asset preview before download
- Usage licensing display (personal use, commercial, etc.)

**Monetization Features**: Deferred (see Out of Scope)

**Success Criteria**: Content creators can upload assets, and GMs can browse, preview, and download free content for use in their games.

---

## Technical Scope for MVP

### Architecture Requirements

- **Frontend**: Modern web application (React/Vue/Svelte)
- **Backend**: FastAPI (Python) with WebSocket support
- **Database**: PostgreSQL for persistence
- **Real-Time**: WebSocket connections for live updates
- **File Storage**: Local filesystem or S3-compatible storage
- **AI Integration**: REST API calls to LLM providers

### Core Systems to Build

1. **Authentication & Authorization**
   - User accounts (email/password)
   - Session management
   - Role-based access (GM, Player)

2. **Game Session Management**
   - Create/join sessions via invite codes
   - Session state persistence
   - Player roster management

3. **Asset Management**
   - File upload handling
   - Image processing (thumbnails, optimization)
   - Asset metadata storage

4. **Real-Time Communication**
   - WebSocket message protocol
   - State synchronization engine
   - Event broadcasting system

5. **Generic Combat System**
   - Turn order tracking
   - Initiative rolling
   - Basic action economy (move, action, bonus action)
   - Health/resource tracking
   - No specific game rules implemented (extensible for later)

### Performance Targets

- **Latency**: <100ms for real-time updates within same region
- **Concurrent Users**: Support 8-10 players per session
- **Map Size**: Handle maps up to 8000x8000 pixels
- **Token Count**: 100+ tokens per map without performance degradation

### Testing Requirements

- Unit tests (80% coverage minimum)
- Integration tests for real-time sync
- End-to-end tests for critical user flows
- Load testing for multi-user sessions

---

## Out of Scope (Deferred Features)

### Not in MVP - Planned for Post-MVP

1. **Premium Tier & Monetization**
   - Paid asset sales
   - Subscription tiers
   - Payment processing
   - Revenue sharing for creators
   - **Reason**: Focus on building value and stability first

2. **Specific Game System Implementations**
   - D&D 5e ruleset
   - Pathfinder 2e ruleset
   - Daggerheart system
   - Character sheet automation
   - **Reason**: MVP uses generic mechanics; specific systems added after validation

3. **Voice/Video Chat**
   - Integrated voice channels
   - Video streaming
   - Screen sharing
   - **Reason**: Complex integration; users can use external tools (Discord) initially

4. **Advanced Scene Management**
   - Trigger zones (automated token detection)
   - Scene transitions and effects
   - Dynamic lighting and fog of war
   - Line-of-sight calculations
   - **Reason**: Nice-to-have features that add complexity

5. **Journal & Handout System**
   - GM notes and journals
   - Handouts for players
   - Rich text editing
   - **Reason**: Not critical for basic gameplay

6. **Compendium System**
   - Monster/NPC databases
   - Spell libraries
   - Item catalogs
   - **Reason**: Content management can be added iteratively

7. **Content Moderation**
   - Automated content scanning
   - User reporting system
   - Moderation dashboard
   - **Reason**: Lower priority until user base grows

8. **Accessibility Features**
   - Screen reader optimization
   - Colorblind modes
   - Keyboard navigation
   - **Reason**: Important but can be improved post-launch

9. **Analytics & Dashboards**
   - Usage metrics
   - Creator analytics
   - Session statistics
   - **Reason**: Nice-to-have for growth phase

### Explicitly Excluded from All Versions

- None identified at this time

---

## Success Criteria for MVP

### Functional Success

- [ ] **Complete Session Playable**: GM and 4-6 players can run a complete 3-4 hour game session using only MVP features
- [ ] **All Core Features Working**: Dice, maps (both types), tokens, chat, sync, and streaming all functional
- [ ] **Zero Critical Bugs**: No bugs that prevent core gameplay
- [ ] **Performance Targets Met**: Latency <100ms, supports 8-10 concurrent users

### Technical Success

- [ ] **Stable Architecture**: Core systems support future game system integrations without major refactoring
- [ ] **Test Coverage**: 80%+ unit test coverage on critical paths
- [ ] **Deployment Ready**: Docker containerization, CI/CD pipeline functional
- [ ] **Documentation Complete**: API docs, user guides, setup instructions

### User Success

- [ ] **GM Usability**: GM can set up and run a session in <15 minutes
- [ ] **Player Usability**: Players can join and participate without technical issues
- [ ] **Positive Feedback**: 8/10 or higher satisfaction rating from test users
- [ ] **Session Completion**: 90%+ of test sessions complete without technical interruptions

### Business Success (Validation)

- [ ] **Proof of Concept**: MVP demonstrates technical feasibility
- [ ] **User Interest**: 50+ beta testers signed up and active
- [ ] **Extensibility Validated**: Successfully add one mock game system after MVP completion
- [ ] **Market Fit Signals**: Positive feedback on core value proposition

---

## Next Steps After MVP

1. **User Feedback Collection**: Gather insights from beta testers
2. **First Game System Implementation**: Choose one game system (D&D 5e recommended) and build full integration
3. **Premium Tier Design**: Define monetization strategy based on proven value
4. **Advanced Features Prioritization**: Rank deferred features by user demand
5. **Scale Testing**: Test with larger user base and concurrent sessions

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-04 | 1.0 | Initial MVP scope definition | Claude Code |

---

**End of Document**
