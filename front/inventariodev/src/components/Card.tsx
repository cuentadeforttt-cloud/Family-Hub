import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  shadow?: boolean;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  borderRadius?: keyof typeof theme.borderRadius;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 16,
  margin = 0,
  shadow = true,
  variant = 'default',
  borderRadius = 'lg',
}) => {
  return (
    <View
      style={[
        styles.card,
        styles[variant],
        {
          padding,
          margin,
          borderRadius: theme.borderRadius[borderRadius],
        },
        shadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.card,
  },
  default: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  elevated: {
    backgroundColor: theme.colors.background.card,
  },
  outlined: {
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    backgroundColor: theme.colors.primary[50],
  },
  filled: {
    backgroundColor: theme.colors.primary[100],
    borderWidth: 0,
  },
  shadow: {
    ...theme.shadows.md,
  },
});
