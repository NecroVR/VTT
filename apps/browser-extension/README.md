# VTT Content Importer - Browser Extension

A Chrome/Firefox browser extension that extracts content from D&D Beyond and imports it into your VTT application.

## Features

- **Automatic Detection**: Detects D&D Beyond character sheets, monsters, spells, and items
- **One-Click Import**: Adds an "Import to VTT" button to D&D Beyond pages
- **Local Storage**: Stores extracted content locally before sending to VTT
- **Auto-Send Mode**: Optionally send content to VTT automatically
- **Connection Status**: Shows VTT server connection status in popup

## Installation

### Chrome/Edge

1. Build the extension:
   ```bash
   cd apps/browser-extension
   pnpm install
   pnpm run build
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked"

5. Select the `apps/browser-extension/dist` folder

6. The extension icon should appear in your browser toolbar

### Firefox

1. Build the extension (same as above)

2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`

3. Click "Load Temporary Add-on"

4. Navigate to `apps/browser-extension/dist` and select `manifest.json`

5. The extension will be loaded temporarily (until browser restart)

## Configuration

1. Click the extension icon in your browser toolbar

2. Configure the VTT Server URL (default: `http://localhost:3000`)

3. Optionally enable "Auto-send to VTT" to skip manual confirmation

4. Click "Save Configuration"

## Usage

### Importing Content

1. Navigate to a D&D Beyond page:
   - Character sheet: `https://www.dndbeyond.com/characters/...`
   - Monster: `https://www.dndbeyond.com/monsters/...`
   - Spell: `https://www.dndbeyond.com/spells/...`
   - Item: `https://www.dndbeyond.com/equipment/...` or `/magic-items/...`

2. Look for the "Import to VTT" button injected into the page

3. Click the button to extract content

4. Content is extracted and:
   - Stored locally in the extension
   - Sent to VTT (if auto-send is enabled)
   - Displayed in a success notification

### Managing Stored Data

1. Click the extension icon to open the popup

2. View the count of stored items

3. Click "Clear All Data" to remove all stored content

4. The extension stores up to 50 most recent extractions

## Supported Content Types

### Characters
- Basic info (name, level, race, class)
- Ability scores
- Skills and saving throws
- Combat stats (AC, HP, speed, initiative)
- Features and traits
- Equipment
- Spells (for spellcasters)

### Monsters
- Basic info (name, size, type, alignment)
- Challenge rating and proficiency bonus
- Ability scores
- Combat stats
- Traits, actions, and legendary actions

### Spells
- Name, level, school
- Casting time, range, components, duration
- Description
- Available classes

### Items
- Name, type, rarity
- Attunement requirements
- Description
- Properties, weight, cost
- Damage (weapons) or AC (armor)

## Development

### Project Structure

```
apps/browser-extension/
├── src/
│   ├── background/         # Background service worker
│   ├── content/           # Content scripts injected into D&D Beyond
│   ├── popup/             # Extension popup UI
│   ├── utils/             # Shared utilities
│   └── types/             # TypeScript type definitions
├── icons/                 # Extension icons
├── dist/                  # Built extension (generated)
├── manifest.json          # Extension manifest
├── package.json           # NPM configuration
├── tsconfig.json          # TypeScript configuration
└── esbuild.config.js      # Build script
```

### Building

```bash
# Install dependencies
pnpm install

# Build once
pnpm run build

# Build and watch for changes
pnpm run watch
```

### Debugging

#### Chrome DevTools

1. **Background Script**:
   - Go to `chrome://extensions/`
   - Find the extension and click "service worker"
   - DevTools will open for the background script

2. **Content Script**:
   - Open DevTools on a D&D Beyond page (`F12`)
   - Content script logs appear in the console
   - Look for messages starting with "VTT Content Importer:"

3. **Popup**:
   - Right-click the extension icon
   - Select "Inspect popup"
   - DevTools will open for the popup

#### Common Issues

**Extension not loading:**
- Ensure `dist/` folder exists and contains all files
- Check browser console for errors
- Verify manifest.json is valid

**Import button not appearing:**
- Check content script is injected (look in DevTools console)
- Verify you're on a supported D&D Beyond page
- Check for JavaScript errors in console

**Connection to VTT failing:**
- Verify VTT server is running
- Check VTT URL is correct in extension settings
- Ensure VTT API endpoint `/api/import/dndbeyond` exists
- Check CORS settings on VTT server

## API Integration

The extension sends extracted data to the VTT server via HTTP POST to `/api/import/dndbeyond`.

### Request Format

```typescript
POST /api/import/dndbeyond
Content-Type: application/json

{
  "type": "character" | "monster" | "spell" | "item",
  "sourceUrl": "https://www.dndbeyond.com/...",
  "timestamp": 1234567890,
  "data": { /* extracted content */ },
  "images": ["https://..."]
}
```

### Expected Response

```typescript
{
  "success": true,
  "id": "imported-content-id"
}
```

## Icon Generation

The extension includes an SVG icon template. To generate PNG icons:

```bash
# Using ImageMagick
cd icons
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

See `icons/README.md` for more options.

## Security & Privacy

- **No Data Collection**: Extension does not collect or transmit any user data except to your configured VTT server
- **Local Storage Only**: Extracted content is stored locally in browser storage
- **Direct Communication**: Extension communicates directly with your VTT server (no third-party services)
- **Permissions**: Extension only requests necessary permissions:
  - `activeTab`: To inject import button into current tab
  - `storage`: To store configuration and extracted content locally
  - `host_permissions`: Limited to D&D Beyond domains only

## License

Part of the VTT project. See root LICENSE file for details.

## Troubleshooting

### Extension Icon Not Showing

Replace placeholder icons with actual PNG files (see `icons/README.md`).

### Import Button Not Appearing

1. Check you're on a supported D&D Beyond page
2. Open DevTools console and look for errors
3. Verify content script is loaded (check in DevTools Sources tab)
4. Try reloading the page

### Connection Errors

1. Verify VTT server is running and accessible
2. Check VTT URL in extension settings
3. Ensure VTT server accepts requests from browser extension (CORS)
4. Check browser console for detailed error messages

### Content Not Extracting Correctly

D&D Beyond may update their HTML structure, breaking the DOM selectors. If content extraction fails:

1. Open an issue with details about what's not working
2. Include the D&D Beyond page URL
3. Provide browser console errors
4. The extension may need updates to match D&D Beyond's current HTML structure
