import * as esbuild from 'esbuild';
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');

// Ensure dist directory exists
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build options for all bundles
const buildOptions = {
  bundle: true,
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  logLevel: 'info',
};

// Background service worker
const backgroundConfig = {
  ...buildOptions,
  entryPoints: ['src/background/index.ts'],
  outfile: 'dist/background/index.js',
};

// Content script
const contentConfig = {
  ...buildOptions,
  entryPoints: ['src/content/ddb-inject.ts'],
  outfile: 'dist/content/ddb-inject.js',
};

// Popup script
const popupConfig = {
  ...buildOptions,
  entryPoints: ['src/popup/popup.ts'],
  outfile: 'dist/popup/popup.js',
};

/**
 * Copy static files to dist
 */
function copyStaticFiles() {
  console.log('Copying static files...');

  // Create subdirectories
  ['background', 'content', 'popup', 'icons'].forEach((dir) => {
    const dirPath = join(distDir, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  });

  // Copy manifest.json
  copyFileSync(join(__dirname, 'manifest.json'), join(distDir, 'manifest.json'));

  // Copy content CSS
  copyFileSync(
    join(__dirname, 'src/content/ddb-inject.css'),
    join(distDir, 'content/ddb-inject.css')
  );

  // Copy popup HTML
  copyFileSync(join(__dirname, 'src/popup/popup.html'), join(distDir, 'popup/popup.html'));

  // Create placeholder icons if they don't exist
  const iconSizes = [16, 48, 128];
  iconSizes.forEach((size) => {
    const iconPath = join(__dirname, 'icons', `icon${size}.png`);
    const distIconPath = join(distDir, 'icons', `icon${size}.png`);

    if (existsSync(iconPath)) {
      copyFileSync(iconPath, distIconPath);
    } else {
      // Create a simple SVG-based placeholder
      createPlaceholderIcon(distIconPath, size);
    }
  });

  console.log('Static files copied successfully');
}

/**
 * Create a placeholder PNG icon (base64 encoded data URL)
 */
function createPlaceholderIcon(path, size) {
  // For now, create a text file explaining it's a placeholder
  // In a real scenario, you'd want actual PNG files
  const message = `Placeholder icon ${size}x${size}. Replace with actual PNG file.`;
  writeFileSync(path, message);
  console.log(`Created placeholder: ${path}`);
}

/**
 * Build all bundles
 */
async function build() {
  console.log('Building extension...');

  try {
    // Copy static files first
    copyStaticFiles();

    // Build all bundles
    await Promise.all([
      esbuild.build(backgroundConfig),
      esbuild.build(contentConfig),
      esbuild.build(popupConfig),
    ]);

    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

/**
 * Watch mode
 */
async function watch() {
  console.log('Starting watch mode...');

  try {
    // Copy static files first
    copyStaticFiles();

    // Create contexts for watching
    const backgroundContext = await esbuild.context(backgroundConfig);
    const contentContext = await esbuild.context(contentConfig);
    const popupContext = await esbuild.context(popupConfig);

    // Watch all bundles
    await Promise.all([
      backgroundContext.watch(),
      contentContext.watch(),
      popupContext.watch(),
    ]);

    console.log('Watching for changes...');
  } catch (error) {
    console.error('Watch failed:', error);
    process.exit(1);
  }
}

// Run build or watch
if (isWatch) {
  watch();
} else {
  build();
}
