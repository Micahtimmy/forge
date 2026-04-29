/**
 * FORGE Design System Tokens
 * Enterprise-grade design tokens for Decision Intelligence UI
 */

export const FORGE_TOKENS = {
  // Spacing scale (4px base)
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'var(--font-dm-sans), system-ui, sans-serif',
      mono: 'var(--font-jetbrains-mono), ui-monospace, monospace',
      display: 'var(--font-syne), system-ui, sans-serif',
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
      '5xl': ['48px', { lineHeight: '1' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Colors - Dark mode first (FORGE identity)
  colors: {
    // Canvas layers
    canvas: {
      DEFAULT: '#0a0a0b',
      subtle: '#0f0f10',
      muted: '#141417',
    },

    // Surface layers (for cards, panels)
    surface: {
      '01': '#141417',
      '02': '#1a1a1e',
      '03': '#212126',
      hover: '#27272a',
      active: '#2e2e33',
    },

    // Border colors
    border: {
      DEFAULT: '#27272a',
      subtle: '#1f1f23',
      strong: '#3f3f46',
      focus: '#6366f1',
    },

    // Text colors
    text: {
      primary: '#f4f4f5',
      secondary: '#a1a1aa',
      tertiary: '#71717a',
      muted: '#52525b',
      inverse: '#09090b',
    },

    // Intelligence colors (for ML/AI features)
    intelligence: {
      iris: {
        DEFAULT: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        muted: 'rgba(99, 102, 241, 0.15)',
      },
      jade: {
        DEFAULT: '#10b981',
        light: '#34d399',
        dark: '#059669',
        muted: 'rgba(16, 185, 129, 0.15)',
      },
      amber: {
        DEFAULT: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
        muted: 'rgba(245, 158, 11, 0.15)',
      },
      coral: {
        DEFAULT: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
        muted: 'rgba(239, 68, 68, 0.15)',
      },
    },

    // Score tiers
    score: {
      excellent: '#10b981', // 80-100
      good: '#6366f1',      // 60-79
      fair: '#f59e0b',      // 40-59
      poor: '#ef4444',      // 0-39
    },

    // Risk levels
    risk: {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    },

    // Status colors
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#6366f1',
    },
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    glow: {
      iris: '0 0 20px rgba(99, 102, 241, 0.3)',
      jade: '0 0 20px rgba(16, 185, 129, 0.3)',
      amber: '0 0 20px rgba(245, 158, 11, 0.3)',
      coral: '0 0 20px rgba(239, 68, 68, 0.3)',
    },
  },

  // Border radius
  radius: {
    none: '0',
    sm: '4px',
    DEFAULT: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Z-index scale
  zIndex: {
    dropdown: 50,
    sticky: 100,
    fixed: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    toast: 600,
    tooltip: 700,
    command: 800,
  },
} as const;

// Helper functions
export function getScoreColor(score: number): string {
  if (score >= 80) return FORGE_TOKENS.colors.score.excellent;
  if (score >= 60) return FORGE_TOKENS.colors.score.good;
  if (score >= 40) return FORGE_TOKENS.colors.score.fair;
  return FORGE_TOKENS.colors.score.poor;
}

export function getScoreTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

export function getRiskColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  return FORGE_TOKENS.colors.risk[level];
}

export function getProbabilityColor(probability: number): string {
  if (probability >= 70) return FORGE_TOKENS.colors.risk.critical;
  if (probability >= 50) return FORGE_TOKENS.colors.risk.high;
  if (probability >= 30) return FORGE_TOKENS.colors.risk.medium;
  return FORGE_TOKENS.colors.risk.low;
}

// CSS custom properties generator
export function generateCSSVariables(): string {
  const variables: string[] = [];

  // Spacing
  Object.entries(FORGE_TOKENS.spacing).forEach(([key, value]) => {
    variables.push(`--spacing-${key}: ${value};`);
  });

  // Colors - flatten nested objects
  const flattenColors = (obj: Record<string, unknown>, prefix = ''): void => {
    Object.entries(obj).forEach(([key, value]) => {
      const varName = prefix ? `${prefix}-${key}` : key;
      if (typeof value === 'string') {
        variables.push(`--color-${varName}: ${value};`);
      } else if (typeof value === 'object' && value !== null) {
        flattenColors(value as Record<string, unknown>, varName);
      }
    });
  };
  flattenColors(FORGE_TOKENS.colors);

  // Shadows
  Object.entries(FORGE_TOKENS.shadows).forEach(([key, value]) => {
    if (typeof value === 'string') {
      variables.push(`--shadow-${key}: ${value};`);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        variables.push(`--shadow-${key}-${subKey}: ${subValue};`);
      });
    }
  });

  // Radius
  Object.entries(FORGE_TOKENS.radius).forEach(([key, value]) => {
    variables.push(`--radius-${key}: ${value};`);
  });

  return `:root {\n  ${variables.join('\n  ')}\n}`;
}

export type ForgeTokens = typeof FORGE_TOKENS;
