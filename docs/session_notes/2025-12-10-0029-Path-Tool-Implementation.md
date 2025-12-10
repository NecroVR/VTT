# Session Notes: Path Tool Implementation

**Date**: 2025-12-10
**Session ID**: 0029
**Topic**: Path Tool - Animated Object Paths

---

## Session Summary

Implementing a new "Path Tool" that allows GMs to create animated paths for objects (tokens, lights) to follow. Objects will travel along smoothly curved spline paths between nodes in a continuous loop at a configurable speed.

---

## Architecture Overview (from codebase exploration)

### Key Files & Patterns to Follow

| Component | Existing Example | New Path File |
|-----------|-----------------|---------------|
| Database Schema | `packages/database/src/schema/walls.ts` | `packages/database/src/schema/paths.ts` |
| Shared Types | `packages/shared/src/types/wall.ts` | `packages/shared/src/types/path.ts` |
| API Routes | `apps/server/src/routes/api/v1/walls.ts` | `apps/server/src/routes/api/v1/paths.ts` |
| WebSocket Types | `packages/shared/src/types/websocket.ts` | Add path messages |
| Frontend Store | `apps/web/src/lib/stores/walls.ts` | `apps/web/src/lib/stores/paths.ts` |
| Spline Utils | `apps/web/src/lib/utils/spline.ts` | Extend for path interpolation |
| Canvas Rendering | `apps/web/src/SceneCanvas.svelte` | Add path rendering & animation |

### Spline System (Already Implemented)

The curved wall system provides:
- `catmullRomSpline(points, tension, numSegments)` - Generates smooth curves
- `findClosestPointOnSpline(px, py, splinePoints)` - Hit detection
- `renderSplinePath(ctx, points)` - Canvas rendering
- `insertControlPoint()` - Adding points to curves

### Tool System

Tools are managed in `SceneCanvas.svelte`:
- `activeTool` prop controls current tool
- `handleMouseDown()` routes clicks to tool-specific handlers
- Tools: 'select', 'wall', 'curved-wall', 'light'
- New tool: 'path'

---

## Design Decisions

### Path Data Model

```typescript
interface Path {
  id: string;
  sceneId: string;
  name: string;

  // Path nodes (waypoints)
  nodes: Array<{ x: number; y: number }>;

  // Animation settings
  speed: number;           // Units per second
  loop: boolean;           // Always true for initial implementation

  // Assigned object (optional)
  assignedObjectId?: string;
  assignedObjectType?: 'token' | 'light';

  // Visual settings
  visible: boolean;        // Show path line (GM only)
  color: string;           // Path visualization color

  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Animation System

1. **Path Interpolation**: Use Catmull-Rom splines to create smooth curves through nodes
2. **Object Movement**: Calculate position along path based on elapsed time and speed
3. **Loop Behavior**: When reaching the end, continue from the start seamlessly
4. **Real-time Sync**: All clients see the same animation position (server time-based)

### Tool Workflow

1. Select "Path" tool from toolbar
2. Click to place nodes (minimum 2)
3. Double-click or press Enter to complete path
4. Select path to edit nodes or assign objects
5. Right-click for context menu (delete, configure)

---

## Implementation Tasks

### Phase 1: Backend Infrastructure
- [ ] Database schema for paths table
- [ ] Shared types for Path interface
- [ ] API routes for CRUD operations
- [ ] WebSocket message types and handlers

### Phase 2: Frontend State & Store
- [ ] Create pathsStore for state management
- [ ] WebSocket subscription for path updates
- [ ] Integration with scene loading

### Phase 3: Path Tool UI
- [ ] Add path tool button to toolbar
- [ ] Implement path drawing mode
- [ ] Path node editing (drag, add, delete)
- [ ] Path selection and highlighting

### Phase 4: Path Rendering
- [ ] Render path lines using splines
- [ ] Show nodes as draggable handles
- [ ] Direction indicators on path
- [ ] GM-only visibility

### Phase 5: Animation System
- [ ] Create animation loop for path followers
- [ ] Calculate position along spline curve
- [ ] Update object positions in real-time
- [ ] Sync animation across clients

### Phase 6: Configuration
- [ ] Path properties modal
- [ ] Object assignment UI
- [ ] Speed configuration
- [ ] Visual settings

### Phase 7: Testing
- [ ] Unit tests for path utilities
- [ ] E2E tests for path tool
- [ ] Regression tests for existing features

---

## Agent Assignments

| Agent | Task | Status |
|-------|------|--------|
| Agent 1 | Database schema + shared types | Pending |
| Agent 2 | Backend API routes + WebSocket | Pending |
| Agent 3 | Frontend store + tool UI | Pending |
| Agent 4 | Path renderer + node editing | Pending |
| Agent 5 | Animation system | Pending |
| Agent 6 | Configuration modal | Pending |
| Agent 7 | Unit tests | Pending |
| Agent 8 | E2E tests | Pending |

---

## Files Created/Modified

(To be updated as agents complete work)

### Created
- (pending)

### Modified
- (pending)

---

## Current Status

- [x] Codebase exploration complete
- [x] Session notes created
- [ ] Implementation in progress

---

## Next Steps

1. Launch Agent 1 to create database schema and shared types
2. Launch Agent 2 to implement backend API routes
3. Continue with frontend implementation after backend is ready

---

## Key Learnings

(To be updated during implementation)

---
