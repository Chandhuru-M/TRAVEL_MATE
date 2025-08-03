// constants/Colors.ts

const primary = '#6C63FF';
const accent = '#FFD700';
const danger = '#DC3545';
const success = '#28A745';
const warning = '#FFC107';

// FIX: Renamed the export from 'colors' to 'Colors'
export const Colors = {
  light: {
    text: '#333333',
    textSecondary: '#666666',
    background: '#F7F8FA',
    cardBackground: '#FFFFFF',
    primary: primary,
    accent: accent,
    danger: danger,
    success: success,
    warning: warning,
    border: '#E0E0E0',
    tint: primary,
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#A9A9A9',
    background: '#121212',
    cardBackground: '#1E1E1E',
    primary: primary,
    accent: accent,
    danger: danger,
    success: success,
    warning: warning,
    border: '#272727',
    tint: '#FFFFFF',
  },
};