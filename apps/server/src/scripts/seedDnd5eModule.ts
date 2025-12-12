#!/usr/bin/env tsx

/**
 * D&D 5e Module Seeder
 *
 * This script seeds the database with D&D 5e SRD content:
 * 1. Loads property definitions into property_definitions table
 * 2. Creates module record in modules table
 * 3. Loads all entities from compendium files into module_entities
 * 4. Flattens entity data into entity_properties (EAV pattern)
 *
 * Usage:
 *   pnpm seed:dnd5e
 *   pnpm seed:dnd5e --reload  # Force reload even if module exists
 */

import { createDb } from '@vtt/database';
import { ModuleLoaderService } from '../services/moduleLoader.js';
import { PropertyDefinitionLoaderService } from '../services/propertyDefinitionLoader.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to project root
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const GAME_SYSTEMS_PATH = path.join(PROJECT_ROOT, 'game-systems/core/dnd5e-ogl');
const PROPERTY_DEFS_PATH = path.join(GAME_SYSTEMS_PATH, 'property-definitions.json');
const MODULE_PATH = GAME_SYSTEMS_PATH;

interface SeedOptions {
  reload?: boolean;
  verbose?: boolean;
}

class Dnd5eSeeder {
  private db: ReturnType<typeof createDb>;
  private moduleLoader: ModuleLoaderService;
  private propertyDefLoader: PropertyDefinitionLoaderService;

  constructor(connectionString: string) {
    this.db = createDb(connectionString);
    this.moduleLoader = new ModuleLoaderService();
    this.propertyDefLoader = new PropertyDefinitionLoaderService();
  }

  async seed(options: SeedOptions = {}) {
    console.log('='.repeat(60));
    console.log('D&D 5e Module Seeder');
    console.log('='.repeat(60));
    console.log();

    try {
      // Step 1: Verify paths exist
      await this.verifyPaths();

      // Step 2: Load property definitions
      await this.loadPropertyDefinitions();

      // Step 3: Load module content
      await this.loadModule(options);

      // Step 4: Display summary
      await this.displaySummary();

      console.log();
      console.log('='.repeat(60));
      console.log('✓ D&D 5e content seeded successfully!');
      console.log('='.repeat(60));
    } catch (error) {
      console.error();
      console.error('='.repeat(60));
      console.error('✗ Seeding failed:');
      console.error(error instanceof Error ? error.message : String(error));
      console.error('='.repeat(60));
      process.exit(1);
    }
  }

  private async verifyPaths() {
    console.log('Step 1: Verifying paths...');
    console.log(`  Project root: ${PROJECT_ROOT}`);
    console.log(`  Game systems: ${GAME_SYSTEMS_PATH}`);
    console.log(`  Property defs: ${PROPERTY_DEFS_PATH}`);
    console.log();

    // Check if property definitions file exists
    try {
      await fs.access(PROPERTY_DEFS_PATH);
      console.log('  ✓ Property definitions file found');
    } catch {
      throw new Error(`Property definitions file not found: ${PROPERTY_DEFS_PATH}`);
    }

    // Check if module directory exists
    try {
      await fs.access(MODULE_PATH);
      console.log('  ✓ Module directory found');
    } catch {
      throw new Error(`Module directory not found: ${MODULE_PATH}`);
    }

    // Check if module.json exists
    const moduleJsonPath = path.join(MODULE_PATH, 'module.json');
    try {
      await fs.access(moduleJsonPath);
      console.log('  ✓ Module manifest found');
    } catch {
      throw new Error(`Module manifest not found: ${moduleJsonPath}`);
    }

    console.log();
  }

  private async loadPropertyDefinitions() {
    console.log('Step 2: Loading property definitions...');

    try {
      const count = await this.propertyDefLoader.loadFromFile(this.db, PROPERTY_DEFS_PATH);
      console.log(`  ✓ Loaded ${count} property definitions`);
    } catch (error) {
      throw new Error(
        `Failed to load property definitions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    console.log();
  }

  private async loadModule(options: SeedOptions) {
    console.log('Step 3: Loading module content...');

    try {
      // Check if module already exists
      const status = await this.moduleLoader.getModuleStatus(this.db, 'dnd5e-srd').catch(() => null);

      if (status && !options.reload) {
        console.log('  ⚠ Module already exists. Use --reload to force reload.');
        console.log(`  Current status: ${status.status}`);
        console.log(`  Entities: ${status.entityCount}`);
        console.log(`  Properties: ${status.propertyCount}`);
        return;
      }

      if (status && options.reload) {
        console.log('  → Reloading existing module...');
        await this.moduleLoader.reloadModule(this.db, 'dnd5e-srd', MODULE_PATH);
        console.log('  ✓ Module reloaded');
      } else {
        console.log('  → Loading new module...');
        const module = await this.moduleLoader.loadModule(this.db, MODULE_PATH, {
          validate: false,
          skipInvalid: true,
        });
        console.log(`  ✓ Module loaded: ${module.name} v${module.version}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to load module: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    console.log();
  }

  private async displaySummary() {
    console.log('Step 4: Summary...');

    try {
      // Get property definition count
      const propDefCount = await this.propertyDefLoader.getDefinitionCount(this.db, 'dnd5e-ogl');

      // Get module status
      const status = await this.moduleLoader.getModuleStatus(this.db, 'dnd5e-srd');

      console.log(`  Property Definitions: ${propDefCount}`);
      console.log(`  Module Status: ${status.status}`);
      console.log(`  Entities Loaded: ${status.entityCount}`);
      console.log(`  Properties Flattened: ${status.propertyCount}`);

      if (status.errors.length > 0) {
        console.log(`  Validation Errors: ${status.errors.length}`);
        console.log('  First 3 errors:');
        status.errors.slice(0, 3).forEach((err) => {
          console.log(`    - ${err.message}`);
        });
      }
    } catch (error) {
      console.warn('  Could not retrieve summary stats');
    }

    console.log();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    reload: args.includes('--reload'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  // Get database connection string
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://claude:Claude^YV18@localhost:5432/vtt';

  console.log(`Using database: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);
  console.log();

  const seeder = new Dnd5eSeeder(connectionString);
  await seeder.seed(options);
}

// Run if executed directly
const isMainModule = () => {
  const modulePath = fileURLToPath(import.meta.url);
  const scriptPath = process.argv[1];
  return modulePath === scriptPath || modulePath === scriptPath + '.ts';
};

if (isMainModule()) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { Dnd5eSeeder };
