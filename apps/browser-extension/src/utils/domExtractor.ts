/**
 * DOM extraction utilities for D&D Beyond pages
 */

import type {
  DDBExtractedData,
  ContentType,
  CharacterData,
  MonsterData,
  SpellData,
  ItemData,
} from '../types/messages.js';

/**
 * Detect the type of D&D Beyond page currently loaded
 */
export function detectPageType(): ContentType | null {
  const url = window.location.href;

  if (url.includes('/characters/')) {
    return 'character';
  } else if (url.includes('/monsters/')) {
    return 'monster';
  } else if (url.includes('/spells/')) {
    return 'spell';
  } else if (url.includes('/equipment/') || url.includes('/magic-items/')) {
    return 'item';
  }

  return null;
}

/**
 * Extract text content from element, handling null cases
 */
function getText(selector: string, parent: Document | Element = document): string {
  const element = parent.querySelector(selector);
  return element?.textContent?.trim() || '';
}

/**
 * Extract number from text, handling various formats
 */
function getNumber(text: string): number {
  const match = text.match(/[-+]?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Extract all images from the page
 */
function extractImages(): string[] {
  const images: string[] = [];
  const imgElements = document.querySelectorAll('img[src*="dndbeyond"]');

  imgElements.forEach((img) => {
    const src = (img as HTMLImageElement).src;
    if (src && !src.includes('icon') && !src.includes('logo')) {
      images.push(src);
    }
  });

  return images;
}

/**
 * Extract character data from D&D Beyond character sheet
 */
export async function extractCharacter(): Promise<DDBExtractedData> {
  const data: Partial<CharacterData> = {};

  // Basic info
  data.name = getText('.ddbc-character-name');
  data.race = getText('.ddbc-character-summary__race');
  data.class = getText('.ddbc-character-summary__classes');

  // Level
  const levelText = getText('.ddbc-character-progression-summary__level');
  data.level = getNumber(levelText);

  // Abilities
  data.abilities = {
    strength: getNumber(getText('.ddbc-ability-summary--str .ddbc-ability-summary__primary')),
    dexterity: getNumber(getText('.ddbc-ability-summary--dex .ddbc-ability-summary__primary')),
    constitution: getNumber(getText('.ddbc-ability-summary--con .ddbc-ability-summary__primary')),
    intelligence: getNumber(getText('.ddbc-ability-summary--int .ddbc-ability-summary__primary')),
    wisdom: getNumber(getText('.ddbc-ability-summary--wis .ddbc-ability-summary__primary')),
    charisma: getNumber(getText('.ddbc-ability-summary--cha .ddbc-ability-summary__primary')),
  };

  // Combat stats
  data.combat = {
    armorClass: getNumber(getText('.ddbc-armor-class-box__value')),
    hitPoints: getNumber(getText('.ddbc-hit-points-box__hp-current')),
    hitPointsMax: getNumber(getText('.ddbc-hit-points-box__hp-max')),
    speed: getText('.ddbc-distance-number__number'),
    initiative: getNumber(getText('.ddbc-initiative-box__value')),
  };

  // Skills
  data.skills = {};
  const skillElements = document.querySelectorAll('.ddbc-skill');
  skillElements.forEach((skillEl) => {
    const name = getText('.ddbc-skill__label', skillEl);
    const value = getNumber(getText('.ddbc-skill__value', skillEl));
    if (name) {
      data.skills![name.toLowerCase()] = value;
    }
  });

  // Saving throws
  data.savingThrows = {};
  const saveElements = document.querySelectorAll('.ddbc-saving-throws-summary__ability');
  saveElements.forEach((saveEl) => {
    const name = getText('.ddbc-saving-throws-summary__ability-name', saveEl);
    const value = getNumber(getText('.ddbc-saving-throws-summary__ability-modifier', saveEl));
    if (name) {
      data.savingThrows![name.toLowerCase()] = value;
    }
  });

  // Features
  data.features = [];
  const featureElements = document.querySelectorAll('.ddbc-feature');
  featureElements.forEach((featureEl) => {
    const name = getText('.ddbc-feature__header', featureEl);
    const description = getText('.ddbc-feature__description', featureEl);
    const source = getText('.ddbc-feature__source', featureEl);
    if (name) {
      data.features!.push({ name, description, source });
    }
  });

  // Equipment
  data.equipment = [];
  const equipElements = document.querySelectorAll('.ddbc-inventory-item');
  equipElements.forEach((equipEl) => {
    const name = getText('.ddbc-inventory-item__name', equipEl);
    const quantity = getNumber(getText('.ddbc-inventory-item__quantity', equipEl));
    const equipped = equipEl.classList.contains('ddbc-inventory-item--equipped');
    if (name) {
      data.equipment!.push({ name, quantity, equipped });
    }
  });

  return {
    type: 'character',
    sourceUrl: window.location.href,
    timestamp: Date.now(),
    data: data as CharacterData,
    images: extractImages(),
  };
}

/**
 * Extract monster data from D&D Beyond monster page
 */
export async function extractMonster(): Promise<DDBExtractedData> {
  const data: Partial<MonsterData> = {};

  // Basic info
  data.name = getText('.mon-stat-block__name-link, .mon-stat-block__name');
  const metaText = getText('.mon-stat-block__meta');
  const metaParts = metaText.split(',').map((s) => s.trim());

  if (metaParts.length >= 2) {
    data.size = metaParts[0].split(' ')[0];
    data.type = metaParts[0].split(' ').slice(1).join(' ');
    data.alignment = metaParts[1];
  }

  // Defense
  data.armorClass = getNumber(getText('.mon-stat-block__stat-block .mon-stat-block__attribute-data-value:first-child'));
  data.hitPoints = getText('.mon-stat-block__stat-block .mon-stat-block__attribute-data-value:nth-child(2)');
  data.speed = getText('.mon-stat-block__stat-block .mon-stat-block__attribute-data-value:nth-child(3)');

  // Abilities
  const abilityElements = document.querySelectorAll('.mon-stat-block__stat');
  const abilities = Array.from(abilityElements).map((el) =>
    getNumber(getText('.mon-stat-block__stat-data-value', el))
  );

  data.abilities = {
    strength: abilities[0] || 10,
    dexterity: abilities[1] || 10,
    constitution: abilities[2] || 10,
    intelligence: abilities[3] || 10,
    wisdom: abilities[4] || 10,
    charisma: abilities[5] || 10,
  };

  // Challenge rating
  data.challengeRating = getText('.mon-stat-block__challenge-rating-block .mon-stat-block__challenge-rating-data-value');
  data.proficiencyBonus = getNumber(getText('.mon-stat-block__challenge-rating-block .mon-stat-block__proficiency-bonus-data-value'));

  // Senses and languages
  data.senses = getText('.mon-stat-block__tidbit-label:contains("Senses") + .mon-stat-block__tidbit-data');
  data.languages = getText('.mon-stat-block__tidbit-label:contains("Languages") + .mon-stat-block__tidbit-data');

  // Traits
  data.traits = [];
  const traitElements = document.querySelectorAll('.mon-stat-block__description-block-content');
  traitElements.forEach((traitEl) => {
    const name = getText('.mon-stat-block__description-block-heading', traitEl);
    const description = getText('.mon-stat-block__description-block-content', traitEl);
    if (name) {
      data.traits!.push({ name, description });
    }
  });

  // Actions
  data.actions = [];
  const actionElements = document.querySelectorAll('.mon-stat-block__action');
  actionElements.forEach((actionEl) => {
    const name = getText('.mon-stat-block__action-name', actionEl);
    const description = getText('.mon-stat-block__action-description', actionEl);
    if (name) {
      data.actions!.push({ name, description });
    }
  });

  return {
    type: 'monster',
    sourceUrl: window.location.href,
    timestamp: Date.now(),
    data: data as MonsterData,
    images: extractImages(),
  };
}

/**
 * Extract spell data from D&D Beyond spell page
 */
export async function extractSpell(): Promise<DDBExtractedData> {
  const data: Partial<SpellData> = {};

  // Basic info
  data.name = getText('.spell-details__name, .page-heading');

  // Level and school
  const levelText = getText('.spell-details__level-school-ritual, .ddb-statblock-item-level');
  const levelMatch = levelText.match(/(\d+)(?:st|nd|rd|th)-level/i);
  data.level = levelMatch ? parseInt(levelMatch[1], 10) : 0;

  if (levelText.toLowerCase().includes('cantrip')) {
    data.level = 0;
  }

  const schoolMatch = levelText.match(/\b(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)\b/i);
  data.school = schoolMatch ? schoolMatch[1] : '';

  // Spell details
  data.castingTime = getText('.spell-details__casting-time .spell-details__data, .ddb-statblock-item-casting-time .ddb-statblock-item-value');
  data.range = getText('.spell-details__range .spell-details__data, .ddb-statblock-item-range .ddb-statblock-item-value');
  data.components = getText('.spell-details__components .spell-details__data, .ddb-statblock-item-components .ddb-statblock-item-value');
  data.duration = getText('.spell-details__duration .spell-details__data, .ddb-statblock-item-duration .ddb-statblock-item-value');

  // Description
  data.description = getText('.spell-details__description, .more-info-content');

  // Classes
  data.classes = [];
  const classElements = document.querySelectorAll('.spell-details__class-tag, .ddb-statblock-item-classes a');
  classElements.forEach((classEl) => {
    const className = classEl.textContent?.trim();
    if (className) {
      data.classes!.push(className);
    }
  });

  return {
    type: 'spell',
    sourceUrl: window.location.href,
    timestamp: Date.now(),
    data: data as SpellData,
    images: extractImages(),
  };
}

/**
 * Extract item data from D&D Beyond item/equipment page
 */
export async function extractItem(): Promise<DDBExtractedData> {
  const data: Partial<ItemData> = {};

  // Basic info
  data.name = getText('.item-details__name, .page-heading');
  data.type = getText('.item-details__type, .ddb-statblock-item-type .ddb-statblock-item-value');
  data.rarity = getText('.item-details__rarity, .ddb-statblock-item-rarity .ddb-statblock-item-value');

  // Attunement
  const attunementText = getText('.item-details__attunement, .ddb-statblock-item-attunement');
  data.attunement = attunementText.toLowerCase().includes('requires attunement');

  // Description
  data.description = getText('.item-details__description, .more-info-content');

  // Properties
  data.properties = [];
  const propElements = document.querySelectorAll('.item-details__property, .ddb-statblock-item-properties li');
  propElements.forEach((propEl) => {
    const prop = propEl.textContent?.trim();
    if (prop) {
      data.properties!.push(prop);
    }
  });

  // Weight and cost
  const weightText = getText('.item-details__weight, .ddb-statblock-item-weight .ddb-statblock-item-value');
  data.weight = weightText ? parseFloat(weightText) : undefined;
  data.cost = getText('.item-details__cost, .ddb-statblock-item-cost .ddb-statblock-item-value');

  // Damage (for weapons)
  data.damage = getText('.item-details__damage, .ddb-statblock-item-damage .ddb-statblock-item-value');

  // AC (for armor)
  const acText = getText('.item-details__armor-class, .ddb-statblock-item-ac .ddb-statblock-item-value');
  data.armorClass = acText ? getNumber(acText) : undefined;

  return {
    type: 'item',
    sourceUrl: window.location.href,
    timestamp: Date.now(),
    data: data as ItemData,
    images: extractImages(),
  };
}

/**
 * Extract content based on the current page type
 */
export async function extractContent(): Promise<DDBExtractedData | null> {
  const pageType = detectPageType();

  if (!pageType) {
    throw new Error('Unable to detect page type. Please navigate to a character, monster, spell, or item page.');
  }

  switch (pageType) {
    case 'character':
      return extractCharacter();
    case 'monster':
      return extractMonster();
    case 'spell':
      return extractSpell();
    case 'item':
      return extractItem();
    default:
      return null;
  }
}
