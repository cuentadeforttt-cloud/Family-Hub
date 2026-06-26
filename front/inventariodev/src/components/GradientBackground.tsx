import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'sunset'
    | 'ocean'
    | 'forest'
    | 'berry';
  style?: ViewStyle;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'primary',
  style,
}) => {
  const gradientColors = theme.gradients[variant];

  return (
    <View
      style={[styles.container, { backgroundColor: gradientColors[0] }, style]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
