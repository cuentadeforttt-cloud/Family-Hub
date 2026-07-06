import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { AppText, AppAvatar, AppButton, ActionPill } from '../ui';
import { colors, radius, spacing } from '../../constants/theme';
import { FamilyMember, ROLE_LABELS, Role } from '../../services/family';
import { HomePlusIcon } from '../../constants/icons';

type MemberRowProps = {
  member: FamilyMember;
  isSelf: boolean;
  canManageMembers?: boolean;
  canChangeRoles?: boolean;
  onAction?: () => void;
  showActions?: boolean;
};

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  isSelf,
  canManageMembers = false,
  canChangeRoles = false,
  onAction,
  showActions = false,
}) => {
  const roleLabel = ROLE_LABELS[member.role as Role] ?? member.role;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onAction}
      disabled={!onAction}
      style={styles.row}
    >
      <View style={styles.avatarContainer}>
        <AppAvatar
          name={member.display_name}
          imageUrl={member.avatar_url}
          size="sm"
        />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <AppText variant="body" weight="600">
            {member.display_name}
          </AppText>
          {isSelf ? (
            <ActionPill label="Vos" tone="success" disabled />
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <HomePlusIcon name="ribbon" size={14} color={colors.text.tertiary} />
          <AppText variant="bodySmall" tone="secondary">
            {roleLabel}
          </AppText>
        </View>
      </View>

      {showActions && (canManageMembers || canChangeRoles) ? (
        <View style={styles.actionContainer}>
          <HomePlusIcon name="options" size={20} color={colors.text.tertiary} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  avatarContainer: {
    flexShrink: 0,
  },
  infoContainer: {
    flex: 1,
    gap: spacing[1],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionContainer: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.soft,
  },
});
