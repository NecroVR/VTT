#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(BASE_DIR, 'assets', 'icons');
const COMPENDIUM_DIR = path.join(BASE_DIR, 'compendium');

// Statistics tracking
const stats = {
  filesProcessed: 0,
  entriesProcessed: 0,
  iconsMapped: 0,
  iconsUnmapped: 0,
  unmappedPaths: new Set()
};

// Keyword mapping for common terms
const KEYWORD_MAPPINGS = {
  // Weapons
  'longsword': ['sword', 'blade', 'longsword', 'broad-sword'],
  'shortsword': ['short-sword', 'sword', 'blade'],
  'greatsword': ['great-sword', 'two-handed-sword', 'claymore'],
  'scimitar': ['scimitar', 'curved-sword'],
  'rapier': ['rapier', 'fencing'],
  'dagger': ['dagger', 'knife', 'blade'],
  'mace': ['mace', 'flanged-mace', 'spiked-mace'],
  'warhammer': ['war-hammer', 'hammer'],
  'battleaxe': ['battle-axe', 'axe'],
  'greataxe': ['broad-axe', 'great-axe', 'axe'],
  'handaxe': ['hatchet', 'hand-axe'],
  'spear': ['spear', 'pike'],
  'trident': ['trident'],
  'quarterstaff': ['bo', 'staff', 'quarterstaff'],
  'club': ['club', 'wooden-club'],
  'bow': ['bow', 'longbow', 'short-bow'],
  'crossbow': ['crossbow', 'arbalest'],
  'sling': ['sling'],

  // Armor
  'padded': ['layered-armor', 'cloth-armor', 'quilted'],
  'leather': ['leather-armor', 'breastplate'],
  'studded': ['studded-leather', 'studded-armor'],
  'hide': ['hide-armor', 'fur-armor'],
  'chainmail': ['chain-mail', 'chainmail'],
  'chain-shirt': ['chain-mail', 'mail-shirt'],
  'scalemail': ['scale-mail', 'scaled-armor'],
  'breastplate': ['breastplate', 'chest-armor'],
  'halfplate': ['half-plate', 'plate-armor'],
  'plate': ['plate-armor', 'full-plate'],
  'ringmail': ['ring-mail', 'chainmail'],
  'splint': ['splint-armor', 'plate-armor'],

  // Shields
  'shield': ['shield', 'round-shield', 'kite-shield'],

  // Adventuring gear
  'torch': ['torch', 'fire-torch'],
  'lantern': ['lantern', 'candle-lamp'],
  'rope': ['rope', 'lasso'],
  'backpack': ['backpack', 'knapsack'],
  'bedroll': ['sleeping-bag', 'bedroll'],
  'tent': ['camp', 'tent'],
  'potion': ['potion', 'bottle', 'flask'],
  'scroll': ['scroll', 'rolled-scroll'],
  'book': ['book', 'spell-book'],
  'chest': ['chest', 'treasure-chest', 'locked-chest'],
  'barrel': ['barrel', 'wooden-barrel'],
  'bag': ['bag', 'money-bag', 'sack'],
  'coin': ['coins', 'gold-bar', 'pay-money'],

  // Tools
  'tool': ['tools', 'gear-hammer'],
  'thieves-tools': ['lockpicks', 'lock-picking'],

  // Magic items
  'ring': ['ring', 'gem-ring'],
  'amulet': ['amulet', 'pendant', 'necklace'],
  'wand': ['wand', 'magic-wand'],
  'rod': ['rod', 'gem-rod'],
  'staff': ['wizard-staff', 'rune-staff', 'staff'],
  'orb': ['orb', 'crystal-ball'],
  'crystal': ['crystal', 'gem'],

  // Spells
  'fire': ['fire', 'fire-spell', 'fireball', 'flame'],
  'ice': ['ice', 'frozen', 'icicle'],
  'lightning': ['lightning', 'electric', 'thunder'],
  'magic': ['sparkles', 'magic-swirl', 'spell'],
  'heal': ['health', 'medical', 'cross'],
  'death': ['skull', 'death'],
  'necro': ['death', 'skull', 'undead'],

  // Monsters
  'dragon': ['dragon', 'sea-dragon', 'wyvern'],
  'goblin': ['goblin', 'imp'],
  'orc': ['orc', 'brute'],
  'skeleton': ['skeleton', 'skull'],
  'zombie': ['zombie', 'shambling'],
  'ghost': ['ghost', 'spectre'],
  'demon': ['demon', 'devil'],
  'angel': ['angel', 'wings'],
  'beast': ['wolf', 'bear', 'claw'],
  'serpent': ['snake', 'serpent'],
  'spider': ['spider', 'arachnid'],

  // General terms
  'weapon': ['crossed-swords', 'sword'],
  'armor': ['armor-vest', 'breastplate'],
  'equipment': ['gear-hammer', 'tools'],
  'treasure': ['treasure-chest', 'gem'],
  'container': ['chest', 'barrel', 'bag']
};

// Icon index: { 'icon-name': 'author/icon-name.svg' }
let iconIndex = {};

/**
 * Build an index of all available icons
 */
function buildIconIndex() {
  console.log('Building icon index...');
  const authors = fs.readdirSync(ICONS_DIR).filter(f => {
    const stat = fs.statSync(path.join(ICONS_DIR, f));
    return stat.isDirectory();
  });

  let totalIcons = 0;
  authors.forEach(author => {
    const authorDir = path.join(ICONS_DIR, author);
    const icons = fs.readdirSync(authorDir).filter(f => f.endsWith('.svg'));

    icons.forEach(icon => {
      const iconName = icon.replace('.svg', '');
      const iconPath = `assets/icons/${author}/${icon}`;

      // Store with full name
      iconIndex[iconName] = iconPath;

      // Also store variations (with underscores, without hyphens, etc.)
      const variations = [
        iconName.replace(/-/g, ''),
        iconName.replace(/-/g, '_'),
        iconName.replace(/_/g, '-')
      ];
      variations.forEach(v => {
        if (!iconIndex[v]) {
          iconIndex[v] = iconPath;
        }
      });

      totalIcons++;
    });
  });

  console.log(`Indexed ${totalIcons} icons from ${authors.length} authors`);
  return iconIndex;
}

/**
 * Extract keywords from a Foundry VTT icon path
 * Example: "icons/weapons/swords/sword-longsword.webp" -> ["weapons", "swords", "sword", "longsword"]
 */
function extractKeywords(foundryPath) {
  if (!foundryPath) return [];

  // Remove file extension and split by / and -
  const cleaned = foundryPath
    .replace(/\.(webp|png|jpg|svg)$/i, '')
    .toLowerCase();

  const parts = cleaned.split(/[\/\-_\s]+/);

  // Filter out common useless words
  const stopWords = new Set(['icons', 'equipment', 'magic', 'items', 'simple', 'the', 'of', 'and']);
  return parts.filter(p => p.length > 2 && !stopWords.has(p));
}

/**
 * Find the best matching icon for a given Foundry path
 */
function findMatchingIcon(foundryPath) {
  if (!foundryPath) return null;

  const keywords = extractKeywords(foundryPath);
  if (keywords.length === 0) return null;

  // Try direct matches first
  for (const keyword of keywords) {
    if (iconIndex[keyword]) {
      return iconIndex[keyword];
    }
  }

  // Try mapped keywords
  for (const keyword of keywords) {
    if (KEYWORD_MAPPINGS[keyword]) {
      for (const mapped of KEYWORD_MAPPINGS[keyword]) {
        if (iconIndex[mapped]) {
          return iconIndex[mapped];
        }
      }
    }
  }

  // Try fuzzy matching (partial matches)
  const allIconNames = Object.keys(iconIndex);
  for (const keyword of keywords) {
    // Find icons that contain the keyword
    const matches = allIconNames.filter(iconName =>
      iconName.includes(keyword) || keyword.includes(iconName)
    );

    if (matches.length > 0) {
      // Return the shortest match (likely most specific)
      matches.sort((a, b) => a.length - b.length);
      return iconIndex[matches[0]];
    }
  }

  // No match found
  return null;
}

/**
 * Process a single compendium JSON file
 */
function processCompendiumFile(filePath) {
  console.log(`\nProcessing: ${path.relative(BASE_DIR, filePath)}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  if (!data.entries || !Array.isArray(data.entries)) {
    console.log('  No entries found, skipping');
    return;
  }

  let modified = false;
  let entriesUpdated = 0;

  data.entries.forEach((entry, index) => {
    if (entry.img) {
      stats.entriesProcessed++;

      // Skip if already using new format
      if (entry.img.startsWith('assets/icons/')) {
        return;
      }

      const newPath = findMatchingIcon(entry.img);

      if (newPath) {
        console.log(`  [${index}] ${entry.name}: ${entry.img} -> ${newPath}`);
        entry.img = newPath;
        stats.iconsMapped++;
        entriesUpdated++;
        modified = true;
      } else {
        console.log(`  [${index}] ${entry.name}: ${entry.img} -> NO MATCH`);
        stats.iconsUnmapped++;
        stats.unmappedPaths.add(entry.img);
      }
    }
  });

  // Write back if modified
  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`  Updated ${entriesUpdated} entries`);
  }

  stats.filesProcessed++;
}

/**
 * Recursively find and process all JSON files in compendium
 */
function processAllCompendiumFiles(dir) {
  const entries = fs.readdirSync(dir);

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processAllCompendiumFiles(fullPath);
    } else if (entry.endsWith('.json')) {
      processCompendiumFile(fullPath);
    }
  });
}

/**
 * Print final statistics and report
 */
function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('ICON PATH UPDATE REPORT');
  console.log('='.repeat(80));
  console.log(`\nFiles Processed: ${stats.filesProcessed}`);
  console.log(`Entries Processed: ${stats.entriesProcessed}`);
  console.log(`Icons Mapped: ${stats.iconsMapped} (${((stats.iconsMapped / stats.entriesProcessed) * 100).toFixed(1)}%)`);
  console.log(`Icons Unmapped: ${stats.iconsUnmapped} (${((stats.iconsUnmapped / stats.entriesProcessed) * 100).toFixed(1)}%)`);

  if (stats.unmappedPaths.size > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('UNMAPPED ICON PATHS:');
    console.log('-'.repeat(80));

    const unmappedArray = Array.from(stats.unmappedPaths).sort();
    unmappedArray.forEach(p => console.log(`  ${p}`));

    // Write unmapped paths to file for reference
    const reportPath = path.join(BASE_DIR, 'scripts', 'unmapped-icons-report.txt');
    fs.writeFileSync(reportPath, unmappedArray.join('\n'), 'utf8');
    console.log(`\nUnmapped paths saved to: ${reportPath}`);
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
function main() {
  console.log('D&D 5e Icon Path Updater');
  console.log('='.repeat(80));

  // Build icon index
  buildIconIndex();

  // Process all compendium files
  console.log('\nProcessing compendium files...');
  processAllCompendiumFiles(COMPENDIUM_DIR);

  // Print report
  printReport();
}

// Run the script
main();
