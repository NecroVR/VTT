/**
 * Sample entity data for testing form previews
 *
 * These entities represent different states of D&D 5e characters
 * to help designers test form layouts with various data scenarios.
 */

export interface SampleEntity {
  id: string;
  name: string;
  description: string;
  data: Record<string, unknown>;
}

/**
 * Empty entity - for testing empty states and placeholders
 */
export const emptyEntity: SampleEntity = {
  id: 'empty',
  name: 'Empty Entity',
  description: 'No data - test empty states',
  data: {}
};

/**
 * Basic character - minimal required data
 */
export const basicCharacter: SampleEntity = {
  id: 'basic',
  name: 'Basic Character',
  description: 'Minimal character data',
  data: {
    name: 'Aric Windrunner',
    class: 'Fighter',
    level: 3,
    race: 'Human'
  }
};

/**
 * Full character - comprehensive D&D 5e character data
 */
export const fullCharacter: SampleEntity = {
  id: 'full',
  name: 'Full Character',
  description: 'Complete character with all fields',
  data: {
    // Basic Info
    name: 'Lyra Shadowmoon',
    class: 'Rogue',
    subclass: 'Arcane Trickster',
    level: 7,
    race: 'Half-Elf',
    background: 'Criminal',
    alignment: 'Chaotic Good',

    // Ability Scores
    attributes: {
      strength: { value: 10, modifier: 0 },
      dexterity: { value: 18, modifier: 4 },
      constitution: { value: 14, modifier: 2 },
      intelligence: { value: 16, modifier: 3 },
      wisdom: { value: 12, modifier: 1 },
      charisma: { value: 13, modifier: 1 }
    },

    // Combat Stats
    armorClass: 16,
    hitPoints: {
      current: 45,
      maximum: 52,
      temporary: 0
    },
    speed: 30,
    initiative: 4,
    proficiencyBonus: 3,

    // Saving Throws
    savingThrows: {
      strength: { proficient: false, value: 0 },
      dexterity: { proficient: true, value: 7 },
      constitution: { proficient: false, value: 2 },
      intelligence: { proficient: true, value: 6 },
      wisdom: { proficient: false, value: 1 },
      charisma: { proficient: false, value: 1 }
    },

    // Skills
    skills: {
      acrobatics: { proficient: true, expertise: false, value: 7 },
      arcana: { proficient: true, expertise: false, value: 6 },
      athletics: { proficient: false, expertise: false, value: 0 },
      deception: { proficient: true, expertise: true, value: 10 },
      history: { proficient: false, expertise: false, value: 3 },
      insight: { proficient: true, expertise: false, value: 4 },
      intimidation: { proficient: false, expertise: false, value: 1 },
      investigation: { proficient: true, expertise: false, value: 6 },
      medicine: { proficient: false, expertise: false, value: 1 },
      nature: { proficient: false, expertise: false, value: 3 },
      perception: { proficient: true, expertise: false, value: 4 },
      performance: { proficient: false, expertise: false, value: 1 },
      persuasion: { proficient: true, expertise: false, value: 4 },
      religion: { proficient: false, expertise: false, value: 3 },
      sleightOfHand: { proficient: true, expertise: true, value: 10 },
      stealth: { proficient: true, expertise: true, value: 10 },
      survival: { proficient: false, expertise: false, value: 1 }
    },

    // Features & Traits
    features: [
      'Darkvision',
      'Fey Ancestry',
      'Sneak Attack (4d6)',
      'Cunning Action',
      'Roguish Archetype: Arcane Trickster',
      'Evasion',
      'Uncanny Dodge'
    ],

    // Equipment
    equipment: {
      weapons: [
        { name: 'Shortsword +1', attackBonus: 8, damage: '1d6+5', type: 'piercing' },
        { name: 'Dagger', attackBonus: 7, damage: '1d4+4', type: 'piercing' },
        { name: 'Shortbow', attackBonus: 7, damage: '1d6+4', type: 'piercing', range: '80/320' }
      ],
      armor: [
        { name: 'Studded Leather Armor', ac: 12, type: 'light' }
      ],
      items: [
        "Thieves' Tools",
        'Burglar\'s Pack',
        'Cloak of Elvenkind',
        'Ring of Protection'
      ]
    },

    // Spellcasting
    spellcasting: {
      class: 'Rogue (Arcane Trickster)',
      ability: 'intelligence',
      saveDC: 14,
      attackBonus: 6,
      spellSlots: {
        level1: { total: 4, used: 2 },
        level2: { total: 2, used: 1 }
      },
      spells: {
        cantrips: [
          'Mage Hand',
          'Minor Illusion',
          'Prestidigitation'
        ],
        level1: [
          'Disguise Self',
          'Sleep',
          'Tasha\'s Hideous Laughter'
        ],
        level2: [
          'Invisibility',
          'Mirror Image'
        ]
      }
    },

    // Character Details
    personality: {
      traits: [
        'I always have a plan for what to do when things go wrong.',
        'I am incredibly slow to trust.'
      ],
      ideals: ['Freedom - Chains are meant to be broken.'],
      bonds: ['I owe my survival to a mentor who taught me the ways of the streets.'],
      flaws: ['When I see something valuable, I can\'t think about anything but how to steal it.']
    },

    // Additional Info
    experience: 23000,
    wealth: {
      copper: 45,
      silver: 120,
      electrum: 0,
      gold: 385,
      platinum: 12
    },
    languages: ['Common', 'Elvish', 'Thieves\' Cant', 'Draconic'],
    proficiencies: {
      armor: ['Light armor'],
      weapons: ['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
      tools: ['Thieves\' tools', 'Disguise kit', 'Playing card set']
    }
  }
};

/**
 * Fighter character - alternative full character example
 */
export const fighterCharacter: SampleEntity = {
  id: 'fighter',
  name: 'Fighter Character',
  description: 'Battle-hardened warrior',
  data: {
    name: 'Thordak Ironforge',
    class: 'Fighter',
    subclass: 'Champion',
    level: 5,
    race: 'Dwarf',
    background: 'Soldier',
    alignment: 'Lawful Good',

    attributes: {
      strength: { value: 18, modifier: 4 },
      dexterity: { value: 14, modifier: 2 },
      constitution: { value: 16, modifier: 3 },
      intelligence: { value: 10, modifier: 0 },
      wisdom: { value: 12, modifier: 1 },
      charisma: { value: 8, modifier: -1 }
    },

    armorClass: 18,
    hitPoints: {
      current: 48,
      maximum: 48,
      temporary: 5
    },
    speed: 25,
    initiative: 2,
    proficiencyBonus: 3,

    equipment: {
      weapons: [
        { name: 'Greatsword', attackBonus: 7, damage: '2d6+4', type: 'slashing' },
        { name: 'Handaxe', attackBonus: 7, damage: '1d6+4', type: 'slashing' }
      ],
      armor: [
        { name: 'Plate Armor', ac: 18, type: 'heavy' }
      ]
    },

    features: [
      'Darkvision',
      'Dwarven Resilience',
      'Fighting Style: Great Weapon Fighting',
      'Second Wind',
      'Action Surge',
      'Improved Critical',
      'Extra Attack'
    ]
  }
};

/**
 * All available sample entities
 */
export const sampleEntities: SampleEntity[] = [
  emptyEntity,
  basicCharacter,
  fullCharacter,
  fighterCharacter
];

/**
 * Get a sample entity by ID
 */
export function getSampleEntityById(id: string): SampleEntity | undefined {
  return sampleEntities.find(entity => entity.id === id);
}

/**
 * Get a sample entity's data by ID
 */
export function getSampleEntityData(id: string): Record<string, unknown> {
  const entity = getSampleEntityById(id);
  return entity?.data || {};
}
