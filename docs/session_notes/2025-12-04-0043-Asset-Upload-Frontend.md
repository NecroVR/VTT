# Session Notes: Asset Upload and Management Frontend Implementation

**Date**: 2025-12-04
**Session ID**: 0043
**Topic**: Asset Upload Frontend Components

---

## Session Summary

Implemented the complete frontend asset management system for the VTT application, including:
- Assets store for state management
- AssetUploader component with drag-and-drop functionality
- AssetBrowser component with grid/list views
- AssetPicker modal for asset selection
- Integration with TokenConfig component

The implementation connects to the existing backend API endpoints for asset upload, retrieval, update, and deletion.

---

## Files Created

### 1. Assets Store
**File**: `apps/web/src/lib/stores/assets.ts`

**Purpose**: Svelte store for managing asset state and API interactions

**Key Features**:
- Map-based storage for assets
- Authentication using sessionId from localStorage
- Methods:
  - `loadAssets(filters)` - Fetch assets with optional filtering
  - `uploadAsset(file, options)` - Upload new asset file
  - `deleteAsset(assetId)` - Delete an asset
  - `updateAsset(assetId, updates)` - Update asset metadata
- Helper methods:
  - `getAssetUrl(asset)` - Get full URL for an asset
  - `getThumbnailUrl(asset)` - Get thumbnail URL (falls back to main asset)
- Error handling and loading states

**Pattern**: Follows the existing `lightsStore` pattern for consistency

### 2. AssetUploader Component
**File**: `apps/web/src/lib/components/assets/AssetUploader.svelte`

**Purpose**: Drag-and-drop file upload component

**Key Features**:
- Drag-and-drop zone with visual feedback
- Click to open file picker
- Progress indicator during upload
- File type validation based on asset type
- File size validation (configurable max size)
- Events:
  - `upload` - Dispatched with Asset object on successful upload
  - `error` - Dispatched with error message string

**Props**:
- `assetType`: AssetType - Type of asset being uploaded
- `gameId`: string | undefined - Optional game ID for association
- `maxSizeMB`: number - Maximum file size in MB (default: 10)

### 3. AssetBrowser Component
**File**: `apps/web/src/lib/components/assets/AssetBrowser.svelte`

**Purpose**: Browse and manage uploaded assets

**Key Features**:
- Grid and list view modes (toggleable)
- Search functionality (searches name, originalName, description)
- Filter by asset type
- Thumbnail display for images
- Delete functionality
- Selection mode for picker integration
- Embedded AssetUploader for new uploads
- Empty and loading states

**Props**:
- `gameId`: string | undefined - Optional game ID filter
- `selectionMode`: boolean - Enable selection mode for picker
- `allowedTypes`: AssetType[] | undefined - Filter allowed types in selection mode

**Exports**:
- `getSelectedAsset()` - Returns currently selected asset (for picker)

### 4. AssetPicker Modal
**File**: `apps/web/src/lib/components/assets/AssetPicker.svelte`

**Purpose**: Modal dialog for selecting assets

**Key Features**:
- Wraps AssetBrowser in modal dialog
- Selection mode enabled automatically
- Confirm/Cancel buttons
- Keyboard shortcuts (Escape to close)
- Backdrop click to close

**Props**:
- `isOpen`: boolean - Control modal visibility
- `gameId`: string | undefined - Optional game ID filter
- `allowedTypes`: AssetType[] | undefined - Filter allowed types
- `title`: string - Modal title (default: "Select Asset")

**Events**:
- `select` - Dispatched with `{asset, url}` when asset is selected
- `cancel` - Dispatched when modal is cancelled

### 5. Component Index
**File**: `apps/web/src/lib/components/assets/index.ts`

**Purpose**: Central export point for all asset components

**Exports**:
- AssetUploader
- AssetBrowser
- AssetPicker

---

## Files Modified

### TokenConfig Component
**File**: `apps/web/src/lib/components/TokenConfig.svelte`

**Changes**:
1. Added import for AssetPicker component
2. Added state variable `showAssetPicker` to control modal
3. Modified image URL input to include Browse button
4. Added event handlers:
   - `handleAssetSelect` - Sets image URL from selected asset
   - `handleAssetPickerCancel` - Closes the picker
5. Added AssetPicker component instance with:
   - Filtered to token/portrait types only
   - Title: "Select Token Image"
   - Connected to gameId prop
6. Added CSS for image-url-input and button-browse

---

## API Integration

The frontend connects to the following backend endpoints:

### Upload Asset
- **Endpoint**: `POST /api/v1/assets/upload`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file` - The uploaded file
  - `assetType` - Type of asset (optional)
  - `gameId` - Associated game ID (optional)
  - `name` - Asset name (optional)
  - `description` - Asset description (optional)
  - `tags` - JSON array of tags (optional)
  - `metadata` - JSON object of metadata (optional)

### List Assets
- **Endpoint**: `GET /api/v1/assets`
- **Query Params**:
  - `assetType` - Filter by asset type
  - `gameId` - Filter by game ID
  - `search` - Search in name, description, originalName

### Get Asset
- **Endpoint**: `GET /api/v1/assets/:assetId`

### Update Asset
- **Endpoint**: `PATCH /api/v1/assets/:assetId`
- **Body**: Partial asset updates (name, description, tags, metadata, assetType, gameId)

### Delete Asset
- **Endpoint**: `DELETE /api/v1/assets/:assetId`

**Authentication**: All endpoints require Bearer token authentication using sessionId from localStorage.

---

## Testing Results

### Build Status
```bash
pnpm build
```
**Result**: SUCCESS

- All packages built successfully
- Web app built without errors
- Only warnings were Svelte accessibility and code style suggestions (non-blocking)
- Build artifacts created successfully

### Git Status
```bash
git status
git add <files>
git commit
git push
```
**Result**: SUCCESS

- All changes committed successfully
- Pre-commit hooks passed
- Pushed to GitHub successfully
- Commit: 8130c51

---

## Current Status

**COMPLETE**: All tasks finished successfully

### What's Complete
1. Assets store with full CRUD operations
2. AssetUploader component with drag-and-drop
3. AssetBrowser with grid/list views and filtering
4. AssetPicker modal for selection
5. Component index file
6. TokenConfig integration with Browse button
7. Build verification (successful)
8. Git commit and push (successful)

### Testing Checklist
- [x] Build completes without errors
- [x] TypeScript compilation successful
- [x] All imports resolve correctly
- [x] Component exports working
- [x] Store pattern consistent with existing code
- [x] Git hooks pass
- [x] Changes pushed to GitHub

---

## Key Decisions

### 1. Store Pattern
**Decision**: Follow the existing `lightsStore` pattern for consistency.

**Rationale**:
- Maintains code consistency across the project
- Developers familiar with lightsStore can easily understand assetsStore
- Proven pattern already working in production

### 2. Authentication
**Decision**: Use sessionId from localStorage with Bearer token authentication.

**Rationale**:
- Matches existing auth pattern in the project
- Auth store already manages sessionId in localStorage
- Consistent with how other API calls are made

### 3. Component Structure
**Decision**: Separate components for Upload, Browse, and Pick functionality.

**Rationale**:
- Single Responsibility Principle
- Reusable components (can use Browser without Picker, Uploader standalone)
- Easier to test and maintain
- Flexible composition (Browser embeds Uploader)

### 4. Asset URLs
**Decision**: Store paths in database, construct full URLs in the frontend.

**Rationale**:
- Backend already returns paths like `/uploads/...`
- Frontend can easily construct full URLs using API_BASE_URL
- Supports different environments (dev, staging, prod)
- Thumbnail paths can fall back to main asset path

### 5. File Validation
**Decision**: Validate file type and size in frontend before upload.

**Rationale**:
- Better user experience (immediate feedback)
- Reduces unnecessary server load
- Backend still validates as security layer
- Clear error messages for users

---

## Architecture Notes

### Data Flow

```
User Action → Component Event → Store Method → API Call → Backend
                                      ↓
                              Update Local State
                                      ↓
                            Reactive UI Update
```

### State Management

```
AssetsStore (Svelte Store)
├── assets: Map<string, Asset>  // All loaded assets
├── loading: boolean             // Loading state
└── error: string | null         // Error message
```

### Component Hierarchy

```
AssetPicker (Modal)
└── AssetBrowser
    ├── AssetUploader
    └── Asset Grid/List Display
        └── Individual Asset Cards
```

### File Upload Flow

```
User selects file
    ↓
Validate size & type
    ↓
Create FormData with file + metadata
    ↓
POST to /api/v1/assets/upload
    ↓
Backend saves file & creates DB record
    ↓
Returns Asset object
    ↓
Store adds to local Map
    ↓
UI updates reactively
```

---

## Next Steps

### Recommended Follow-ups

1. **Add Asset Management Page**
   - Standalone page for managing all assets
   - Bulk operations (delete multiple, download)
   - Asset organization (folders, tags)

2. **Enhance Integration**
   - Add asset picker to ItemSheet for item images
   - Add asset picker to scene background selection
   - Add asset picker to map selection

3. **Add Asset Preview**
   - Fullscreen preview modal
   - Image zoom/pan capabilities
   - Asset details panel

4. **Add Upload Enhancements**
   - Bulk upload (multiple files)
   - Drag-and-drop multiple files
   - Upload progress for each file
   - Upload queue management

5. **Add Asset Search**
   - Advanced search filters
   - Tag-based search
   - Date range filters
   - File type filters

6. **Add Asset Sharing**
   - Share assets between games
   - Public asset library
   - Import from URLs
   - Asset templates

---

## Lessons Learned

### What Went Well

1. **Pattern Consistency**: Following existing store patterns made implementation smooth
2. **Component Separation**: Splitting into Upload/Browse/Pick made components reusable
3. **Type Safety**: TypeScript caught several potential issues during development
4. **Build Success**: Clean build with no errors demonstrates good integration

### What Could Be Improved

1. **Upload Progress**: Currently simulated, could use actual XHR progress events
2. **Error Handling**: Could add more specific error messages for different failure scenarios
3. **Caching**: Could implement client-side caching for asset thumbnails
4. **Accessibility**: Some Svelte warnings about accessibility could be addressed

### Development Tips

1. Always check existing patterns before implementing new features
2. Test component exports early to catch import issues
3. Use TypeScript strictly for better type safety
4. Follow the existing code style for consistency
5. Build frequently to catch integration issues early

---

## References

### Related Session Notes
- `2025-12-04-0042-Asset-Upload-Management-Backend.md` - Backend implementation

### Related Files
- `apps/web/src/lib/stores/lights.ts` - Store pattern reference
- `apps/web/src/lib/components/LightingConfig.svelte` - Modal pattern reference
- `packages/shared/src/types/asset.ts` - Type definitions
- `apps/server/src/routes/api/v1/assets.ts` - Backend API

### External Documentation
- [Svelte Stores](https://svelte.dev/docs/svelte-store)
- [SvelteKit File Uploads](https://kit.svelte.dev/docs/form-actions#files)
- [Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

---

**Session Completed**: 2025-12-04
**Total Implementation Time**: ~1 hour
**Status**: All tasks completed successfully
