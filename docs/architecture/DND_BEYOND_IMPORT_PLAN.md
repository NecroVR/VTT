# D&D Beyond Content Import - Implementation Plan

> **Plan Version:** 1.0.0
> **Created:** 2025-12-13
> **Status:** NOT STARTED
> **Target:** Personal use VTT with GM-bound content licensing

---

## Executive Summary

This plan implements a browser extension-based D&D Beyond content import system. GMs can import their purchased D&D Beyond content into our VTT, where it becomes bound to their campaigns. The approach uses DOM extraction (not API scraping) for legal safety.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IMPORT FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐        │
│  │  VTT Web UI  │────▶│  Popup Window    │────▶│  D&D Beyond Site │        │
│  │              │     │  (dndbeyond.com) │     │  (user's session)│        │
│  └──────┬───────┘     └────────┬─────────┘     └────────┬─────────┘        │
│         │                      │                        │                   │
│         │                      │    ┌───────────────────┘                   │
│         │                      │    │ Extension injects                     │
│         │                      │    ▼ import buttons                        │
│         │             ┌────────────────────┐                                │
│         │             │  Browser Extension │                                │
│         │             │  - Content Script  │                                │
│         │             │  - DOM Extraction  │                                │
│         │             └────────┬───────────┘                                │
│         │                      │                                            │
│         │                      │ postMessage / fetch                        │
│         │                      ▼                                            │
│         │             ┌────────────────────┐                                │
│         │             │   VTT Server API   │                                │
│         │             │  /api/v1/ddb-import│                                │
│         └────────────▶└────────┬───────────┘                                │
│                                │                                            │
│                                ▼                                            │
│                       ┌────────────────────┐                                │
│                       │ Transform Service  │                                │
│                       │ DDB → VTT Format   │                                │
│                       └────────┬───────────┘                                │
│                                │                                            │
│                                ▼                                            │
│                       ┌────────────────────┐                                │
│                       │  Module System     │                                │
│                       │  (Campaign-Bound)  │                                │
│                       └────────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Plan Status Tracking

### CRITICAL: Agent Instructions for Status Updates

**Every agent MUST update this section when completing work:**

1. After completing each task, update its status from `[ ]` to `[x]`
2. Add completion date in format `(YYYY-MM-DD)`
3. If a task is blocked, add `[BLOCKED: reason]`
4. Update the Phase status when all tasks complete
5. Run `git add` and `git commit` with the status update

### Phase Status Summary

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Foundation & Database Schema | NOT STARTED | 0/8 |
| 2 | Browser Extension Core | NOT STARTED | 0/10 |
| 3 | Server Import API | NOT STARTED | 0/9 |
| 4 | Content Parsers - Characters | NOT STARTED | 0/8 |
| 5 | Content Parsers - Monsters | NOT STARTED | 0/7 |
| 6 | Content Parsers - Spells & Items | NOT STARTED | 0/8 |
| 7 | Frontend Import UI | NOT STARTED | 0/9 |
| 8 | Campaign Binding & Permissions | NOT STARTED | 0/7 |
| 9 | Testing & Documentation | NOT STARTED | 0/8 |

---

## Phase 1: Foundation & Database Schema

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** None

### Objective

Establish the database schema, shared types, and foundational architecture for D&D Beyond imports.

### Tasks

- [ ] 1.1 Create shared TypeScript types for DDB import (`packages/shared/src/types/ddbImport.ts`)
- [ ] 1.2 Create database schema for import sources (`packages/database/src/schema/importSources.ts`)
- [ ] 1.3 Create database schema for import jobs (`packages/database/src/schema/importJobs.ts`)
- [ ] 1.4 Add `sourceType` and `sourceId` columns to `moduleEntities` table
- [ ] 1.5 Create database migration for new tables
- [ ] 1.6 Run migration and verify schema
- [ ] 1.7 Document schema in `docs/architecture/DDB_IMPORT_SCHEMA.md`
- [ ] 1.8 Commit and deploy to Docker

### Detailed Specifications

#### 1.1 Shared Types (`packages/shared/src/types/ddbImport.ts`)

```typescript
// D&D Beyond Import Types

export type DDBContentType =
  | 'character'
  | 'monster'
  | 'spell'
  | 'item'
  | 'class'
  | 'subclass'
  | 'race'
  | 'subrace'
  | 'background'
  | 'feat';

export type DDBImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial';

export interface DDBImportSource {
  id: string;
  userId: string;              // GM who owns this import
  sourceType: 'dndbeyond';
  sourceName: string;          // e.g., "Player's Handbook", "Monster Manual"
  sourceUrl: string;           // Original DDB URL
  ddbSourceId?: string;        // DDB's internal ID if available
  importedAt: Date;
  lastSyncAt?: Date;
  contentTypes: DDBContentType[];
  metadata: Record<string, unknown>;
}

export interface DDBImportJob {
  id: string;
  userId: string;
  sourceId?: string;
  status: DDBImportStatus;
  contentType: DDBContentType;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: DDBImportError[];
  startedAt: Date;
  completedAt?: Date;
  rawData?: unknown;           // Original DDB data (for debugging)
}

export interface DDBImportError {
  itemName: string;
  itemId?: string;
  error: string;
  details?: unknown;
}

export interface DDBImportRequest {
  contentType: DDBContentType;
  items: DDBRawItem[];
  sourceUrl: string;
  sourceName: string;
}

export interface DDBRawItem {
  ddbId: string;
  name: string;
  type: DDBContentType;
  data: unknown;               // Raw DOM-extracted data
  imageUrl?: string;
  sourceBook?: string;
}

// Campaign binding
export interface CampaignImportBinding {
  campaignId: string;
  importSourceId: string;
  addedAt: Date;
  addedByUserId: string;
}
```

#### 1.2 Import Sources Schema (`packages/database/src/schema/importSources.ts`)

```typescript
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const importSources = pgTable('import_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').notNull().default('dndbeyond'),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  ddbSourceId: text('ddb_source_id'),
  contentTypes: jsonb('content_types').$type<string[]>().notNull().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  importedAt: timestamp('imported_at').notNull().defaultNow(),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

#### 1.3 Import Jobs Schema (`packages/database/src/schema/importJobs.ts`)

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { importSources } from './importSources';

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceId: uuid('source_id').references(() => importSources.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('pending'),
  contentType: text('content_type').notNull(),
  totalItems: integer('total_items').notNull().default(0),
  processedItems: integer('processed_items').notNull().default(0),
  failedItems: integer('failed_items').notNull().default(0),
  errors: jsonb('errors').$type<Array<{itemName: string; error: string}>>().default([]),
  rawData: jsonb('raw_data'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

#### 1.4 Module Entities Extension

Add to existing `moduleEntities` table:
```sql
ALTER TABLE module_entities ADD COLUMN source_type TEXT;
ALTER TABLE module_entities ADD COLUMN source_id TEXT;
ALTER TABLE module_entities ADD COLUMN source_url TEXT;
CREATE INDEX idx_module_entities_source ON module_entities(source_type, source_id);
```

### Acceptance Criteria

- [ ] All TypeScript types compile without errors
- [ ] Database migration runs successfully
- [ ] Schema matches specification
- [ ] Can insert/query import_sources table
- [ ] Can insert/query import_jobs table
- [ ] Docker deployment successful
- [ ] Documentation complete

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/shared/src/types/ddbImport.ts` | CREATE |
| `packages/shared/src/types/index.ts` | MODIFY (add export) |
| `packages/database/src/schema/importSources.ts` | CREATE |
| `packages/database/src/schema/importJobs.ts` | CREATE |
| `packages/database/src/schema/moduleEntities.ts` | MODIFY |
| `packages/database/src/schema/index.ts` | MODIFY (add exports) |
| `packages/database/src/migrations/XXXX_ddb_import.ts` | CREATE |
| `docs/architecture/DDB_IMPORT_SCHEMA.md` | CREATE |

---

## Phase 2: Browser Extension Core

> **Estimated Session Time:** 1-2 sessions
> **Status:** NOT STARTED
> **Dependencies:** Phase 1 complete

### Objective

Create the Chrome/Firefox browser extension that injects into D&D Beyond pages and extracts content.

### Tasks

- [ ] 2.1 Create extension directory structure (`apps/browser-extension/`)
- [ ] 2.2 Create extension manifest v3 (`manifest.json`)
- [ ] 2.3 Create background service worker (`background.ts`)
- [ ] 2.4 Create content script for D&D Beyond injection (`content/ddb-inject.ts`)
- [ ] 2.5 Create popup UI for extension status (`popup/`)
- [ ] 2.6 Implement DOM extraction utilities (`utils/domExtractor.ts`)
- [ ] 2.7 Implement message passing to VTT (`utils/vttBridge.ts`)
- [ ] 2.8 Add extension build configuration (esbuild/webpack)
- [ ] 2.9 Test extension loading in Chrome
- [ ] 2.10 Document extension installation in `docs/guides/DDB_EXTENSION_INSTALL.md`

### Detailed Specifications

#### 2.1 Directory Structure

```
apps/browser-extension/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.js
├── src/
│   ├── background/
│   │   └── index.ts           # Service worker
│   ├── content/
│   │   ├── ddb-inject.ts      # Injected into dndbeyond.com
│   │   └── vtt-inject.ts      # Injected into our VTT (for receiving)
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── utils/
│   │   ├── domExtractor.ts    # DOM parsing utilities
│   │   ├── vttBridge.ts       # Communication with VTT
│   │   └── storage.ts         # Extension storage utilities
│   └── types/
│       └── messages.ts        # Message type definitions
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── dist/                      # Built extension
```

#### 2.2 Manifest V3 (`manifest.json`)

```json
{
  "manifest_version": 3,
  "name": "VTT D&D Beyond Importer",
  "version": "1.0.0",
  "description": "Import your D&D Beyond content into VTT",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://www.dndbeyond.com/*",
    "https://dndbeyond.com/*",
    "http://localhost:*/*",
    "https://your-vtt-domain.com/*"
  ],
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://www.dndbeyond.com/*", "https://dndbeyond.com/*"],
      "js": ["content/ddb-inject.js"],
      "css": ["content/ddb-inject.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

#### 2.3 Background Service Worker (`background/index.ts`)

```typescript
// Background service worker - handles extension lifecycle and cross-tab communication

import { MessageType, ExtensionMessage } from '../types/messages';

// Store VTT connection state
let vttTabId: number | null = null;
let vttOrigin: string | null = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case MessageType.REGISTER_VTT:
      // VTT page is registering itself
      vttTabId = sender.tab?.id ?? null;
      vttOrigin = message.payload.origin;
      sendResponse({ success: true });
      break;

    case MessageType.SEND_TO_VTT:
      // DDB content script wants to send data to VTT
      if (vttTabId) {
        chrome.tabs.sendMessage(vttTabId, {
          type: MessageType.IMPORT_DATA,
          payload: message.payload
        });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'VTT not connected' });
      }
      break;

    case MessageType.GET_VTT_STATUS:
      sendResponse({ connected: vttTabId !== null, origin: vttOrigin });
      break;

    case MessageType.OPEN_DDB_POPUP:
      // Open D&D Beyond in a popup window
      chrome.windows.create({
        url: message.payload.url || 'https://www.dndbeyond.com',
        type: 'popup',
        width: 1200,
        height: 800
      });
      sendResponse({ success: true });
      break;
  }

  return true; // Keep message channel open for async response
});

// Clean up when VTT tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === vttTabId) {
    vttTabId = null;
    vttOrigin = null;
  }
});

console.log('VTT DDB Importer background script loaded');
```

#### 2.4 DDB Content Script (`content/ddb-inject.ts`)

```typescript
// Content script injected into dndbeyond.com pages

import { MessageType } from '../types/messages';
import { DOMExtractor } from '../utils/domExtractor';

class DDBInjector {
  private extractor: DOMExtractor;
  private isInitialized = false;

  constructor() {
    this.extractor = new DOMExtractor();
    this.init();
  }

  private async init() {
    // Wait for page to fully load
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }

    this.detectPageType();
    this.injectImportButtons();
    this.isInitialized = true;

    console.log('[VTT Importer] Initialized on:', window.location.pathname);
  }

  private detectPageType(): 'character' | 'monster' | 'spell' | 'item' | 'compendium' | 'unknown' {
    const path = window.location.pathname;

    if (path.includes('/characters/')) return 'character';
    if (path.includes('/monsters/')) return 'monster';
    if (path.includes('/spells/')) return 'spell';
    if (path.includes('/equipment/') || path.includes('/magic-items/')) return 'item';
    if (path.includes('/sources/') || path.includes('/compendium/')) return 'compendium';

    return 'unknown';
  }

  private injectImportButtons() {
    const pageType = this.detectPageType();

    switch (pageType) {
      case 'character':
        this.injectCharacterButton();
        break;
      case 'monster':
        this.injectMonsterButton();
        break;
      case 'spell':
        this.injectSpellButton();
        break;
      case 'item':
        this.injectItemButton();
        break;
      case 'compendium':
        this.injectCompendiumButtons();
        break;
    }
  }

  private createImportButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'vtt-import-button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  private injectCharacterButton() {
    // Find character header area
    const header = document.querySelector('.ct-character-header');
    if (!header) return;

    const button = this.createImportButton('Import to VTT', async () => {
      const data = await this.extractor.extractCharacter();
      this.sendToVTT('character', data);
    });

    header.appendChild(button);
  }

  private injectMonsterButton() {
    // Find monster stat block
    const statBlock = document.querySelector('.mon-stat-block');
    if (!statBlock) return;

    const button = this.createImportButton('Import Monster', async () => {
      const data = await this.extractor.extractMonster();
      this.sendToVTT('monster', data);
    });

    statBlock.insertBefore(button, statBlock.firstChild);
  }

  private injectSpellButton() {
    // Find spell detail container
    const spellDetail = document.querySelector('.spell-detail');
    if (!spellDetail) return;

    const button = this.createImportButton('Import Spell', async () => {
      const data = await this.extractor.extractSpell();
      this.sendToVTT('spell', data);
    });

    spellDetail.insertBefore(button, spellDetail.firstChild);
  }

  private injectItemButton() {
    // Find item detail container
    const itemDetail = document.querySelector('.item-detail, .magic-item-detail');
    if (!itemDetail) return;

    const button = this.createImportButton('Import Item', async () => {
      const data = await this.extractor.extractItem();
      this.sendToVTT('item', data);
    });

    itemDetail.insertBefore(button, itemDetail.firstChild);
  }

  private injectCompendiumButtons() {
    // For compendium listing pages, add bulk import buttons
    const listItems = document.querySelectorAll('.compendium-item, .listing-item');

    listItems.forEach(item => {
      const button = this.createImportButton('Import', async () => {
        const data = await this.extractor.extractFromListItem(item as HTMLElement);
        this.sendToVTT(data.type, data);
      });
      button.classList.add('vtt-import-button-small');
      item.appendChild(button);
    });
  }

  private async sendToVTT(contentType: string, data: unknown) {
    try {
      // Check VTT connection status first
      const status = await chrome.runtime.sendMessage({
        type: MessageType.GET_VTT_STATUS
      });

      if (!status.connected) {
        this.showNotification('VTT not connected. Please open your VTT and try again.', 'error');
        return;
      }

      // Send data to VTT via background script
      const result = await chrome.runtime.sendMessage({
        type: MessageType.SEND_TO_VTT,
        payload: {
          contentType,
          data,
          sourceUrl: window.location.href,
          timestamp: Date.now()
        }
      });

      if (result.success) {
        this.showNotification('Sent to VTT successfully!', 'success');
      } else {
        this.showNotification(`Failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('[VTT Importer] Error sending to VTT:', error);
      this.showNotification('Error communicating with VTT', 'error');
    }
  }

  private showNotification(message: string, type: 'success' | 'error') {
    const notification = document.createElement('div');
    notification.className = `vtt-notification vtt-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }
}

// Initialize injector
new DDBInjector();
```

#### 2.6 DOM Extractor Utilities (`utils/domExtractor.ts`)

```typescript
// DOM extraction utilities for different D&D Beyond content types

export interface ExtractedData {
  type: string;
  ddbId: string;
  name: string;
  data: Record<string, unknown>;
  imageUrl?: string;
  sourceBook?: string;
}

export class DOMExtractor {

  async extractCharacter(): Promise<ExtractedData> {
    // Extract character ID from URL
    const match = window.location.pathname.match(/\/characters\/(\d+)/);
    const ddbId = match?.[1] ?? 'unknown';

    // Extract character name
    const name = document.querySelector('.ct-character-tidbits__name')?.textContent?.trim() ?? 'Unknown Character';

    // Extract basic info
    const data: Record<string, unknown> = {
      // Basic info
      name,
      race: document.querySelector('.ct-character-tidbits__race')?.textContent?.trim(),
      classes: this.extractClasses(),
      level: this.extractLevel(),
      background: document.querySelector('.ct-character-tidbits__background')?.textContent?.trim(),

      // Ability scores
      abilities: this.extractAbilityScores(),

      // Combat stats
      armorClass: this.extractArmorClass(),
      hitPoints: this.extractHitPoints(),
      speed: this.extractSpeed(),
      initiative: this.extractInitiative(),
      proficiencyBonus: this.extractProficiencyBonus(),

      // Proficiencies
      savingThrows: this.extractSavingThrows(),
      skills: this.extractSkills(),

      // Features
      features: this.extractFeatures(),

      // Spells (if any)
      spells: this.extractCharacterSpells(),

      // Equipment
      equipment: this.extractEquipment(),
    };

    // Get character portrait
    const imageUrl = document.querySelector('.ct-character-avatar__image')?.getAttribute('src') ?? undefined;

    return {
      type: 'character',
      ddbId,
      name,
      data,
      imageUrl
    };
  }

  async extractMonster(): Promise<ExtractedData> {
    const ddbId = this.extractDDBIdFromUrl() ?? 'unknown';
    const name = document.querySelector('.mon-stat-block__name-link, .mon-stat-block__name')?.textContent?.trim() ?? 'Unknown Monster';

    const data: Record<string, unknown> = {
      name,
      size: document.querySelector('.mon-stat-block__type-meta')?.textContent?.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)/i)?.[1],
      type: this.extractMonsterType(),
      alignment: this.extractAlignment(),
      armorClass: this.extractMonsterAC(),
      hitPoints: this.extractMonsterHP(),
      speed: this.extractMonsterSpeed(),
      abilities: this.extractMonsterAbilities(),
      savingThrows: this.extractMonsterSaves(),
      skills: this.extractMonsterSkills(),
      damageVulnerabilities: this.extractDamageList('Damage Vulnerabilities'),
      damageResistances: this.extractDamageList('Damage Resistances'),
      damageImmunities: this.extractDamageList('Damage Immunities'),
      conditionImmunities: this.extractConditionImmunities(),
      senses: this.extractSenses(),
      languages: this.extractLanguages(),
      challengeRating: this.extractChallengeRating(),
      traits: this.extractTraits(),
      actions: this.extractActions(),
      reactions: this.extractReactions(),
      legendaryActions: this.extractLegendaryActions(),
    };

    const imageUrl = document.querySelector('.mon-stat-block__header-image img')?.getAttribute('src') ?? undefined;
    const sourceBook = document.querySelector('.mon-stat-block__source')?.textContent?.trim();

    return {
      type: 'monster',
      ddbId,
      name,
      data,
      imageUrl,
      sourceBook
    };
  }

  async extractSpell(): Promise<ExtractedData> {
    const ddbId = this.extractDDBIdFromUrl() ?? 'unknown';
    const name = document.querySelector('.spell-name, h1.page-title')?.textContent?.trim() ?? 'Unknown Spell';

    const data: Record<string, unknown> = {
      name,
      level: this.extractSpellLevel(),
      school: this.extractSpellSchool(),
      castingTime: this.extractSpellProperty('Casting Time'),
      range: this.extractSpellProperty('Range'),
      components: this.extractSpellComponents(),
      duration: this.extractSpellProperty('Duration'),
      description: this.extractSpellDescription(),
      higherLevels: this.extractHigherLevels(),
      classes: this.extractSpellClasses(),
      ritual: this.isRitualSpell(),
      concentration: this.isConcentrationSpell(),
    };

    const sourceBook = document.querySelector('.spell-source')?.textContent?.trim();

    return {
      type: 'spell',
      ddbId,
      name,
      data,
      sourceBook
    };
  }

  async extractItem(): Promise<ExtractedData> {
    const ddbId = this.extractDDBIdFromUrl() ?? 'unknown';
    const name = document.querySelector('.item-name, h1.page-title')?.textContent?.trim() ?? 'Unknown Item';

    const data: Record<string, unknown> = {
      name,
      type: this.extractItemType(),
      rarity: this.extractItemRarity(),
      attunement: this.extractAttunement(),
      description: this.extractItemDescription(),
      properties: this.extractItemProperties(),
      weight: this.extractItemWeight(),
      cost: this.extractItemCost(),
    };

    const imageUrl = document.querySelector('.item-image img')?.getAttribute('src') ?? undefined;
    const sourceBook = document.querySelector('.item-source')?.textContent?.trim();

    return {
      type: 'item',
      ddbId,
      name,
      data,
      imageUrl,
      sourceBook
    };
  }

  async extractFromListItem(element: HTMLElement): Promise<ExtractedData> {
    // Generic extraction for compendium list items
    const link = element.querySelector('a');
    const name = link?.textContent?.trim() ?? 'Unknown';
    const href = link?.getAttribute('href') ?? '';

    // Determine type from URL
    let type = 'unknown';
    if (href.includes('/monsters/')) type = 'monster';
    else if (href.includes('/spells/')) type = 'spell';
    else if (href.includes('/equipment/') || href.includes('/magic-items/')) type = 'item';

    return {
      type,
      ddbId: this.extractIdFromHref(href),
      name,
      data: { name, url: href }
    };
  }

  // Helper methods (implement based on actual DDB DOM structure)
  private extractDDBIdFromUrl(): string | null {
    const match = window.location.pathname.match(/\/(\d+)(?:-|$)/);
    return match?.[1] ?? null;
  }

  private extractIdFromHref(href: string): string {
    const match = href.match(/\/(\d+)(?:-|$)/);
    return match?.[1] ?? 'unknown';
  }

  private extractClasses(): Array<{name: string; level: number}> {
    const classes: Array<{name: string; level: number}> = [];
    document.querySelectorAll('.ct-character-tidbits__classes-item').forEach(item => {
      const text = item.textContent?.trim() ?? '';
      const match = text.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        classes.push({ name: match[1], level: parseInt(match[2]) });
      }
    });
    return classes;
  }

  private extractLevel(): number {
    const levelText = document.querySelector('.ct-character-tidbits__level')?.textContent ?? '';
    return parseInt(levelText.replace(/\D/g, '')) || 1;
  }

  private extractAbilityScores(): Record<string, {score: number; modifier: number}> {
    const abilities: Record<string, {score: number; modifier: number}> = {};
    const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

    document.querySelectorAll('.ct-ability-summary').forEach((el, index) => {
      const score = parseInt(el.querySelector('.ct-ability-summary__primary')?.textContent ?? '10');
      const modifier = parseInt(el.querySelector('.ct-ability-summary__modifier')?.textContent ?? '0');
      abilities[abilityNames[index]] = { score, modifier };
    });

    return abilities;
  }

  // Additional extraction methods would be implemented here...
  private extractArmorClass(): number { return 10; } // Placeholder
  private extractHitPoints(): {current: number; max: number; temp: number} {
    return { current: 0, max: 0, temp: 0 };
  }
  private extractSpeed(): string { return '30 ft.'; }
  private extractInitiative(): number { return 0; }
  private extractProficiencyBonus(): number { return 2; }
  private extractSavingThrows(): Record<string, number> { return {}; }
  private extractSkills(): Record<string, number> { return {}; }
  private extractFeatures(): Array<{name: string; description: string}> { return []; }
  private extractCharacterSpells(): unknown[] { return []; }
  private extractEquipment(): unknown[] { return []; }

  // Monster extraction helpers
  private extractMonsterType(): string { return ''; }
  private extractAlignment(): string { return ''; }
  private extractMonsterAC(): {value: number; type?: string} { return { value: 10 }; }
  private extractMonsterHP(): {average: number; formula: string} { return { average: 0, formula: '' }; }
  private extractMonsterSpeed(): Record<string, number> { return {}; }
  private extractMonsterAbilities(): Record<string, number> { return {}; }
  private extractMonsterSaves(): Record<string, number> { return {}; }
  private extractMonsterSkills(): Record<string, number> { return {}; }
  private extractDamageList(type: string): string[] { return []; }
  private extractConditionImmunities(): string[] { return []; }
  private extractSenses(): string { return ''; }
  private extractLanguages(): string { return ''; }
  private extractChallengeRating(): {cr: string; xp: number} { return { cr: '0', xp: 0 }; }
  private extractTraits(): Array<{name: string; description: string}> { return []; }
  private extractActions(): Array<{name: string; description: string}> { return []; }
  private extractReactions(): Array<{name: string; description: string}> { return []; }
  private extractLegendaryActions(): Array<{name: string; description: string}> { return []; }

  // Spell extraction helpers
  private extractSpellLevel(): number { return 0; }
  private extractSpellSchool(): string { return ''; }
  private extractSpellProperty(name: string): string { return ''; }
  private extractSpellComponents(): {verbal: boolean; somatic: boolean; material: boolean; materials?: string} {
    return { verbal: false, somatic: false, material: false };
  }
  private extractSpellDescription(): string { return ''; }
  private extractHigherLevels(): string { return ''; }
  private extractSpellClasses(): string[] { return []; }
  private isRitualSpell(): boolean { return false; }
  private isConcentrationSpell(): boolean { return false; }

  // Item extraction helpers
  private extractItemType(): string { return ''; }
  private extractItemRarity(): string { return 'common'; }
  private extractAttunement(): boolean { return false; }
  private extractItemDescription(): string { return ''; }
  private extractItemProperties(): string[] { return []; }
  private extractItemWeight(): number { return 0; }
  private extractItemCost(): {value: number; unit: string} { return { value: 0, unit: 'gp' }; }
}
```

### Acceptance Criteria

- [ ] Extension loads in Chrome without errors
- [ ] Extension loads in Firefox without errors
- [ ] Content script injects on dndbeyond.com pages
- [ ] Import buttons appear on character pages
- [ ] Import buttons appear on monster stat blocks
- [ ] Import buttons appear on spell pages
- [ ] Import buttons appear on item pages
- [ ] Background script handles messages correctly
- [ ] Extension popup shows connection status
- [ ] Documentation complete

### Files to Create

| File | Action |
|------|--------|
| `apps/browser-extension/manifest.json` | CREATE |
| `apps/browser-extension/package.json` | CREATE |
| `apps/browser-extension/tsconfig.json` | CREATE |
| `apps/browser-extension/esbuild.config.js` | CREATE |
| `apps/browser-extension/src/background/index.ts` | CREATE |
| `apps/browser-extension/src/content/ddb-inject.ts` | CREATE |
| `apps/browser-extension/src/content/ddb-inject.css` | CREATE |
| `apps/browser-extension/src/popup/popup.html` | CREATE |
| `apps/browser-extension/src/popup/popup.ts` | CREATE |
| `apps/browser-extension/src/popup/popup.css` | CREATE |
| `apps/browser-extension/src/utils/domExtractor.ts` | CREATE |
| `apps/browser-extension/src/utils/vttBridge.ts` | CREATE |
| `apps/browser-extension/src/utils/storage.ts` | CREATE |
| `apps/browser-extension/src/types/messages.ts` | CREATE |
| `docs/guides/DDB_EXTENSION_INSTALL.md` | CREATE |

---

## Phase 3: Server Import API

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phase 1 complete

### Objective

Create the server-side API endpoints that receive imported data from the browser extension and process it into the module system.

### Tasks

- [ ] 3.1 Create DDB import service (`apps/server/src/services/ddbImportService.ts`)
- [ ] 3.2 Create import API routes (`apps/server/src/routes/api/v1/ddb-import.ts`)
- [ ] 3.3 Implement import job management (create, status, cancel)
- [ ] 3.4 Implement data validation and sanitization
- [ ] 3.5 Create import source tracking
- [ ] 3.6 Add WebSocket notifications for import progress
- [ ] 3.7 Write unit tests for import service
- [ ] 3.8 Add API documentation
- [ ] 3.9 Commit and deploy to Docker

### Detailed Specifications

#### 3.1 DDB Import Service (`apps/server/src/services/ddbImportService.ts`)

```typescript
import { db } from '@vtt/database';
import { importSources, importJobs, moduleEntities, entityProperties } from '@vtt/database/schema';
import { eq, and } from 'drizzle-orm';
import {
  DDBImportRequest,
  DDBImportJob,
  DDBImportSource,
  DDBContentType,
  DDBImportStatus
} from '@vtt/shared/types/ddbImport';
import { ModuleLoaderService } from './moduleLoader';
import { DDBCharacterParser } from './parsers/ddbCharacterParser';
import { DDBMonsterParser } from './parsers/ddbMonsterParser';
import { DDBSpellParser } from './parsers/ddbSpellParser';
import { DDBItemParser } from './parsers/ddbItemParser';

export class DDBImportService {
  private moduleLoader: ModuleLoaderService;
  private parsers: Map<DDBContentType, any>;

  constructor() {
    this.moduleLoader = new ModuleLoaderService();
    this.parsers = new Map([
      ['character', new DDBCharacterParser()],
      ['monster', new DDBMonsterParser()],
      ['spell', new DDBSpellParser()],
      ['item', new DDBItemParser()],
    ]);
  }

  /**
   * Create a new import job
   */
  async createImportJob(
    userId: string,
    request: DDBImportRequest
  ): Promise<DDBImportJob> {
    const [job] = await db.insert(importJobs).values({
      userId,
      status: 'pending',
      contentType: request.contentType,
      totalItems: request.items.length,
      processedItems: 0,
      failedItems: 0,
      errors: [],
      rawData: request,
    }).returning();

    // Start processing asynchronously
    this.processImportJob(job.id, userId, request).catch(err => {
      console.error(`Import job ${job.id} failed:`, err);
    });

    return this.mapJobToDTO(job);
  }

  /**
   * Process import job (runs asynchronously)
   */
  private async processImportJob(
    jobId: string,
    userId: string,
    request: DDBImportRequest
  ): Promise<void> {
    // Update status to processing
    await db.update(importJobs)
      .set({ status: 'processing' })
      .where(eq(importJobs.id, jobId));

    const parser = this.parsers.get(request.contentType);
    if (!parser) {
      await this.failJob(jobId, `No parser for content type: ${request.contentType}`);
      return;
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors: Array<{itemName: string; error: string}> = [];

    // Create or find import source
    const source = await this.getOrCreateSource(userId, request);

    for (const item of request.items) {
      try {
        // Parse DDB data into VTT format
        const parsed = await parser.parse(item);

        // Create module entity
        await this.createModuleEntity(userId, source.id, parsed);

        processedCount++;
      } catch (error) {
        failedCount++;
        errors.push({
          itemName: item.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Update progress
      await db.update(importJobs)
        .set({
          processedItems: processedCount,
          failedItems: failedCount,
          errors
        })
        .where(eq(importJobs.id, jobId));

      // Emit WebSocket progress event
      this.emitProgress(jobId, processedCount, request.items.length);
    }

    // Mark job as completed
    const finalStatus: DDBImportStatus = failedCount === 0
      ? 'completed'
      : failedCount === request.items.length
        ? 'failed'
        : 'partial';

    await db.update(importJobs)
      .set({
        status: finalStatus,
        completedAt: new Date()
      })
      .where(eq(importJobs.id, jobId));
  }

  /**
   * Get or create import source record
   */
  private async getOrCreateSource(
    userId: string,
    request: DDBImportRequest
  ): Promise<DDBImportSource> {
    // Check if source already exists
    const existing = await db.query.importSources.findFirst({
      where: and(
        eq(importSources.userId, userId),
        eq(importSources.sourceUrl, request.sourceUrl)
      )
    });

    if (existing) {
      // Update last sync time
      await db.update(importSources)
        .set({ lastSyncAt: new Date() })
        .where(eq(importSources.id, existing.id));
      return existing as DDBImportSource;
    }

    // Create new source
    const [source] = await db.insert(importSources).values({
      userId,
      sourceType: 'dndbeyond',
      sourceName: request.sourceName,
      sourceUrl: request.sourceUrl,
      contentTypes: [request.contentType]
    }).returning();

    return source as DDBImportSource;
  }

  /**
   * Create module entity from parsed data
   */
  private async createModuleEntity(
    userId: string,
    sourceId: string,
    parsed: {
      entityType: string;
      entityId: string;
      name: string;
      description?: string;
      img?: string;
      data: Record<string, unknown>;
      ddbId: string;
      sourceUrl?: string;
    }
  ): Promise<void> {
    // Get or create user's DDB import module
    const moduleId = await this.getOrCreateUserDDBModule(userId);

    // Check for existing entity (for updates)
    const existing = await db.query.moduleEntities.findFirst({
      where: and(
        eq(moduleEntities.moduleId, moduleId),
        eq(moduleEntities.sourceType, 'dndbeyond'),
        eq(moduleEntities.sourceId, parsed.ddbId)
      )
    });

    if (existing) {
      // Update existing entity
      await db.update(moduleEntities)
        .set({
          name: parsed.name,
          description: parsed.description,
          img: parsed.img,
          data: parsed.data,
          updatedAt: new Date()
        })
        .where(eq(moduleEntities.id, existing.id));

      // Update properties
      await this.updateEntityProperties(existing.id, parsed.data);
    } else {
      // Create new entity
      const [entity] = await db.insert(moduleEntities).values({
        moduleId,
        entityId: parsed.entityId,
        entityType: parsed.entityType,
        name: parsed.name,
        description: parsed.description,
        img: parsed.img,
        data: parsed.data,
        sourceType: 'dndbeyond',
        sourceId: parsed.ddbId,
        sourceUrl: parsed.sourceUrl,
        searchText: `${parsed.name} ${parsed.description ?? ''}`.toLowerCase()
      }).returning();

      // Create properties
      await this.createEntityProperties(entity.id, parsed.data);
    }
  }

  /**
   * Get or create user's DDB import module
   */
  private async getOrCreateUserDDBModule(userId: string): Promise<string> {
    // This would create a personal DDB import module for the user
    // Implementation depends on your module system
    // Return module ID
    return 'user-ddb-module-id'; // Placeholder
  }

  /**
   * Create entity properties from data object
   */
  private async createEntityProperties(
    entityId: string,
    data: Record<string, unknown>,
    prefix: string = ''
  ): Promise<void> {
    // Use existing EAV flattening logic from moduleLoader
    // This flattens nested objects into property rows
  }

  /**
   * Update entity properties
   */
  private async updateEntityProperties(
    entityId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // Delete existing properties and recreate
    await db.delete(entityProperties)
      .where(eq(entityProperties.entityId, entityId));

    await this.createEntityProperties(entityId, data);
  }

  /**
   * Get import job status
   */
  async getJobStatus(jobId: string, userId: string): Promise<DDBImportJob | null> {
    const job = await db.query.importJobs.findFirst({
      where: and(
        eq(importJobs.id, jobId),
        eq(importJobs.userId, userId)
      )
    });

    return job ? this.mapJobToDTO(job) : null;
  }

  /**
   * List import jobs for user
   */
  async listJobs(userId: string, limit = 20): Promise<DDBImportJob[]> {
    const jobs = await db.query.importJobs.findMany({
      where: eq(importJobs.userId, userId),
      orderBy: (jobs, { desc }) => [desc(jobs.startedAt)],
      limit
    });

    return jobs.map(this.mapJobToDTO);
  }

  /**
   * List import sources for user
   */
  async listSources(userId: string): Promise<DDBImportSource[]> {
    const sources = await db.query.importSources.findMany({
      where: eq(importSources.userId, userId),
      orderBy: (sources, { desc }) => [desc(sources.importedAt)]
    });

    return sources as DDBImportSource[];
  }

  private mapJobToDTO(job: any): DDBImportJob {
    return {
      id: job.id,
      userId: job.userId,
      sourceId: job.sourceId,
      status: job.status,
      contentType: job.contentType,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      failedItems: job.failedItems,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };
  }

  private async failJob(jobId: string, error: string): Promise<void> {
    await db.update(importJobs)
      .set({
        status: 'failed',
        errors: [{ itemName: 'Job', error }],
        completedAt: new Date()
      })
      .where(eq(importJobs.id, jobId));
  }

  private emitProgress(jobId: string, processed: number, total: number): void {
    // Emit WebSocket event for real-time progress
    // Implementation depends on your WebSocket setup
  }
}
```

#### 3.2 API Routes (`apps/server/src/routes/api/v1/ddb-import.ts`)

```typescript
import { Router } from 'express';
import { DDBImportService } from '../../../services/ddbImportService';
import { requireAuth } from '../../../middleware/auth';
import { z } from 'zod';

const router = Router();
const importService = new DDBImportService();

// Validation schemas
const importRequestSchema = z.object({
  contentType: z.enum(['character', 'monster', 'spell', 'item', 'class', 'race', 'background', 'feat']),
  items: z.array(z.object({
    ddbId: z.string(),
    name: z.string(),
    type: z.string(),
    data: z.unknown(),
    imageUrl: z.string().optional(),
    sourceBook: z.string().optional()
  })),
  sourceUrl: z.string().url(),
  sourceName: z.string()
});

/**
 * POST /api/v1/ddb-import
 * Start a new import job
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const request = importRequestSchema.parse(req.body);
    const job = await importService.createImportJob(req.user!.id, request);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import request',
        details: error.errors
      });
    }

    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start import'
    });
  }
});

/**
 * GET /api/v1/ddb-import/jobs
 * List user's import jobs
 */
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const jobs = await importService.listJobs(req.user!.id, limit);

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('List jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list import jobs'
    });
  }
});

/**
 * GET /api/v1/ddb-import/jobs/:jobId
 * Get import job status
 */
router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const job = await importService.getJobStatus(req.params.jobId, req.user!.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Import job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get import job'
    });
  }
});

/**
 * GET /api/v1/ddb-import/sources
 * List user's import sources
 */
router.get('/sources', requireAuth, async (req, res) => {
  try {
    const sources = await importService.listSources(req.user!.id);

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('List sources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list import sources'
    });
  }
});

/**
 * DELETE /api/v1/ddb-import/sources/:sourceId
 * Delete an import source and its entities
 */
router.delete('/sources/:sourceId', requireAuth, async (req, res) => {
  try {
    await importService.deleteSource(req.params.sourceId, req.user!.id);

    res.json({
      success: true,
      message: 'Import source deleted'
    });
  } catch (error) {
    console.error('Delete source error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete import source'
    });
  }
});

export default router;
```

### Acceptance Criteria

- [ ] Import endpoint accepts valid requests
- [ ] Import endpoint rejects invalid requests with proper errors
- [ ] Import jobs are created and tracked
- [ ] Import progress is updated during processing
- [ ] Import sources are tracked
- [ ] Duplicate imports update existing entities
- [ ] WebSocket notifications work for progress
- [ ] All endpoints require authentication
- [ ] Unit tests pass
- [ ] Docker deployment successful

### Files to Create/Modify

| File | Action |
|------|--------|
| `apps/server/src/services/ddbImportService.ts` | CREATE |
| `apps/server/src/routes/api/v1/ddb-import.ts` | CREATE |
| `apps/server/src/routes/api/v1/index.ts` | MODIFY (add route) |
| `apps/server/tests/services/ddbImportService.test.ts` | CREATE |
| `apps/server/tests/routes/ddb-import.test.ts` | CREATE |
| `docs/api/DDB_IMPORT_API.md` | CREATE |

---

## Phase 4: Content Parsers - Characters

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phase 3 complete

### Objective

Implement the character parser that transforms D&D Beyond character data into VTT format.

### Tasks

- [ ] 4.1 Create character parser (`apps/server/src/services/parsers/ddbCharacterParser.ts`)
- [ ] 4.2 Implement ability score parsing
- [ ] 4.3 Implement class/level parsing
- [ ] 4.4 Implement skill/save parsing
- [ ] 4.5 Implement equipment parsing
- [ ] 4.6 Implement spell parsing for characters
- [ ] 4.7 Write unit tests with sample DDB character data
- [ ] 4.8 Commit and deploy to Docker

### Detailed Specifications

#### 4.1 Character Parser (`apps/server/src/services/parsers/ddbCharacterParser.ts`)

```typescript
import { DDBRawItem } from '@vtt/shared/types/ddbImport';

interface ParsedCharacter {
  entityType: 'character';
  entityId: string;
  name: string;
  description: string;
  img?: string;
  data: CharacterData;
  ddbId: string;
  sourceUrl?: string;
}

interface CharacterData {
  // Basic Info
  name: string;
  race: string;
  background: string;
  alignment: string;
  experiencePoints: number;

  // Classes
  classes: Array<{
    name: string;
    level: number;
    subclass?: string;
    hitDiceUsed: number;
  }>;
  totalLevel: number;

  // Ability Scores
  abilities: {
    str: AbilityScore;
    dex: AbilityScore;
    con: AbilityScore;
    int: AbilityScore;
    wis: AbilityScore;
    cha: AbilityScore;
  };

  // Combat
  armorClass: number;
  initiative: number;
  speed: {
    walk: number;
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  hitPoints: {
    current: number;
    max: number;
    temp: number;
  };
  hitDice: Array<{
    dieType: string;
    total: number;
    used: number;
  }>;
  deathSaves: {
    successes: number;
    failures: number;
  };

  // Proficiencies
  proficiencyBonus: number;
  savingThrows: Record<string, { proficient: boolean; modifier: number }>;
  skills: Record<string, { proficient: boolean; expertise: boolean; modifier: number }>;

  // Features & Traits
  features: Array<{
    name: string;
    source: string;
    description: string;
  }>;

  // Spellcasting (if applicable)
  spellcasting?: {
    ability: string;
    spellAttack: number;
    spellDC: number;
    slots: Record<number, { total: number; used: number }>;
    spells: Array<{
      name: string;
      level: number;
      prepared: boolean;
    }>;
  };

  // Equipment
  equipment: Array<{
    name: string;
    quantity: number;
    equipped: boolean;
    attuned: boolean;
  }>;
  currency: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };

  // Personality
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;

  // Notes
  backstory: string;
  notes: string;
}

interface AbilityScore {
  base: number;
  bonus: number;
  total: number;
  modifier: number;
}

export class DDBCharacterParser {

  async parse(item: DDBRawItem): Promise<ParsedCharacter> {
    const raw = item.data as any;

    // Generate unique entity ID
    const entityId = `ddb-char-${item.ddbId}`;

    // Parse all character data
    const data: CharacterData = {
      name: item.name,
      race: this.parseRace(raw),
      background: this.parseBackground(raw),
      alignment: raw.alignment || 'Neutral',
      experiencePoints: raw.experiencePoints || 0,

      classes: this.parseClasses(raw),
      totalLevel: this.calculateTotalLevel(raw),

      abilities: this.parseAbilities(raw),

      armorClass: this.calculateAC(raw),
      initiative: this.calculateInitiative(raw),
      speed: this.parseSpeed(raw),
      hitPoints: this.parseHitPoints(raw),
      hitDice: this.parseHitDice(raw),
      deathSaves: { successes: 0, failures: 0 },

      proficiencyBonus: this.calculateProficiencyBonus(raw),
      savingThrows: this.parseSavingThrows(raw),
      skills: this.parseSkills(raw),

      features: this.parseFeatures(raw),

      spellcasting: this.parseSpellcasting(raw),

      equipment: this.parseEquipment(raw),
      currency: this.parseCurrency(raw),

      personalityTraits: raw.personalityTraits || '',
      ideals: raw.ideals || '',
      bonds: raw.bonds || '',
      flaws: raw.flaws || '',

      backstory: raw.backstory || '',
      notes: raw.notes || ''
    };

    return {
      entityType: 'character',
      entityId,
      name: item.name,
      description: this.generateDescription(data),
      img: item.imageUrl,
      data,
      ddbId: item.ddbId,
      sourceUrl: raw.sourceUrl
    };
  }

  private parseRace(raw: any): string {
    if (raw.race?.fullName) return raw.race.fullName;
    if (raw.race?.baseName) return raw.race.baseName;
    return raw.race || 'Unknown';
  }

  private parseBackground(raw: any): string {
    return raw.background?.name || raw.background || 'Unknown';
  }

  private parseClasses(raw: any): CharacterData['classes'] {
    if (!raw.classes || !Array.isArray(raw.classes)) {
      return [];
    }

    return raw.classes.map((c: any) => ({
      name: c.name || c.definition?.name || 'Unknown',
      level: c.level || 1,
      subclass: c.subclass?.name || c.subclassDefinition?.name,
      hitDiceUsed: c.hitDiceUsed || 0
    }));
  }

  private calculateTotalLevel(raw: any): number {
    if (!raw.classes || !Array.isArray(raw.classes)) {
      return 1;
    }
    return raw.classes.reduce((sum: number, c: any) => sum + (c.level || 0), 0);
  }

  private parseAbilities(raw: any): CharacterData['abilities'] {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const result: any = {};

    for (const ability of abilities) {
      const score = this.getAbilityScore(raw, ability);
      result[ability] = {
        base: score.base,
        bonus: score.bonus,
        total: score.base + score.bonus,
        modifier: Math.floor((score.base + score.bonus - 10) / 2)
      };
    }

    return result;
  }

  private getAbilityScore(raw: any, ability: string): { base: number; bonus: number } {
    // DDB stores ability scores in various ways depending on extraction method
    const abilityMap: Record<string, number> = {
      str: 1, dex: 2, con: 3, int: 4, wis: 5, cha: 6
    };

    // Try different data structures
    if (raw.abilities) {
      const found = raw.abilities[ability] || raw.abilities[abilityMap[ability]];
      if (found) {
        return {
          base: found.score || found.value || 10,
          bonus: found.bonus || found.modifier || 0
        };
      }
    }

    // Fallback
    return { base: 10, bonus: 0 };
  }

  private calculateAC(raw: any): number {
    return raw.armorClass || raw.ac || 10;
  }

  private calculateInitiative(raw: any): number {
    if (raw.initiative !== undefined) return raw.initiative;
    // Calculate from DEX modifier
    const dexMod = this.parseAbilities(raw).dex.modifier;
    return dexMod;
  }

  private parseSpeed(raw: any): CharacterData['speed'] {
    if (typeof raw.speed === 'number') {
      return { walk: raw.speed };
    }

    return {
      walk: raw.speed?.walk || raw.speed?.walking || 30,
      fly: raw.speed?.fly || raw.speed?.flying,
      swim: raw.speed?.swim || raw.speed?.swimming,
      climb: raw.speed?.climb || raw.speed?.climbing,
      burrow: raw.speed?.burrow || raw.speed?.burrowing
    };
  }

  private parseHitPoints(raw: any): CharacterData['hitPoints'] {
    return {
      current: raw.hitPoints?.current || raw.currentHitPoints || 0,
      max: raw.hitPoints?.max || raw.maxHitPoints || 0,
      temp: raw.hitPoints?.temp || raw.tempHitPoints || 0
    };
  }

  private parseHitDice(raw: any): CharacterData['hitDice'] {
    // Parse from classes
    const classes = this.parseClasses(raw);
    return classes.map(c => ({
      dieType: this.getClassHitDie(c.name),
      total: c.level,
      used: c.hitDiceUsed
    }));
  }

  private getClassHitDie(className: string): string {
    const hitDice: Record<string, string> = {
      'barbarian': 'd12',
      'fighter': 'd10',
      'paladin': 'd10',
      'ranger': 'd10',
      'bard': 'd8',
      'cleric': 'd8',
      'druid': 'd8',
      'monk': 'd8',
      'rogue': 'd8',
      'warlock': 'd8',
      'sorcerer': 'd6',
      'wizard': 'd6'
    };
    return hitDice[className.toLowerCase()] || 'd8';
  }

  private calculateProficiencyBonus(raw: any): number {
    if (raw.proficiencyBonus) return raw.proficiencyBonus;
    const level = this.calculateTotalLevel(raw);
    return Math.ceil(level / 4) + 1;
  }

  private parseSavingThrows(raw: any): CharacterData['savingThrows'] {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const result: CharacterData['savingThrows'] = {};
    const profBonus = this.calculateProficiencyBonus(raw);
    const parsedAbilities = this.parseAbilities(raw);

    for (const ability of abilities) {
      const proficient = this.isProficientInSave(raw, ability);
      const modifier = parsedAbilities[ability].modifier + (proficient ? profBonus : 0);
      result[ability] = { proficient, modifier };
    }

    return result;
  }

  private isProficientInSave(raw: any, ability: string): boolean {
    // Check class proficiencies, etc.
    if (raw.savingThrows?.[ability]?.proficient) return true;
    return false;
  }

  private parseSkills(raw: any): CharacterData['skills'] {
    const skills = [
      'acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception',
      'history', 'insight', 'intimidation', 'investigation', 'medicine',
      'nature', 'perception', 'performance', 'persuasion', 'religion',
      'sleightOfHand', 'stealth', 'survival'
    ];

    const result: CharacterData['skills'] = {};

    for (const skill of skills) {
      const skillData = raw.skills?.[skill] || {};
      result[skill] = {
        proficient: skillData.proficient || false,
        expertise: skillData.expertise || false,
        modifier: skillData.modifier || 0
      };
    }

    return result;
  }

  private parseFeatures(raw: any): CharacterData['features'] {
    if (!raw.features || !Array.isArray(raw.features)) {
      return [];
    }

    return raw.features.map((f: any) => ({
      name: f.name || 'Unknown Feature',
      source: f.source || f.sourceType || 'Unknown',
      description: f.description || ''
    }));
  }

  private parseSpellcasting(raw: any): CharacterData['spellcasting'] | undefined {
    if (!raw.spellcasting && !raw.spells) {
      return undefined;
    }

    const spellcasting = raw.spellcasting || {};

    return {
      ability: spellcasting.ability || 'int',
      spellAttack: spellcasting.spellAttack || 0,
      spellDC: spellcasting.spellDC || spellcasting.saveDC || 10,
      slots: this.parseSpellSlots(raw),
      spells: this.parseCharacterSpells(raw)
    };
  }

  private parseSpellSlots(raw: any): Record<number, { total: number; used: number }> {
    const slots: Record<number, { total: number; used: number }> = {};
    const rawSlots = raw.spellSlots || raw.spellcasting?.slots || {};

    for (let level = 1; level <= 9; level++) {
      const slot = rawSlots[level] || rawSlots[`level${level}`];
      if (slot) {
        slots[level] = {
          total: slot.total || slot.max || 0,
          used: slot.used || slot.expended || 0
        };
      }
    }

    return slots;
  }

  private parseCharacterSpells(raw: any): Array<{ name: string; level: number; prepared: boolean }> {
    const spells = raw.spells || raw.spellcasting?.spells || [];

    return spells.map((s: any) => ({
      name: s.name || s.definition?.name || 'Unknown Spell',
      level: s.level || s.definition?.level || 0,
      prepared: s.prepared !== false
    }));
  }

  private parseEquipment(raw: any): CharacterData['equipment'] {
    const items = raw.equipment || raw.inventory || [];

    return items.map((item: any) => ({
      name: item.name || item.definition?.name || 'Unknown Item',
      quantity: item.quantity || 1,
      equipped: item.equipped !== false,
      attuned: item.attuned || false
    }));
  }

  private parseCurrency(raw: any): CharacterData['currency'] {
    const currency = raw.currency || raw.currencies || {};

    return {
      cp: currency.cp || currency.copper || 0,
      sp: currency.sp || currency.silver || 0,
      ep: currency.ep || currency.electrum || 0,
      gp: currency.gp || currency.gold || 0,
      pp: currency.pp || currency.platinum || 0
    };
  }

  private generateDescription(data: CharacterData): string {
    const classes = data.classes.map(c =>
      c.subclass ? `${c.name} (${c.subclass}) ${c.level}` : `${c.name} ${c.level}`
    ).join(' / ');

    return `Level ${data.totalLevel} ${data.race} ${classes}`;
  }
}
```

### Acceptance Criteria

- [ ] Parser handles complete character data
- [ ] Parser handles partial/missing data gracefully
- [ ] Ability scores calculate correctly
- [ ] Class levels sum correctly
- [ ] Proficiency bonus calculates correctly
- [ ] Equipment parses correctly
- [ ] Spells parse correctly (if present)
- [ ] Unit tests cover edge cases
- [ ] Docker deployment successful

### Files to Create

| File | Action |
|------|--------|
| `apps/server/src/services/parsers/ddbCharacterParser.ts` | CREATE |
| `apps/server/src/services/parsers/index.ts` | CREATE |
| `apps/server/tests/services/parsers/ddbCharacterParser.test.ts` | CREATE |
| `apps/server/tests/fixtures/ddbCharacterSample.json` | CREATE |

---

## Phase 5: Content Parsers - Monsters

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phase 3 complete

### Objective

Implement the monster parser that transforms D&D Beyond monster data into VTT format.

### Tasks

- [ ] 5.1 Create monster parser (`apps/server/src/services/parsers/ddbMonsterParser.ts`)
- [ ] 5.2 Implement stat block parsing
- [ ] 5.3 Implement action/trait parsing
- [ ] 5.4 Implement legendary action parsing
- [ ] 5.5 Implement CR/XP calculation
- [ ] 5.6 Write unit tests with sample DDB monster data
- [ ] 5.7 Commit and deploy to Docker

### Detailed Specifications

The monster parser should transform D&D Beyond monster stat blocks into our existing monster schema (see `game-systems/core/dnd5e-ogl/compendium/monsters/`).

Key fields to parse:
- Size, type, alignment
- Armor class (value and type)
- Hit points (average and formula)
- Speed (walk, fly, swim, climb, burrow, hover)
- Ability scores (STR, DEX, CON, INT, WIS, CHA)
- Saving throws
- Skills
- Damage vulnerabilities/resistances/immunities
- Condition immunities
- Senses (darkvision, blindsight, etc.)
- Languages
- Challenge rating and XP
- Traits (passive abilities)
- Actions (including attack calculations)
- Reactions
- Legendary actions (if any)
- Lair actions (if any)
- Regional effects (if any)

### Acceptance Criteria

- [ ] Parser handles complete monster stat blocks
- [ ] Parser handles partial data gracefully
- [ ] Attack calculations are correct
- [ ] CR/XP values are correct
- [ ] Legendary actions parse correctly
- [ ] Unit tests cover various monster types
- [ ] Docker deployment successful

### Files to Create

| File | Action |
|------|--------|
| `apps/server/src/services/parsers/ddbMonsterParser.ts` | CREATE |
| `apps/server/tests/services/parsers/ddbMonsterParser.test.ts` | CREATE |
| `apps/server/tests/fixtures/ddbMonsterSample.json` | CREATE |

---

## Phase 6: Content Parsers - Spells & Items

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phase 3 complete

### Objective

Implement parsers for spells and items.

### Tasks

- [ ] 6.1 Create spell parser (`apps/server/src/services/parsers/ddbSpellParser.ts`)
- [ ] 6.2 Implement spell component parsing
- [ ] 6.3 Implement higher level scaling parsing
- [ ] 6.4 Create item parser (`apps/server/src/services/parsers/ddbItemParser.ts`)
- [ ] 6.5 Implement weapon/armor property parsing
- [ ] 6.6 Implement magic item parsing
- [ ] 6.7 Write unit tests
- [ ] 6.8 Commit and deploy to Docker

### Acceptance Criteria

- [ ] Spell parser handles all spell levels
- [ ] Spell components (V, S, M) parse correctly
- [ ] Concentration/ritual flags parse correctly
- [ ] Item parser handles weapons correctly
- [ ] Item parser handles armor correctly
- [ ] Item parser handles magic items correctly
- [ ] Unit tests cover edge cases
- [ ] Docker deployment successful

### Files to Create

| File | Action |
|------|--------|
| `apps/server/src/services/parsers/ddbSpellParser.ts` | CREATE |
| `apps/server/src/services/parsers/ddbItemParser.ts` | CREATE |
| `apps/server/tests/services/parsers/ddbSpellParser.test.ts` | CREATE |
| `apps/server/tests/services/parsers/ddbItemParser.test.ts` | CREATE |
| `apps/server/tests/fixtures/ddbSpellSample.json` | CREATE |
| `apps/server/tests/fixtures/ddbItemSample.json` | CREATE |

---

## Phase 7: Frontend Import UI

> **Estimated Session Time:** 1-2 sessions
> **Status:** NOT STARTED
> **Dependencies:** Phases 2, 3 complete

### Objective

Create the frontend UI for managing D&D Beyond imports.

### Tasks

- [ ] 7.1 Create import page/modal component (`apps/web/src/components/import/DDBImport.tsx`)
- [ ] 7.2 Create import wizard flow
- [ ] 7.3 Create content selection interface
- [ ] 7.4 Create progress tracking component
- [ ] 7.5 Create import history view
- [ ] 7.6 Add extension connection status indicator
- [ ] 7.7 Implement WebSocket progress updates
- [ ] 7.8 Add error handling and retry UI
- [ ] 7.9 Commit and deploy to Docker

### Detailed Specifications

#### Import Flow UI

1. **Step 1: Connection Check**
   - Verify browser extension is installed
   - Show installation instructions if not
   - Show "connected" status when extension detected

2. **Step 2: Open D&D Beyond**
   - Button to open D&D Beyond popup
   - Instructions for navigating to content
   - Real-time status of popup window

3. **Step 3: Import Progress**
   - List of items being imported
   - Progress bar for each item
   - Success/error indicators
   - Retry button for failed items

4. **Step 4: Review & Assign**
   - Show imported content summary
   - Option to assign to campaigns
   - Link to browse imported content

### Acceptance Criteria

- [ ] Import wizard guides user through process
- [ ] Extension status is clearly shown
- [ ] D&D Beyond popup opens correctly
- [ ] Progress updates in real-time
- [ ] Errors are displayed clearly
- [ ] Import history shows past imports
- [ ] Campaign assignment works
- [ ] UI is responsive
- [ ] Docker deployment successful

### Files to Create

| File | Action |
|------|--------|
| `apps/web/src/components/import/DDBImport.tsx` | CREATE |
| `apps/web/src/components/import/DDBImportWizard.tsx` | CREATE |
| `apps/web/src/components/import/DDBImportProgress.tsx` | CREATE |
| `apps/web/src/components/import/DDBImportHistory.tsx` | CREATE |
| `apps/web/src/components/import/ExtensionStatus.tsx` | CREATE |
| `apps/web/src/hooks/useDDBImport.ts` | CREATE |
| `apps/web/src/pages/import/index.tsx` | CREATE or MODIFY |

---

## Phase 8: Campaign Binding & Permissions

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phases 3, 7 complete

### Objective

Implement the campaign binding system that restricts imported content to the GM's campaigns.

### Tasks

- [ ] 8.1 Create campaign-import binding schema
- [ ] 8.2 Implement binding API endpoints
- [ ] 8.3 Implement permission checks for content access
- [ ] 8.4 Add campaign content manager UI
- [ ] 8.5 Ensure players can only see bound content
- [ ] 8.6 Write integration tests
- [ ] 8.7 Commit and deploy to Docker

### Key Requirements

1. **GM-Only Import**: Only campaign GMs can import content
2. **Campaign Binding**: Imported content is bound to specific campaigns
3. **Player Access**: Players in a campaign can view bound content but not take it elsewhere
4. **No Cross-Campaign**: Content doesn't follow players to other campaigns

### Acceptance Criteria

- [ ] Only GMs can initiate imports
- [ ] Content is bound to specific campaigns
- [ ] Players can view bound content in campaign
- [ ] Players cannot access content outside campaign
- [ ] GM can manage campaign content bindings
- [ ] Integration tests pass
- [ ] Docker deployment successful

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/database/src/schema/campaignImportBindings.ts` | CREATE |
| `apps/server/src/routes/api/v1/campaigns.ts` | MODIFY |
| `apps/server/src/services/campaignContentService.ts` | CREATE |
| `apps/web/src/components/campaign/CampaignContent.tsx` | CREATE |
| `apps/server/tests/integration/campaignContent.test.ts` | CREATE |

---

## Phase 9: Testing & Documentation

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** All previous phases complete

### Objective

Complete integration testing, end-to-end testing, and documentation.

### Tasks

- [ ] 9.1 Write end-to-end import flow tests
- [ ] 9.2 Test with real D&D Beyond pages (various content types)
- [ ] 9.3 Performance testing for bulk imports
- [ ] 9.4 Write user documentation (`docs/guides/DDB_IMPORT_USER_GUIDE.md`)
- [ ] 9.5 Write developer documentation (`docs/architecture/DDB_IMPORT_ARCHITECTURE.md`)
- [ ] 9.6 Update main README with import feature
- [ ] 9.7 Create troubleshooting guide
- [ ] 9.8 Final Docker deployment and verification

### Acceptance Criteria

- [ ] E2E tests pass for all content types
- [ ] Performance is acceptable for 50+ item imports
- [ ] User documentation is complete and clear
- [ ] Developer documentation covers extension and architecture
- [ ] Troubleshooting guide covers common issues
- [ ] All Docker containers start and run correctly
- [ ] Feature is ready for use

### Files to Create

| File | Action |
|------|--------|
| `apps/e2e/tests/ddb-import.spec.ts` | CREATE |
| `docs/guides/DDB_IMPORT_USER_GUIDE.md` | CREATE |
| `docs/architecture/DDB_IMPORT_ARCHITECTURE.md` | CREATE |
| `docs/guides/DDB_IMPORT_TROUBLESHOOTING.md` | CREATE |
| `README.md` | MODIFY |

---

## Appendix A: Sample D&D Beyond Data Structures

### Character JSON (Simplified)

```json
{
  "id": 12345678,
  "name": "Thorin Ironforge",
  "race": {
    "baseName": "Dwarf",
    "fullName": "Mountain Dwarf"
  },
  "classes": [
    {
      "name": "Fighter",
      "level": 5,
      "subclassDefinition": {
        "name": "Champion"
      }
    }
  ],
  "stats": [
    { "id": 1, "value": 16 },
    { "id": 2, "value": 14 },
    { "id": 3, "value": 15 },
    { "id": 4, "value": 10 },
    { "id": 5, "value": 12 },
    { "id": 6, "value": 8 }
  ],
  "hitPointInfo": {
    "currentHitPoints": 44,
    "maximumHitPoints": 44
  }
}
```

### Monster Stat Block (DOM Structure)

```html
<div class="mon-stat-block">
  <div class="mon-stat-block__header">
    <span class="mon-stat-block__name">Goblin</span>
  </div>
  <div class="mon-stat-block__type-meta">Small humanoid (goblinoid), neutral evil</div>
  <div class="mon-stat-block__attributes">
    <div class="mon-stat-block__attribute">
      <span class="mon-stat-block__attribute-label">Armor Class</span>
      <span class="mon-stat-block__attribute-value">15 (leather armor, shield)</span>
    </div>
    <!-- ... more attributes ... -->
  </div>
</div>
```

---

## Appendix B: Extension Message Types

```typescript
// types/messages.ts
export enum MessageType {
  // VTT Registration
  REGISTER_VTT = 'REGISTER_VTT',
  UNREGISTER_VTT = 'UNREGISTER_VTT',
  GET_VTT_STATUS = 'GET_VTT_STATUS',

  // DDB to VTT Communication
  SEND_TO_VTT = 'SEND_TO_VTT',
  IMPORT_DATA = 'IMPORT_DATA',

  // Popup Control
  OPEN_DDB_POPUP = 'OPEN_DDB_POPUP',
  CLOSE_DDB_POPUP = 'CLOSE_DDB_POPUP',

  // Status
  IMPORT_PROGRESS = 'IMPORT_PROGRESS',
  IMPORT_COMPLETE = 'IMPORT_COMPLETE',
  IMPORT_ERROR = 'IMPORT_ERROR'
}

export interface ExtensionMessage {
  type: MessageType;
  payload: any;
}
```

---

## Appendix C: Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `DDB_EXT_NOT_INSTALLED` | Browser extension not detected | Install extension |
| `DDB_EXT_NOT_CONNECTED` | Extension not connected to VTT | Refresh VTT page |
| `DDB_PARSE_ERROR` | Failed to parse DDB page content | Check page structure changed |
| `DDB_AUTH_REQUIRED` | User not logged into D&D Beyond | Log into D&D Beyond |
| `DDB_CONTENT_NOT_OWNED` | User doesn't own this content | Purchase on D&D Beyond |
| `VTT_IMPORT_FAILED` | Server failed to process import | Check server logs |
| `VTT_DUPLICATE_ENTITY` | Entity already imported | Update or skip |

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-13 | 1.0.0 | Initial plan created | Claude |

