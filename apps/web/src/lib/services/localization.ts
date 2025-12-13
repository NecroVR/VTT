import type { LocalizedString } from '@vtt/shared/types/forms';

/**
 * Locale resolver for form localization
 *
 * This service provides translation resolution for LocalizedString types,
 * with a fallback chain that ensures content is always displayed even
 * if translations are not available.
 *
 * Fallback chain:
 * 1. If localeKey exists, look up translation in locale data
 * 2. If translation not found or localeKey missing, use literal value
 * 3. If literal not present, return localeKey as-is (for debugging)
 */
class LocaleResolverService {
  private currentLocale: string = 'en';
  private localeData: Map<string, Record<string, string>> = new Map();

  /**
   * Resolve a LocalizedString to its display value
   *
   * @param localized The LocalizedString to resolve
   * @param locale Optional locale override (defaults to current locale)
   * @returns The resolved string value
   */
  resolve(localized: LocalizedString | string | undefined, locale?: string): string {
    // Handle undefined
    if (!localized) {
      return '';
    }

    // Handle plain string (for backwards compatibility)
    if (typeof localized === 'string') {
      return localized;
    }

    // Use provided locale or fall back to current locale
    const targetLocale = locale || this.currentLocale;

    // Try to resolve locale key if present
    if (localized.localeKey) {
      const translation = this.getTranslation(localized.localeKey, targetLocale);
      if (translation) {
        return translation;
      }
    }

    // Fall back to literal value
    if (localized.literal) {
      return localized.literal;
    }

    // Last resort: return the locale key itself (for debugging)
    return localized.localeKey || '';
  }

  /**
   * Get the current locale
   */
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Set the current locale
   *
   * @param locale The locale code (e.g., 'en', 'es', 'fr')
   */
  setLocale(locale: string): void {
    this.currentLocale = locale;
  }

  /**
   * Load locale data for a specific locale
   *
   * @param locale The locale code
   * @param data Key-value pairs of locale keys to translations
   */
  loadLocale(locale: string, data: Record<string, string>): void {
    this.localeData.set(locale, data);
  }

  /**
   * Get a translation for a specific key and locale
   *
   * @param key The locale key
   * @param locale The locale code
   * @returns The translation, or undefined if not found
   */
  private getTranslation(key: string, locale: string): string | undefined {
    const data = this.localeData.get(locale);
    return data?.[key];
  }

  /**
   * Check if a locale is loaded
   *
   * @param locale The locale code
   */
  hasLocale(locale: string): boolean {
    return this.localeData.has(locale);
  }

  /**
   * Get all loaded locales
   */
  getLoadedLocales(): string[] {
    return Array.from(this.localeData.keys());
  }

  /**
   * Clear all locale data
   */
  clearLocales(): void {
    this.localeData.clear();
  }

  /**
   * Create a LocalizedString from a plain string
   * Useful for migration/backwards compatibility
   *
   * @param value The string value
   * @returns A LocalizedString with the literal set
   */
  fromString(value: string): LocalizedString {
    return { literal: value };
  }

  /**
   * Create a LocalizedString with both literal and locale key
   *
   * @param literal The fallback literal value
   * @param localeKey The locale key for translation
   * @returns A LocalizedString with both values
   */
  create(literal: string, localeKey?: string): LocalizedString {
    return { literal, localeKey };
  }
}

// Export a singleton instance
export const localeResolver = new LocaleResolverService();

// Export the class for testing purposes
export { LocaleResolverService };
