# Database Schema

## Overview

The platform uses PostgreSQL as the primary database, leveraging its JSONB capabilities for flexible game system data while maintaining relational integrity for core entities.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [Authentication Tables](#authentication-tables)
5. [Organization & Permission Tables](#organization--permission-tables)
6. [Campaign & Content Tables](#campaign--content-tables)
7. [Marketplace Tables](#marketplace-tables)
8. [Chat & Real-time Tables](#chat--real-time-tables)
9. [Streaming Tables](#streaming-tables)
10. [Indexes & Performance](#indexes--performance)

---

## Design Principles

### 1. Flexible Schema for Game Systems

Game systems have vastly different data requirements. We use JSONB for system-specific data while keeping core relationships in structured columns.

```sql
-- Example: Character with structured core + flexible game data
CREATE TABLE characters (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,           -- Always present
    campaign_id UUID REFERENCES campaigns, -- Relational
    game_data JSONB DEFAULT '{}'          -- System-specific (HP, stats, etc.)
);
```

### 2. Soft Deletes

Critical data uses soft deletes for recovery and audit purposes:

```sql
deleted_at TIMESTAMPTZ  -- NULL = active, timestamp = deleted
```

### 3. Timestamps

All tables include:
```sql
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### 4. UUIDs for Primary Keys

UUIDs prevent enumeration attacks and enable distributed ID generation:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIPS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐     ┌──────────────────┐     ┌───────────────┐               │
│  │  users   │────<│ oauth_connections│     │  user_mfa     │               │
│  └────┬─────┘     └──────────────────┘     └───────────────┘               │
│       │                                                                      │
│       │ owns                                                                 │
│       ▼                                                                      │
│  ┌──────────────┐                                                           │
│  │organizations │                                                           │
│  └──────┬───────┘                                                           │
│         │ contains                                                           │
│         ▼                                                                    │
│  ┌──────────┐         ┌───────────────┐                                    │
│  │  groups  │────────<│ group_members │                                    │
│  └────┬─────┘         └───────────────┘                                    │
│       │ contains                                                             │
│       ▼                                                                      │
│  ┌───────────┐        ┌───────────────┐     ┌─────────────┐                │
│  │ campaigns │───────<│   journals    │     │   scenes    │                │
│  └─────┬─────┘        └───────────────┘     └─────────────┘                │
│        │                                                                     │
│        │ has                                                                 │
│        ▼                                                                     │
│  ┌───────────────┐    ┌───────────────┐                                    │
│  │ chat_channels │───<│ chat_messages │                                    │
│  └───────────────┘    └───────────────┘                                    │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════  │
│                            MARKETPLACE                                       │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                              │
│  ┌──────────────┐     ┌───────────────┐     ┌──────────┐                   │
│  │  gm_profiles │────<│ game_listings │────<│ bookings │                   │
│  └──────────────┘     └───────────────┘     └────┬─────┘                   │
│                                                   │                          │
│                                          ┌───────┴───────┐                  │
│                                          ▼               ▼                  │
│                                    ┌─────────┐     ┌──────────┐            │
│                                    │ reviews │     │ disputes │            │
│                                    └─────────┘     └──────────┘            │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════  │
│                             STREAMING                                        │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                              │
│  ┌──────────────────────┐     ┌─────────────────┐     ┌────────────────┐  │
│  │ streaming_connections│     │ stream_overlays │     │ active_streams │  │
│  └──────────────────────┘     └─────────────────┘     └────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### Users

The central user identity table.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ,
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    
    -- Profile
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50),
    locale VARCHAR(10) DEFAULT 'en-US',
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_reason TEXT,
    suspended_until TIMESTAMPTZ,
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    -- Example: {"theme": "dark", "notifications": {"email": true, "push": false}}
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT display_name_length CHECK (char_length(display_name) >= 2)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_users_created ON users(created_at DESC);
```

---

## Authentication Tables

### OAuth Connections

```sql
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Provider identification
    provider VARCHAR(50) NOT NULL, -- 'google', 'discord', 'apple'
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(255),
    
    -- Tokens (encrypted at application level)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Metadata
    scopes TEXT[],
    raw_profile JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user ON oauth_connections(user_id);
CREATE INDEX idx_oauth_provider ON oauth_connections(provider, provider_user_id);
```

### MFA Configuration

```sql
CREATE TABLE user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Method
    method VARCHAR(20) NOT NULL, -- 'totp', 'sms', 'email', 'webauthn'
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Method-specific data (encrypted)
    secret_encrypted TEXT,
    phone_number VARCHAR(20),
    webauthn_credential JSONB,
    
    -- Status
    verified_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mfa_user ON user_mfa(user_id);
CREATE UNIQUE INDEX idx_mfa_primary ON user_mfa(user_id) WHERE is_primary = true;
```

### Recovery Codes

```sql
CREATE TABLE mfa_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    code_hash VARCHAR(255) NOT NULL,
    
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_user ON mfa_recovery_codes(user_id) WHERE used_at IS NULL;
```

### Sessions

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- State
    mfa_verified BOOLEAN DEFAULT FALSE,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- Device info
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Geolocation
    geo_country VARCHAR(2),
    geo_region VARCHAR(100),
    geo_city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE is_revoked = false;
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_cleanup ON sessions(expires_at) WHERE is_revoked = false;
```

### Auth Tokens (Email Verification, Password Reset)

```sql
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_type VARCHAR(30) NOT NULL, -- 'email_verification', 'password_reset'
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    
    -- Security
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_tokens_hash ON auth_tokens(token_hash) WHERE used_at IS NULL;
CREATE INDEX idx_auth_tokens_cleanup ON auth_tokens(expires_at);
```

### Audit Log

```sql
CREATE TABLE auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    event_type VARCHAR(50) NOT NULL,
    -- 'login_success', 'login_failure', 'logout', 'password_change',
    -- 'mfa_enabled', 'mfa_disabled', 'session_revoked', 'account_locked'
    
    ip_address INET,
    user_agent TEXT,
    
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON auth_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_type ON auth_audit_log(event_type, created_at DESC);
CREATE INDEX idx_audit_time ON auth_audit_log(created_at DESC);
```

---

## Organization & Permission Tables

### Organizations

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES users(id),
    
    -- Branding
    logo_url TEXT,
    website_url TEXT,
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(20), -- 'active', 'past_due', 'cancelled'
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON organizations(slug);
CREATE INDEX idx_orgs_owner ON organizations(owner_id);
```

### Organization Members

```sql
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'manager', 'member');

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role org_role NOT NULL DEFAULT 'member',
    
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

### Groups

```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Access
    is_public BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(20) UNIQUE,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, slug)
);

CREATE INDEX idx_groups_org ON groups(organization_id);
CREATE INDEX idx_groups_invite ON groups(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_groups_public ON groups(id) WHERE is_public = true;
```

### Group Members

```sql
CREATE TYPE group_role AS ENUM ('owner', 'gm', 'player', 'spectator');

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role group_role NOT NULL DEFAULT 'player',
    nickname VARCHAR(100),
    
    -- Notifications
    notify_session_reminders BOOLEAN DEFAULT TRUE,
    notify_chat_mentions BOOLEAN DEFAULT TRUE,
    
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

### Granular Permissions

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    permission VARCHAR(50) NOT NULL,
    
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, user_id, permission)
);

CREATE INDEX idx_permissions_lookup ON permissions(group_id, user_id);
```

### Group Invitations

```sql
CREATE TABLE group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    invited_email VARCHAR(255),
    invited_user_id UUID REFERENCES users(id),
    
    role group_role NOT NULL DEFAULT 'player',
    
    token_hash VARCHAR(255) UNIQUE,
    
    invited_by UUID NOT NULL REFERENCES users(id),
    
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT invite_target CHECK (invited_email IS NOT NULL OR invited_user_id IS NOT NULL)
);

CREATE INDEX idx_invitations_group ON group_invitations(group_id);
CREATE INDEX idx_invitations_token ON group_invitations(token_hash) WHERE accepted_at IS NULL;
```

---

## Campaign & Content Tables

### Campaigns

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- If from marketplace
    listing_id UUID REFERENCES game_listings(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    game_system VARCHAR(100),
    
    -- World-building data (proprietary system)
    world_data JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'planning', 'active', 'paused', 'completed'
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_group ON campaigns(group_id);
CREATE INDEX idx_campaigns_status ON campaigns(status) WHERE status = 'active';
```

### Journals / Notes

```sql
CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(200) NOT NULL,
    content TEXT,
    content_format VARCHAR(20) DEFAULT 'markdown', -- 'markdown', 'html', 'plain'
    
    -- Visibility
    visibility VARCHAR(20) DEFAULT 'players', -- 'gm_only', 'players', 'public'
    
    -- Organization
    category VARCHAR(50), -- 'session_notes', 'lore', 'rules', 'handout'
    tags TEXT[],
    pinned BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    -- Parent for nesting
    parent_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journals_campaign ON journals(campaign_id);
CREATE INDEX idx_journals_category ON journals(campaign_id, category);
CREATE INDEX idx_journals_parent ON journals(parent_id);
```

---

## Marketplace Tables

### GM Profiles

```sql
CREATE TABLE gm_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe Connect
    stripe_account_id VARCHAR(255),
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    stripe_charges_enabled BOOLEAN DEFAULT FALSE,
    stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
    
    -- Profile
    headline VARCHAR(200),
    bio TEXT,
    experience_years INTEGER,
    systems_played TEXT[],
    languages TEXT[],
    timezone VARCHAR(50),
    
    -- Availability
    availability JSONB DEFAULT '{}',
    
    -- Settings
    is_listed BOOLEAN DEFAULT FALSE,
    min_players INTEGER DEFAULT 3,
    max_players INTEGER DEFAULT 6,
    session_length_minutes INTEGER DEFAULT 180,
    
    -- Aggregated stats
    total_sessions INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    average_storytelling DECIMAL(3,2),
    average_engagement DECIMAL(3,2),
    average_preparedness DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    first_session_at TIMESTAMPTZ,
    last_session_at TIMESTAMPTZ
);

CREATE INDEX idx_gm_profiles_user ON gm_profiles(user_id);
CREATE INDEX idx_gm_profiles_listed ON gm_profiles(is_listed, average_rating DESC) WHERE is_listed = true;
```

### Game Listings

```sql
CREATE TABLE game_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    game_system VARCHAR(100) NOT NULL,
    
    -- Pricing
    price_per_seat_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Type
    listing_type VARCHAR(20) NOT NULL, -- 'one_shot', 'campaign', 'open_table'
    scheduled_start TIMESTAMPTZ,
    recurring_schedule JSONB,
    session_length_minutes INTEGER NOT NULL,
    
    -- Capacity
    min_players INTEGER DEFAULT 3,
    max_players INTEGER DEFAULT 6,
    current_players INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft',
    
    -- Metadata
    experience_level VARCHAR(20),
    tags TEXT[],
    content_warnings TEXT[],
    beginner_friendly BOOLEAN DEFAULT FALSE,
    
    -- Streaming
    stream_enabled BOOLEAN DEFAULT FALSE,
    stream_platform VARCHAR(20),
    stream_channel_url TEXT,
    
    -- Media
    thumbnail_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_listings_gm ON game_listings(gm_id);
CREATE INDEX idx_listings_published ON game_listings(status, scheduled_start) WHERE status = 'published';
CREATE INDEX idx_listings_system ON game_listings(game_system) WHERE status = 'published';
```

### Bookings

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES game_listings(id),
    player_id UUID NOT NULL REFERENCES users(id),
    
    -- Payment
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),
    
    amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    processing_fee_cents INTEGER NOT NULL,
    gm_payout_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Session tracking
    session_date TIMESTAMPTZ,
    session_number INTEGER,
    
    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Refund
    refund_amount_cents INTEGER,
    refunded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_player ON bookings(player_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_upcoming ON bookings(session_date) WHERE status = 'confirmed';
```

### Reviews

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    storytelling_rating INTEGER CHECK (storytelling_rating >= 1 AND storytelling_rating <= 5),
    engagement_rating INTEGER CHECK (engagement_rating >= 1 AND engagement_rating <= 5),
    preparedness_rating INTEGER CHECK (preparedness_rating >= 1 AND preparedness_rating <= 5),
    
    review_text TEXT,
    
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    
    -- Moderation
    is_held BOOLEAN DEFAULT FALSE,
    held_reason TEXT,
    is_removed BOOLEAN DEFAULT FALSE,
    removed_reason TEXT,
    
    -- GM response
    gm_response TEXT,
    gm_responded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_gm ON reviews(gm_id, created_at DESC) WHERE is_public = true AND is_removed = false;
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
```

### Payouts

```sql
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id),
    
    stripe_transfer_id VARCHAR(255),
    stripe_payout_id VARCHAR(255),
    
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    status VARCHAR(20), -- 'pending', 'in_transit', 'paid', 'failed', 'cancelled'
    failure_reason TEXT,
    
    booking_ids UUID[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    initiated_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

CREATE INDEX idx_payouts_gm ON payouts(gm_id, created_at DESC);
CREATE INDEX idx_payouts_status ON payouts(status) WHERE status IN ('pending', 'in_transit');
```

### Disputes

```sql
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    
    opened_by UUID NOT NULL REFERENCES users(id),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id),
    player_id UUID NOT NULL REFERENCES users(id),
    
    dispute_type VARCHAR(50) NOT NULL,
    
    opener_statement TEXT NOT NULL,
    responder_statement TEXT,
    
    status VARCHAR(20) DEFAULT 'open',
    
    resolution VARCHAR(50),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_booking ON disputes(booking_id);
CREATE INDEX idx_disputes_open ON disputes(status) WHERE status NOT IN ('resolved');
```

---

## Chat & Real-time Tables

### Chat Channels

```sql
CREATE TABLE chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    name VARCHAR(100),
    channel_type VARCHAR(20) DEFAULT 'ooc', -- 'ic', 'ooc', 'gm_only'
    
    -- For whisper channels
    participant_ids UUID[],
    
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_campaign ON chat_channels(campaign_id);
```

### Chat Messages

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'roll', 'emote', 'system'
    
    -- For dice rolls
    roll_data JSONB,
    
    -- For whispers
    whisper_to UUID[],
    
    -- For replies
    reply_to UUID REFERENCES chat_messages(id),
    
    -- Edit tracking
    edited_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_channel ON chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_author ON chat_messages(author_id);
```

---

## Streaming Tables

### Streaming Connections

```sql
CREATE TABLE streaming_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    platform VARCHAR(20) NOT NULL, -- 'twitch', 'youtube', 'kick'
    
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    
    platform_user_id VARCHAR(255) NOT NULL,
    platform_username VARCHAR(255),
    channel_id VARCHAR(255),
    channel_url TEXT,
    
    scopes TEXT[],
    
    is_active BOOLEAN DEFAULT TRUE,
    last_validated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform)
);

CREATE INDEX idx_streaming_user ON streaming_connections(user_id);
```

### Stream Overlays

```sql
CREATE TABLE stream_overlays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    overlay_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    
    access_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    config JSONB DEFAULT '{}',
    custom_css TEXT,
    custom_html TEXT,
    template_id UUID REFERENCES overlay_templates(id),
    
    background_color VARCHAR(7) DEFAULT '#00FF00',
    transparent BOOLEAN DEFAULT TRUE,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_overlays_campaign ON stream_overlays(campaign_id);
CREATE INDEX idx_overlays_token ON stream_overlays(access_token);
```

### Overlay Templates

```sql
CREATE TABLE overlay_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    overlay_type VARCHAR(50) NOT NULL,
    
    html_template TEXT NOT NULL,
    css_template TEXT NOT NULL,
    default_config JSONB DEFAULT '{}',
    
    preview_image_url TEXT,
    
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Active Streams

```sql
CREATE TABLE active_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streaming_connection_id UUID NOT NULL REFERENCES streaming_connections(id) ON DELETE CASCADE,
    gm_profile_id UUID REFERENCES gm_profiles(id),
    
    platform VARCHAR(20) NOT NULL,
    stream_id VARCHAR(255),
    stream_url TEXT NOT NULL,
    
    title VARCHAR(200),
    game_system VARCHAR(100),
    viewer_count INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streams_active ON active_streams(ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_streams_discover ON active_streams(viewer_count DESC) WHERE ended_at IS NULL AND is_public = true;
```

### Stream View Configuration

```sql
CREATE TABLE stream_view_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID UNIQUE NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    camera_mode VARCHAR(20) DEFAULT 'auto',
    camera_smoothing DECIMAL(3,2) DEFAULT 0.5,
    camera_padding INTEGER DEFAULT 100,
    
    show_initiative_tracker BOOLEAN DEFAULT TRUE,
    show_turn_indicator BOOLEAN DEFAULT TRUE,
    show_dice_rolls BOOLEAN DEFAULT TRUE,
    show_chat_bubbles BOOLEAN DEFAULT FALSE,
    
    show_watermark BOOLEAN DEFAULT TRUE,
    watermark_position VARCHAR(20) DEFAULT 'bottom-right',
    custom_watermark_url TEXT,
    
    target_fps INTEGER DEFAULT 30,
    quality_level VARCHAR(10) DEFAULT 'high',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Indexes & Performance

### Key Query Patterns

| Query | Index Strategy |
|-------|---------------|
| User login | `idx_users_email` |
| Session validation | `idx_sessions_token` |
| Group member lookup | Composite `(group_id, user_id)` |
| Campaign list for user | Join through group_members |
| Published listings search | Partial index `WHERE status = 'published'` |
| GM leaderboard | `idx_gm_profiles_listed` sorted by rating |
| Chat history | `(channel_id, created_at DESC)` |
| Active streams | Partial index `WHERE ended_at IS NULL` |

### Maintenance Queries

```sql
-- Clean up expired sessions
DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '1 day';

-- Clean up old auth tokens
DELETE FROM auth_tokens WHERE expires_at < NOW() - INTERVAL '7 days';

-- Archive old audit logs (move to cold storage)
-- ... implement based on retention policy

-- Update GM aggregate stats
UPDATE gm_profiles 
SET 
    total_sessions = (SELECT COUNT(*) FROM bookings b JOIN game_listings l ON b.listing_id = l.id WHERE l.gm_id = gm_profiles.id AND b.status = 'completed'),
    average_rating = (SELECT AVG(rating) FROM reviews WHERE gm_id = gm_profiles.id AND is_public = true)
WHERE is_listed = true;
```

---

*For migration scripts and database setup, see the /migrations directory.*
