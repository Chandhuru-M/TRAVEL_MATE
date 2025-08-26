// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';
type TimeFormat = '12h' | '24h'; // <-- NEW TYPE

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  timeFormat: TimeFormat; // <-- NEW STATE
  toggleTimeFormat: () => void; // <-- NEW ACTION
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemTheme || 'light');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h'); // Default to 12-hour

  // Load the saved theme from storage when the app starts
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as Theme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const toggleTimeFormat = () => {
    setTimeFormat(prev => prev === '12h' ? '24h' : '12h');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, timeFormat, toggleTimeFormat }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};