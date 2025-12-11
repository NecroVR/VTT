import type { EnvConfig } from "../types/index.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  // Default certificate paths (relative to project root)
  const projectRoot = path.resolve(__dirname, "../../../..");
  const defaultCertPath = path.join(projectRoot, "certs", "localhost.pem");
  const defaultKeyPath = path.join(projectRoot, "certs", "localhost-key.pem");

  // Check if HTTPS should be enabled
  const httpsEnabled = process.env.HTTPS_ENABLED !== "false"; // Default to true
  const certPath = process.env.HTTPS_CERT_PATH || defaultCertPath;
  const keyPath = process.env.HTTPS_KEY_PATH || defaultKeyPath;

  // Verify certificates exist if HTTPS is enabled
  const certsExist = fs.existsSync(certPath) && fs.existsSync(keyPath);

  const config: EnvConfig = {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/vtt",
    REDIS_URL: process.env.REDIS_URL,
    PORT: parseInt(process.env.PORT || "3000", 10),
    HOST: process.env.HOST || "0.0.0.0",
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "https://localhost:5173",
    HTTPS_ENABLED: httpsEnabled && certsExist,
    HTTPS_CERT_PATH: certsExist ? certPath : undefined,
    HTTPS_KEY_PATH: certsExist ? keyPath : undefined,
  };

  // Validate required configuration
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Warn if HTTPS is requested but certificates don't exist
  if (httpsEnabled && !certsExist) {
    console.warn(
      "HTTPS enabled but certificates not found. Falling back to HTTP.",
    );
    console.warn(`Expected cert at: ${certPath}`);
    console.warn(`Expected key at: ${keyPath}`);
    console.warn("Run: npm run generate-certs to create certificates.");
  }

  return config;
}
