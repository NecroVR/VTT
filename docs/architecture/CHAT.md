# Integrated Chat Services

## Overview

The platform provides fully integrated text, voice, and video chat services, eliminating the need for third-party tools like Discord, Zoom, or Google Meet. The voice/video system integrates directly with the streaming features, allowing GMs to broadcast their sessions to Twitch, YouTube, and Kick with a single click.

**Key Value Proposition:**
- All-in-one solution: VTT + Voice/Video + Streaming in one platform
- No need for Discord servers, Zoom links, or OBS setup for basic streaming
- Lower barrier to entry for new GMs
- Consistent experience across all games

---

## Table of Contents

1. [Technology Choice](#technology-choice)
2. [Text Chat System](#text-chat-system)
3. [Voice & Video Chat](#voice--video-chat)
4. [Streaming Integration](#streaming-integration)
5. [Recording & Playback](#recording--playback)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Cost Analysis](#cost-analysis)

---

## Technology Choice

### LiveKit

After evaluating multiple options (Twilio, Agora, Daily, 100ms, Jitsi), **LiveKit** is the recommended solution:

| Criteria | LiveKit | Why It Wins |
|----------|---------|-------------|
| **Open Source** | ✓ Apache 2.0 | Can self-host for cost control |
| **RTMP Egress** | ✓ Native | Stream directly to Twitch/YouTube |
| **Multi-streaming** | ✓ Built-in | Broadcast to multiple platforms simultaneously |
| **Recording** | ✓ MP4/HLS | Session recording for playback |
| **Pricing** | Usage-based | $0.18/GB after 50GB free; self-host for free |
| **Quality** | WebRTC SFU | Low latency, scales to large rooms |
| **SDKs** | All platforms | JS, React, iOS, Android, Unity, etc. |

### LiveKit Capabilities

From the research:

- LiveKit Egress supports recording to an MP4 file or HLS segments, as well as exporting to livestreaming services like YouTube Live, Twitch, and Facebook via RTMP

- Turnkey multistreaming allows you to transcode sessions to RTMP at the edge and send them out to services like Twitch, Kick, YouTube, or TikTok

- When multiple RTMP URLs are specified, LiveKit would multi-cast to all of them at the same time. Stream URLs can be changed even after the egress has started

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATED CHAT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Player 1   │    │   Player 2   │    │     GM       │                  │
│  │  (Browser)   │    │  (Browser)   │    │  (Browser)   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                           │
│         └───────────────────┼───────────────────┘                           │
│                             │                                                │
│                             ▼                                                │
│                   ┌─────────────────────┐                                   │
│                   │   LiveKit Server    │                                   │
│                   │   (SFU - WebRTC)    │                                   │
│                   └──────────┬──────────┘                                   │
│                              │                                               │
│              ┌───────────────┼───────────────┐                              │
│              │               │               │                              │
│              ▼               ▼               ▼                              │
│    ┌─────────────────┐ ┌──────────┐ ┌────────────────┐                     │
│    │  Egress Service │ │ Recording│ │ Text Chat API  │                     │
│    │  (RTMP Out)     │ │ (MP4/HLS)│ │ (WebSocket)    │                     │
│    └────────┬────────┘ └────┬─────┘ └────────────────┘                     │
│             │               │                                               │
│    ┌────────┴────────┐      │                                               │
│    │                 │      ▼                                               │
│    ▼                 ▼    ┌────────────┐                                   │
│ ┌──────┐         ┌──────┐│   S3/R2    │                                   │
│ │Twitch│         │YouTube││  Storage   │                                   │
│ └──────┘         └──────┘└────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Text Chat System

### Channel Types

| Channel Type | Description | Visibility |
|--------------|-------------|------------|
| **In-Character (IC)** | Roleplay dialogue | All players |
| **Out-of-Character (OOC)** | Player discussion | All players |
| **GM Notes** | GM-only channel | GM only |
| **Whisper** | Private between users | Selected users |
| **System** | Dice rolls, announcements | Depends on roll type |

### Message Types

```typescript
interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  
  // Content
  content: string;
  contentType: 'text' | 'roll' | 'emote' | 'system' | 'card';
  
  // For dice rolls
  rollData?: {
    formula: string;
    dice: DieResult[];
    modifier: number;
    total: number;
    label?: string;
    isSecret: boolean;
    isCritical: boolean;
    isFumble: boolean;
  };
  
  // For card/handout shares
  cardData?: {
    type: 'character' | 'item' | 'handout';
    entityId: string;
    preview: object;
  };
  
  // Whisper recipients
  whisperTo?: string[];
  
  // Threading
  replyTo?: string;
  
  // Metadata
  createdAt: Date;
  editedAt?: Date;
}
```

### Chat Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/roll` | Roll dice | `/roll 2d20kh1+5 Attack` |
| `/r` | Roll shorthand | `/r d20` |
| `/gmroll` | Secret roll (GM sees) | `/gmroll d20` |
| `/whisper @user` | Private message | `/whisper @Alex Hey!` |
| `/w` | Whisper shorthand | `/w @Alex Check this out` |
| `/emote` | Action/emote | `/emote draws his sword` |
| `/me` | Emote shorthand | `/me sighs deeply` |
| `/desc` | Scene description (GM) | `/desc The room falls silent...` |
| `/ooc` | Out-of-character | `/ooc brb getting water` |

### Text Chat Features

- **Markdown support** — Bold, italic, links, code blocks
- **@mentions** — Notify specific users
- **Emoji reactions** — React to messages
- **Message editing** — Edit within 5 minutes
- **Message deletion** — Delete your own messages
- **Pin messages** — GM can pin important info
- **Search** — Full-text search of chat history
- **Export** — Download chat log as text/JSON

---

## Voice & Video Chat

### Room Configuration

```typescript
interface VoiceVideoConfig {
  // Participants
  maxParticipants: number; // Default: 10 for TTRPG sessions
  
  // Audio
  audioEnabled: boolean;
  noiseSuppressionEnabled: boolean;
  echoCancellationEnabled: boolean;
  
  // Video
  videoEnabled: boolean;
  maxVideoQuality: '720p' | '1080p' | '4k';
  simulcastEnabled: boolean; // Multiple quality layers
  
  // Features
  screenShareEnabled: boolean;
  recordingEnabled: boolean;
  
  // Streaming
  streamingEnabled: boolean;
  streamDestinations: StreamDestination[];
}

interface StreamDestination {
  platform: 'twitch' | 'youtube' | 'kick' | 'custom';
  rtmpUrl: string;
  streamKey: string;
}
```

### Participant Roles

| Role | Capabilities |
|------|--------------|
| **Host (GM)** | Full control: mute all, kick, recording, streaming |
| **Co-Host** | Can mute others, manage screen share |
| **Participant** | Standard audio/video, can screen share if allowed |
| **Spectator** | View/listen only, cannot transmit |

### Audio Features

- **Spatial audio** (optional) — Position audio based on token location
- **Push-to-talk** — Optional PTT mode
- **Voice activity detection** — Auto-unmute on speech
- **Per-user volume** — Adjust individual volumes
- **Noise suppression** — AI-powered background noise removal
- **Echo cancellation** — Prevent feedback loops

### Video Features

- **Adaptive quality** — Auto-adjust based on bandwidth
- **Simulcast** — Multiple quality streams for mixed connections
- **Virtual backgrounds** — Blur or replace background
- **Spotlight** — Highlight active speaker
- **Gallery view** — See all participants
- **Picture-in-picture** — Pop out video while viewing map

### Screen Sharing

- **Application window** — Share specific app
- **Full screen** — Share entire display
- **Browser tab** — Share single tab (with audio)
- **GM map view** — Share the VTT canvas directly

---

## Streaming Integration

### One-Click Streaming

The platform enables GMs to stream their sessions without OBS or complex setup:

```
GM clicks "Go Live"
         │
         ▼
┌─────────────────────────────────────┐
│  Select streaming platforms         │
│  ☑ Twitch  ☐ YouTube  ☐ Kick       │
│                                     │
│  Select layout:                     │
│  ○ Full VTT (map focus)            │
│  ● Video + VTT (picture-in-picture)│
│  ○ Webcams only                     │
│                                     │
│  [Start Streaming]                  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  LiveKit Egress Service             │
│  - Composites video + VTT view     │
│  - Encodes to RTMP                 │
│  - Sends to selected platforms     │
└─────────────────────────────────────┘
```

### Stream Composition Templates

LiveKit's egress service uses a web-based compositor. We provide pre-built templates:

#### Template: VTT Focus
```
┌─────────────────────────────────────┐
│                                     │
│         MAP / VTT VIEW              │
│                                     │
│                                     │
│  ┌─────┐                            │
│  │ GM  │  [Dice Overlay]            │
│  │ cam │                            │
│  └─────┘                            │
└─────────────────────────────────────┘
```

#### Template: Video Conference
```
┌─────────────────────────────────────┐
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐│
│  │ P1  │  │ P2  │  │ P3  │  │ P4  ││
│  └─────┘  └─────┘  └─────┘  └─────┘│
│          ┌───────────────┐          │
│          │      GM       │          │
│          │   (larger)    │          │
│          └───────────────┘          │
│  [Campaign: Curse of Strahd]        │
└─────────────────────────────────────┘
```

#### Template: Hybrid
```
┌─────────────────────────────────────┐
│                          ┌─────────┐│
│                          │  ┌───┐  ││
│      MAP / VTT           │  │GM │  ││
│                          │  └───┘  ││
│                          │ ┌─┐┌─┐  ││
│                          │ │1││2│  ││
│                          │ └─┘└─┘  ││
│ [Dice Roll] [Initiative] │ ┌─┐┌─┐  ││
│                          │ │3││4│  ││
│                          │ └─┘└─┘  ││
└─────────────────────────────────────┘
```

### Multi-Platform Streaming

From the research: When multiple RTMP URLs are specified, LiveKit would multi-cast to all of them at the same time. Stream URLs can be changed even after the egress has started with UpdateStream

```typescript
// Start streaming to multiple platforms
const streamRequest = {
  roomName: 'campaign-123',
  layout: 'hybrid-template',
  stream: {
    protocol: 'RTMP',
    urls: [
      'rtmp://live.twitch.tv/app/<twitch-stream-key>',
      'rtmp://a.rtmp.youtube.com/live2/<youtube-stream-key>',
      'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/<kick-stream-key>'
    ]
  }
};
```

### Streaming Quality Settings

| Preset | Resolution | Bitrate | FPS | Use Case |
|--------|------------|---------|-----|----------|
| Low | 720p | 2.5 Mbps | 30 | Limited bandwidth |
| Medium | 1080p | 4.5 Mbps | 30 | Standard streaming |
| High | 1080p | 6 Mbps | 60 | High quality |
| Source | 1080p | 8 Mbps | 60 | Best quality |

---

## Recording & Playback

### Recording Options

| Type | Description | Output |
|------|-------------|--------|
| **Full Session** | Entire room composite | MP4 file |
| **Audio Only** | Just the audio | MP3/AAC file |
| **Individual Tracks** | Separate file per participant | Multiple MP4s |
| **HLS Segments** | For live playback | M3U8 + TS files |

### Recording Storage

Recordings are stored in S3-compatible storage (Cloudflare R2 recommended):

```
/recordings
  /{campaign_id}
    /{session_date}
      /session_full.mp4
      /session_audio.mp3
      /individual/
        /{participant_id}.mp4
      /metadata.json
```

### Playback Features

- **Session archive** — Watch past sessions
- **Timestamp markers** — Jump to combat, key moments
- **Playback speed** — 0.5x to 2x speed
- **Chapter navigation** — GM-marked chapters
- **Sharing** — Share recording link with party members
- **Download** — Download MP4 for offline viewing

### Privacy & Consent

- Recording requires opt-in from all participants
- Indicator shown when recording is active
- Participants can request recording deletion
- Retention policy configurable (default: 90 days)

---

## Database Schema

### Voice/Video Tables

```sql
-- Voice/Video rooms (1:1 with campaign sessions)
CREATE TABLE av_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- LiveKit room info
    livekit_room_name VARCHAR(255) UNIQUE NOT NULL,
    livekit_room_sid VARCHAR(255),
    
    -- Configuration
    config JSONB DEFAULT '{
      "maxParticipants": 10,
      "audioEnabled": true,
      "videoEnabled": true,
      "screenShareEnabled": true,
      "recordingEnabled": false,
      "streamingEnabled": false
    }',
    
    -- Status
    status VARCHAR(20) DEFAULT 'inactive', -- 'inactive', 'active', 'streaming', 'recording'
    
    -- Stats
    participant_count INTEGER DEFAULT 0,
    peak_participants INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_av_rooms_campaign ON av_rooms(campaign_id);
CREATE INDEX idx_av_rooms_livekit ON av_rooms(livekit_room_name);

-- Room participants
CREATE TABLE av_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES av_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- LiveKit participant info
    livekit_identity VARCHAR(255) NOT NULL,
    livekit_sid VARCHAR(255),
    
    -- Role
    role VARCHAR(20) DEFAULT 'participant', -- 'host', 'co_host', 'participant', 'spectator'
    
    -- State
    audio_enabled BOOLEAN DEFAULT TRUE,
    video_enabled BOOLEAN DEFAULT FALSE,
    screen_sharing BOOLEAN DEFAULT FALSE,
    
    -- Stats
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    total_speaking_time_seconds INTEGER DEFAULT 0,
    
    UNIQUE(room_id, user_id)
);

CREATE INDEX idx_av_participants_room ON av_participants(room_id);
CREATE INDEX idx_av_participants_user ON av_participants(user_id);

-- Streaming sessions (egress)
CREATE TABLE stream_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES av_rooms(id) ON DELETE CASCADE,
    
    -- LiveKit egress info
    livekit_egress_id VARCHAR(255) NOT NULL,
    
    -- Destinations
    destinations JSONB NOT NULL, -- Array of {platform, url, status}
    
    -- Configuration
    layout_template VARCHAR(50) DEFAULT 'hybrid',
    quality_preset VARCHAR(20) DEFAULT 'medium',
    
    -- Status
    status VARCHAR(20) DEFAULT 'starting', -- 'starting', 'active', 'stopping', 'stopped', 'failed'
    error_message TEXT,
    
    -- Stats
    viewer_count INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_stream_sessions_room ON stream_sessions(room_id);

-- Recordings
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES av_rooms(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- LiveKit egress info
    livekit_egress_id VARCHAR(255),
    
    -- Recording type
    recording_type VARCHAR(20) NOT NULL, -- 'composite', 'audio_only', 'individual', 'hls'
    
    -- Storage
    storage_provider VARCHAR(20) DEFAULT 's3', -- 's3', 'r2', 'gcs'
    storage_bucket VARCHAR(100),
    storage_path TEXT,
    
    -- File info
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'recording', -- 'recording', 'processing', 'ready', 'failed', 'deleted'
    error_message TEXT,
    
    -- Metadata
    title VARCHAR(200),
    description TEXT,
    chapter_markers JSONB DEFAULT '[]',
    
    -- Access control
    visibility VARCHAR(20) DEFAULT 'party', -- 'private', 'party', 'public'
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- For retention policy
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recordings_room ON recordings(room_id);
CREATE INDEX idx_recordings_campaign ON recordings(campaign_id);
CREATE INDEX idx_recordings_status ON recordings(status) WHERE status = 'ready';
```

### Extended Chat Tables

```sql
-- Add voice/video reference to chat channels
ALTER TABLE chat_channels ADD COLUMN 
    av_room_id UUID REFERENCES av_rooms(id) ON DELETE SET NULL;

-- Voice activity log (for speaking time tracking)
CREATE TABLE voice_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES av_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

CREATE INDEX idx_voice_activity_room ON voice_activity_log(room_id, started_at);

-- Recording access grants
CREATE TABLE recording_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(recording_id, user_id)
);
```

---

## API Endpoints

### Voice/Video Room Endpoints

```
POST   /api/v1/campaigns/:id/av/start
       Start voice/video room for campaign
       Request: { config?: AVConfig }
       Response: { room: AVRoom, token: string }

POST   /api/v1/campaigns/:id/av/stop
       End the voice/video session
       Response: { room: AVRoom }

GET    /api/v1/campaigns/:id/av/status
       Get current room status
       Response: { room: AVRoom, participants: Participant[] }

POST   /api/v1/campaigns/:id/av/join
       Get token to join room
       Response: { token: string, room: AVRoom }

POST   /api/v1/campaigns/:id/av/leave
       Leave the room
       Response: { success: true }
```

### Participant Control Endpoints (Host only)

```
POST   /api/v1/av/rooms/:id/mute-all
       Mute all participants
       Response: { success: true }

POST   /api/v1/av/rooms/:id/participants/:userId/mute
       Mute specific participant
       Request: { audio?: boolean, video?: boolean }
       Response: { success: true }

POST   /api/v1/av/rooms/:id/participants/:userId/kick
       Remove participant from room
       Response: { success: true }

PATCH  /api/v1/av/rooms/:id/participants/:userId/role
       Change participant role
       Request: { role: 'co_host' | 'participant' | 'spectator' }
       Response: { participant: Participant }
```

### Streaming Endpoints

```
POST   /api/v1/av/rooms/:id/stream/start
       Start streaming
       Request: {
         destinations: [
           { platform: 'twitch', streamKey: '...' },
           { platform: 'youtube', streamKey: '...' }
         ],
         layout: 'hybrid',
         quality: 'medium'
       }
       Response: { streamSession: StreamSession }

POST   /api/v1/av/rooms/:id/stream/stop
       Stop streaming
       Response: { streamSession: StreamSession }

PATCH  /api/v1/av/rooms/:id/stream/destinations
       Add/remove stream destinations mid-stream
       Request: { add?: Destination[], remove?: string[] }
       Response: { streamSession: StreamSession }

PATCH  /api/v1/av/rooms/:id/stream/layout
       Change layout template mid-stream
       Request: { layout: string, customConfig?: object }
       Response: { success: true }
```

### Recording Endpoints

```
POST   /api/v1/av/rooms/:id/record/start
       Start recording
       Request: { type: 'composite' | 'audio_only', title?: string }
       Response: { recording: Recording }

POST   /api/v1/av/rooms/:id/record/stop
       Stop recording
       Response: { recording: Recording }

POST   /api/v1/av/rooms/:id/record/marker
       Add chapter marker during recording
       Request: { label: string }
       Response: { success: true }

GET    /api/v1/campaigns/:id/recordings
       List campaign recordings
       Response: { recordings: Recording[] }

GET    /api/v1/recordings/:id
       Get recording details
       Response: { recording: Recording, playbackUrl: string }

DELETE /api/v1/recordings/:id
       Delete recording
       Response: { success: true }
```

### WebSocket Events (LiveKit)

```typescript
// Client joins room
{
  type: 'participant_joined',
  participant: {
    id: 'user_123',
    name: 'Alex',
    role: 'participant',
    audioEnabled: true,
    videoEnabled: false
  }
}

// Participant state change
{
  type: 'participant_updated',
  participant: {
    id: 'user_123',
    audioEnabled: false, // muted
  }
}

// Stream started
{
  type: 'stream_started',
  platforms: ['twitch', 'youtube'],
  layout: 'hybrid'
}

// Recording started
{
  type: 'recording_started',
  recordingId: 'rec_123'
}
```

---

## Cost Analysis

### LiveKit Cloud Pricing

LiveKit Video SDK adopts a tiered pricing structure based on data usage. The service is free for the first 50 GB of data. Beyond that, the cost is $0.18 per GB for 50 - 1,000 GB of usage.

### Estimated Costs

**Per Session Bandwidth:**
- 4-hour session
- 5 participants with video (720p ~1.5 Mbps each)
- Bidirectional: 1.5 Mbps × 5 × 2 = 15 Mbps
- 4 hours: 15 Mbps × 4h × 3600s = 27 GB per session

**Monthly Projections:**

| Scale | Sessions/Month | Bandwidth | Cost (LiveKit Cloud) |
|-------|---------------|-----------|---------------------|
| Small | 100 | 2.7 TB | ~$450/mo |
| Medium | 500 | 13.5 TB | ~$2,200/mo |
| Large | 2,000 | 54 TB | ~$8,000/mo |

### Self-Hosting Option

A LiveKit instance hosted on a single AWS EC2 instance that costs ~$60 per month can manage up to 200 users simultaneously

For larger scale, self-hosting LiveKit can reduce costs significantly:

| Scale | Infrastructure | Est. Cost |
|-------|---------------|-----------|
| Small | 2× c5.xlarge + bandwidth | ~$300/mo |
| Medium | 4× c5.2xlarge + bandwidth | ~$800/mo |
| Large | Auto-scaling cluster | ~$2,000/mo |

### Recommendation

- **Phase 1 (Launch):** Use LiveKit Cloud for simplicity
- **Phase 2 (Scale):** Hybrid approach — LiveKit Cloud for egress/recording, self-hosted SFU for rooms
- **Phase 3 (Mature):** Full self-hosted for cost optimization

---

## Integration with VTT Features

### Dice Roll Announcements

When dice are rolled in text chat:
- Play optional sound effect
- Show roll animation overlay in video stream
- TTS announcement option (for accessibility)

### Token/Map Sync

- Video thumbnails can show character portraits
- Speaking indicator syncs with token glow on map
- Screen share can focus on specific map region

### Combat Integration

- Auto-spotlight current initiative turn
- Combat music/ambiance auto-play
- Timer display for turn limits

---

*For LiveKit server deployment, see DEPLOYMENT.md*
*For streaming overlay customization, see STREAMING.md*
