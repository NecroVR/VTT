# Virtual Table Top (VTT) - Project Outline

## Project Vision

Create a modern, intuitive Virtual Table Top platform that enables tabletop RPG enthusiasts to play their favorite games online with the same engagement and immersion as in-person sessions. The system should be accessible, performant, and feature-rich while maintaining ease of use for both game masters and players.

## Core Goals

1. **User-Friendly Experience**: Intuitive interface requiring minimal learning curve
2. **Real-Time Performance**: Seamless synchronization across all connected clients
3. **Flexibility**: Support for various RPG systems and playstyles
4. **Scalability**: Handle multiple concurrent games with varying player counts
5. **Extensibility**: Architecture that allows for future feature additions
6. **Reliability**: Stable connections and persistent game state

## Core Features (Prioritized)

### Phase 1: Foundation (MVP)

#### Priority 1 - Essential Infrastructure
- **User Authentication & Authorization**
  - User registration and login
  - Session management
  - Password recovery
  - Role-based access control (GM vs Player)

- **Campaign/Game Management**
  - Create and manage campaigns
  - Invite players to campaigns
  - Campaign settings and configuration
  - Persistent game state storage

- **Basic Real-Time System**
  - WebSocket connection management
  - Client synchronization
  - Connection resilience and reconnection
  - Heartbeat/keepalive mechanism

#### Priority 2 - Core Gameplay Features
- **Interactive Map System**
  - Map upload and display
  - Grid overlay (square/hex)
  - Zoom and pan controls
  - Grid configuration (size, visibility)
  - Background image scaling

- **Token System**
  - Token creation and placement
  - Token movement (drag-and-drop)
  - Token customization (image, name, size)
  - Token ownership and permissions
  - Token visibility control

- **Dice Rolling System**
  - Standard dice notation parser (1d20, 3d6+5, etc.)
  - Roll history
  - Public vs private rolls
  - Roll result display
  - Common dice presets

- **Chat System**
  - Text messaging
  - System messages for game events
  - Dice roll integration in chat
  - Chat history
  - In-character vs out-of-character modes

### Phase 2: Enhanced Gameplay

#### Priority 3 - Advanced Features
- **Character Sheet System**
  - Character creation and management
  - Stat tracking and modification
  - Inventory management
  - Notes and biography
  - Character sheet templates (system-agnostic)

- **Asset Management**
  - Image upload and storage
  - Asset library/browser
  - Thumbnail generation
  - Asset organization (folders/tags)
  - Asset sharing between campaigns

- **Fog of War**
  - Dynamic vision system
  - Line-of-sight calculation
  - GM-controlled reveal/hide
  - Player vision based on token position
  - Light source system

- **Initiative Tracker**
  - Turn order management
  - Initiative rolling
  - Turn advancement
  - Status effect tracking
  - Combat timer

### Phase 3: Polish & Advanced Features

#### Priority 4 - Enhanced Experience
- **Advanced Map Features**
  - Multiple map layers
  - Drawing tools (shapes, freehand)
  - Measurement tools
  - Dynamic lighting
  - Animated tokens
  - Map presets and templates

- **Audio Integration**
  - Background music
  - Sound effects
  - Ambient soundscapes
  - Volume controls per client
  - Audio asset library

- **Macros & Automation**
  - Custom macro creation
  - Roll templates
  - Automated actions
  - Script system (for GMs)

- **Mobile Support**
  - Responsive design
  - Touch controls
  - Mobile-optimized UI
  - Progressive Web App (PWA)

## Technical Considerations

### Architecture Decisions Needed

1. **Frontend Framework**
   - Options: React, Vue, Svelte, Angular
   - Considerations: Component reusability, real-time updates, performance

2. **Backend Framework**
   - Options: Node.js (Express/Fastify), Python (FastAPI/Django), Go
   - Requirements: WebSocket support, scalability, development speed

3. **Database Selection**
   - Options: PostgreSQL, MongoDB, MySQL
   - Requirements: JSON support, relationships, performance at scale

4. **Real-Time Communication**
   - Options: Socket.io, native WebSockets, Server-Sent Events
   - Requirements: Reliability, browser support, fallback mechanisms

5. **File Storage**
   - Options: Local filesystem, S3-compatible storage, CDN
   - Requirements: Scalability, cost, performance

6. **Authentication Strategy**
   - Options: JWT, Session-based, OAuth integration
   - Requirements: Security, scalability, user experience

### Performance Requirements

- **Latency**: < 100ms for game actions (token movement, dice rolls)
- **Concurrent Users**: Support 50+ concurrent games (5-8 players each)
- **Asset Loading**: < 2s for map loads
- **Uptime**: 99.5% availability target

### Security Considerations

- Secure authentication and session management
- Input validation and sanitization
- Rate limiting for API endpoints
- File upload restrictions and validation
- XSS and CSRF protection
- Data encryption (in transit and at rest)

## Development Phases

### Phase 1: Foundation (Weeks 1-4)
- Project setup and infrastructure
- Database schema design
- User authentication system
- Basic campaign management
- WebSocket infrastructure

### Phase 2: Core Gameplay (Weeks 5-10)
- Map system implementation
- Token system
- Dice rolling engine
- Chat system
- Basic UI/UX

### Phase 3: Character Management (Weeks 11-14)
- Character sheet system
- Asset management
- Character-token linking
- Enhanced UI components

### Phase 4: Advanced Features (Weeks 15-20)
- Fog of war implementation
- Initiative tracker
- Advanced map features
- Drawing tools
- Performance optimization

### Phase 5: Polish & Launch Prep (Weeks 21-24)
- UI/UX refinement
- Bug fixes and testing
- Documentation completion
- Deployment preparation
- Beta testing

## Open Questions & Decisions

### Technical Decisions
- [ ] Choose frontend framework
- [ ] Choose backend framework and language
- [ ] Select database system
- [ ] Define API architecture (REST, GraphQL, hybrid)
- [ ] Choose file storage solution
- [ ] Select hosting/deployment platform
- [ ] Define testing strategy and frameworks

### Feature Decisions
- [ ] Support for multiple RPG systems vs system-agnostic approach?
- [ ] Built-in character sheet templates or user-defined?
- [ ] Video/voice chat integration or external tool recommendation?
- [ ] Free tier limitations (if any)
- [ ] Premium features and monetization strategy
- [ ] Maximum file size for asset uploads
- [ ] Maximum number of concurrent games per server instance

### Design Decisions
- [ ] UI/UX design language and theme
- [ ] Responsive breakpoints and mobile support depth
- [ ] Accessibility requirements (WCAG compliance level)
- [ ] Internationalization support
- [ ] Dark mode support

### Process Decisions
- [ ] Version control workflow (Git flow, trunk-based)
- [ ] Code review process
- [ ] CI/CD pipeline setup
- [ ] Documentation standards
- [ ] Testing coverage requirements
- [ ] Release schedule and versioning strategy

## Success Metrics

- User engagement (session duration, frequency)
- System performance (latency, uptime)
- User satisfaction (feedback, ratings)
- Feature adoption rates
- Error rates and bug reports
- Community growth

## Next Steps

1. Review and refine this outline with team/stakeholders
2. Make key technical decisions (framework, database, etc.)
3. Create detailed architecture documentation
4. Design database schema
5. Set up development environment
6. Begin Phase 1 implementation

---

**Document Status**: Initial Draft
**Last Updated**: 2025-12-04
**Next Review**: After technical decisions are finalized
