const fs = require('fs');

const updates = [
  {
    name: 'Goblin',
    actor_type: 'monster',
    data: {
      size: 'small',
      type: 'humanoid (goblinoid)',
      alignment: 'neutral evil',
      armorClass: { value: 15, type: 'leather armor, shield' },
      hitPoints: { value: 7, formula: '2d6' },
      speed: { walk: 30 },
      abilities: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
      skills: 'Stealth +6',
      senses: 'darkvision 60 ft., passive Perception 9',
      languages: 'Common, Goblin',
      challengeRating: '1/4',
      experiencePoints: 50,
      traits: [
        { name: 'Nimble Escape', description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.' }
      ],
      actions: [
        { name: 'Scimitar', description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.', attackBonus: 4, damageDice: '1d6+2', damageType: 'slashing' },
        { name: 'Shortbow', description: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' }
      ]
    }
  },
  {
    name: 'Orc',
    actor_type: 'monster',
    data: {
      size: 'medium',
      type: 'humanoid (orc)',
      alignment: 'chaotic evil',
      armorClass: { value: 13, type: 'hide armor' },
      hitPoints: { value: 15, formula: '2d8+6' },
      speed: { walk: 30 },
      abilities: { strength: 16, dexterity: 12, constitution: 16, intelligence: 7, wisdom: 11, charisma: 10 },
      skills: 'Intimidation +2',
      senses: 'darkvision 60 ft., passive Perception 10',
      languages: 'Common, Orc',
      challengeRating: '1/2',
      experiencePoints: 100,
      traits: [
        { name: 'Aggressive', description: 'As a bonus action, the orc can move up to its speed toward a hostile creature that it can see.' }
      ],
      actions: [
        { name: 'Greataxe', description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage.', attackBonus: 5, damageDice: '1d12+3', damageType: 'slashing' },
        { name: 'Javelin', description: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage.', attackBonus: 5, damageDice: '1d6+3', damageType: 'piercing' }
      ]
    }
  },
  {
    name: 'Skeleton',
    actor_type: 'monster',
    data: {
      size: 'medium',
      type: 'undead',
      alignment: 'lawful evil',
      armorClass: { value: 13, type: 'armor scraps' },
      hitPoints: { value: 13, formula: '2d8+4' },
      speed: { walk: 30 },
      abilities: { strength: 10, dexterity: 14, constitution: 15, intelligence: 6, wisdom: 8, charisma: 5 },
      damageVulnerabilities: ['bludgeoning'],
      damageImmunities: ['poison'],
      conditionImmunities: ['exhaustion', 'poisoned'],
      senses: 'darkvision 60 ft., passive Perception 9',
      languages: "understands all languages it knew in life but can't speak",
      challengeRating: '1/4',
      experiencePoints: 50,
      actions: [
        { name: 'Shortsword', description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' },
        { name: 'Shortbow', description: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' }
      ]
    }
  },
  {
    name: 'Zombie',
    actor_type: 'monster',
    data: {
      size: 'medium',
      type: 'undead',
      alignment: 'neutral evil',
      armorClass: { value: 8 },
      hitPoints: { value: 22, formula: '3d8+9' },
      speed: { walk: 20 },
      abilities: { strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5 },
      savingThrows: 'Wis +0',
      damageImmunities: ['poison'],
      conditionImmunities: ['poisoned'],
      senses: 'darkvision 60 ft., passive Perception 8',
      languages: "understands all languages it knew in life but can't speak",
      challengeRating: '1/4',
      experiencePoints: 50,
      traits: [
        { name: 'Undead Fortitude', description: 'If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead.' }
      ],
      actions: [
        { name: 'Slam', description: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage.', attackBonus: 3, damageDice: '1d6+1', damageType: 'bludgeoning' }
      ]
    }
  },
  {
    name: 'Wolf',
    actor_type: 'monster',
    data: {
      size: 'medium',
      type: 'beast',
      alignment: 'unaligned',
      armorClass: { value: 13, type: 'natural armor' },
      hitPoints: { value: 11, formula: '2d8+2' },
      speed: { walk: 40 },
      abilities: { strength: 12, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6 },
      skills: 'Perception +3, Stealth +4',
      senses: 'passive Perception 13',
      challengeRating: '1/4',
      experiencePoints: 50,
      traits: [
        { name: 'Keen Hearing and Smell', description: 'The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell.' },
        { name: 'Pack Tactics', description: "The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 feet of the creature and the ally isn't incapacitated." }
      ],
      actions: [
        { name: 'Bite', description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone.', attackBonus: 4, damageDice: '2d4+2', damageType: 'piercing' }
      ]
    }
  },
  {
    name: 'Giant Rat',
    actor_type: 'monster',
    data: {
      size: 'small',
      type: 'beast',
      alignment: 'unaligned',
      armorClass: { value: 12 },
      hitPoints: { value: 7, formula: '2d6' },
      speed: { walk: 30 },
      abilities: { strength: 7, dexterity: 15, constitution: 11, intelligence: 2, wisdom: 10, charisma: 4 },
      senses: 'darkvision 60 ft., passive Perception 10',
      challengeRating: '1/8',
      experiencePoints: 25,
      traits: [
        { name: 'Keen Smell', description: 'The rat has advantage on Wisdom (Perception) checks that rely on smell.' },
        { name: 'Pack Tactics', description: "The rat has advantage on an attack roll against a creature if at least one of the rat's allies is within 5 feet of the creature and the ally isn't incapacitated." }
      ],
      actions: [
        { name: 'Bite', description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.', attackBonus: 4, damageDice: '1d4+2', damageType: 'piercing' }
      ]
    }
  }
];

let sql = '';

for (const monster of updates) {
  const dataStr = JSON.stringify(monster.data).replace(/'/g, "''");
  sql += `UPDATE actors SET actor_type = 'monster', data = '${dataStr}'::jsonb WHERE name = '${monster.name}';\n`;
}

fs.writeFileSync('D:/Projects/VTT/update_monsters.sql', sql);
console.log('Created SQL for', updates.length, 'monsters');
console.log('SQL file written to: D:/Projects/VTT/update_monsters.sql');
