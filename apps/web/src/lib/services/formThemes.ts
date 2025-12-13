/**
 * Form Theme System
 *
 * Provides built-in themes and theme management for form designer.
 */

export interface FormTheme {
  name: string;
  description: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textMuted: string;
    border: string;
    error: string;
    success: string;
  };
  fonts: {
    body: string;
    heading: string;
    monospace: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * Built-in themes
 */
export const builtInThemes: Record<string, FormTheme> = {
  default: {
    name: 'Default',
    description: 'Standard neutral theme',
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      primary: '#007bff',
      secondary: '#6c757d',
      text: '#212529',
      textMuted: '#6c757d',
      border: '#dee2e6',
      error: '#dc3545',
      success: '#28a745'
    },
    fonts: {
      body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      heading: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      monospace: '"Courier New", Courier, monospace'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem'
    }
  },

  dark: {
    name: 'Dark',
    description: 'Dark mode theme',
    colors: {
      background: '#1a1a1a',
      surface: '#2d2d2d',
      primary: '#4a9eff',
      secondary: '#8a909a',
      text: '#e8e8e8',
      textMuted: '#a0a0a0',
      border: '#404040',
      error: '#ff4444',
      success: '#44ff44'
    },
    fonts: {
      body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      heading: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      monospace: '"Courier New", Courier, monospace'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem'
    }
  },

  light: {
    name: 'Light',
    description: 'Clean light theme',
    colors: {
      background: '#fafafa',
      surface: '#ffffff',
      primary: '#2196f3',
      secondary: '#757575',
      text: '#424242',
      textMuted: '#757575',
      border: '#e0e0e0',
      error: '#f44336',
      success: '#4caf50'
    },
    fonts: {
      body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      heading: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      monospace: '"Courier New", Courier, monospace'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem'
    }
  },

  parchment: {
    name: 'Parchment',
    description: 'Fantasy/paper look',
    colors: {
      background: '#f4e8d0',
      surface: '#faf5e6',
      primary: '#8b4513',
      secondary: '#654321',
      text: '#3e2723',
      textMuted: '#5d4037',
      border: '#d7c9aa',
      error: '#c62828',
      success: '#558b2f'
    },
    fonts: {
      body: 'Georgia, "Times New Roman", serif',
      heading: 'Georgia, "Times New Roman", serif',
      monospace: '"Courier New", Courier, monospace'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.5rem'
    }
  }
};

/**
 * Get a theme by name
 */
export function getTheme(themeName: string): FormTheme | null {
  return builtInThemes[themeName] || null;
}

/**
 * Get all available theme names
 */
export function getThemeNames(): string[] {
  return Object.keys(builtInThemes);
}

/**
 * Convert theme to CSS variables
 */
export function themeToCssVariables(theme: FormTheme): Record<string, string> {
  return {
    // Colors
    '--form-bg-color': theme.colors.background,
    '--form-surface-color': theme.colors.surface,
    '--form-primary-color': theme.colors.primary,
    '--form-secondary-color': theme.colors.secondary,
    '--form-text-color': theme.colors.text,
    '--form-text-muted-color': theme.colors.textMuted,
    '--form-border-color': theme.colors.border,
    '--form-error-color': theme.colors.error,
    '--form-success-color': theme.colors.success,

    // Fonts
    '--form-font-body': theme.fonts.body,
    '--form-font-heading': theme.fonts.heading,
    '--form-font-monospace': theme.fonts.monospace,

    // Spacing
    '--form-spacing-xs': theme.spacing.xs,
    '--form-spacing-sm': theme.spacing.sm,
    '--form-spacing-md': theme.spacing.md,
    '--form-spacing-lg': theme.spacing.lg,
    '--form-spacing-xl': theme.spacing.xl,

    // Border radius
    '--form-radius-sm': theme.borderRadius.sm,
    '--form-radius-md': theme.borderRadius.md,
    '--form-radius-lg': theme.borderRadius.lg
  };
}

/**
 * Apply theme variables to a CSS string
 */
export function applyThemeVariables(
  cssVariables: Record<string, string>
): string {
  return Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}
