import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeModes = 'light' | 'dark' | 'system';

// Define color themes
type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  accent: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  inputBackground: string;
  statusBar: 'dark-content' | 'light-content';
  elevated: string;
  profileGradientStart: string;
  profileGradientEnd: string;
  tabBarBackground: string;
  avatarBackground: string;
  settingsIconBackground: string;
};

// Default light theme colors
const lightTheme: ThemeColors = {
  primary: '#3B82F6',
  secondary: '#0EA5E9',
  background: '#F0F9FF',
  card: '#FFFFFF',
  text: '#0F172A',
  secondaryText: '#475569',
  accent: '#8B5CF6',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  inputBackground: '#F8FAFC',
  statusBar: 'dark-content',
  elevated: '#FFFFFF',
  profileGradientStart: '#3B82F6',
  profileGradientEnd: '#2563EB',
  tabBarBackground: '#FFFFFF',
  avatarBackground: '#3B82F6',
  settingsIconBackground: '#F1F5F9',
};

// Rich dark theme colors with more depth and elegance
const darkTheme: ThemeColors = {
  primary: '#3B82F6', // Vibrant blue for a more tech feel
  secondary: '#0EA5E9',
  background: '#0F172A', // Deep navy blue
  card: '#1E293B', // Slightly lighter than background
  text: '#F8FAFC',
  secondaryText: '#94A3B8',
  accent: '#8B5CF6', // Purple for an energetic secondary color
  border: '#334155',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#60A5FA',
  inputBackground: '#1E293B',
  statusBar: 'light-content',
  elevated: '#334155', // Elevated surfaces are slightly lighter
  profileGradientStart: '#2563EB', // Rich blue
  profileGradientEnd: '#1E40AF',
  tabBarBackground: '#1E293B',
  avatarBackground: '#2563EB',
  settingsIconBackground: '#334155',
};

interface ThemeContextData {
  mode: ThemeModes;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (mode: ThemeModes) => void;
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'EnviroLink_theme_mode';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeModes>('dark');

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          savedTheme &&
          (savedTheme === 'light' ||
            savedTheme === 'dark' ||
            savedTheme === 'system')
        ) {
          setMode(savedTheme as ThemeModes);
        } else {
          // If no saved preference, set to dark mode and save it
          setMode('dark');
          await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  const setTheme = async (newMode: ThemeModes) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine if we should use dark mode
  const isDark =
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  // Select the appropriate color theme
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
