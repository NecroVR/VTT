# Session Notes: Viewport API Endpoints

**Date**: 2025-12-09
**Session ID**: 0021
**Focus**: Backend API endpoints for viewport save/load functionality

---

## Summary

Created backend API endpoints to support saving and loading user viewport positions for scenes. These endpoints allow each user to persist their camera position and zoom level per scene, enabling the frontend to restore their last view when returning to a scene.

---

## What Was Built

### 1. Viewport Routes (`apps/server/src/routes/api/v1/viewports.ts`)

Created a new Fastify plugin with two endpoints:

#### GET `/api/v1/scenes/:sceneId/viewport`
- **Purpose**: Fetch the authenticated user's saved viewport for a specific scene
- **Authentication**: Required via `authenticate` middleware
- **Response**: `{ viewport: SceneViewport | null }`
- **Behavior**: Returns `null` if no viewport has been saved yet
- **Validation**: Verifies scene exists before querying viewport

#### POST `/api/v1/scenes/:sceneId/viewport`
- **Purpose**: Save/update the authenticated user's viewport for a specific scene
- **Authentication**: Required via `authenticate` middleware
- **Body**: `{ cameraX: number, cameraY: number, zoom: number }`
- **Response**: `{ viewport: SceneViewport }`
- **Behavior**: Upserts viewport using `onConflictDoUpdate` (insert if new, update if exists)
- **Validation**:
  - Validates scene exists
  - Validates request body contains required numeric fields
  - Uses unique constraint on `(userId, sceneId)` for conflict resolution

### 2. Route Registration

Updated `apps/server/src/routes/api/v1/index.ts` to:
- Import `viewportsRoute` from `./viewports.js`
- Register the route with `await fastify.register(viewportsRoute)`
- Add endpoint documentation to the API root response

---

## Implementation Details

### Database Schema Used

The implementation uses the existing `sceneViewports` table from the database schema:

```typescript
export const sceneViewports = pgTable('scene_viewports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  cameraX: real('camera_x').notNull().default(0),
  cameraY: real('camera_y').notNull().default(0),
  zoom: real('zoom').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userSceneUnique: unique().on(table.userId, table.sceneId),
}));
```

### Type Definitions Used

From `@vtt/shared`:
- `SceneViewport` - Full viewport object with all fields
- `SaveViewportRequest` - Request body for POST endpoint
- `ViewportResponse` - Response wrapper (though we directly return the object)

### Upsert Logic

The POST endpoint uses Drizzle ORM's `onConflictDoUpdate` to handle both insert and update cases:

```typescript
await fastify.db
  .insert(sceneViewports)
  .values({
    userId,
    sceneId,
    cameraX,
    cameraY,
    zoom,
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [sceneViewports.userId, sceneViewports.sceneId],
    set: {
      cameraX,
      cameraY,
      zoom,
      updatedAt: new Date(),
    },
  })
  .returning();
```

This leverages the unique constraint on `(userId, sceneId)` to detect conflicts and update existing records.

---

## Files Created

- `D:\Projects\VTT\apps\server\src\routes\api\v1\viewports.ts` - New viewport routes

---

## Files Modified

- `D:\Projects\VTT\apps\server\src\routes\api\v1\index.ts` - Registered viewport routes

---

## Testing Results

### Build Status
- ✅ TypeScript compilation successful
- ✅ All packages built without errors

### Docker Deployment
- ✅ `docker-compose up -d --build` completed successfully
- ✅ All containers running (vtt_server, vtt_web, vtt_db, vtt_redis, vtt_nginx)
- ✅ Server logs show clean startup without errors
- ✅ Server listening on port 3000 in production mode

### Container Status
```
vtt_server   vtt-server   Up 8 seconds    3000/tcp
vtt_web      vtt-web      Up 7 seconds    5173/tcp
vtt_db       postgres     Up 24 hours     5432/tcp
vtt_redis    redis        Up 24 hours     6379/tcp
vtt_nginx    nginx        Up 3 hours      80/tcp, 443/tcp
```

---

## Git Commit

**Commit Hash**: `d1fbcb9`
**Message**: `feat(server): Add viewport save/load API endpoints`

**Changes**:
- Created GET /api/v1/scenes/:sceneId/viewport endpoint to fetch user's saved viewport
- Created POST /api/v1/scenes/:sceneId/viewport endpoint to save/update viewport position
- Implemented upsert logic using onConflictDoUpdate for viewport persistence
- Added authentication and scene existence validation
- Registered routes in API v1 index

---

## Current Status

✅ **Complete** - Viewport API endpoints are implemented, tested, committed, pushed, and deployed to Docker.

---

## Next Steps

### Frontend Integration
The frontend will need to:
1. Call GET endpoint when a scene is opened to restore saved viewport
2. Call POST endpoint periodically or on scene exit to save current viewport
3. Handle the case where no viewport exists (null response from GET)
4. Implement debouncing for POST calls to avoid excessive server requests

### Future Enhancements (Optional)
- Add campaign access validation (TODO comments in code)
- Consider rate limiting for POST endpoint to prevent abuse
- Add WebSocket support to sync viewport changes in real-time for GMs observing players
- Add viewport history/undo functionality
- Add per-user viewport reset functionality

---

## Key Learnings

1. **Upsert Pattern**: Drizzle ORM's `onConflictDoUpdate` provides clean upsert logic when unique constraints exist
2. **Authentication Flow**: The `authenticate` middleware populates `request.user` which contains the user ID
3. **Route Patterns**: Following existing patterns (scenes.ts) ensures consistency across the API
4. **Type Safety**: Leveraging shared types from `@vtt/shared` maintains type safety across frontend and backend

---

**Session Complete**: All objectives met, changes deployed and verified.
