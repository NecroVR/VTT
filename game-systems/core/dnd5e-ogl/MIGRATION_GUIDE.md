# Compendium to EAV Module Migration Guide

This guide explains how to migrate the existing compendium format to work with the new EAV module system.

## Current vs Target Format

### Current Format (Compendium Batch)

```json
{
  "compendiumId": "dnd5e-srd-weapons-simple-melee",
  "name": "Simple Melee Weapons",
  "templateId": "dnd5e-weapon",
  "source": "SRD 5.1",
  "entries": [
    {
      "id": "club",
      "name": "Club",
      "img": "icons/weapons/clubs/club-wood.webp",
      "description": "A simple wooden club.",
      "templateId": "dnd5e-weapon",
      "source": "SRD 5.1",
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d4",
        "damageType": "bludgeoning",
        "properties": ["light"],
        "weight": 2,
        "price": 0.1
      }
    }
  ]
}
```

### Target Format (EAV Entity)

```json
[
  {
    "id": "club",
    "entityType": "item",
    "name": "Club",
    "img": "icons/weapons/clubs/club-wood.webp",
    "description": "A simple wooden club.",
    "templateId": "dnd5e-weapon",
    "tags": ["weapon", "simple", "melee", "srd"],
    "data": {
      "weaponType": "simple-melee",
      "damage": "1d4",
      "damageType": "bludgeoning",
      "properties": ["light"],
      "weight": 2,
      "price": 0.1,
      "source": "SRD 5.1"
    }
  }
]
```

## Migration Options

### Option 1: Update ModuleLoader (Recommended)

Modify `ModuleLoaderService.loadEntityFile()` to detect and handle the compendium batch format:

```typescript
private async loadEntityFile(filePath: string, defaultType?: string): Promise<EntityFile[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    // NEW: Check for compendium batch format
    if (parsed.entries && Array.isArray(parsed.entries)) {
      // Handle compendium batch format
      return parsed.entries.map((entry: any) => ({
        entityId: entry.id || entry.entityId,
        entityType: this.inferEntityType(parsed.templateId) || defaultType || 'custom',
        name: entry.name,
        description: entry.description,
        img: entry.img,
        templateId: entry.templateId || parsed.templateId,
        tags: this.extractTags(entry, parsed),
        data: {
          ...entry.data,
          source: entry.source || parsed.source,
        },
        sourcePath: filePath,
      }));
    }

    // Original: Handle single entity or array
    const entities = Array.isArray(parsed) ? parsed : [parsed];
    return entities.map((entity) => ({
      entityId: entity.id || entity.entityId,
      entityType: entity.type || entity.entityType || defaultType || 'custom',
      name: entity.name,
      description: entity.description,
      img: entity.img,
      templateId: entity.templateId,
      tags: entity.tags,
      data: entity.data || entity,
      sourcePath: filePath,
    }));
  } catch (error) {
    throw new Error(`Failed to load entity file ${filePath}: ${error.message}`);
  }
}

/**
 * Infer entity type from template ID
 */
private inferEntityType(templateId?: string): string | undefined {
  if (!templateId) return undefined;

  // dnd5e-weapon → item
  // dnd5e-spell → spell
  // dnd5e-monster → monster
  const match = templateId.match(/^dnd5e-(.+)$/);
  if (match) {
    const type = match[1];
    if (type === 'weapon' || type === 'armor' || type === 'consumable') {
      return 'item';
    }
    return type; // spell, monster, etc.
  }

  return undefined;
}

/**
 * Extract tags from entity and batch metadata
 */
private extractTags(entry: any, batch: any): string[] {
  const tags: string[] = [];

  // Add entity tags
  if (entry.tags) {
    tags.push(...entry.tags);
  }

  // Add source tag
  if (entry.source || batch.source) {
    tags.push((entry.source || batch.source).toLowerCase().replace(/\s+/g, '-'));
  }

  // Add template-based tags
  if (entry.templateId || batch.templateId) {
    const templateId = entry.templateId || batch.templateId;
    const match = templateId.match(/^dnd5e-(.+)$/);
    if (match) {
      tags.push(match[1]);
    }
  }

  // Add type-specific tags
  if (entry.data?.weaponType) {
    const parts = entry.data.weaponType.split('-');
    tags.push(...parts); // ["simple", "melee"]
  }

  return [...new Set(tags)]; // Remove duplicates
}
```

**Advantages:**
- No need to restructure existing files
- Backward compatible
- Can handle both formats

**Implementation:**
1. Update `ModuleLoaderService` with the code above
2. Test with existing compendium files
3. Add tests for both formats

### Option 2: Convert Files with Script

Create a migration script to convert compendium files:

```typescript
// scripts/convert-compendium.ts

import fs from 'fs/promises';
import path from 'path';

interface CompendiumBatch {
  compendiumId: string;
  name: string;
  templateId: string;
  source: string;
  entries: Array<{
    id: string;
    name: string;
    img?: string;
    description?: string;
    templateId?: string;
    source?: string;
    data: Record<string, any>;
  }>;
}

async function convertCompendiumFile(inputPath: string, outputPath: string) {
  const content = await fs.readFile(inputPath, 'utf-8');
  const batch: CompendiumBatch = JSON.parse(content);

  const entities = batch.entries.map((entry) => {
    // Infer entity type from template
    const entityType = inferEntityType(entry.templateId || batch.templateId);

    // Extract tags
    const tags = extractTags(entry, batch);

    return {
      id: entry.id,
      entityType,
      name: entry.name,
      img: entry.img,
      description: entry.description,
      templateId: entry.templateId || batch.templateId,
      tags,
      data: {
        ...entry.data,
        source: entry.source || batch.source,
      },
    };
  });

  // Write converted file
  await fs.writeFile(outputPath, JSON.stringify(entities, null, 2), 'utf-8');
  console.log(`Converted ${inputPath} → ${outputPath}`);
  console.log(`  ${entities.length} entities`);
}

function inferEntityType(templateId: string): string {
  const match = templateId.match(/^dnd5e-(.+)$/);
  if (match) {
    const type = match[1];
    if (['weapon', 'armor', 'consumable', 'tool', 'loot'].includes(type)) {
      return 'item';
    }
    return type;
  }
  return 'custom';
}

function extractTags(entry: any, batch: any): string[] {
  const tags: string[] = [];

  if (entry.source || batch.source) {
    tags.push((entry.source || batch.source).toLowerCase().replace(/\s+/g, '-'));
  }

  const templateId = entry.templateId || batch.templateId;
  const match = templateId.match(/^dnd5e-(.+)$/);
  if (match) {
    tags.push(match[1]);
  }

  if (entry.data?.weaponType) {
    tags.push(...entry.data.weaponType.split('-'));
  }

  return [...new Set(tags)];
}

// Run conversion
async function main() {
  const inputDir = 'game-systems/core/dnd5e-ogl/compendium';
  const outputDir = 'game-systems/core/dnd5e-ogl/entities';

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Convert all compendium files
  const itemsDir = path.join(inputDir, 'items');
  const files = await fs.readdir(itemsDir);

  for (const file of files) {
    if (file.endsWith('.json')) {
      const inputPath = path.join(itemsDir, file);
      const outputPath = path.join(outputDir, 'items', file);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await convertCompendiumFile(inputPath, outputPath);
    }
  }
}

main().catch(console.error);
```

**Usage:**
```bash
cd D:\Projects\VTT
npx ts-node scripts/convert-compendium.ts
```

**Advantages:**
- Clean separation of formats
- Can keep original files for reference
- More explicit structure

**Disadvantages:**
- Requires maintaining two sets of files
- Need to re-run on updates

### Option 3: Hybrid Approach

Keep compendium files as-is but create adapter files for the module system:

```
dnd5e-ogl/
├── compendium/           # Original batch format (for reference/tooling)
│   └── items/
│       └── simple-melee-weapons.json
└── entities/             # Converted format (for module loading)
    └── items/
        └── simple-melee-weapons.json
```

**Advantages:**
- Best of both worlds
- Original files preserved
- Clean EAV format

**Disadvantages:**
- File duplication
- Need sync mechanism

## Recommended Migration Path

### Phase 1: Support Both Formats (Immediate)

1. Implement Option 1 (update ModuleLoader)
2. Add detection for compendium batch format
3. Test with existing files
4. Document both formats

### Phase 2: Convert Content (Short-term)

1. Create conversion script (Option 2)
2. Convert existing compendium files
3. Place converted files in `entities/` directory
4. Update `module.json` to reference new paths

### Phase 3: Deprecate Old Format (Long-term)

1. Mark compendium batch format as deprecated
2. Provide migration tools for custom content
3. Eventually remove batch format support

## Example Conversion

### Before: `compendium/items/simple-melee-weapons.json`

```json
{
  "compendiumId": "dnd5e-srd-weapons-simple-melee",
  "name": "Simple Melee Weapons",
  "templateId": "dnd5e-weapon",
  "source": "SRD 5.1",
  "entries": [
    {
      "id": "club",
      "name": "Club",
      "img": "icons/weapons/clubs/club-wood.webp",
      "description": "A simple wooden club.",
      "templateId": "dnd5e-weapon",
      "source": "SRD 5.1",
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d4",
        "damageType": "bludgeoning",
        "properties": ["light"],
        "weight": 2,
        "price": 0.1
      }
    },
    {
      "id": "dagger",
      "name": "Dagger",
      "img": "icons/weapons/daggers/dagger-steel.webp",
      "description": "A small, easily concealed blade.",
      "templateId": "dnd5e-weapon",
      "source": "SRD 5.1",
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d4",
        "damageType": "piercing",
        "properties": ["finesse", "light", "thrown"],
        "range": "20/60",
        "weight": 1,
        "price": 2
      }
    }
  ]
}
```

### After: `entities/items/simple-melee-weapons.json`

```json
[
  {
    "id": "club",
    "entityType": "item",
    "name": "Club",
    "img": "icons/weapons/clubs/club-wood.webp",
    "description": "A simple wooden club.",
    "templateId": "dnd5e-weapon",
    "tags": ["weapon", "simple", "melee", "srd-5.1"],
    "data": {
      "weaponType": "simple-melee",
      "damage": "1d4",
      "damageType": "bludgeoning",
      "properties": ["light"],
      "weight": 2,
      "price": 0.1,
      "source": "SRD 5.1"
    }
  },
  {
    "id": "dagger",
    "entityType": "item",
    "name": "Dagger",
    "img": "icons/weapons/daggers/dagger-steel.webp",
    "description": "A small, easily concealed blade.",
    "templateId": "dnd5e-weapon",
    "tags": ["weapon", "simple", "melee", "srd-5.1"],
    "data": {
      "weaponType": "simple-melee",
      "damage": "1d4",
      "damageType": "piercing",
      "properties": ["finesse", "light", "thrown"],
      "range": "20/60",
      "weight": 1,
      "price": 2,
      "source": "SRD 5.1"
    }
  }
]
```

## Testing Migration

### Test Case 1: Load Original Format

```typescript
const loader = new ModuleLoaderService();
const module = await loader.loadModule(
  db,
  'game-systems/core/dnd5e-ogl',
  { validate: true }
);

// Verify entities were loaded
const status = await loader.getModuleStatus(db, 'dnd5e-srd');
expect(status.entityCount).toBe(3); // club, dagger, greatclub
expect(status.status).toBe('valid');
```

### Test Case 2: Verify EAV Flattening

```typescript
// Query club entity
const [entity] = await db
  .select()
  .from(moduleEntities)
  .where(eq(moduleEntities.entityId, 'club'));

expect(entity.name).toBe('Club');
expect(entity.entityType).toBe('item');

// Query properties
const properties = await db
  .select()
  .from(entityProperties)
  .where(eq(entityProperties.entityId, entity.id));

// Verify property count
expect(properties.length).toBeGreaterThan(5);

// Verify specific properties
const weaponType = properties.find(p => p.propertyKey === 'weaponType');
expect(weaponType?.valueString).toBe('simple-melee');

const weight = properties.find(p => p.propertyKey === 'weight');
expect(weight?.valueInteger).toBe(2);
```

### Test Case 3: Reconstruct Entity

```typescript
// Reconstruct entity data from EAV
const reconstructed = loader.reconstructFromProperties(properties);

expect(reconstructed).toMatchObject({
  weaponType: 'simple-melee',
  damage: '1d4',
  damageType: 'bludgeoning',
  properties: ['light'],
  weight: 2,
  price: 0.1,
});
```

## Next Steps

1. **Choose migration strategy** - Option 1 recommended for backward compatibility
2. **Update ModuleLoader** - Add compendium batch format support
3. **Test with existing content** - Verify loading works correctly
4. **Document format** - Update MODULE_README.md with both formats
5. **Create conversion tools** - For custom content creators
6. **Plan deprecation** - Timeline for phasing out old format

## References

- [MODULE_README.md](./MODULE_README.md) - User documentation
- [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md) - System architecture
- [ModuleLoader Service](../../../apps/server/src/services/moduleLoader.ts)
- [EAV Module Schema](../../../docs/architecture/EAV_MODULE_SCHEMA.md)
