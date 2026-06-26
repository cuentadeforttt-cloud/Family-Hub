import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';
import { AnimatedCard } from './AnimatedCard';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  style?: ViewStyle;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  style,
  delay = 0,
}) => {
  const colorScheme = theme.colors[color] || theme.colors.primary;

  return (
    <AnimatedCard
      variant="elevated"
      style={[styles.container, style]}
      delay={delay}
    >
      <View style={styles.content}>
        {icon && (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colorScheme[100] },
            ]}
          >
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}

        <Text style={[styles.value, { color: colorScheme[600] }]}>{value}</Text>

        <Text style={styles.title}>{title}</Text>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 90,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  value: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },
});
