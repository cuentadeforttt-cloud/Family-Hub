import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { theme } from '../constants/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  style?: any;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  icon = '🔍',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Text style={styles.clearIcon} onPress={() => onChangeText('')}>
            ✕
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  icon: {
    fontSize: theme.typography.fontSize.lg,
    marginRight: theme.spacing.sm,
    color: theme.colors.text.secondary,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.tertiary,
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
});
