/**
 * Re-export shared types for WebSocket messages
 */
export type {
  WSMessage,
  WSMessageType,
  TokenMovePayload,
  DiceRollPayload,
  DiceResultPayload,
} from '@vtt/shared';

/**
 * Re-export shared game and user types
 */
export type {
  Game,
  GameSettings,
  Token,
  MapLayer,
  User,
  Session,
} from '@vtt/shared';

/**
 * Environment configuration types
 */
export interface EnvConfig {
  DATABASE_URL: string;
  REDIS_URL?: string;
  PORT: number;
  HOST: string;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
}

/**
 * Fastify instance type augmentation
 */
declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig;
    db: import('@vtt/database').Database;
  }
}
