import React from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, touchTargets } from '../../constants/theme';
import { AppText } from './AppText';

export type ActionPillTone = 'default' | 'primary' | 'success' | 'warning';

export type ActionPillProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  tone?: ActionPillTone;
  selected?: boolean;
  leftSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const toneStyles: Record<
  ActionPillTone,
  { backgroundColor: string; borderColor: string; textTone: 'primary' | 'success' | 'warning' }
> = {
  default: {
    backgroundColor: colors.surface.soft,
    borderColor: colors.border.default,
    textTone: 'primary',
  },
  primary: {
    backgroundColor: colors.terracotta[50],
    borderColor: colors.terracotta[300],
    textTone: 'primary',
  },
  success: {
    backgroundColor: colors.success.soft,
    borderColor: colors.success.base,
    textTone: 'success',
  },
  warning: {
    backgroundColor: colors.warning.soft,
    borderColor: colors.warning.base,
    textTone: 'warning',
  },
};

export function ActionPill({
  label,
  tone = 'default',
  selected = false,
  disabled,
  leftSlot,
  accessibilityLabel,
  style,
  ...props
}: ActionPillProps) {
  const resolvedTone = selected ? 'primary' : tone;
  const toneStyle = toneStyles[resolvedTone];
  const isDisabled = Boolean(disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled: isDisabled }}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        {
          minHeight: touchTargets.normal,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          borderRadius: radius.pill,
          borderWidth: selected ? 2 : 1,
          backgroundColor: toneStyle.backgroundColor,
          borderColor: toneStyle.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing[2],
          opacity: isDisabled ? 0.52 : pressed ? 0.84 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {leftSlot ? <View>{leftSlot}</View> : null}
      <AppText variant="micro" tone={toneStyle.textTone} weight="700">
        {label}
      </AppText>
    </Pressable>
  );
}
