# Session Notes: Docker TypeScript Resolution Fix

**Date**: 2025-12-04
**Session ID**: 0056
**Focus**: Fix Docker build failure due to TypeScript not being found in pnpm workspace

---

## Session Summary

Fixed Docker build failure caused by TypeScript module resolution issues in the pnpm monorepo workspace. The build scripts were using hardcoded paths that didn't work with pnpm's hoisting behavior in Docker containers.

---

## Problem Addressed

### Symptoms
- Docker build failing with error:
```
Error: Cannot find module '/app/packages/shared/node_modules/typescript/bin/tsc'
```
- Build failing at step: `RUN pnpm --filter @vtt/shared build`

### Root Cause
Build scripts in `package.json` files were using hardcoded paths:
```json
"build": "node ../../node_modules/typescript/bin/tsc"
```

This failed because:
1. pnpm hoists dependencies to the root `node_modules` directory (via `shamefully-hoist=true`)
2. The `.bin/tsc` wrapper scripts try to find TypeScript relative to the package directory
3. The hardcoded path assumed TypeScript would be in a specific relative location that didn't match the actual hoisted location in Docker

---

## Solution Implemented

Changed all build scripts to use:
```json
"build": "pnpm --dir ../.. exec tsc --project <path-to-tsconfig>"
```

This approach:
- `pnpm --dir ../..` - Executes the command from the workspace root directory
- `exec tsc` - Runs the hoisted TypeScript binary from root `node_modules/.bin`
- `--project <path>` - Specifies which `tsconfig.json` to use for each package
- Works cross-platform (Windows & Linux) and in Docker containers

---

## Files Modified

1. **packages/shared/package.json**
   - Changed: `"build": "node ../../node_modules/typescript/bin/tsc"`
   - To: `"build": "pnpm --dir ../.. exec tsc --project packages/shared/tsconfig.json"`

2. **apps/server/package.json**
   - Changed: `"build": "node ../../node_modules/typescript/bin/tsc"`
   - To: `"build": "pnpm --dir ../.. exec tsc --project apps/server/tsconfig.json"`

3. **packages/database/package.json**
   - Changed: `"build": "node ../../node_modules/typescript/bin/tsc"`
   - To: `"build": "pnpm --dir ../.. exec tsc --project packages/database/tsconfig.json"`

---

## Testing Results

### Local Builds
```bash
pnpm --filter @vtt/shared build    # Success
pnpm --filter @vtt/database build  # Success
pnpm --filter @vtt/server build    # Success
```

### Docker Build
```bash
docker-compose build --no-cache
```
**Result**: ✅ All images built successfully

### Docker Deployment
```bash
docker-compose up -d
docker-compose ps
```
**Result**: ✅ All containers running
- vtt_db - Running (healthy)
- vtt_redis - Running (healthy)
- vtt_server - Running
- vtt_web - Running
- vtt_nginx - Running

### Server Health
```
Server listening on 0.0.0.0:3000 in production mode
All HTTP routes registered
WebSocket handlers registered at /ws
Database connection initialized
```

---

## Git Commit

**Commit Hash**: `6722ab8`
**Message**: `fix(docker): Fix TypeScript resolution in pnpm workspace builds`
**Push Status**: ✅ Successfully pushed to `origin/master`

---

## Current Status

✅ **COMPLETE** - All tasks finished successfully

### Verification Checklist
- [x] Local builds working
- [x] Docker build successful
- [x] All containers running
- [x] Server started without errors
- [x] Changes committed
- [x] Pushed to GitHub

---

## Key Learning

When using pnpm workspaces with Docker:
- Avoid hardcoded paths to hoisted dependencies
- Use `pnpm --dir <workspace-root> exec <command>` to run binaries from root
- The `--project` flag lets you specify tsconfig from any working directory
- This pattern works consistently across local development and Docker builds

---

**Session completed successfully at 2025-12-04 22:42:00**
