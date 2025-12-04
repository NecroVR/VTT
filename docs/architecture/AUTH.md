# Authentication & Authorization

## Overview

The platform implements a comprehensive authentication system supporting multiple identity providers, various two-factor authentication methods, and a flexible role-based permission system.

---

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [Two-Factor Authentication](#two-factor-authentication)
3. [Session Management](#session-management)
4. [Authorization & Permissions](#authorization--permissions)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Security Considerations](#security-considerations)

---

## Authentication Methods

### Email/Password Authentication

Standard email and password registration with email verification.

**Registration Flow:**
```
User submits email + password
         │
         ▼
┌─────────────────────┐
│  Validate input     │
│  - Email format     │
│  - Password strength│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create user record │
│  - Hash password    │
│  - Generate token   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Send verification  │
│  email              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  User clicks link   │
│  - Verify token     │
│  - Activate account │
└─────────────────────┘
```

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common password lists (top 100,000)

**Password Hashing:**
- Algorithm: Argon2id
- Memory: 64 MB
- Iterations: 3
- Parallelism: 4

### OAuth Providers

Supported OAuth 2.0 / OpenID Connect providers:

| Provider | Scopes Requested | Data Retrieved |
|----------|------------------|----------------|
| Google | `openid email profile` | Email, name, avatar |
| Discord | `identify email` | Email, username, avatar |
| Apple | `name email` | Email, name |

**OAuth Flow:**
```
User clicks "Sign in with [Provider]"
         │
         ▼
┌─────────────────────────────────────┐
│  Redirect to provider's auth page   │
│  with client_id, redirect_uri,      │
│  scopes, state (CSRF token)         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  User authenticates with provider   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Provider redirects back with code  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Exchange code for tokens           │
│  Fetch user profile                 │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  New user:      │  │  Existing user: │
│  Create account │  │  Link or login  │
└─────────────────┘  └─────────────────┘
```

**Account Linking:**
- Users can link multiple OAuth providers to one account
- Email matching used for automatic linking (with verification)
- Manual linking available in account settings

---

## Two-Factor Authentication

### Supported Methods

| Method | Implementation | Best For |
|--------|---------------|----------|
| **TOTP** | RFC 6238 (Google Authenticator compatible) | Security-conscious users |
| **SMS** | Twilio / AWS SNS | Casual users, broad accessibility |
| **Email OTP** | 6-digit code, 10-minute expiry | Fallback, low-friction |
| **WebAuthn/Passkeys** | FIDO2 hardware keys, biometrics | Maximum security |
| **Recovery Codes** | 10 single-use codes at setup | Account recovery |

### TOTP Implementation

**Setup Flow:**
```
User enables TOTP in settings
         │
         ▼
┌─────────────────────────────────────┐
│  Generate secret (base32, 20 bytes) │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Display QR code with otpauth URI   │
│  otpauth://totp/VTT:user@email.com  │
│  ?secret=JBSWY3DPEHPK3PXP           │
│  &issuer=VTT                        │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  User scans with authenticator app  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  User enters current code           │
│  Verify code matches                │
│  Store encrypted secret             │
│  Generate recovery codes            │
└─────────────────────────────────────┘
```

**Verification Parameters:**
- Time step: 30 seconds
- Code length: 6 digits
- Window: ±1 step (allows for clock drift)
- Algorithm: SHA-1 (for compatibility)

### SMS Verification

**Flow:**
```
User requests SMS code
         │
         ▼
┌─────────────────────────────────────┐
│  Generate 6-digit code              │
│  Store hash with 10-min expiry      │
│  Rate limit: 3 per hour             │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Send via Twilio/SNS                │
│  "Your VTT code is: 123456"         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  User enters code                   │
│  Verify against stored hash         │
│  Max 5 attempts before lockout      │
└─────────────────────────────────────┘
```

### WebAuthn/Passkeys

**Registration Flow:**
```javascript
// Server generates challenge
const options = {
  challenge: randomBytes(32),
  rp: { name: "VTT Platform", id: "vtt.example.com" },
  user: {
    id: userIdBytes,
    name: user.email,
    displayName: user.displayName
  },
  pubKeyCredParams: [
    { type: "public-key", alg: -7 },   // ES256
    { type: "public-key", alg: -257 }  // RS256
  ],
  authenticatorSelection: {
    authenticatorAttachment: "cross-platform", // or "platform"
    userVerification: "preferred"
  },
  timeout: 60000
};

// Client creates credential
const credential = await navigator.credentials.create({ publicKey: options });

// Server verifies and stores
```

### Recovery Codes

- Generated at 2FA setup: 10 codes
- Format: `XXXX-XXXX-XXXX` (12 alphanumeric characters)
- Each code is single-use
- Displayed once, user must save them
- Can regenerate (invalidates old codes)

---

## Session Management

### Session Token Structure

Sessions use opaque tokens (not JWTs) for revocability:

```
Token format: base64url(random 32 bytes)
Example: "dGhpc2lzYXJhbmRvbXRva2VuZXhhbXBsZQ"
```

**Session Properties:**
- Stored server-side in database + Redis cache
- Default expiry: 30 days
- Extended on activity (sliding window)
- Includes device fingerprint for anomaly detection

### Session States

```
┌─────────────────────────────────────────────────────┐
│                   Session Lifecycle                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Created ──► Active ──► Expired                     │
│               │                                      │
│               ├──► MFA Required ──► Active          │
│               │                                      │
│               └──► Revoked                          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**MFA Verification Flow:**
```
User logs in with email/password
         │
         ▼
┌─────────────────────────────────────┐
│  Create session with mfa_verified   │
│  = false                            │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Redirect to MFA prompt             │
│  Limited access until verified      │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  User completes MFA                 │
│  Set mfa_verified = true            │
│  Full access granted                │
└─────────────────────────────────────┘
```

### Device Management

Users can view and revoke active sessions:

| Session Info Displayed | Purpose |
|------------------------|---------|
| Device type | "Chrome on Windows" |
| IP address (masked) | "192.168.xxx.xxx" |
| Location (approximate) | "San Francisco, CA" |
| Last active | "2 hours ago" |
| Created | "Dec 15, 2024" |

---

## Authorization & Permissions

### Entity Hierarchy

```
User
 └── Organization (optional, for gaming clubs/stores)
      └── Group (a regular gaming table)
           └── Campaign (a specific game within the group)
                └── Session (individual play session)
```

### Role Definitions

#### Group Roles

| Role | Description |
|------|-------------|
| **Owner** | Created the group; full administrative control |
| **GM** | Can manage campaigns, content, and players |
| **Player** | Can participate in games, access allowed content |
| **Spectator** | View-only access (for streaming, observation) |

#### Permission Matrix

| Action | Owner | GM | Player | Spectator |
|--------|-------|-----|--------|-----------|
| Delete group | ✓ | | | |
| Transfer ownership | ✓ | | | |
| Manage billing | ✓ | | | |
| Invite members | ✓ | ✓ | | |
| Remove members | ✓ | ✓ | | |
| Change member roles | ✓ | ✓* | | |
| Create campaigns | ✓ | ✓ | | |
| Delete campaigns | ✓ | ✓ | | |
| Edit campaign settings | ✓ | ✓ | | |
| Manage campaign content | ✓ | ✓ | | |
| Control game session | ✓ | ✓ | | |
| Post in chat | ✓ | ✓ | ✓ | |
| Roll dice | ✓ | ✓ | ✓ | |
| Move own tokens | ✓ | ✓ | ✓ | |
| View allowed content | ✓ | ✓ | ✓ | ✓ |
| Access stream view | ✓ | ✓ | ✓ | ✓ |

*GMs can promote to Player/Spectator only, not to GM/Owner

### Granular Permissions

Beyond roles, specific permissions can be granted:

```sql
-- Example: Grant a player permission to manage NPCs
INSERT INTO permissions (group_id, user_id, permission, granted_by)
VALUES ('group-uuid', 'user-uuid', 'manage_npcs', 'gm-uuid');
```

**Available Permissions:**
- `manage_campaigns` — Create/edit campaigns
- `manage_content` — Edit journals, handouts
- `manage_npcs` — Control NPC tokens
- `invite_players` — Send invitations
- `manage_audio` — Control ambient audio
- `bypass_fog` — See through fog of war (co-GM)

### Organization Permissions

For gaming stores and clubs managing multiple groups:

| Role | Capabilities |
|------|--------------|
| **Org Owner** | Full control, billing, delete org |
| **Org Admin** | Manage all groups, members, settings |
| **Org Manager** | Manage assigned groups only |
| **Org Member** | Access to assigned groups |

---

## Database Schema

### Core Authentication Tables

```sql
-- Core user identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ,
    password_hash VARCHAR(255), -- nullable for OAuth-only users
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- soft delete
    last_login_at TIMESTAMPTZ,
    
    -- Indexes
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- OAuth connections
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Provider info
    provider VARCHAR(50) NOT NULL, -- 'google', 'discord', 'apple'
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(255),
    
    -- Tokens (encrypted at rest)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Metadata
    scopes TEXT[],
    raw_profile JSONB, -- store provider response for debugging
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user ON oauth_connections(user_id);
CREATE INDEX idx_oauth_provider ON oauth_connections(provider, provider_user_id);

-- 2FA configuration
CREATE TABLE user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Method configuration
    method VARCHAR(20) NOT NULL, -- 'totp', 'sms', 'email', 'webauthn'
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Method-specific data (encrypted)
    secret_encrypted TEXT, -- TOTP secret
    phone_number VARCHAR(20), -- SMS
    webauthn_credential JSONB, -- WebAuthn credential data
    
    -- Status
    verified_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Only one primary method per user
    UNIQUE(user_id, is_primary) WHERE is_primary = true
);

CREATE INDEX idx_mfa_user ON user_mfa(user_id);

-- Recovery codes
CREATE TABLE mfa_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    code_hash VARCHAR(255) NOT NULL, -- bcrypt hash of code
    
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_user ON mfa_recovery_codes(user_id);

-- Session management
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token (stored as hash for security)
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- Session state
    mfa_verified BOOLEAN DEFAULT FALSE,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- Device info
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Geolocation (approximate)
    geo_country VARCHAR(2),
    geo_region VARCHAR(100),
    geo_city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for cleanup
    CONSTRAINT session_not_expired CHECK (expires_at > NOW() OR is_revoked = true)
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at) WHERE is_revoked = false;

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    used_at TIMESTAMPTZ,
    
    -- Security
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Organization & Permission Tables

```sql
-- Organizations (gaming clubs, stores, etc.)
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
    
    -- Billing (Stripe)
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON organizations(slug);
CREATE INDEX idx_orgs_owner ON organizations(owner_id);

-- Organization membership
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'manager', 'member');

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role org_role NOT NULL DEFAULT 'member',
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(organization_id, user_id)
);

-- Groups (gaming tables)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Optional organization parent
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(20) UNIQUE,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Slug unique within org (or globally if no org)
    UNIQUE(organization_id, slug)
);

CREATE INDEX idx_groups_org ON groups(organization_id);
CREATE INDEX idx_groups_invite ON groups(invite_code) WHERE invite_code IS NOT NULL;

-- Group membership
CREATE TYPE group_role AS ENUM ('owner', 'gm', 'player', 'spectator');

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role group_role NOT NULL DEFAULT 'player',
    nickname VARCHAR(100), -- display name override for this group
    
    -- Notifications
    notify_session_reminders BOOLEAN DEFAULT TRUE,
    notify_chat_mentions BOOLEAN DEFAULT TRUE,
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- Granular permissions
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

-- Group invitations
CREATE TABLE group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Can be email or user
    invited_email VARCHAR(255),
    invited_user_id UUID REFERENCES users(id),
    
    role group_role NOT NULL DEFAULT 'player',
    
    -- Token for email invites
    token_hash VARCHAR(255) UNIQUE,
    
    invited_by UUID NOT NULL REFERENCES users(id),
    
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Either email or user_id must be set
    CONSTRAINT invite_target CHECK (invited_email IS NOT NULL OR invited_user_id IS NOT NULL)
);
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/v1/auth/register
       Body: { email, password, displayName }
       Response: { user, message: "Verification email sent" }

POST   /api/v1/auth/login
       Body: { email, password }
       Response: { user, session, mfaRequired: boolean }

POST   /api/v1/auth/logout
       Headers: Authorization: Bearer <token>
       Response: { success: true }

POST   /api/v1/auth/refresh
       Body: { refreshToken }
       Response: { accessToken, expiresAt }

POST   /api/v1/auth/verify-email
       Body: { token }
       Response: { success: true }

POST   /api/v1/auth/forgot-password
       Body: { email }
       Response: { message: "If account exists, email sent" }

POST   /api/v1/auth/reset-password
       Body: { token, newPassword }
       Response: { success: true }

GET    /api/v1/auth/oauth/:provider
       Redirects to provider OAuth page

GET    /api/v1/auth/oauth/:provider/callback
       Handles OAuth callback, creates/links account
```

### MFA Endpoints

```
GET    /api/v1/auth/mfa/status
       Response: { methods: [...], primaryMethod, recoveryCodesRemaining }

POST   /api/v1/auth/mfa/setup/totp
       Response: { secret, qrCodeUrl, backupCodes }

POST   /api/v1/auth/mfa/setup/sms
       Body: { phoneNumber }
       Response: { message: "Code sent" }

POST   /api/v1/auth/mfa/setup/webauthn
       Response: { options } // WebAuthn registration options

POST   /api/v1/auth/mfa/verify
       Body: { method, code } // or { method, credential } for WebAuthn
       Response: { success: true, session }

POST   /api/v1/auth/mfa/recovery
       Body: { code }
       Response: { success: true, session }

DELETE /api/v1/auth/mfa/:methodId
       Response: { success: true }

POST   /api/v1/auth/mfa/regenerate-recovery
       Response: { codes: [...] }
```

### Session Management Endpoints

```
GET    /api/v1/auth/sessions
       Response: { sessions: [...] } // All active sessions

DELETE /api/v1/auth/sessions/:id
       Response: { success: true }

DELETE /api/v1/auth/sessions
       Body: { except: "current" } // Revoke all except current
       Response: { revokedCount: number }
```

---

## Security Considerations

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 attempts | 15 minutes |
| `/auth/register` | 3 accounts | 1 hour (per IP) |
| `/auth/forgot-password` | 3 requests | 1 hour (per email) |
| `/auth/mfa/verify` | 5 attempts | 15 minutes |
| SMS codes | 3 sends | 1 hour |

### Brute Force Protection

- Progressive delays after failed attempts
- CAPTCHA after 3 failed logins
- Account lockout after 10 failed attempts (30-minute cooldown)
- Notification email on lockout

### Token Security

- All tokens are cryptographically random (32 bytes minimum)
- Stored as hashes, never plaintext
- Short expiration for sensitive operations
- Tokens bound to IP for high-security actions

### Encryption

- Passwords: Argon2id
- OAuth tokens: AES-256-GCM at rest
- TOTP secrets: AES-256-GCM at rest
- All encryption keys managed via environment variables or secrets manager

### Audit Logging

Security-relevant events are logged:

```sql
CREATE TABLE auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    event_type VARCHAR(50) NOT NULL,
    -- 'login_success', 'login_failure', 'password_change',
    -- 'mfa_enabled', 'mfa_disabled', 'session_revoked', etc.
    
    ip_address INET,
    user_agent TEXT,
    
    metadata JSONB, -- event-specific data
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON auth_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_type ON auth_audit_log(event_type, created_at DESC);
```

---

*For implementation details on specific authentication flows, see the codebase documentation.*
