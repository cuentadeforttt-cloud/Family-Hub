// Sistema de diseño StocklyApp - Tema de disciplina y fuerza
export const theme = {
  colors: {
    // Colores principales - Inspirados en disciplina y fuerza
    primary: {
      50: '#eff6ff', // Azul muy claro
      100: '#dbeafe', // Azul claro
      200: '#bfdbfe', // Azul suave
      300: '#93c5fd', // Azul medio
      400: '#60a5fa', // Azul vibrante
      500: '#3b82f6', // Azul principal
      600: '#2563eb', // Azul oscuro
      700: '#1d4ed8', // Azul más oscuro
      800: '#1e40af', // Azul muy oscuro
      900: '#1e3a8a', // Azul más profundo
    },

    // Colores secundarios - Inspirados en frutas y vegetales
    secondary: {
      50: '#fef7ed', // Naranja muy claro
      100: '#fed7aa', // Naranja claro
      200: '#fdba74', // Naranja suave
      300: '#fb923c', // Naranja medio
      400: '#f97316', // Naranja vibrante
      500: '#ea580c', // Naranja principal
      600: '#dc2626', // Rojo-naranja
      700: '#b91c1c', // Rojo oscuro
      800: '#991b1b', // Rojo muy oscuro
      900: '#7f1d1d', // Rojo profundo
    },

    // Colores de acento - Inspirados en ingredientes naturales
    accent: {
      yellow: '#fbbf24', // Amarillo dorado (limón)
      purple: '#a855f7', // Púrpura (berenjena)
      blue: '#3b82f6', // Azul (arándanos)
      pink: '#ec4899', // Rosa (fresas)
      teal: '#14b8a6', // Verde azulado (menta)
    },

    // Colores neutros - Inspirados en ingredientes básicos
    neutral: {
      50: '#fafafa', // Blanco roto
      100: '#f5f5f5', // Gris muy claro
      200: '#e5e5e5', // Gris claro
      300: '#d4d4d4', // Gris medio claro
      400: '#a3a3a3', // Gris medio
      500: '#737373', // Gris
      600: '#525252', // Gris oscuro
      700: '#404040', // Gris muy oscuro
      800: '#262626', // Casi negro
      900: '#171717', // Negro
    },

    // Colores de estado
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Colores de fondo
    background: {
      primary: '#fefefe', // Blanco puro
      secondary: '#f8fafc', // Gris muy claro
      tertiary: '#f1f5f9', // Gris suave
      card: '#ffffff', // Blanco para tarjetas
      overlay: 'rgba(0, 0, 0, 0.5)', // Overlay semitransparente
    },

    // Colores de texto
    text: {
      primary: '#1f2937', // Negro suave
      secondary: '#6b7280', // Gris medio
      tertiary: '#9ca3af', // Gris claro
      inverse: '#ffffff', // Blanco
      accent: '#22c55e', // Verde principal
    },
  },

  // Tipografías
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
  },

  // Espaciado
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
  },

  // Bordes y radios
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  // Sombras
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // Gradientes
  gradients: {
    primary: ['#3b82f6', '#2563eb'],
    secondary: ['#f97316', '#ea580c'],
    accent: ['#a855f7', '#7c3aed'],
    sunset: ['#fbbf24', '#f59e0b', '#ea580c'],
    ocean: ['#3b82f6', '#1d4ed8'],
    forest: ['#22c55e', '#15803d'],
    berry: ['#ec4899', '#be185d'],
    discipline: ['#1e40af', '#1e3a8a'],
  },

  // Iconos y emojis temáticos
  icons: {
    food: {
      fruits: ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑', '🥭'],
      vegetables: ['🥕', '🥒', '🍅', '🥬', '🥦', '🌶️', '🧄', '🧅'],
      proteins: ['🥩', '🍗', '🐟', '🥚', '🧀', '🥛', '🍤', '🥜'],
      grains: ['🍞', '🍚', '🌾', '🥖', '🥨', '🍝', '🥟', '🌮'],
      drinks: ['🥤', '☕', '🧃', '🍵', '🥛', '🍷', '🍺', '🧊'],
    },
    actions: {
      add: '➕',
      remove: '➖',
      edit: '✏️',
      delete: '🗑️',
      check: '✅',
      warning: '⚠️',
      info: 'ℹ️',
      star: '⭐',
      heart: '❤️',
      fire: '🔥',
    },
    status: {
      fresh: '🟢',
      warning: '🟡',
      expired: '🔴',
      unknown: '⚪',
    },
  },
};

// Utilidades de tema
export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let value: any = theme.colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color not found: ${colorPath}`);
      return theme.colors.neutral[500];
    }
  }

  return value;
};

export const getSpacing = (size: keyof typeof theme.spacing) =>
  theme.spacing[size];
export const getFontSize = (size: keyof typeof theme.typography.fontSize) =>
  theme.typography.fontSize[size];
export const getBorderRadius = (size: keyof typeof theme.borderRadius) =>
  theme.borderRadius[size];
export const getShadow = (size: keyof typeof theme.shadows) =>
  theme.shadows[size];
