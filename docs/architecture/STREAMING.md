# Streaming Integration

## Overview

The platform provides native streaming support as a free feature, enabling GMs and content creators to broadcast their sessions on Twitch, YouTube, and Kick with integrated overlays and stream-optimized views.

**Strategic Value:**
- Every stream is free marketing for the platform
- Streamers attract players who become paying customers
- Competitive advantage over VTTs that require third-party modules
- Creates discovery funnel: Watch stream → Join as player → Become GM

---

## Table of Contents

1. [Supported Platforms](#supported-platforms)
2. [Stream View Mode](#stream-view-mode)
3. [OBS Overlays](#obs-overlays)
4. [Platform Integration](#platform-integration)
5. [Stream Discovery](#stream-discovery)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)

---

## Supported Platforms

### Platform Comparison

| Platform | API Maturity | Integration Features | Priority |
|----------|--------------|---------------------|----------|
| **Twitch** | Mature | OAuth, embeds, chat, clips | Primary |
| **YouTube** | Mature | OAuth, embeds, live scheduling | Primary |
| **Kick** | New (2024) | Public API with chat, channel data | Secondary |

### Feature Support by Platform

| Feature | Twitch | YouTube | Kick |
|---------|--------|---------|------|
| OAuth Login | ✓ | ✓ | ✓ |
| Stream Status | ✓ | ✓ | ✓ |
| Viewer Count | ✓ | ✓ | ✓ |
| Embed Player | ✓ | ✓ | ✓ |
| Chat Integration | ✓ | ✓ | ✓ |
| Go Live Notification | ✓ | ✓ | ✓ |
| Clip Creation | ✓ | ✗ | ✗ |
| Schedule Integration | ✓ | ✓ | ✗ |

---

## Stream View Mode

### Concept

A dedicated, minimal UI specifically designed for streaming and recording. Inspired by FoundryVTT's Stream View module, which provides "a minimal UI view with automated camera work, ideal for streaming or recording games, without all the GM clutter."

### Access

```
URL: /campaign/:campaignId/stream
     /campaign/:campaignId/stream?token=<access_token>
```

### Features

#### Minimal UI
- No GM controls visible
- No player list sidebar
- No initiative tracker (unless in combat)
- Full-screen map view
- Optional subtle branding watermark

#### Automatic Camera

The stream view implements intelligent camera automation:

**Auto-Follow Mode:**
- Tracks player character tokens in the scene
- Adjusts camera focus to keep active tokens in view
- Smooth pan/zoom transitions
- Configurable padding around focused area

**Directed Mode:**
- Mirrors the GM's view exactly
- GM controls what viewers see
- Useful for dramatic reveals

**Combat Mode:**
- During combat, focuses on current combatant
- Tracks targets and measured templates
- Optional: follow controlling player's view

**Speaker Mode (if voice chat enabled):**
- Focus on currently speaking player's token
- Speaking indicator above token

### Stream View Configuration

```typescript
interface StreamViewConfig {
  // Camera behavior
  cameraMode: 'auto' | 'directed' | 'combat';
  autoCameraSmoothing: number; // 0-1, transition smoothness
  autoCameraPadding: number; // pixels around focused tokens
  
  // UI elements
  showInitiativeTracker: boolean;
  showTurnIndicator: boolean;
  showDiceRolls: boolean;
  showChatBubbles: boolean;
  
  // Branding
  showWatermark: boolean;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  customWatermarkUrl?: string;
  
  // Performance
  targetFPS: 30 | 60;
  qualityLevel: 'low' | 'medium' | 'high';
}
```

### Browser Source Usage

For OBS/Streamlabs:

1. Add Browser Source
2. URL: `https://app.yourvtt.com/campaign/:id/stream?token=xxx`
3. Right-click → Interact → Log in (one time)
4. Set dimensions to match canvas (1920x1080 recommended)
5. Optionally add chroma key for green screen background

---

## OBS Overlays

### Overview

Separate overlay endpoints designed for OBS Browser Sources. Each overlay:
- Has transparent background (or chroma key color)
- Receives real-time updates via WebSocket
- Is accessed via unique token (no login required)
- Supports custom styling

### Overlay Types

#### Dice Roll Overlay

Displays recent dice rolls with animations.

```
URL: /stream/overlay/dice/:token
```

**Display:**
```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐   │
│  │  [Portrait] Grimjaw             │   │
│  │  Attack Roll                    │   │
│  │  🎲 1d20+7 → [18] + 7 = 25     │   │
│  │  ★ CRITICAL HIT ★              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Portrait] Elara               │   │
│  │  Fireball Damage                │   │
│  │  🎲 8d6 → [3,5,2,6,4,1,6,5] = 32│   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Configuration:**
```typescript
interface DiceOverlayConfig {
  maxRolls: number;           // How many rolls to display
  displayDuration: number;    // Seconds before fade out
  showCharacterPortrait: boolean;
  showFormula: boolean;
  highlightCriticals: boolean;
  animationStyle: 'fade' | 'slide' | 'bounce';
  theme: 'dark' | 'light' | 'custom';
}
```

#### Party Stats Overlay

Shows character HP bars, conditions, and portraits.

```
URL: /stream/overlay/party/:token
```

**Display:**
```
┌─────────────────────────────────────────────────────────┐
│  [Portrait]  Grimjaw          ████████████░░░ 45/50 HP  │
│  [Portrait]  Elara            ██████░░░░░░░░░ 23/50 HP  │
│  [Portrait]  Thorin           ████████████████ 38/38 HP │
│  [Portrait]  Whisper    💀    ░░░░░░░░░░░░░░░  0/32 HP  │
│                                          [Poisoned]      │
└─────────────────────────────────────────────────────────┘
```

**Configuration:**
```typescript
interface PartyOverlayConfig {
  layout: 'vertical' | 'horizontal' | 'grid';
  showPortraits: boolean;
  showHPNumbers: boolean;
  showHPBars: boolean;
  showConditions: boolean;
  barStyle: 'solid' | 'segmented' | 'gradient';
  lowHPThreshold: number;     // Percentage to highlight
  characterOrder: 'initiative' | 'alphabetical' | 'custom';
}
```

#### Initiative Tracker Overlay

Shows current combat order.

```
URL: /stream/overlay/initiative/:token
```

**Display:**
```
┌─────────────────────────────────────┐
│  ROUND 3                            │
│                                     │
│  ► [Portrait] Grimjaw        22    │ ← Current turn
│    [Portrait] Goblin Chief   18    │
│    [Portrait] Elara          15    │
│    [Portrait] Goblin x3      12    │
│    [Portrait] Thorin          8    │
└─────────────────────────────────────┘
```

#### Chat Overlay

Shows in-character or out-of-character chat.

```
URL: /stream/overlay/chat/:token
```

**Display:**
```
┌─────────────────────────────────────────────────────────┐
│  Grimjaw: "I don't trust this tavern keeper..."         │
│                                                          │
│  Elara: "Neither do I. Did you notice his hands?"       │
│                                                          │
│  GM: The firelight flickers ominously as you speak.    │
└─────────────────────────────────────────────────────────┘
```

#### Custom Overlay

User-defined HTML/CSS overlay.

```
URL: /stream/overlay/custom/:token
```

Users can define layout using template variables:

**Available Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `{username}` | Player's display name | "Alex" |
| `{characterName}` | Character name | "Grimjaw" |
| `{characterPortrait}` | Portrait image URL | (URL) |
| `{rollFormula}` | Dice formula | "2d6+3" |
| `{rollResult}` | Final total | "11" |
| `{rollDice}` | Individual dice | "[4, 5]" |
| `{isCritical}` | Critical hit flag | "true" |
| `{currentHp}` | Current HP | "32" |
| `{maxHp}` | Maximum HP | "50" |
| `{hpPercent}` | HP as percentage | "64" |
| `{conditions}` | Active conditions | "Poisoned, Prone" |
| `{initiativeOrder}` | Position in initiative | "3" |
| `{isCurrentTurn}` | Is it their turn | "true" |
| `{campaignName}` | Campaign name | "Curse of Strahd" |
| `{sessionNumber}` | Session count | "15" |

### Overlay Real-Time Protocol

Overlays receive updates via WebSocket:

```typescript
// WebSocket connection
const ws = new WebSocket('wss://app.yourvtt.com/ws/overlay/:token');

// Message types
interface OverlayMessage {
  type: 'dice_roll' | 'hp_change' | 'initiative_update' | 
        'chat_message' | 'combat_start' | 'combat_end' |
        'condition_change' | 'turn_change';
  payload: any;
  timestamp: number;
}

// Example: Dice roll event
{
  type: 'dice_roll',
  payload: {
    player: 'Thorin',
    character: 'Grimjaw the Bold',
    formula: '1d20+7',
    result: {
      dice: [{ sides: 20, value: 18 }],
      modifier: 7,
      total: 25
    },
    label: 'Attack Roll',
    isCritical: false,
    isFumble: false
  },
  timestamp: 1699900000000
}

// Example: HP change event
{
  type: 'hp_change',
  payload: {
    characterId: 'uuid',
    characterName: 'Grimjaw',
    previousHp: 45,
    currentHp: 32,
    maxHp: 50,
    damage: 13,
    source: 'Goblin Archer'
  },
  timestamp: 1699900001000
}

// Example: Turn change
{
  type: 'turn_change',
  payload: {
    round: 3,
    currentCombatant: {
      id: 'uuid',
      name: 'Grimjaw',
      initiative: 22,
      isPlayer: true
    },
    nextCombatant: {
      id: 'uuid',
      name: 'Goblin Chief',
      initiative: 18,
      isPlayer: false
    }
  },
  timestamp: 1699900002000
}
```

### Overlay Templates

Pre-built themes available:

| Template | Description | Style |
|----------|-------------|-------|
| Classic Dice | Clean roll display with fade animations | Minimal |
| RPG Party Frame | Fantasy-themed HP bars with ornate borders | Fantasy |
| Modern Stats | Sleek, modern stat display | Contemporary |
| Retro Terminal | Green-on-black terminal style | Nostalgic |
| Combat Tracker | Minimal initiative display | Functional |
| Cozy Stream | Warm colors, rounded corners | Friendly |

---

## Platform Integration

### OAuth Connection Flow

```
User clicks "Connect Twitch" (or YouTube/Kick)
         │
         ▼
┌─────────────────────────────────────┐
│  Redirect to platform OAuth         │
│  Scopes requested:                  │
│  - Read channel info                │
│  - Read stream status               │
│  (minimal permissions needed)       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  User authorizes                    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Store tokens                       │
│  Fetch channel info                 │
│  Link to VTT account                │
└─────────────────────────────────────┘
```

### Twitch Integration

**Required Scopes:**
- `user:read:email` — Verify account
- `channel:read:stream_key` — Optional: auto-configure

**Embed Requirements:**
- Twitch embeds require a `parent` parameter specifying allowed domains
- Must use HTTPS
- Must not obscure embed elements

**API Endpoints Used:**
- `GET /helix/streams` — Check if user is live
- `GET /helix/users` — Get channel info

### YouTube Integration

**Required Scopes:**
- `https://www.googleapis.com/auth/youtube.readonly` — Read channel/stream info

**Live Stream Embedding:**
```html
<iframe 
  src="https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID"
  frameborder="0" 
  allowfullscreen>
</iframe>
```

**API Endpoints Used:**
- `GET /youtube/v3/liveBroadcasts` — List live broadcasts
- `GET /youtube/v3/liveStreams` — Get stream details

### Kick Integration

Kick launched their public API in 2024 with endpoints covering subscriptions, follows, chat, and channel data.

**API Endpoints Used:**
- `GET /api/v1/channels/{username}` — Channel info
- `GET /api/v1/channels/{username}/livestream` — Stream status

---

## Stream Discovery

### Public Stream Directory

A page showcasing live streams using the platform:

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔴 LIVE NOW ON [PLATFORM NAME]                      [Filter ▼]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │  Thumbnail  │  │  Thumbnail  │  │  Thumbnail  │  │  Thumbnail  ││
│  │   (Live)    │  │   (Live)    │  │   (Live)    │  │   (Live)    ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤│
│  │ GM: Dragon  │  │ GM: Dice... │  │ GM: TabTop  │  │ GM: RPGpro  ││
│  │ D&D 5e      │  │ Pathfinder  │  │ Call of...  │  │ Blades in...││
│  │ 👁 234      │  │ 👁 89       │  │ 👁 156      │  │ 👁 45       ││
│  │ 🟣 Twitch   │  │ 🔴 YouTube  │  │ 🟢 Kick     │  │ 🟣 Twitch   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│                                                                      │
│  [Load More]                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Discovery Features

- **Filters:** Platform, game system, language, viewer count
- **Sort:** Viewers (high to low), recently started, alphabetical
- **Search:** GM name, campaign name, game system
- **Integration with marketplace:** Show if GM offers paid games

### Stream-to-Booking Funnel

```
Viewer discovers stream
         │
         ▼
┌─────────────────────────────────────┐
│  Watches stream on Twitch/YouTube   │
│  Sees "Powered by [Platform]" badge │
│  and booking link in description    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Clicks through to GM profile       │
│  Sees reviews, other games          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Books a seat in upcoming game      │
│  → New paying customer!             │
└─────────────────────────────────────┘
```

---

## Database Schema

```sql
-- Streaming platform connections
CREATE TABLE streaming_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    platform VARCHAR(20) NOT NULL, -- 'twitch', 'youtube', 'kick'
    
    -- OAuth tokens (encrypted at rest)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Platform-specific data
    platform_user_id VARCHAR(255) NOT NULL,
    platform_username VARCHAR(255),
    channel_id VARCHAR(255),
    channel_url TEXT,
    
    -- Permissions granted
    scopes TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_validated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform)
);

CREATE INDEX idx_streaming_user ON streaming_connections(user_id);

-- Stream overlay configurations
CREATE TABLE stream_overlays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Overlay identification
    overlay_type VARCHAR(50) NOT NULL, -- 'dice', 'party', 'initiative', 'chat', 'custom'
    name VARCHAR(100) NOT NULL,
    
    -- Access token for the overlay URL (public, no auth needed)
    access_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Configuration
    config JSONB DEFAULT '{}',
    
    -- Custom styling (for custom overlays)
    custom_css TEXT,
    custom_html TEXT,
    template_id UUID REFERENCES overlay_templates(id),
    
    -- Appearance
    background_color VARCHAR(7) DEFAULT '#00FF00', -- Chroma key green
    transparent BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_overlays_campaign ON stream_overlays(campaign_id);
CREATE INDEX idx_overlays_token ON stream_overlays(access_token);

-- Overlay templates (pre-built themes)
CREATE TABLE overlay_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    overlay_type VARCHAR(50) NOT NULL,
    
    -- Template content
    html_template TEXT NOT NULL,
    css_template TEXT NOT NULL,
    default_config JSONB DEFAULT '{}',
    
    -- Preview
    preview_image_url TEXT,
    
    -- Availability
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track active streams for discovery
CREATE TABLE active_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Links
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streaming_connection_id UUID NOT NULL REFERENCES streaming_connections(id) ON DELETE CASCADE,
    gm_profile_id UUID REFERENCES gm_profiles(id), -- If they're a paid GM
    
    -- Platform info
    platform VARCHAR(20) NOT NULL,
    stream_id VARCHAR(255), -- Platform's stream ID
    stream_url TEXT NOT NULL,
    
    -- Stream metadata
    title VARCHAR(200),
    game_system VARCHAR(100),
    viewer_count INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    
    -- Discoverability
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE, -- Staff picks
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streams_active ON active_streams(ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_streams_platform ON active_streams(platform) WHERE ended_at IS NULL;
CREATE INDEX idx_streams_viewers ON active_streams(viewer_count DESC) WHERE ended_at IS NULL;

-- Stream view access tokens
CREATE TABLE stream_view_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Optional restrictions
    expires_at TIMESTAMPTZ,
    allowed_ips INET[],
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stream_tokens ON stream_view_tokens(token);

-- Stream view configuration per campaign
CREATE TABLE stream_view_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID UNIQUE NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Camera settings
    camera_mode VARCHAR(20) DEFAULT 'auto', -- 'auto', 'directed', 'combat'
    camera_smoothing DECIMAL(3,2) DEFAULT 0.5,
    camera_padding INTEGER DEFAULT 100,
    
    -- UI visibility
    show_initiative_tracker BOOLEAN DEFAULT TRUE,
    show_turn_indicator BOOLEAN DEFAULT TRUE,
    show_dice_rolls BOOLEAN DEFAULT TRUE,
    show_chat_bubbles BOOLEAN DEFAULT FALSE,
    
    -- Branding
    show_watermark BOOLEAN DEFAULT TRUE,
    watermark_position VARCHAR(20) DEFAULT 'bottom-right',
    custom_watermark_url TEXT,
    
    -- Performance
    target_fps INTEGER DEFAULT 30,
    quality_level VARCHAR(10) DEFAULT 'high',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Platform Connection Endpoints

```
GET    /api/v1/streaming/platforms
       Response: { platforms: [{ id, name, connected, username? }] }

GET    /api/v1/streaming/connect/:platform
       Redirects to OAuth flow

GET    /api/v1/streaming/connect/:platform/callback
       Handles OAuth callback

DELETE /api/v1/streaming/connections/:platform
       Disconnects platform

GET    /api/v1/streaming/connections
       Response: { connections: StreamingConnection[] }
```

### Overlay Endpoints

```
GET    /api/v1/streaming/overlays
       Query: ?campaign_id=
       Response: { overlays: StreamOverlay[] }

POST   /api/v1/streaming/overlays
       Body: { campaign_id, overlay_type, name, config? }
       Response: { overlay: StreamOverlay, url: string }

GET    /api/v1/streaming/overlays/:id
       Response: { overlay: StreamOverlay }

PATCH  /api/v1/streaming/overlays/:id
       Body: { name?, config?, custom_css?, custom_html? }
       Response: { overlay: StreamOverlay }

DELETE /api/v1/streaming/overlays/:id
       Response: { success: true }

POST   /api/v1/streaming/overlays/:id/regenerate-token
       Response: { overlay: StreamOverlay, newUrl: string }
```

### Template Endpoints

```
GET    /api/v1/streaming/templates
       Query: ?overlay_type=
       Response: { templates: OverlayTemplate[] }

GET    /api/v1/streaming/templates/:id
       Response: { template: OverlayTemplate }
```

### Live Stream Endpoints

```
POST   /api/v1/streaming/live/start
       Body: { campaign_id, platform, stream_url, title?, game_system? }
       Response: { stream: ActiveStream }

POST   /api/v1/streaming/live/end
       Body: { stream_id }
       Response: { stream: ActiveStream }

PATCH  /api/v1/streaming/live/update
       Body: { stream_id, viewer_count?, title? }
       Response: { stream: ActiveStream }

GET    /api/v1/streaming/live/discover
       Query: ?platform=&system=&sort=&page=
       Response: { streams: ActiveStream[], total: number }
```

### Stream View Endpoints

```
GET    /api/v1/streaming/stream-view/config/:campaignId
       Response: { config: StreamViewConfig }

PATCH  /api/v1/streaming/stream-view/config/:campaignId
       Body: { camera_mode?, show_initiative_tracker?, ... }
       Response: { config: StreamViewConfig }

POST   /api/v1/streaming/stream-view/tokens
       Body: { campaign_id, expires_at? }
       Response: { token: string, url: string }

DELETE /api/v1/streaming/stream-view/tokens/:id
       Response: { success: true }
```

### Public Overlay Endpoint (No Auth)

```
GET    /stream/overlay/:type/:token
       Renders overlay HTML page for OBS

WS     /ws/overlay/:token
       WebSocket for real-time overlay updates
```

---

*For frontend implementation of overlays and stream view, see the component documentation.*
