# Session Notes: Optimistic Property Updates Fix

**Date**: 2025-12-11
**Session ID**: 0063
**Focus**: Fix property changes not reflecting immediately on canvas

## Problem Summary

Property changes made through the PropertiesPanel (like changing light color, brightness, token properties, etc.) were not reflecting immediately on the canvas. Users had to move the object to see the changes.

### Root Cause

The issue was caused by missing optimistic updates in the `handleObjectPropertyChange` function. Unlike token movement (which updates the local store immediately before sending the WebSocket message), property changes only sent the WebSocket message and waited for the server to broadcast back the update.

**Token movement flow (working correctly)**:
1. Canvas detects token drag
2. Calls `onTokenMove` handler
3. Handler sends WebSocket message `sendTokenMove()`
4. WebSocket broadcasts to all clients (including sender)
5. Broadcast handler calls `tokensStore.moveToken()` to update local store
6. Svelte reactivity triggers canvas re-render

**Property changes flow (broken)**:
1. PropertiesPanel detects property input change
2. Dispatches `change` event
3. Page component calls `handleObjectPropertyChange`
4. Handler sends WebSocket message (e.g., `sendLightUpdate()`)
5. WebSocket broadcasts to all clients
6. Broadcast handler calls store update method
7. **BUT**: No immediate local store update, so canvas doesn't re-render until movement or WebSocket round-trip completes

## Solution Implemented

Added **optimistic updates** to all object property changes. The pattern now matches token movement:
1. Update local store immediately
2. Send WebSocket message
3. When WebSocket broadcasts back, the store update is idempotent (no visual flicker)

### Files Modified

#### `D:\Projects\VTT\apps\web\src\routes\campaign\[id]\+page.svelte`

**1. Updated `handleObjectPropertyChange` function** (lines 170-199):
- Added optimistic updates for all object types before sending WebSocket messages
- Ensures immediate UI feedback

```typescript
function handleObjectPropertyChange(event: CustomEvent<{ objectType: string; objectId: string; property: string; value: any }>) {
  const { objectType, objectId, property, value } = event.detail;

  // Optimistic update: Update local store immediately, then send WebSocket message
  // This ensures the UI updates immediately without waiting for the server round-trip
  switch (objectType) {
    case 'token':
      tokensStore.updateToken(objectId, { [property]: value });
      websocket.sendTokenUpdate({ tokenId: objectId, updates: { [property]: value } });
      break;
    case 'light':
      lightsStore.updateLight(objectId, { [property]: value });
      websocket.sendLightUpdate({ lightId: objectId, updates: { [property]: value } });
      break;
    case 'wall':
      wallsStore.updateWall(objectId, { [property]: value });
      websocket.sendWallUpdate({ wallId: objectId, updates: { [property]: value } });
      break;
    case 'door':
      doorsStore.updateDoorLocal(objectId, { [property]: value });
      websocket.sendDoorUpdate({ doorId: objectId, updates: { [property]: value } });
      break;
    case 'window':
      windowsStore.updateWindowLocal(objectId, { [property]: value });
      websocket.sendWindowUpdate({ windowId: objectId, updates: { [property]: value } });
      break;
    default:
      console.warn(`Unknown object type: ${objectType}`);
  }
}
```

**2. Updated `handleLightMove` function** (lines 675-682):
- Added optimistic update for consistency with other movement handlers
- Light movement now updates immediately like token movement

```typescript
function handleLightMove(lightId: string, x: number, y: number) {
  // Optimistic update: Update local store immediately, then send WebSocket message
  lightsStore.updateLight(lightId, { x, y });
  websocket.sendLightUpdate({
    lightId,
    updates: { x, y }
  });
}
```

## Store Methods Used

Each store provides an update method for partial property updates:
- `tokensStore.updateToken(tokenId, updates)`
- `lightsStore.updateLight(lightId, updates)`
- `wallsStore.updateWall(wallId, updates)`
- `doorsStore.updateDoorLocal(doorId, updates)`
- `windowsStore.updateWindowLocal(windowId, updates)`

These methods:
1. Retrieve the current object from the Map
2. Merge updates with existing properties
3. Update the Map with the merged object
4. Trigger Svelte reactivity

## Testing Performed

1. **Build Verification**: TypeScript compilation succeeded with no errors
2. **Pattern Consistency**: Verified the pattern matches token movement (which works correctly)
3. **All Object Types**: Applied fix to lights, tokens, walls, doors, and windows

## Expected Behavior After Fix

- Changing light color in PropertiesPanel → Color updates immediately on canvas
- Changing light brightness → Brightness updates immediately on canvas
- Changing token properties → Updates immediately on canvas
- Changing wall/door/window properties → Updates immediately on canvas
- All changes sync to other clients via WebSocket as before

## Technical Notes

### Why This Pattern Works

**Optimistic updates** provide instant UI feedback while maintaining data consistency:
1. User sees changes immediately (better UX)
2. WebSocket ensures all clients stay in sync
3. If WebSocket update differs from optimistic update (rare), it will correct itself when the broadcast arrives
4. The store update methods are idempotent - applying the same update twice has no negative effect

### Store Update Method Naming

Note the inconsistency in naming conventions:
- `tokensStore.updateToken()` - no suffix
- `lightsStore.updateLight()` - no suffix
- `wallsStore.updateWall()` - no suffix
- `doorsStore.updateDoorLocal()` - has "Local" suffix
- `windowsStore.updateWindowLocal()` - has "Local" suffix

This is because doors and windows also have async API methods (`updateDoor()`, `updateWindow()`) that make HTTP requests, so they use "Local" suffix for WebSocket-only updates.

## Related Files

- `D:\Projects\VTT\apps\web\src\lib\stores\lights.ts` - Lights store with `updateLight()` method
- `D:\Projects\VTT\apps\web\src\lib\stores\tokens.ts` - Tokens store with `updateToken()` method
- `D:\Projects\VTT\apps\web\src\lib\stores\walls.ts` - Walls store with `updateWall()` method
- `D:\Projects\VTT\apps\web\src\lib\stores\doors.ts` - Doors store with `updateDoorLocal()` method
- `D:\Projects\VTT\apps\web\src\lib\stores\windows.ts` - Windows store with `updateWindowLocal()` method
- `D:\Projects\VTT\apps\web\src\lib\components\scene\properties\LightProperties.svelte` - Light property panel
- `D:\Projects\VTT\apps\web\src\lib\components\SceneCanvas.svelte` - Canvas rendering component

## Next Steps

1. **Manual Testing**: Test in browser by changing light colors and verifying immediate updates
2. **Multi-Client Testing**: Verify changes still sync correctly between multiple connected clients
3. **Performance**: Monitor for any performance issues with rapid property changes
4. **Consider**: Add debouncing if users experience performance issues with rapid slider adjustments

## Status

✅ **Implementation Complete**
✅ **Build Successful**
⏳ **Awaiting Manual Testing** (deploy to Docker and test in browser)
