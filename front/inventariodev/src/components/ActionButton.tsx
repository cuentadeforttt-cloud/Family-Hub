import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'outline'
    | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  fullWidth = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[500],
          borderColor: theme.colors.primary[500],
          textColor: theme.colors.text.inverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary[500],
          borderColor: theme.colors.secondary[500],
          textColor: theme.colors.text.inverse,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          borderColor: theme.colors.success,
          textColor: theme.colors.text.inverse,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          borderColor: theme.colors.warning,
          textColor: theme.colors.text.inverse,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.error,
          textColor: theme.colors.text.inverse,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.primary[500],
          textColor: theme.colors.primary[600],
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: theme.colors.primary[600],
        };
      default:
        return {
          backgroundColor: theme.colors.primary[500],
          borderColor: theme.colors.primary[500],
          textColor: theme.colors.text.inverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          fontSize: theme.typography.fontSize.sm,
          minHeight: 32,
        };
      case 'medium':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          fontSize: theme.typography.fontSize.base,
          minHeight: 40,
        };
      case 'large':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          fontSize: theme.typography.fontSize.lg,
          minHeight: 48,
        };
      default:
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          fontSize: theme.typography.fontSize.base,
          minHeight: 40,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          minHeight: sizeStyles.minHeight,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {icon && `${icon} `}
        {title}
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
    borderWidth: 2,
    ...theme.shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
