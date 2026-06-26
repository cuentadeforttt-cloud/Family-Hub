import React, { useState } from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';
import { AppText } from './AppText';

export type AppInputVariant = 'default' | 'large' | 'multiline' | 'search';

export type AppInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  helperText?: string;
  errorText?: string;
  variant?: AppInputVariant;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

const variantHeights: Record<AppInputVariant, number> = {
  default: 48,
  large: 56,
  multiline: 104,
  search: 48,
};

export function AppInput({
  label,
  helperText,
  errorText,
  variant = 'default',
  editable = true,
  accessibilityLabel,
  multiline,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  leftSlot,
  rightSlot,
  ...props
}: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const isMultiline = variant === 'multiline' || multiline;
  const hasError = Boolean(errorText);
  const isDisabled = editable === false;

  return (
    <View style={[{ gap: spacing[2] }, containerStyle]}>
      <AppText variant="caption" tone="secondary" weight="700">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {leftSlot && <View style={{ marginRight: spacing[2] }}>{leftSlot}</View>}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          editable={editable}
          multiline={isMultiline}
          placeholderTextColor={colors.text.muted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            typography.body,
            {
              flex: 1,
              minHeight: variantHeights[variant],
              paddingHorizontal: spacing[4],
              paddingVertical: isMultiline ? spacing[3] : spacing[2],
              borderRadius: radius.lg,
              borderWidth: focused ? 2 : 1,
              borderColor: hasError
                ? colors.danger.base
                : focused
                  ? colors.terracotta[500]
                  : colors.border.default,
              backgroundColor: isDisabled ? colors.surface.muted : colors.surface.soft,
              color: isDisabled ? colors.text.disabled : colors.text.primary,
              textAlignVertical: isMultiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
          {...props}
        />
        {rightSlot && <View style={{ marginLeft: spacing[2] }}>{rightSlot}</View>}
      </View>
      {hasError ? (
        <AppText variant="caption" tone="danger">
          {errorText}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" tone="tertiary">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}
