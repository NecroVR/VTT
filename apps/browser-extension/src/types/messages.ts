/**
 * Message types for communication between extension components
 */

export type ContentType = 'character' | 'monster' | 'spell' | 'item';

export interface DDBExtractedData {
  type: ContentType;
  sourceUrl: string;
  timestamp: number;
  data: any;
  images: string[];
}

export interface CharacterData {
  name: string;
  level: number;
  race: string;
  class: string;
  background?: string;
  alignment?: string;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills: Record<string, number>;
  combat: {
    armorClass: number;
    hitPoints: number;
    hitPointsMax: number;
    speed: string;
    initiative: number;
  };
  savingThrows: Record<string, number>;
  features: Array<{
    name: string;
    description: string;
    source: string;
  }>;
  equipment: Array<{
    name: string;
    quantity: number;
    equipped: boolean;
  }>;
  spells?: Array<{
    name: string;
    level: number;
    school: string;
  }>;
}

export interface MonsterData {
  name: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: string;
  speed: string;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  senses: string;
  languages: string;
  challengeRating: string;
  proficiencyBonus: number;
  traits?: Array<{
    name: string;
    description: string;
  }>;
  actions?: Array<{
    name: string;
    description: string;
  }>;
  legendaryActions?: Array<{
    name: string;
    description: string;
  }>;
}

export interface SpellData {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  higherLevels?: string;
  classes: string[];
}

export interface ItemData {
  name: string;
  type: string;
  rarity: string;
  attunement: boolean;
  description: string;
  weight?: number;
  cost?: string;
  properties?: string[];
  damage?: string;
  armorClass?: number;
}

export interface VTTBridgeConfig {
  vttUrl: string;
  autoSend: boolean;
}

export type ExtensionMessage =
  | { type: 'EXTRACT_CONTENT'; pageType: ContentType }
  | { type: 'SEND_TO_VTT'; data: DDBExtractedData }
  | { type: 'GET_CONFIG' }
  | { type: 'SET_CONFIG'; config: VTTBridgeConfig }
  | { type: 'GET_STORED_DATA' }
  | { type: 'CLEAR_STORED_DATA' }
  | { type: 'EXTRACTION_COMPLETE'; data: DDBExtractedData }
  | { type: 'ERROR'; error: string };

export interface ExtensionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
