// Re-export stores
export { websocket } from './stores/websocket';

// Re-export shared types from @vtt/shared
export type {
  WSMessage,
  WSMessageType,
  TokenMovePayload,
  DiceRollPayload,
  DiceResultPayload,
  User,
  Session,
  Game,
  GameSettings,
  Token,
  MapLayer
} from '@vtt/shared';

// Future exports for components and canvas utilities will go here
