# Extension Icons

The extension requires PNG icons in three sizes:
- `icon16.png` - 16x16 pixels (toolbar)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Creating Icons from SVG

An `icon.svg` file is provided as a base. You can convert it to PNG using one of these methods:

### Method 1: Using ImageMagick (Command Line)

```bash
# Install ImageMagick first if needed
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Convert to different sizes
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

### Method 2: Using Inkscape (GUI)

1. Open `icon.svg` in Inkscape
2. File > Export PNG Image
3. Set width and height to desired size
4. Export to the appropriate filename

### Method 3: Using Online Tools

1. Visit https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set output dimensions
4. Download the converted PNG

### Method 4: Using Node.js (sharp)

```bash
npm install sharp
node -e "
const sharp = require('sharp');
const svg = require('fs').readFileSync('icon.svg');

[16, 48, 128].forEach(size => {
  sharp(svg)
    .resize(size, size)
    .png()
    .toFile(\`icon\${size}.png\`);
});
"
```

## Placeholder Behavior

The build script will create placeholder files if PNG icons don't exist. These placeholders should be replaced with actual PNG files before publishing the extension to the Chrome Web Store.

The extension will still work locally with placeholder files, but may not display icons correctly.
