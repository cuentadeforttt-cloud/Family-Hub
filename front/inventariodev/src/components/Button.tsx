import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'outline'
    | 'ghost'
    | 'success';
  size?: 'small' | 'medium' | 'large' | 'xl';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {icon ? `${icon} ${title}` : title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.sm,
  },
  primary: {
    backgroundColor: theme.colors.primary[500],
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: theme.colors.secondary[500],
    borderWidth: 0,
  },
  danger: {
    backgroundColor: theme.colors.error,
    borderWidth: 0,
  },
  success: {
    backgroundColor: theme.colors.success,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
  },
  ghost: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 0,
  },
  small: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 40,
  },
  large: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  xl: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  primaryText: {
    color: theme.colors.text.inverse,
  },
  secondaryText: {
    color: theme.colors.text.inverse,
  },
  dangerText: {
    color: theme.colors.text.inverse,
  },
  successText: {
    color: theme.colors.text.inverse,
  },
  outlineText: {
    color: theme.colors.primary[600],
  },
  ghostText: {
    color: theme.colors.primary[600],
  },
});
