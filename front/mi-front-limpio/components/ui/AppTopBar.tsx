import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, radius, shadows, typography } from '../../constants/theme';
import { AppText } from './AppText';
import { AppAvatar } from './AppAvatar';
import { HomePlusIcon } from '../../constants/icons';

export type AppTopBarProps = {
  personName: string;
  personAvatarUrl?: string | null;
  householdName: string;
  householdRole: string;
  onAvatarPress?: () => void;
  onHouseholdPress?: () => void;
  showChevron?: boolean;
  rightSlot?: React.ReactNode;
};

const ROLE_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  coordinator: { name: 'ribbon', color: colors.terracotta[600], bg: colors.terracotta[50] },
  adult: { name: 'ribbon', color: colors.sage[600], bg: colors.sage[50] },
  adolescent: { name: 'ribbon', color: colors.info.text, bg: colors.info.soft },
  senior: { name: 'ribbon', color: colors.sand[600], bg: colors.sand[50] },
  child: { name: 'ribbon', color: colors.sage[600], bg: colors.sage[50] },
  guest: { name: 'ribbon', color: colors.text.tertiary, bg: colors.surface.soft },
};

function getRoleDisplay(role: string): { label: string; icon: string; color: string; bg: string } {
  const roleLower = role.toLowerCase();
  const mapping: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    coordinator: { label: 'Coordinador', icon: 'ribbon', color: colors.terracotta[600], bg: colors.terracotta[50] },
    adult: { label: 'Adulto', icon: 'ribbon', color: colors.sage[600], bg: colors.sage[50] },
    adolescent: { label: 'Adolescente', icon: 'ribbon', color: colors.info.text, bg: colors.info.soft },
    senior: { label: 'Adulto mayor', icon: 'ribbon', color: colors.sand[600], bg: colors.sand[50] },
    child: { label: 'Niño', icon: 'ribbon', color: colors.sage[600], bg: colors.sage[50] },
    guest: { label: 'Invitado', icon: 'ribbon', color: colors.text.tertiary, bg: colors.surface.soft },
  };
  return mapping[roleLower] ?? { label: role, icon: 'ribbon', color: colors.text.tertiary, bg: colors.surface.soft };
}

export function AppTopBar({
  personName,
  personAvatarUrl,
  householdName,
  householdRole,
  onAvatarPress,
  onHouseholdPress,
  showChevron = true,
  rightSlot,
}: AppTopBarProps) {
  const roleInfo = getRoleDisplay(householdRole);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.leftSection}>
        <AppAvatar
          imageUrl={personAvatarUrl}
          name={personName}
          size="md"
          showBorder
          onPress={onAvatarPress}
          accessibilityLabel={`Abrir perfil de ${personName}`}
        />
      </View>

      <Pressable
        onPress={onHouseholdPress}
        style={({ pressed }) => [
          styles.centerSection,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar hogar: ${householdName}`}
      >
        <View style={styles.householdInfo}>
          <View style={styles.householdRow}>
            <AppText variant="bodySmall" weight="700" style={styles.householdName}>
              {householdName}
            </AppText>
            {showChevron && (
              <HomePlusIcon name="chevron-down-outline" size={16} color={colors.text.tertiary} style={styles.chevron} />
            )}
          </View>
          <View style={styles.roleRow}>
            <View
              style={[
                styles.roleChip,
                { backgroundColor: roleInfo.bg, borderColor: roleInfo.bg },
              ]}
            >
              <HomePlusIcon name="ribbon-outline" size={12} color={roleInfo.color} />
              <AppText variant="micro" tone="secondary" weight="700" style={{ color: roleInfo.color, marginLeft: spacing[1] }}>
                {roleInfo.label}
              </AppText>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.rightSection}>
        {rightSlot ? (
          <View style={styles.rightSlot}>{rightSlot}</View>
        ) : (
          <View style={styles.rightPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[3],
  },
  householdInfo: {
    alignItems: 'center',
    gap: spacing[1],
  },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  householdName: {
    color: colors.text.primary,
  },
  chevron: {
    opacity: 0.7,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: spacing[1],
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  rightPlaceholder: {
    width: 44,
  },
});