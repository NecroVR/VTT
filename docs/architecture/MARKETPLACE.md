# Paid GM Marketplace

## Overview

The platform includes an integrated marketplace where Game Masters can offer their services for pay, similar to StartPlaying.games but with the advantage of an integrated VTT and lower platform fees.

---

## Table of Contents

1. [Market Research](#market-research)
2. [Business Model](#business-model)
3. [GM Onboarding](#gm-onboarding)
4. [Game Listings](#game-listings)
5. [Booking System](#booking-system)
6. [Payment Processing](#payment-processing)
7. [Reviews & Ratings](#reviews--ratings)
8. [Policies](#policies)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)

---

## Market Research

### Competitor Analysis: StartPlaying.games

StartPlaying.games is the market leader for paid GM services. Key findings from research:

| Aspect | StartPlaying.games | Our Platform |
|--------|-------------------|--------------|
| **Platform Fee** | 15% of GM bookings | 12% of GM bookings |
| **Upfront Cost** | Free to list | Free to list |
| **Average Price** | $15-20 per session | GM sets price |
| **Payment Handling** | Platform handles all payments | Platform handles all payments |
| **Dispute Resolution** | Platform handles disputes | Platform handles disputes |
| **Tax Documents** | Single yearly document | Automated via Stripe |
| **VTT Integration** | None (use Roll20/Foundry) | Fully integrated |

### Key Insights

1. **No upfront cost is critical** — GMs won't pay to list; revenue share model works
2. **Dispute handling builds trust** — Both players and GMs need protection
3. **Tax simplification matters** — Many GMs are hobbyists, not tax experts
4. **Integration is our advantage** — StartPlaying requires separate VTT subscription

### Market Size Indicators

- StartPlaying GMs have earned over $3 million since 2020 launch
- Average game price: $15-20 per session
- Typical session: 3-4 hours
- Player retention: recurring players common in campaigns

---

## Business Model

### Fee Structure

| Fee Type | Amount | Paid By |
|----------|--------|---------|
| Platform Fee | 12% | Deducted from GM earnings |
| Payment Processing | ~2.9% + $0.30 | Passed through to transaction |
| **GM Receives** | **~85%** | After all fees |

**Example Transaction:**
```
Player pays:              $20.00
- Payment processing:     -$0.88 (2.9% + $0.30)
- Platform fee (12%):     -$2.40
= GM receives:            $16.72 (83.6%)
```

### Comparison to Competitors

| Platform | Creator Revenue Share |
|----------|----------------------|
| Our Platform | ~85% |
| StartPlaying.games | 85% |
| Twitch (subs) | 50% |
| YouTube (Super Chat) | 70% |
| Fiverr | 80% |
| Airbnb Experiences | 80% |

### Revenue Projections

Conservative estimates based on market data:
- Year 1: 100 active GMs × $500/month avg = $50,000 monthly GMV → $6,000 platform revenue
- Year 2: 500 active GMs × $750/month avg = $375,000 monthly GMV → $45,000 platform revenue
- Year 3: 2,000 active GMs × $1,000/month avg = $2M monthly GMV → $240,000 platform revenue

---

## GM Onboarding

### Eligibility Requirements

- Verified email address
- Completed user profile
- Agreed to GM Terms of Service
- Age 18+ (for payment processing)

### Onboarding Flow

```
User clicks "Become a GM"
         │
         ▼
┌─────────────────────────────────────┐
│  Step 1: Profile Setup              │
│  - Headline (tagline)               │
│  - Bio (experience, style)          │
│  - Systems played                   │
│  - Languages spoken                 │
│  - Timezone                         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Step 2: Availability               │
│  - Weekly schedule                  │
│  - Session length preference        │
│  - Min/max players                  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Step 3: Stripe Connect Onboarding  │
│  - Redirect to Stripe               │
│  - Identity verification            │
│  - Bank account setup               │
│  - Tax information (W-9/W-8BEN)     │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Step 4: Create First Listing       │
│  - Game details                     │
│  - Pricing                          │
│  - Schedule                         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Profile Live!                      │
│  - Appears in marketplace           │
│  - Can accept bookings              │
└─────────────────────────────────────┘
```

### Stripe Connect Integration

We use **Stripe Connect Express** accounts:

**Benefits:**
- Stripe handles identity verification
- Stripe handles tax form collection (W-9/W-8BEN)
- Stripe issues 1099s automatically
- Supports payouts to 118+ countries
- Handles disputes and chargebacks

**Implementation:**
```javascript
// Create connected account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: user.email,
  capabilities: {
    transfers: { requested: true },
  },
  business_type: 'individual',
  business_profile: {
    mcc: '7941', // Sports clubs, fields, and promoters
    url: `https://vtt.example.com/gm/${user.slug}`,
  },
});

// Generate onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://vtt.example.com/gm/onboarding/refresh',
  return_url: 'https://vtt.example.com/gm/onboarding/complete',
  type: 'account_onboarding',
});
```

---

## Game Listings

### Listing Types

| Type | Description | Booking Model |
|------|-------------|---------------|
| **One-Shot** | Single session, standalone story | Book once |
| **Campaign** | Ongoing multi-session game | Recurring booking |
| **Open Table** | Drop-in, different players each session | Per-session booking |

### Listing Fields

**Required:**
- Title
- Description (minimum 100 characters)
- Game system (D&D 5e, Pathfinder 2e, etc.)
- Price per seat
- Session length
- Player count (min/max)
- Scheduled time or availability

**Optional:**
- Thumbnail image
- Content warnings
- Experience level (beginner-friendly, advanced, etc.)
- Play style tags (roleplay-heavy, combat-focused, etc.)
- Required materials
- Language

### Listing States

```
┌─────────────────────────────────────────────────────────┐
│                   Listing Lifecycle                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Draft ──► Published ──► Full ──► Completed             │
│              │                                           │
│              ├──► Cancelled (by GM)                     │
│              │                                           │
│              └──► Suspended (by platform)               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Visibility & Search

Listings appear in search based on:
- Relevance to search query
- GM rating and review count
- Upcoming availability
- Price (filterable)
- Game system (filterable)
- Experience level (filterable)
- Language (filterable)

---

## Booking System

### Booking Flow

```
Player finds listing
         │
         ▼
┌─────────────────────────────────────┐
│  View listing details               │
│  - Description, reviews, GM profile │
│  - Available seats                  │
│  - Price and schedule               │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Click "Book Seat"                  │
│  - Select session date (campaigns) │
│  - Confirm price                    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Payment                            │
│  - Stripe Checkout                  │
│  - Card charged immediately         │
│  - Funds held in platform account   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Booking Confirmed                  │
│  - Email confirmation               │
│  - Added to calendar                │
│  - Access to campaign chat          │
└─────────────────────────────────────┘
```

### Booking States

| State | Description |
|-------|-------------|
| `pending` | Payment processing |
| `confirmed` | Payment complete, awaiting session |
| `completed` | Session finished, GM paid out |
| `cancelled_by_player` | Player cancelled |
| `cancelled_by_gm` | GM cancelled |
| `refunded` | Full refund issued |
| `disputed` | Under review |
| `no_show` | Player didn't attend |

### Session Completion

```
Session scheduled time arrives
         │
         ▼
┌─────────────────────────────────────┐
│  Session takes place                │
│  (on the platform VTT)              │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  GM marks       │  │  Auto-complete  │
│  "Complete"     │  │  after 24 hours │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └────────┬───────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Payout initiated                   │
│  - Funds transferred to GM          │
│  - Player prompted for review       │
└─────────────────────────────────────┘
```

---

## Payment Processing

### Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Player                     Platform                    GM           │
│    │                           │                        │            │
│    │  1. Book session          │                        │            │
│    │ ─────────────────────────►│                        │            │
│    │                           │                        │            │
│    │  2. Pay $20               │                        │            │
│    │ ─────────────────────────►│                        │            │
│    │                           │                        │            │
│    │                    ┌──────┴──────┐                │            │
│    │                    │ Funds held  │                │            │
│    │                    │ in Stripe   │                │            │
│    │                    └──────┬──────┘                │            │
│    │                           │                        │            │
│    │           [SESSION OCCURS]│                        │            │
│    │                           │                        │            │
│    │                    ┌──────┴──────┐                │            │
│    │                    │ Session     │                │            │
│    │                    │ completed   │                │            │
│    │                    └──────┬──────┘                │            │
│    │                           │                        │            │
│    │                           │  3. Transfer $16.72   │            │
│    │                           │ ──────────────────────►│            │
│    │                           │                        │            │
│    │                    ┌──────┴──────┐                │            │
│    │                    │ Platform    │                │            │
│    │                    │ keeps $2.40 │                │            │
│    │                    │ (12% fee)   │                │            │
│    │                    └─────────────┘                │            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Stripe Integration Details

**Payment Intent Creation:**
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: priceInCents,
  currency: 'usd',
  customer: player.stripeCustomerId,
  metadata: {
    booking_id: booking.id,
    listing_id: listing.id,
    gm_account_id: gm.stripeAccountId,
  },
  // Don't transfer immediately - wait for session completion
  transfer_group: `booking_${booking.id}`,
});
```

**Transfer to GM (after session):**
```javascript
const transfer = await stripe.transfers.create({
  amount: gmPayoutCents, // Original minus platform fee
  currency: 'usd',
  destination: gm.stripeAccountId,
  transfer_group: `booking_${booking.id}`,
  metadata: {
    booking_id: booking.id,
  },
});
```

### Payout Schedule

| Payout Type | Timing |
|-------------|--------|
| Standard | 2 business days after session completion |
| Express (future) | Same day (additional fee) |

### Tax Reporting

Stripe Connect handles tax compliance:

- **US GMs:** Stripe collects W-9, issues 1099-K if threshold met
- **International GMs:** Stripe collects W-8BEN, handles withholding if required
- **Platform:** No 1099 burden; Stripe manages all tax forms

Thresholds (as of 2024):
- 1099-K issued if: $600+ in gross receipts (new IRS threshold)

---

## Reviews & Ratings

### Review Eligibility

- Only players who completed a booking can leave reviews
- Reviews can be submitted within 30 days of session completion
- One review per booking

### Rating Dimensions

| Dimension | Description |
|-----------|-------------|
| **Overall** | 1-5 stars, required |
| **Storytelling** | Quality of narrative and improvisation |
| **Engagement** | Kept players involved and interested |
| **Preparedness** | Organization and session management |

### Review Display

```
┌─────────────────────────────────────────────────────────────────────┐
│  ★★★★★  "Best GM I've ever played with!"                           │
│                                                                      │
│  Storytelling: ★★★★★  Engagement: ★★★★★  Preparedness: ★★★★☆       │
│                                                                      │
│  "Marcus ran an incredible session of Curse of Strahd. His voice    │
│  acting for the NPCs was phenomenal, and he kept all 5 players      │
│  engaged throughout the 4-hour session..."                          │
│                                                                      │
│  — PlayerName123 • 3 sessions with this GM • Dec 2024               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ GM Response:                                                  │   │
│  │ "Thanks so much! Your party was a joy to GM for. Looking     │   │
│  │  forward to the next session!"                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Review Moderation

Reviews are automatically held if they contain:
- Profanity or slurs
- Personal information
- Links or promotional content
- Extremely short text (<20 characters)

GM can report reviews for:
- Harassment
- False claims
- Off-topic content
- Spam

---

## Policies

### Cancellation Policy

| Scenario | Refund | GM Impact |
|----------|--------|-----------|
| **Player cancels 48h+ before** | Full refund minus $2 processing fee | No penalty |
| **Player cancels <48h before** | 50% refund | GM receives 50% |
| **Player no-show** | No refund | GM receives full payment |
| **GM cancels** | Full refund | Warning; repeated = suspension |
| **Session cancelled (emergency)** | Full refund | Case-by-case review |

### Dispute Resolution

```
Player or GM reports issue
         │
         ▼
┌─────────────────────────────────────┐
│  Automatic mediation attempt        │
│  - Both parties submit statements   │
│  - 48 hours to resolve              │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  Resolved       │  │  Escalated      │
│  - Funds        │  │  - Manual review│
│    released     │  │  - Platform     │
│    per agreement│  │    decision     │
└─────────────────┘  └────────┬────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Platform Decision  │
                   │  - Full refund      │
                   │  - Partial refund   │
                   │  - No refund        │
                   │  - GM penalty       │
                   └─────────────────────┘
```

### GM Code of Conduct

GMs must:
- Provide accurate listing descriptions
- Start sessions on time (within 10 minutes)
- Communicate cancellations ASAP
- Maintain professional behavior
- Not solicit off-platform payments
- Respect content warnings and player boundaries

Violations result in:
- First offense: Warning
- Second offense: Temporary suspension (7 days)
- Third offense: Permanent removal from marketplace

---

## Database Schema

```sql
-- GM profiles for marketplace
CREATE TABLE gm_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe Connect
    stripe_account_id VARCHAR(255),
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    stripe_charges_enabled BOOLEAN DEFAULT FALSE,
    stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
    
    -- Profile content
    headline VARCHAR(200),
    bio TEXT,
    experience_years INTEGER,
    systems_played TEXT[], -- ['D&D 5e', 'Pathfinder 2e', ...]
    languages TEXT[], -- ['English', 'Spanish', ...]
    timezone VARCHAR(50),
    
    -- Availability
    availability JSONB DEFAULT '{}',
    -- Format: { "monday": [{"start": "18:00", "end": "22:00"}], ... }
    
    -- Marketplace settings
    is_listed BOOLEAN DEFAULT FALSE,
    min_players INTEGER DEFAULT 3,
    max_players INTEGER DEFAULT 6,
    session_length_minutes INTEGER DEFAULT 180,
    
    -- Stats (denormalized for performance)
    total_sessions INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    average_storytelling DECIMAL(3,2),
    average_engagement DECIMAL(3,2),
    average_preparedness DECIMAL(3,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    first_session_at TIMESTAMPTZ,
    last_session_at TIMESTAMPTZ
);

CREATE INDEX idx_gm_profiles_user ON gm_profiles(user_id);
CREATE INDEX idx_gm_profiles_listed ON gm_profiles(is_listed) WHERE is_listed = true;
CREATE INDEX idx_gm_profiles_rating ON gm_profiles(average_rating DESC) WHERE is_listed = true;

-- Game listings
CREATE TABLE game_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id) ON DELETE CASCADE,
    
    -- Basic info
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    game_system VARCHAR(100) NOT NULL,
    
    -- Pricing
    price_per_seat_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Type and scheduling
    listing_type VARCHAR(20) NOT NULL, -- 'one_shot', 'campaign', 'open_table'
    scheduled_start TIMESTAMPTZ,
    recurring_schedule JSONB, -- for campaigns
    session_length_minutes INTEGER NOT NULL,
    
    -- Capacity
    min_players INTEGER DEFAULT 3,
    max_players INTEGER DEFAULT 6,
    current_players INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft',
    -- 'draft', 'published', 'full', 'in_progress', 'completed', 'cancelled', 'suspended'
    
    -- Content metadata
    experience_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'any'
    tags TEXT[],
    content_warnings TEXT[],
    beginner_friendly BOOLEAN DEFAULT FALSE,
    
    -- Streaming
    stream_enabled BOOLEAN DEFAULT FALSE,
    stream_platform VARCHAR(20),
    stream_channel_url TEXT,
    
    -- Media
    thumbnail_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_listings_gm ON game_listings(gm_id);
CREATE INDEX idx_listings_status ON game_listings(status) WHERE status = 'published';
CREATE INDEX idx_listings_system ON game_listings(game_system);
CREATE INDEX idx_listings_schedule ON game_listings(scheduled_start) WHERE status = 'published';

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES game_listings(id),
    player_id UUID NOT NULL REFERENCES users(id),
    
    -- Payment info
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),
    
    -- Amounts (all in cents)
    amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    processing_fee_cents INTEGER NOT NULL,
    gm_payout_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'confirmed', 'completed', 'cancelled_by_player', 
    -- 'cancelled_by_gm', 'refunded', 'disputed', 'no_show'
    
    -- For recurring campaigns
    session_date TIMESTAMPTZ,
    session_number INTEGER, -- 1st session, 2nd session, etc.
    
    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Refund tracking
    refund_amount_cents INTEGER,
    refunded_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_player ON bookings(player_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_session ON bookings(session_date) WHERE status = 'confirmed';

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id),
    
    -- Ratings
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    storytelling_rating INTEGER CHECK (storytelling_rating >= 1 AND storytelling_rating <= 5),
    engagement_rating INTEGER CHECK (engagement_rating >= 1 AND engagement_rating <= 5),
    preparedness_rating INTEGER CHECK (preparedness_rating >= 1 AND preparedness_rating <= 5),
    
    -- Content
    review_text TEXT,
    
    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE, -- booking was completed
    
    -- Moderation
    is_held BOOLEAN DEFAULT FALSE,
    held_reason TEXT,
    is_removed BOOLEAN DEFAULT FALSE,
    removed_reason TEXT,
    
    -- GM response
    gm_response TEXT,
    gm_responded_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_gm ON reviews(gm_id) WHERE is_public = true AND is_removed = false;
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- Payouts tracking
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id),
    
    -- Stripe
    stripe_transfer_id VARCHAR(255),
    stripe_payout_id VARCHAR(255),
    
    -- Amounts
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status VARCHAR(20), -- 'pending', 'in_transit', 'paid', 'failed', 'cancelled'
    failure_reason TEXT,
    
    -- Related bookings
    booking_ids UUID[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    initiated_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

CREATE INDEX idx_payouts_gm ON payouts(gm_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Disputes
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    
    -- Parties
    opened_by UUID NOT NULL REFERENCES users(id),
    gm_id UUID NOT NULL REFERENCES gm_profiles(id),
    player_id UUID NOT NULL REFERENCES users(id),
    
    -- Type
    dispute_type VARCHAR(50) NOT NULL,
    -- 'session_not_run', 'quality_issue', 'harassment', 'no_show', 'other'
    
    -- Statements
    opener_statement TEXT NOT NULL,
    responder_statement TEXT,
    
    -- Resolution
    status VARCHAR(20) DEFAULT 'open',
    -- 'open', 'awaiting_response', 'under_review', 'resolved', 'escalated'
    
    resolution VARCHAR(50),
    -- 'full_refund', 'partial_refund', 'no_refund', 'gm_warning', 'gm_suspended'
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id), -- admin who resolved
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_booking ON disputes(booking_id);
CREATE INDEX idx_disputes_status ON disputes(status) WHERE status NOT IN ('resolved');
```

---

## API Endpoints

### GM Profile Endpoints

```
GET    /api/v1/marketplace/gm/me
       Response: { profile: GMProfile }

POST   /api/v1/marketplace/gm/onboard
       Response: { stripeOnboardingUrl: string }

PATCH  /api/v1/marketplace/gm/me
       Body: { headline?, bio?, systems_played?, ... }
       Response: { profile: GMProfile }

GET    /api/v1/marketplace/gms
       Query: ?system=&language=&rating=&page=&limit=
       Response: { gms: GMProfile[], total: number }

GET    /api/v1/marketplace/gms/:id
       Response: { gm: GMProfile, listings: Listing[] }
```

### Listing Endpoints

```
POST   /api/v1/marketplace/listings
       Body: { title, description, game_system, price_per_seat_cents, ... }
       Response: { listing: Listing }

GET    /api/v1/marketplace/listings
       Query: ?system=&type=&price_min=&price_max=&date=&page=
       Response: { listings: Listing[], total: number }

GET    /api/v1/marketplace/listings/:id
       Response: { listing: Listing, gm: GMProfile, reviews: Review[] }

PATCH  /api/v1/marketplace/listings/:id
       Body: { title?, description?, ... }
       Response: { listing: Listing }

POST   /api/v1/marketplace/listings/:id/publish
       Response: { listing: Listing }

POST   /api/v1/marketplace/listings/:id/cancel
       Body: { reason?: string }
       Response: { listing: Listing }
```

### Booking Endpoints

```
POST   /api/v1/marketplace/bookings
       Body: { listing_id, session_date? }
       Response: { booking: Booking, checkoutUrl: string }

GET    /api/v1/marketplace/bookings
       Query: ?status=&as=player|gm
       Response: { bookings: Booking[] }

GET    /api/v1/marketplace/bookings/:id
       Response: { booking: Booking }

POST   /api/v1/marketplace/bookings/:id/cancel
       Body: { reason?: string }
       Response: { booking: Booking, refund?: RefundDetails }

POST   /api/v1/marketplace/bookings/:id/complete
       (GM only)
       Response: { booking: Booking }

POST   /api/v1/marketplace/bookings/:id/dispute
       Body: { dispute_type, statement }
       Response: { dispute: Dispute }
```

### Review Endpoints

```
POST   /api/v1/marketplace/bookings/:id/review
       Body: { rating, storytelling_rating?, engagement_rating?, 
               preparedness_rating?, review_text? }
       Response: { review: Review }

POST   /api/v1/marketplace/reviews/:id/respond
       (GM only)
       Body: { response: string }
       Response: { review: Review }

POST   /api/v1/marketplace/reviews/:id/report
       Body: { reason: string }
       Response: { success: true }
```

### Payout Endpoints

```
GET    /api/v1/marketplace/payouts
       (GM only)
       Response: { payouts: Payout[], balance: BalanceInfo }

GET    /api/v1/marketplace/payouts/:id
       Response: { payout: Payout, bookings: Booking[] }
```

---

*For webhook handling and Stripe integration details, see the implementation documentation.*
