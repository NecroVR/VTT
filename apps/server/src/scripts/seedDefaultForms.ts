#!/usr/bin/env tsx

/**
 * Default Forms Seeder
 *
 * This script loads default form definitions from game system directories
 * into the database. Forms are used to render entity sheets (actors, items, etc.)
 * in the VTT client.
 *
 * The script:
 * 1. Connects to the database
 * 2. Finds a system user to own the default forms
 * 3. Scans game system directories for forms/ subdirectories
 * 4. Loads all *.form.json files as default forms
 *
 * Usage:
 *   pnpm seed:forms
 *   pnpm seed:forms --system dnd5e-ogl   # Load forms for specific system only
 */

import { createDb } from '@vtt/database';
import { users } from '@vtt/database';
import { FormLoaderService } from '../services/formLoader.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to project root
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const GAME_SYSTEMS_ROOT = path.join(PROJECT_ROOT, 'game-systems');
const CORE_SYSTEMS_PATH = path.join(GAME_SYSTEMS_ROOT, 'core');

interface SeedOptions {
  system?: string; // Specific system to seed (e.g., 'dnd5e-ogl')
  verbose?: boolean;
}

class FormSeeder {
  private db: ReturnType<typeof createDb>;
  private formLoader: FormLoaderService;
  private systemOwnerId?: string;

  constructor(connectionString: string) {
    this.db = createDb(connectionString);
    this.formLoader = new FormLoaderService();
  }

  async seed(options: SeedOptions = {}) {
    console.log('='.repeat(60));
    console.log('Default Forms Seeder');
    console.log('='.repeat(60));
    console.log();

    try {
      // Step 1: Get or create system owner user
      await this.ensureSystemOwner();

      // Step 2: Find game systems
      const systems = await this.findGameSystems(options.system);

      if (systems.length === 0) {
        console.log('No game systems found to seed forms from.');
        return;
      }

      console.log(`Found ${systems.length} game system(s) to process`);
      console.log();

      // Step 3: Load forms for each system
      let totalLoaded = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      for (const system of systems) {
        console.log(`Processing system: ${system.id}`);
        console.log(`  Path: ${system.path}`);

        const result = await this.formLoader.loadSystemForms(
          this.db,
          system.id,
          system.path,
          this.systemOwnerId!
        );

        totalLoaded += result.loaded;
        totalUpdated += result.updated;
        totalErrors += result.errors.length;

        if (result.errors.length > 0) {
          console.log('  Errors:');
          result.errors.forEach((err) => console.log(`    - ${err}`));
        }

        console.log();
      }

      // Step 4: Display summary
      console.log('='.repeat(60));
      console.log('Summary:');
      console.log(`  Forms loaded:  ${totalLoaded}`);
      console.log(`  Forms updated: ${totalUpdated}`);
      console.log(`  Errors:        ${totalErrors}`);
      console.log('='.repeat(60));

      if (totalErrors === 0) {
        console.log('✓ Default forms seeded successfully!');
      } else {
        console.log('⚠ Default forms seeded with errors (see above)');
      }
      console.log('='.repeat(60));
    } catch (error) {
      console.error();
      console.error('='.repeat(60));
      console.error('✗ Seeding failed:');
      console.error(error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error();
        console.error('Stack trace:');
        console.error(error.stack);
      }
      console.error('='.repeat(60));
      process.exit(1);
    }
  }

  /**
   * Ensure a system owner user exists
   */
  private async ensureSystemOwner() {
    console.log('Step 1: Finding system owner user...');

    // Look for a user with username 'system' or the first admin user
    const systemUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.username, 'system'))
      .limit(1);

    if (systemUsers.length > 0) {
      this.systemOwnerId = systemUsers[0].id;
      console.log(`  ✓ Using system user: ${systemUsers[0].username} (${this.systemOwnerId})`);
    } else {
      // Fall back to first user in database
      const firstUser = await this.db.select().from(users).limit(1);

      if (firstUser.length === 0) {
        throw new Error(
          'No users found in database. Please create at least one user before seeding forms.'
        );
      }

      this.systemOwnerId = firstUser[0].id;
      console.log(
        `  ⚠ No system user found, using first user: ${firstUser[0].username} (${this.systemOwnerId})`
      );
    }

    console.log();
  }

  /**
   * Find game systems to process
   */
  private async findGameSystems(
    specificSystem?: string
  ): Promise<Array<{ id: string; path: string }>> {
    console.log('Step 2: Finding game systems...');

    const systems: Array<{ id: string; path: string }> = [];

    // Check if core systems directory exists
    try {
      await fs.access(CORE_SYSTEMS_PATH);
    } catch {
      console.log(`  Core systems directory not found: ${CORE_SYSTEMS_PATH}`);
      return systems;
    }

    // Read core systems
    const entries = await fs.readdir(CORE_SYSTEMS_PATH, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }

      // Skip if specific system requested and this isn't it
      if (specificSystem && entry.name !== specificSystem) {
        continue;
      }

      const systemPath = path.join(CORE_SYSTEMS_PATH, entry.name);
      const formsPath = path.join(systemPath, 'forms');

      // Check if system has a forms/ directory
      try {
        await fs.access(formsPath);
        systems.push({
          id: entry.name,
          path: systemPath,
        });
        console.log(`  ✓ Found: ${entry.name}`);
      } catch {
        if (specificSystem === entry.name) {
          console.log(`  ⚠ System ${entry.name} has no forms/ directory`);
        }
      }
    }

    console.log();
    return systems;
  }
}

// Parse command line arguments
function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--system' && i + 1 < args.length) {
      options.system = args[i + 1];
      i++;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm seed:forms [options]');
      console.log();
      console.log('Options:');
      console.log('  --system <id>   Seed forms for specific system only (e.g., dnd5e-ogl)');
      console.log('  --verbose, -v   Enable verbose logging');
      console.log('  --help, -h      Show this help message');
      process.exit(0);
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const seeder = new FormSeeder(connectionString);
  await seeder.seed(options);
}

main();
