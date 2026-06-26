import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  secureTextEntry?: boolean;
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'email-address'
    | 'phone-pad'
    | 'number-pad';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  disabled = false,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.focused,
          error && styles.error,
          disabled && styles.disabled,
          multiline && styles.multiline,
          inputStyle,
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  focused: {
    borderColor: '#0369a1',
    borderWidth: 2,
  },
  error: {
    borderColor: '#dc2626',
  },
  disabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  multiline: {
    textAlignVertical: 'top',
    minHeight: 60,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
  },
});
