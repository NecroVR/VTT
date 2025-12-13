import { ImportService } from '../../importService.js';
import { FoundryActorParser } from './actorParser.js';
import { FoundryItemParser } from './itemParser.js';
import { FoundrySceneParser } from './sceneParser.js';
import { FoundryJournalParser } from './journalParser.js';

/**
 * Register all Foundry VTT parsers with the import service
 *
 * This function should be called during server initialization to
 * register all Foundry-specific content parsers.
 */
export function registerFoundryParsers(importService: ImportService): void {
  const actorParser = new FoundryActorParser();
  const itemParser = new FoundryItemParser();
  const sceneParser = new FoundrySceneParser();
  const journalParser = new FoundryJournalParser();

  // Register actor parser
  importService.registerParser('foundryvtt', 'actor', actorParser);

  // Register item parsers (multiple content types use the same parser)
  importService.registerParser('foundryvtt', 'item', itemParser);
  importService.registerParser('foundryvtt', 'spell', itemParser);
  importService.registerParser('foundryvtt', 'feat', itemParser);
  importService.registerParser('foundryvtt', 'class', itemParser);
  importService.registerParser('foundryvtt', 'subclass', itemParser);
  importService.registerParser('foundryvtt', 'race', itemParser);
  importService.registerParser('foundryvtt', 'subrace', itemParser);
  importService.registerParser('foundryvtt', 'background', itemParser);

  // Register scene parser
  importService.registerParser('foundryvtt', 'scene', sceneParser);

  // Register journal parser
  importService.registerParser('foundryvtt', 'journal', journalParser);

  console.log('Foundry VTT parsers registered successfully');
}

// Export individual parsers for testing
export { FoundryActorParser } from './actorParser.js';
export { FoundryItemParser } from './itemParser.js';
export { FoundrySceneParser } from './sceneParser.js';
export { FoundryJournalParser } from './journalParser.js';
