// hooks/useThemeColor.ts

import { useColorScheme } from 'react-native';

// FIX #1: Corrected the import path and variable name to match our changes.
import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // FIX #2: Ensured 'theme' is never null or undefined, defaulting to 'light'.
  // This resolves the "implicitly has an 'any' type" error.
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // This line will now work because 'theme' is guaranteed to be 'light' or 'dark'.
    return Colors[theme][colorName];
  }
}