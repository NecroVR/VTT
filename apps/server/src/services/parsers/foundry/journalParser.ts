import type { ContentParser, ParsedEntity } from '../../importService';
import type { RawImportItem, FoundryJournal } from '@vtt/shared';

/**
 * Foundry Journal Parser
 * Transforms Foundry VTT journal entries (notes, handouts) into VTT format
 */
export class FoundryJournalParser implements ContentParser {

  async parse(item: RawImportItem): Promise<ParsedEntity> {
    const foundry = item.data as FoundryJournal;

    const data = this.transformJournalData(foundry);

    return {
      entityType: 'journal',
      entityId: `foundry-${foundry._id}`,
      name: foundry.name,
      description: this.extractDescription(foundry),
      img: foundry.img || this.extractFirstImage(foundry),
      data,
      sourceId: foundry._id
    };
  }

  private transformJournalData(foundry: FoundryJournal): Record<string, unknown> {
    return {
      name: foundry.name,

      // Pages (Foundry v10+ uses pages system)
      pages: this.transformPages(foundry.pages),

      // Flags (preserve Foundry-specific data)
      flags: foundry.flags || {}
    };
  }

  private transformPages(pages?: Array<any>): Array<Record<string, unknown>> {
    if (!pages || !Array.isArray(pages)) return [];

    return pages.map(page => ({
      id: page._id || page.id,
      name: page.name || 'Untitled Page',
      type: page.type || 'text',

      // Text content
      text: page.text?.content || page.content || '',
      format: this.mapTextFormat(page.text?.format),

      // Image/video content
      src: page.src || '',

      // Metadata
      sort: page.sort || 0,
      flags: page.flags || {}
    }));
  }

  private mapTextFormat(format?: number): string {
    // Foundry text formats: 1 = HTML, 2 = Markdown
    const formatMap: Record<number, string> = {
      1: 'html',
      2: 'markdown'
    };
    return formatMap[format ?? 1] || 'html';
  }

  private extractDescription(foundry: FoundryJournal): string {
    // Try to get description from first text page
    if (foundry.pages && foundry.pages.length > 0) {
      const firstTextPage = foundry.pages.find(p => p.type === 'text');
      if (firstTextPage) {
        const content = firstTextPage.text?.content || (firstTextPage as any).content || '';
        // Extract first 200 characters of text content, stripping HTML
        return this.stripHtml(content).substring(0, 200);
      }
    }

    return '';
  }

  private extractFirstImage(foundry: FoundryJournal): string | undefined {
    // Try to find first image page
    if (foundry.pages && foundry.pages.length > 0) {
      const firstImagePage = foundry.pages.find(p => p.type === 'image');
      if (firstImagePage?.src) {
        return firstImagePage.src;
      }

      // Try to extract first image from text content
      const firstTextPage = foundry.pages.find(p => p.type === 'text');
      if (firstTextPage) {
        const content = firstTextPage.text?.content || (firstTextPage as any).content || '';
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
          return imgMatch[1];
        }
      }
    }

    return undefined;
  }

  private stripHtml(html: string): string {
    // Simple HTML stripping - remove tags and decode entities
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
