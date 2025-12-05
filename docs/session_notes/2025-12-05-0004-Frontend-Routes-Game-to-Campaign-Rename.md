# Session Notes: Frontend Routes Game to Campaign Rename

**Date:** 2025-12-05
**Session ID:** 0004
**Topic:** Renamed all frontend Svelte routes from Game/Games to Campaign/Campaigns

---

## Session Summary

Successfully renamed all frontend Svelte route directories and files from Game/Games terminology to Campaign/Campaigns terminology. This completes the renaming effort that was started in the backend (database schema, shared types, and API routes).

---

## Changes Implemented

### Directory Renaming

1. **Renamed `apps/web/src/routes/games/` → `apps/web/src/routes/campaigns/`**
   - Contains the campaigns list page, new campaign page, and campaign detail pages

2. **Renamed `apps/web/src/routes/game/` → `apps/web/src/routes/campaign/`**
   - Contains the actual campaign session page with the game canvas

### File Updates

#### 1. `apps/web/src/routes/campaigns/+page.svelte` (Campaigns List Page)

**Changes:**
- Updated imports: `gamesStore` → `campaignsStore`
- Updated types: `Game` → `Campaign`
- Updated variables: `games` → `campaigns`, `game` → `campaign`, `selectedGame` → `selectedCampaign`
- Updated functions: `fetchGames()` → `fetchCampaigns()`, `deleteGame()` → `deleteCampaign()`, `createNewGame()` → `createNewCampaign()`, `openGame()` → `openCampaign()`
- Updated navigation: `goto('/games/new')` → `goto('/campaigns/new')`, `goto(`/game/${id}`)` → `goto(`/campaign/${id}`)`
- Updated CSS classes: `.games-grid` → `.campaigns-grid`, `.game-card` → `.campaign-card`, `.game-card-header` → `.campaign-card-header`, `.game-card-body` → `.campaign-card-body`, `.game-card-actions` → `.campaign-card-actions`, `.game-info` → `.campaign-info`
- Updated page title: "My Games - VTT" → "My Campaigns - VTT"
- Updated UI text:
  - "My Games" → "My Campaigns"
  - "Create New Game" → "Create New Campaign"
  - "Loading games..." → "Loading campaigns..."
  - "No games yet" → "No campaigns yet"
  - "Create your first game to get started!" → "Create your first campaign to get started!"
  - "Create Game" → "Create Campaign"
  - "Open game" → "Open campaign"
  - "Delete game" → "Delete campaign"

#### 2. `apps/web/src/routes/campaigns/new/+page.svelte` (Create Campaign Page)

**Changes:**
- Updated imports: `gamesStore` → `campaignsStore`
- Updated types: `GameSettings` → `CampaignSettings`
- Updated variables: `gameName` → `campaignName`
- Updated functions: `createGame()` → `createCampaign()`
- Updated navigation: `goto('/games')` → `goto('/campaigns')`, `goto(`/game/${id}`)` → `goto(`/campaign/${id}`)`
- Updated page title: "Create New Game - VTT" → "Create New Campaign - VTT"
- Updated UI text:
  - "Create New Game" → "Create New Campaign"
  - "Game Name" → "Campaign Name"
  - "Enter game name" → "Enter campaign name"
  - "Game name is required" → "Campaign name is required"
  - "Creating..." → "Creating..."
  - "Create Game" → "Create Campaign"

#### 3. `apps/web/src/routes/campaigns/[id]/+page.svelte` (Campaign Placeholder Page)

**Changes:**
- Updated variables: `gameId` → `campaignId`
- Updated CSS classes: `.game-container` → `.campaign-container`, `.game-layout` → `.campaign-layout`, `.game-area` → `.campaign-area`, `.game-canvas` → `.campaign-canvas`
- Updated UI text:
  - "Game: {id}" → "Campaign: {id}"

#### 4. `apps/web/src/routes/campaign/[id]/+page.svelte` (Campaign Session Page)

**Changes:**
- Updated imports: `gamesStore` → `campaignsStore`
- Updated variables: `gameId` → `campaignId`, `currentGame` → `currentCampaign`
- Updated functions: `fetchGame()` → `fetchCampaign()`, `clearCurrentGame()` → `clearCurrentCampaign()`
- Updated CSS classes: `.game-container` → `.campaign-container`, `.game-header` → `.campaign-header`, `.game-info` → `.campaign-info`, `.game-id` → `.campaign-id`, `.game-content` → `.campaign-content`
- Updated page title: "Game {id} - VTT" → "Campaign {id} - VTT"
- Updated UI text:
  - "Game Session" → "Campaign Session"
  - "ID: {gameId}" → "ID: {campaignId}"

#### 5. `apps/web/src/routes/+page.svelte` (Homepage)

**Changes:**
- Updated variables: `gameId` → `campaignId`
- Updated functions:
  - `createGame()` → `createCampaign()`
  - `joinGame()` → `joinCampaign()`
  - `viewMyGames()` → `viewMyCampaigns()`
- Updated navigation:
  - `goto('/games')` → `goto('/campaigns')`
  - `goto('/game/${id}')` → `goto('/campaign/${id}')`
- Updated UI text:
  - "Sign in to create and manage your game sessions" → "Sign in to create and manage your campaign sessions"
  - "My Games" → "My Campaigns"
  - "View and manage your game sessions" → "View and manage your campaign sessions"
  - "View My Games" → "View My Campaigns"
  - "Create New Game" → "Create New Campaign"
  - "Start a new game session and invite your players" → "Start a new campaign session and invite your players"
  - "Create Game" → "Create Campaign"
  - "Join Game" → "Join Campaign"
  - "Enter a game ID to join an existing session" → "Enter a campaign ID to join an existing session"
  - "Enter game ID" → "Enter campaign ID"
  - "Join Game" → "Join Campaign"

---

## Files Created/Modified

### Created:
- `apps/web/src/routes/campaigns/+page.svelte`
- `apps/web/src/routes/campaigns/new/+page.svelte`
- `apps/web/src/routes/campaigns/[id]/+page.svelte`
- `apps/web/src/routes/campaign/[id]/+page.svelte`

### Modified:
- `apps/web/src/routes/+page.svelte`

### Deleted:
- `apps/web/src/routes/games/+page.svelte`
- `apps/web/src/routes/games/new/+page.svelte`
- `apps/web/src/routes/games/[id]/+page.svelte`
- `apps/web/src/routes/game/[id]/+page.svelte`

---

## Testing & Validation

### Build Verification
- ✅ Ran `npm run build` successfully
- ✅ No TypeScript errors
- ✅ All imports resolved correctly
- ✅ Build completed in 4.79s

### Docker Deployment
- ✅ Ran `docker-compose up -d --build`
- ✅ All containers started successfully
- ✅ Web container listening on port 5173
- ✅ Server container running
- ✅ Database and Redis containers healthy

### Git Commit
- ✅ Changes committed with descriptive message
- ✅ Pushed to GitHub repository
- Commit: `074cea4`

---

## Current Status

**COMPLETED** ✅

All frontend routes have been successfully renamed from Game/Games to Campaign/Campaigns. The application builds successfully, deploys to Docker without errors, and all containers are running properly.

---

## Next Steps

The frontend route renaming is complete. This completes the Game → Campaign renaming effort across:
1. Database schema (completed in previous session)
2. Shared types (completed in previous session)
3. API routes (completed in previous session)
4. Frontend stores (campaignsStore already existed)
5. Frontend routes (completed in this session)

Future work may include:
- Testing the full user flow from campaigns list → create campaign → join campaign session
- Verifying all WebSocket events work correctly with the new routes
- Checking that GM management features work with the new terminology

---

## Key Learnings

1. **Route Renaming**: SvelteKit's file-based routing made it straightforward to rename routes by simply renaming directories
2. **Store Integration**: The campaigns store already existed, so no store changes were needed
3. **Type Safety**: Using TypeScript throughout ensured all references were updated correctly
4. **Build Verification**: Running a full build before committing caught any potential issues early

---

## Commands Used

```bash
# Verify current route structure
ls -la "D:\Projects\VTT\apps\web\src\routes\games"
ls -la "D:\Projects\VTT\apps\web\src\routes\game"

# Create new directory structure
mkdir campaigns campaigns/new campaigns/[id]
mkdir campaign campaign/[id]

# Remove old directories
rm -rf games game

# Build verification
npm run build

# Deploy to Docker
docker-compose up -d --build

# Git operations
git add apps/web/src/routes/+page.svelte apps/web/src/routes/campaign apps/web/src/routes/campaigns
git commit -m "refactor(routes): Rename Game/Games routes to Campaign/Campaigns"
git push origin master
```

---

**Session End Time:** 2025-12-05 11:04 AM PST
