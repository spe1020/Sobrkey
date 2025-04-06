// Theme variables for consistent styling across the app

// Colors
export const colors = {
  primary: '#4a90e2',
  primaryDark: '#2e70c2', 
  primaryLight: '#e8f0fe',
  secondary: '#6c757d',
  success: '#27ae60',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  black: '#000000',
  gray: '#808080',
  grayLight: '#e9ecef',
  grayDark: '#495057',
  background: '#f5f5f7',
  card: '#ffffff',
  text: '#333333',
  border: '#eeeeee',
  notification: '#ff3b30',
  
  // Specific use cases
  meetingBackground: '#f0f7ff',
  journalBackground: '#f9f9ff',
  emergencyButton: '#e74c3c',
  checkInButton: '#4a90e2',
  checkedInButton: '#27ae60',
};

// Typography
export const typography = {
  fontFamily: {
    base: undefined, // System default font
    heading: undefined, // System default font
    monospace: 'monospace',
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
  },
  fontWeight: {
    normal: 'normal',
    medium: '500',
    semibold: '600',
    bold: 'bold',
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Borders
export const borders = {
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  width: {
    none: 0,
    thin: 1,
    thick: 2,
    thicker: 4,
  },
};

// Shadows
export const shadows = {
  none: {
    boxShadow: 'none',
    elevation: 0,
  },
  sm: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  md: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  lg: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  // Keep these for native compatibility
  nativeNone: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  nativeSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nativeMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nativeLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
};

// Component Styles
export const components = {
  // Button styles
  button: {
    base: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 48,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
    },
    success: {
      backgroundColor: colors.success,
    },
    danger: {
      backgroundColor: colors.danger,
    },
    warning: {
      backgroundColor: colors.warning,
    },
    info: {
      backgroundColor: colors.info,
    },
    disabled: {
      backgroundColor: colors.gray,
      opacity: 0.7,
    },
  },
  
  // Input styles
  input: {
    base: {
      backgroundColor: colors.white,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: typography.fontSize.base,
      color: colors.text,
    },
    multiline: {
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    error: {
      borderColor: colors.danger,
    },
  },
  
  // Card styles
  card: {
    base: {
      backgroundColor: colors.card,
      borderRadius: borders.radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.md,
    },
  },
  
  // Header styles
  header: {
    base: {
      backgroundColor: colors.white,
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text,
    },
  },
  
  // Message styles
  message: {
    self: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    other: {
      backgroundColor: colors.grayLight,
      color: colors.text,
    },
  },
};

// Export default theme object that combines all styles
export default {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  components,
};
