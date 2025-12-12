# Compendium Format Comparison

This document shows the differences between the legacy compendium format and the new EAV module format.

## Summary Table

| Feature | Legacy | New EAV |
|---------|--------|---------|
| **Module Identity** | None | moduleId + version |
| **Game System Linking** | Implicit | Explicit (gameSystemId) |
| **Versioning** | None | Semantic versioning |
| **Dependencies** | None | Dependency tracking |
| **Validation** | None | Multi-stage with error tracking |
| **Change Detection** | None | SHA256 hash |
| **Hot Reload** | No | Yes |
| **Property Queries** | Inefficient (JSONB) | Indexed and fast (EAV) |
| **Campaign Integration** | Direct | Module junction table |
| **Rollback** | No | Transactional |
| **Error Handling** | Fail silently | Error tracking and reporting |
| **Format Support** | Batch only | Both batch and array |

## File Structure Comparison

### Legacy Structure

```
dnd5e-ogl/
├── manifest.json         # System metadata only
├── system.json           # System definition (attributes, skills, etc.)
└── compendium/           # Content files in custom batch format
    └── items/
        └── simple-melee-weapons.json  # Batch format with "entries" wrapper
```

### New EAV Structure

```
dnd5e-ogl/
├── manifest.json         # System metadata (legacy, kept for compatibility)
├── system.json           # System definition (unchanged)
├── module.json           # NEW: Module manifest for EAV loader
└── compendium/           # Content files (supports both formats)
    └── items/
        └── simple-melee-weapons.json
```

## Data Format Comparison

### Legacy Compendium Format

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
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d4"
      }
    }
  ]
}
```

**Characteristics:**
- Batch wrapper with metadata
- `entries` array contains entities
- Source and template at batch level
- Designed for bulk loading

### New EAV Format (Target)

```json
[
  {
    "id": "club",
    "entityType": "item",
    "name": "Club",
    "img": "icons/weapons/clubs/club-wood.webp",
    "description": "A simple wooden club.",
    "templateId": "dnd5e-weapon",
    "tags": ["weapon", "simple", "melee"],
    "data": {
      "weaponType": "simple-melee",
      "damage": "1d4"
    }
  }
]
```

**Characteristics:**
- Direct array of entities
- Explicit `entityType` field
- Tags for search and categorization
- All metadata at entity level

## Database Storage Comparison

### Legacy Storage

```
Items stored as JSONB documents:
┌─────────┬────────┬────────────────────────────────────┐
│ id      │ name   │ data (JSONB)                       │
├─────────┼────────┼────────────────────────────────────┤
│ club    │ Club   │ {weaponType: "simple-melee", ...}  │
└─────────┴────────┴────────────────────────────────────┘
```

### New EAV Storage

```
modules:
┌────────┬─────────────┬──────────────┬───────────────────┐
│ id     │ module_id   │ name         │ validation_status │
├────────┼─────────────┼──────────────┼───────────────────┤
│ uuid-1 │ dnd5e-srd   │ D&D 5e SRD   │ valid             │
└────────┴─────────────┴──────────────┴───────────────────┘

module_entities:
┌────────┬───────────┬───────────┬─────────────┬──────┐
│ id     │ module_id │ entity_id │ entity_type │ name │
├────────┼───────────┼───────────┼─────────────┼──────┤
│ uuid-2 │ uuid-1    │ club      │ item        │ Club │
└────────┴───────────┴───────────┴─────────────┴──────┘

entity_properties (EAV):
┌────────┬───────────┬──────────────┬──────────────┬──────────────┐
│ id     │ entity_id │ property_key │ value_string │ value_number │
├────────┼───────────┼──────────────┼──────────────┼──────────────┤
│ uuid-4 │ uuid-2    │ weaponType   │ simple-melee │ null         │
│ uuid-5 │ uuid-2    │ damage       │ 1d4          │ null         │
│ uuid-6 │ uuid-2    │ weight       │ null         │ 2            │
└────────┴───────────┴──────────────┴──────────────┴──────────────┘
```

## Query Comparison

### Legacy Queries

```typescript
// Filter by JSONB property (less efficient)
SELECT * FROM items
WHERE data->>'weaponType' LIKE '%melee%';
```

### New EAV Queries

```typescript
// Indexed property search (efficient)
SELECT e.*
FROM module_entities e
JOIN entity_properties p ON p.entity_id = e.id
WHERE p.property_key = 'weaponType'
  AND p.value_string LIKE '%melee%';
```

## Module Manifest Comparison

### Legacy (No Manifest)

No formal module system. Content loaded directly from files.

### New Module Manifest

```json
{
  "moduleId": "dnd5e-srd",
  "gameSystemId": "dnd5e-ogl",
  "name": "D&D 5e System Reference Document",
  "version": "1.0.0",
  "author": "Wizards of the Coast",
  "moduleType": "content",
  "license": "OGL 1.0a",
  "entities": ["compendium/items/simple-melee-weapons.json"]
}
```

**Features:**
- Module identity and versioning
- Game system compatibility
- Dependency management
- License metadata
- Entity file registry

## Migration Path

The new system supports both formats during transition:

```typescript
// ModuleLoader detects format automatically
if (parsed.entries && Array.isArray(parsed.entries)) {
  // Handle legacy batch format
  return convertBatchToEntities(parsed);
}

// Handle new format
return Array.isArray(parsed) ? parsed : [parsed];
```

This allows gradual migration without breaking existing content.
