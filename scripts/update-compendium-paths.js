const fs = require('fs');
const path = require('path');
const glob = require('glob');

const COMPENDIUM_DIR = path.join(__dirname, '..', 'game-systems', 'core', 'dnd5e-ogl', 'compendium');
const OLD_PREFIX = 'assets/';
const NEW_PREFIX = '/game-systems/dnd5e-ogl/assets/';

console.log('Searching for JSON files in:', COMPENDIUM_DIR);

// Find all JSON files recursively
const jsonFiles = glob.sync('**/*.json', { cwd: COMPENDIUM_DIR, absolute: true });

console.log(`Found ${jsonFiles.length} JSON files\n`);

let totalUpdates = 0;
let filesUpdated = 0;

jsonFiles.forEach((filePath) => {
  const relativePath = path.relative(COMPENDIUM_DIR, filePath);

  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');

  // Count occurrences
  const occurrences = (content.match(/"img":\s*"assets\//g) || []).length;

  if (occurrences === 0) {
    console.log(`⊘ ${relativePath} - no updates needed`);
    return;
  }

  // Replace all "img": "assets/ with "img": "/game-systems/dnd5e-ogl/assets/
  const updated = content.replace(
    /"img":\s*"assets\//g,
    `"img": "${NEW_PREFIX}`
  );

  // Write back
  fs.writeFileSync(filePath, updated, 'utf8');

  totalUpdates += occurrences;
  filesUpdated++;
  console.log(`✓ ${relativePath} - updated ${occurrences} path(s)`);
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Complete!`);
console.log(`Files updated: ${filesUpdated}/${jsonFiles.length}`);
console.log(`Total paths updated: ${totalUpdates}`);
console.log(`${'='.repeat(60)}`);
