import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface BadgeProps {
  text: string;
  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'default'
    | 'primary'
    | 'secondary'
    | 'expired';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  icon?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  style,
  icon,
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {icon ? `${icon} ${text}` : text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  success: {
    backgroundColor: theme.colors.primary[100],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  warning: {
    backgroundColor: theme.colors.secondary[100],
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
  },
  danger: {
    backgroundColor: theme.colors.error + '20',
    borderWidth: 1,
    borderColor: theme.colors.error + '40',
  },
  info: {
    backgroundColor: theme.colors.accent.blue + '20',
    borderWidth: 1,
    borderColor: theme.colors.accent.blue + '40',
  },
  primary: {
    backgroundColor: theme.colors.primary[500],
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: theme.colors.secondary[500],
    borderWidth: 0,
  },
  expired: {
    backgroundColor: '#8B0000' + '20', // Dark red with transparency
    borderWidth: 1,
    borderColor: '#8B0000' + '40',
  },
  default: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  small: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  large: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  successText: {
    color: theme.colors.primary[700],
  },
  warningText: {
    color: theme.colors.secondary[700],
  },
  dangerText: {
    color: theme.colors.error,
  },
  infoText: {
    color: theme.colors.accent.blue,
  },
  primaryText: {
    color: theme.colors.text.inverse,
  },
  secondaryText: {
    color: theme.colors.text.inverse,
  },
  expiredText: {
    color: '#8B0000', // Dark red
  },
  defaultText: {
    color: theme.colors.text.secondary,
  },
});
