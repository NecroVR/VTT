/**
 * Script to fix test files to include gameSystemId in campaign creation
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
  'apps/server/src/routes/api/v1/campaigns.test.ts',
  'apps/server/src/routes/api/v1/windows.test.ts',
  'apps/server/src/routes/api/v1/fog.test.ts',
  'apps/server/src/websocket/handlers/campaign.test.ts',
  'apps/server/src/routes/api/v1/scenes.test.ts',
  'apps/server/src/routes/api/v1/actors.test.ts',
  'apps/server/src/routes/api/v1/combats.test.ts',
  'apps/server/src/routes/api/v1/chat.test.ts',
  'apps/server/src/routes/api/v1/items.test.ts',
  'apps/server/src/routes/api/v1/lights.test.ts',
  'apps/server/src/routes/api/v1/walls.test.ts',
  'apps/server/src/routes/api/v1/tokens.test.ts',
];

const projectRoot = path.join(__dirname, '..');

testFiles.forEach((file) => {
  const filePath = path.join(projectRoot, file);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - file not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix API inject campaign creation (add gameSystemId to payload)
  // Pattern: payload: { name: 'Test Campaign', } or payload: { name: 'Test Campaign' }
  const apiPattern1 = /(payload:\s*\{\s*name:\s*['"]Test Campaign['"]\s*,?\s*\})/g;
  if (content.match(apiPattern1)) {
    content = content.replace(
      apiPattern1,
      "payload: { name: 'Test Campaign', gameSystemId: 'dnd5e-ogl' }"
    );
    modified = true;
    console.log(`Fixed API campaign creation in ${file}`);
  }

  // Fix database insert campaign creation
  // Pattern: .values({ ownerId: ..., name: 'Test Campaign', settings: {} })
  const dbPattern1 = /(\.values\(\{[^}]*name:\s*['"]Test Campaign['"][^}]*)(settings:\s*\{\})/g;
  if (content.match(dbPattern1)) {
    content = content.replace(
      dbPattern1,
      "$1gameSystemId: 'dnd5e-ogl', $2"
    );
    modified = true;
    console.log(`Fixed database campaign creation in ${file}`);
  }

  // Fix database insert without settings
  // Pattern: .values({ ownerId: ..., name: 'Test Campaign' })
  const dbPattern2 = /(\.values\(\{[^}]*)(name:\s*['"]Test Campaign['"])(\s*\})/g;
  if (content.match(dbPattern2)) {
    content = content.replace(
      dbPattern2,
      "$1$2, gameSystemId: 'dnd5e-ogl', settings: {}$3"
    );
    modified = true;
    console.log(`Fixed simple database campaign creation in ${file}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`  No changes needed in ${file}`);
  }
});

console.log('\nDone!');
