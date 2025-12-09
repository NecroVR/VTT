# Task: Fix all remaining Game→Campaign rename issues

## Context
The VTT codebase has been migrated from "Game" terminology to "Campaign" terminology. The database schema, main API routes, and core implementations have been updated, but many test files and some implementation files still reference the old "game" naming.

## Current Test Failures Summary

### Database Package: ✅ PASS (164/164 tests)
### Shared Package: ✅ PASS (390/390 tests)
### Server Package: ❌ FAIL (130/526 passed, 396 failed)
### Web Package: ❌ FAIL (427/512 passed, 65 failed)

## Files Requiring Updates

### Server Package (18 files):
1. `apps/server/src/websocket/handlers/campaign.test.ts`
   - Import: `games` → `campaigns`
   - Table reference: `db.delete(games)` → `db.delete(campaigns)`
   - Import statement: `from './game.js'` → `from './campaign.js'`

2. `apps/server/src/websocket/auth.test.ts`
   - Import: `games` → `campaigns`
   - Table reference: `games` → `campaigns`

3. `apps/server/src/websocket/rooms.ts`
   - Comments: Update references from "gameId" to "campaignId" in JSDoc
   - Keep parameter names as `gameId` for now (breaking change - defer)

4. `apps/server/src/routes/api/v1/index.test.ts` ✅ FIXED
   - `endpoints.games` → `endpoints.campaigns`

5. `apps/server/src/routes/api/v1/auth.test.ts`
   - Import: `games` → `campaigns`
   - Table reference: `games` → `campaigns`

6. `apps/server/src/routes/api/v1/scenes.test.ts`
   - Import: `games` → `campaigns`
   - Table references: `games` → `campaigns`
   - URLs: `/api/v1/games/` → `/api/v1/campaigns/`
   - Variables: `gameId` → `campaignId` (test-local only)
   - Properties: `scene.gameId` → `scene.campaignId`

7. `apps/server/src/routes/api/v1/tokens.test.ts` - Same patterns as scenes.test.ts
8. `apps/server/src/routes/api/v1/walls.test.ts` - Same patterns
9. `apps/server/src/routes/api/v1/lights.test.ts` - Same patterns
10. `apps/server/src/routes/api/v1/items.test.ts` - Same patterns
11. `apps/server/src/routes/api/v1/actors.test.ts` - Same patterns
12. `apps/server/src/routes/api/v1/combats.test.ts` - Same patterns
13. `apps/server/src/routes/api/v1/chat.test.ts` - Same patterns

14. `apps/server/src/routes/api/v1/scenes.ts`
    - Comment on line mentioning "games" (if exists)

15. `apps/server/src/routes/api/v1/combats.ts` - Check for comments
16. `apps/server/src/routes/api/v1/chat.ts` - Check for comments
17. `apps/server/src/routes/api/v1/journals.ts` - Check for comments
18. `apps/server/src/routes/api/v1/compendiums.ts` - Check for comments
19. `apps/server/src/routes/api/v1/effects.ts` - Check for comments

### Web Package (12 files):
1. `apps/web/src/lib/stores/scenes.ts`
   - Function param: `gameId` → `campaignId`
   - URLs: `/api/v1/games/` → `/api/v1/campaigns/`
   - Comments: "game" → "campaign"

2. `apps/web/src/lib/stores/actors.ts` - Same patterns
3. `apps/web/src/lib/stores/compendiums.ts` - Check for patterns
4. `apps/web/src/lib/stores/journals.ts` - Check for patterns
5. `apps/web/src/lib/stores/effects.ts` - Check for patterns
6. `apps/web/src/lib/stores/tokens.ts` - Comment only

7. `apps/web/src/lib/stores/scenes.test.ts` - Test file patterns
8. `apps/web/src/lib/stores/tokens.test.ts` - Test file patterns
9. `apps/web/src/lib/stores/effects.test.ts` - Test file patterns

10. `apps/web/src/lib/components/actor/ActorCreateModal.svelte` - Check usage
11. `apps/web/src/lib/components/scene/SceneManagementModal.svelte` - Check usage
12. `apps/web/src/lib/components/combat/CombatTracker.svelte` - Check usage
13. `apps/web/src/test/routes/page.test.ts` - Test patterns

## Patterns to Fix

### 1. Import Statements
```typescript
// OLD:
import { games } from '@vtt/database';

// NEW:
import { campaigns } from '@vtt/database';
```

### 2. Database Operations
```typescript
// OLD:
await db.delete(games);
await db.insert(games).values({...});

// NEW:
await db.delete(campaigns);
await db.insert(campaigns).values({...});
```

### 3. API URLs
```typescript
// OLD:
url: `/api/v1/games/${campaignId}/scenes`
url: '/api/v1/games'

// NEW:
url: `/api/v1/campaigns/${campaignId}/scenes`
url: '/api/v1/campaigns'
```

### 4. Test Variable Names
```typescript
// OLD:
let gameId: string;
const gameBody = JSON.parse(gameResponse.body);
gameId = gameBody.game.id;

// NEW:
let campaignId: string;
const campaignBody = JSON.parse(campaignResponse.body);
campaignId = campaignBody.campaign.id;
```

### 5. Response Property Names
```typescript
// OLD:
expect(body.scene.gameId).toBe(gameId);

// NEW:
expect(body.scene.campaignId).toBe(campaignId);
```

### 6. Function Parameters (Store files)
```typescript
// OLD:
async loadScenes(gameId: string): Promise<void> {
  const url = `${API_BASE_URL}/api/v1/games/${gameId}/scenes`;

// NEW:
async loadScenes(campaignId: string): Promise<void> {
  const url = `${API_BASE_URL}/api/v1/campaigns/${campaignId}/scenes`;
```

### 7. Comments
```typescript
// OLD:
// Load scenes for a game from the API
// Clear all scenes (useful when leaving a game)

// NEW:
// Load scenes for a campaign from the API
// Clear all scenes (useful when leaving a campaign)
```

### 8. Import File Paths (campaign.test.ts)
```typescript
// OLD:
from './game.js'

// NEW:
from './campaign.js'
```

## Testing Strategy

After making changes:

1. Run server tests: `cd D:\Projects\VTT\apps\server && npm test`
2. Run web tests: `cd D:\Projects\VTT\apps\web && npm test`
3. Verify 0 failures related to game/campaign naming
4. Report any remaining failures

## Success Criteria

- All 526 server tests pass
- All 512 web tests pass  
- No references to "games" table (should be "campaigns")
- No API URLs with "/games/" (should be "/campaigns/")
- No test variables named "gameId" (should be "campaignId")
- All imports from './game.js' changed to './campaign.js'

## Important Notes

- Do NOT change the `rooms.ts` file's parameter names - those are part of the public API
- Only update JSDoc comments in `rooms.ts` to reference "campaign" instead of "game"
- Focus on test files first, then implementation files
- Use search and replace carefully to avoid false positives
- Test after each major file change

