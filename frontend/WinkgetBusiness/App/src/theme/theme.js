import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937',
    placeholder: '#9CA3AF',
    disabled: '#D1D5DB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
};

export const businessColors = {
  food_delivery: {
    primary: '#FF6B6B',
    secondary: '#FF5252',
    accent: '#FF8A80',
  },
  marketplace: {
    primary: '#4ECDC4',
    secondary: '#26A69A',
    accent: '#80CBC4',
  },
  finance: {
    primary: '#45B7D1',
    secondary: '#2196F3',
    accent: '#64B5F6',
  },
  express: {
    primary: '#96CEB4',
    secondary: '#4CAF50',
    accent: '#81C784',
  },
  b2b: {
    primary: '#9C27B0',
    secondary: '#7B1FA2',
    accent: '#BA68C8',
  },
  b2c: {
    primary: '#FF9800',
    secondary: '#F57C00',
    accent: '#FFB74D',
  },
  healthcare: {
    primary: '#E91E63',
    secondary: '#C2185B',
    accent: '#F06292',
  },
  education: {
    primary: '#607D8B',
    secondary: '#455A64',
    accent: '#90A4AE',
  },
  entertainment: {
    primary: '#795548',
    secondary: '#5D4037',
    accent: '#A1887F',
  },
};
