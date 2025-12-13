import { describe, it, expect, beforeEach } from 'vitest';
import { FoundryJournalParser } from '../journalParser';
import type { RawImportItem, FoundryJournal } from '@vtt/shared';
import foundryJournalSample from './fixtures/foundryJournalSample.json';

describe('FoundryJournalParser', () => {
  let parser: FoundryJournalParser;

  beforeEach(() => {
    parser = new FoundryJournalParser();
  });

  describe('parse', () => {
    it('should parse a Foundry journal entry', async () => {
      const item: RawImportItem = {
        sourceId: foundryJournalSample._id,
        name: foundryJournalSample.name,
        type: 'journal',
        data: foundryJournalSample as FoundryJournal
      };

      const result = await parser.parse(item);

      expect(result).toBeDefined();
      expect(result.entityType).toBe('journal');
      expect(result.entityId).toBe('foundry-journal456');
      expect(result.name).toBe('The Legend of the Runelords');
      expect(result.sourceId).toBe('journal456');
    });

    it('should extract pages correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryJournalSample._id,
        name: foundryJournalSample.name,
        type: 'journal',
        data: foundryJournalSample as FoundryJournal
      };

      const result = await parser.parse(item);

      expect(result.data.pages).toBeDefined();
      expect(result.data.pages).toHaveLength(3);
    });

    it('should extract text page correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryJournalSample._id,
        name: foundryJournalSample.name,
        type: 'journal',
        data: foundryJournalSample as FoundryJournal
      };

      const result = await parser.parse(item);

      const textPage = result.data.pages[0];
      expect(textPage).toBeDefined();
      expect(textPage.id).toBe('page001');
      expect(textPage.name).toBe('Introduction');
      expect(textPage.type).toBe('text');
      expect(textPage.format).toBe('html');
      expect(textPage.text).toContain('The Rise of the Runelords');
    });

    it('should extract image page correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryJournalSample._id,
        name: foundryJournalSample.name,
        type: 'journal',
        data: foundryJournalSample as FoundryJournal
      };

      const result = await parser.parse(item);

      const imagePage = result.data.pages[2];
      expect(imagePage).toBeDefined();
      expect(imagePage.id).toBe('page003');
      expect(imagePage.name).toBe('Map of Thassilon');
      expect(imagePage.type).toBe('image');
      expect(imagePage.src).toBe('journal/thassilon-map.webp');
    });

    it('should extract description from first text page', async () => {
      const item: RawImportItem = {
        sourceId: foundryJournalSample._id,
        name: foundryJournalSample.name,
        type: 'journal',
        data: foundryJournalSample as FoundryJournal
      };

      const result = await parser.parse(item);

      expect(result.description).toContain('Ten thousand years ago');
      expect(result.description.length).toBeLessThanOrEqual(200);
    });

    it('should extract first image as journal img', async () => {
      const item: RawImportItem = {
        sourceId: foundryJournalSample._id,
        name: foundryJournalSample.name,
        type: 'journal',
        data: foundryJournalSample as FoundryJournal
      };

      const result = await parser.parse(item);

      // Should use the journal's img field if present, otherwise find first image page
      expect(result.img).toBeDefined();
    });

    it('should handle journal without pages', async () => {
      const emptyJournal = {
        ...foundryJournalSample,
        pages: []
      };

      const item: RawImportItem = {
        sourceId: emptyJournal._id,
        name: emptyJournal.name,
        type: 'journal',
        data: emptyJournal as FoundryJournal
      };

      const result = await parser.parse(item);

      expect(result.data.pages).toEqual([]);
      expect(result.description).toBe('');
    });

    it('should handle markdown format', async () => {
      const markdownJournal = {
        ...foundryJournalSample,
        pages: [
          {
            _id: 'md001',
            name: 'Markdown Page',
            type: 'text',
            text: { content: '# Heading\n\nParagraph', format: 2 },
            sort: 100
          }
        ]
      };

      const item: RawImportItem = {
        sourceId: markdownJournal._id,
        name: markdownJournal.name,
        type: 'journal',
        data: markdownJournal as FoundryJournal
      };

      const result = await parser.parse(item);

      const page = result.data.pages[0];
      expect(page.format).toBe('markdown');
      expect(page.text).toContain('# Heading');
    });

    it('should preserve page sort order', async () => {
      const item: RawImportItem = {
        sourceId: foundryJournalSample._id,
        name: foundryJournalSample.name,
        type: 'journal',
        data: foundryJournalSample as FoundryJournal
      };

      const result = await parser.parse(item);

      expect(result.data.pages[0].sort).toBe(100);
      expect(result.data.pages[1].sort).toBe(200);
      expect(result.data.pages[2].sort).toBe(300);
    });

    it('should strip HTML from description', async () => {
      const htmlJournal = {
        ...foundryJournalSample,
        pages: [
          {
            _id: 'html001',
            name: 'HTML Page',
            type: 'text',
            text: { content: '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p>', format: 1 },
            sort: 100
          }
        ]
      };

      const item: RawImportItem = {
        sourceId: htmlJournal._id,
        name: htmlJournal.name,
        type: 'journal',
        data: htmlJournal as FoundryJournal
      };

      const result = await parser.parse(item);

      expect(result.description).not.toContain('<');
      expect(result.description).not.toContain('>');
      expect(result.description).toContain('Title');
      expect(result.description).toContain('Paragraph with bold text');
    });
  });
});
