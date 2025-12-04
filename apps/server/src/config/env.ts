import type { EnvConfig } from '../types/index.js';

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/vtt',
    REDIS_URL: process.env.REDIS_URL,
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  };

  // Validate required configuration
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return config;
}
