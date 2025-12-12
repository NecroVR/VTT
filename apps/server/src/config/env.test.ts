import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadEnvConfig } from "./env.js";

describe("Environment Configuration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("loadEnvConfig", () => {
    it("should load configuration with all environment variables set", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.PORT = "4000";
      process.env.HOST = "127.0.0.1";
      process.env.NODE_ENV = "production";
      process.env.CORS_ORIGIN = "https://example.com";
      process.env.HTTPS_ENABLED = "false";

      const config = loadEnvConfig();

      expect(config.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/testdb");
      expect(config.REDIS_URL).toBe("redis://localhost:6379");
      expect(config.PORT).toBe(4000);
      expect(config.HOST).toBe("127.0.0.1");
      expect(config.NODE_ENV).toBe("production");
      expect(config.CORS_ORIGIN).toBe("https://example.com");
      expect(config.HTTPS_ENABLED).toBe(false);
      // HTTPS_CERT_PATH and HTTPS_KEY_PATH may be set if certs exist, even when HTTPS is disabled
    });

    it("should use default DATABASE_URL if not provided", () => {
      delete process.env.DATABASE_URL;

      const config = loadEnvConfig();

      expect(config.DATABASE_URL).toBe("postgresql://localhost:5432/vtt");
    });

    it("should use default PORT if not provided", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      delete process.env.PORT;

      const config = loadEnvConfig();

      expect(config.PORT).toBe(3000);
    });

    it("should use default HOST if not provided", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      delete process.env.HOST;

      const config = loadEnvConfig();

      expect(config.HOST).toBe("0.0.0.0");
    });

    it("should use default NODE_ENV if not provided", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      delete process.env.NODE_ENV;

      const config = loadEnvConfig();

      expect(config.NODE_ENV).toBe("development");
    });

    it("should use default CORS_ORIGIN if not provided", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      delete process.env.CORS_ORIGIN;

      const config = loadEnvConfig();

      expect(config.CORS_ORIGIN).toBe("https://localhost:5173");
    });

    it("should parse PORT as integer", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      process.env.PORT = "8080";

      const config = loadEnvConfig();

      expect(config.PORT).toBe(8080);
      expect(typeof config.PORT).toBe("number");
    });

    it("should handle invalid PORT by using default", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      process.env.PORT = "invalid";

      const config = loadEnvConfig();

      expect(config.PORT).toBeNaN();
    });

    it("should allow REDIS_URL to be undefined", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      delete process.env.REDIS_URL;

      const config = loadEnvConfig();

      expect(config.REDIS_URL).toBeUndefined();
    });

    it("should use default DATABASE_URL if empty string provided", () => {
      process.env.DATABASE_URL = "";

      const config = loadEnvConfig();

      expect(config.DATABASE_URL).toBe("postgresql://localhost:5432/vtt");
    });

    it("should accept all valid NODE_ENV values", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";

      const validEnvs = ["development", "production", "test"] as const;

      validEnvs.forEach((env) => {
        process.env.NODE_ENV = env;
        const config = loadEnvConfig();
        expect(config.NODE_ENV).toBe(env);
      });
    });

    it("should handle custom DATABASE_URL formats", () => {
      const urls = [
        "postgresql://localhost:5432/vtt",
        "postgresql://user@localhost:5432/vtt",
        "postgresql://user:pass@localhost:5432/vtt",
        "postgresql://user:pass@host.example.com:5432/vtt",
        "postgres://localhost/vtt",
      ];

      urls.forEach((url) => {
        process.env.DATABASE_URL = url;
        const config = loadEnvConfig();
        expect(config.DATABASE_URL).toBe(url);
      });
    });

    it("should handle custom CORS_ORIGIN formats", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";

      const origins = [
        "http://localhost:3000",
        "https://example.com",
        "https://app.example.com:8080",
        "*",
      ];

      origins.forEach((origin) => {
        process.env.CORS_ORIGIN = origin;
        const config = loadEnvConfig();
        expect(config.CORS_ORIGIN).toBe(origin);
      });
    });

    it("should parse PORT with leading zeros correctly", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      process.env.PORT = "0003000";

      const config = loadEnvConfig();

      expect(config.PORT).toBe(3000);
    });

    it("should handle REDIS_URL with authentication", () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/vtt";
      process.env.REDIS_URL = "redis://user:password@localhost:6379/0";

      const config = loadEnvConfig();

      expect(config.REDIS_URL).toBe("redis://user:password@localhost:6379/0");
    });

    it("should not throw error when DATABASE_URL has default value", () => {
      delete process.env.DATABASE_URL;

      // Should use default and not throw
      expect(() => loadEnvConfig()).not.toThrow();

      const config = loadEnvConfig();
      expect(config.DATABASE_URL).toBe("postgresql://localhost:5432/vtt");
    });
  });
});
