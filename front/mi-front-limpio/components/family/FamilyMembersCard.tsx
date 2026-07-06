import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { AppText, AppCard, AppButton, ActionPill, Skeleton, EmptyState } from '../ui';
import { colors, radius, spacing } from '../../constants/theme';
import { FamilyData, FamilyMember, ROLE_LABELS } from '../../services/family';
import { HomePlusIcon } from '../../constants/icons';
import { MemberRow } from './MemberRow';
import { PendingSummaryPill } from './PendingSummaryPill';

type FamilyMembersCardProps = {
  familyData: FamilyData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onMemberAction?: (member: FamilyMember) => void;
  onPendingPress: () => void;
  onInvitePress: () => void;
};

export const FamilyMembersCard: React.FC<FamilyMembersCardProps> = ({
  familyData,
  loading,
  error,
  onRetry,
  onMemberAction,
  onPendingPress,
  onInvitePress,
}) => {
  const current_member = familyData?.current_member ?? null;
  const members = familyData?.members ?? [];
  const join_requests = familyData?.join_requests ?? [];
  const role_requests = familyData?.role_requests ?? [];
  const invite_links = familyData?.invite_links ?? [];

  const pendingCount = join_requests.filter((r) => r.status === 'pending').length +
    role_requests.filter((r) => r.status === 'pending').length;

  const hasActiveInviteLink = invite_links.some((link) => !link.revoked_at && !link.expires_at);

  const handleInvite = () => {
    onInvitePress();
  };

  if (loading) {
    return (
      <AppCard variant="quiet" padding="generous">
        <View style={styles.card}>
          <View style={styles.header}>
            <Skeleton variant="line" width={120} height={24} />
            <Skeleton variant="line" width={80} height={20} />
          </View>
          <Skeleton variant="line" width={200} height={16} />
          <View style={styles.membersList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.memberSkeleton}>
                <Skeleton variant="avatar" />
                <View style={{ flex: 1 }}>
                  <Skeleton variant="line" width={150} height={18} />
                  <Skeleton variant="line" width={100} height={14} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard variant="quiet" padding="generous">
        <View style={styles.emptyCard}>
          <AppText variant="body" tone="danger">
            {error}
          </AppText>
          <AppButton title="Reintentar" size="sm" onPress={onRetry} />
        </View>
      </AppCard>
    );
  }

  if (!familyData) {
    return (
      <AppCard variant="quiet" padding="generous">
        <View style={styles.emptyCard}>
          <EmptyState
            title="No pudimos encontrar el hogar activo."
            description="Reintenta cargar la familia para sincronizar tus datos."
          />
          <AppButton title="Reintentar" size="sm" onPress={onRetry} />
        </View>
      </AppCard>
    );
  }

  if (!current_member) {
    return (
      <AppCard variant="quiet" padding="generous">
        <View style={styles.emptyCard}>
          <EmptyState
            title="No pudimos encontrar tu membresia activa."
            description="Reintenta cargar la familia para sincronizar tus permisos."
          />
          <AppButton title="Reintentar" size="sm" onPress={onRetry} />
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard variant="quiet" padding="generous">
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <AppText variant="title3">Miembros</AppText>
<View style={styles.metaRow}>
              <AppText variant="bodySmall" tone="secondary">
                {members.length} integrante{members.length !== 1 ? 's' : ''}
              </AppText>
              <AppText variant="bodySmall" tone="muted">
                {' · '}
              </AppText>
              <ActionPill label={ROLE_LABELS[current_member.role]} tone={current_member.role === 'coordinator' ? 'primary' : 'success'} disabled />
            </View>
          </View>
        </View>

        {pendingCount > 0 ? (
          <PendingSummaryPill count={pendingCount} onPress={onPendingPress} />
        ) : null}

        {current_member.can_invite ? (
          <TouchableOpacity onPress={handleInvite} activeOpacity={0.7} style={styles.inviteAction}>
            <View style={styles.inviteButton}>
              <HomePlusIcon name="person-add" size={16} color={colors.terracotta[600]} />
              <AppText variant="bodySmall" weight="600" tone="primary">
                {hasActiveInviteLink ? 'Invitación activa' : 'Crear invitación'}
              </AppText>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.membersList}>
          {members.length === 0 ? (
            <EmptyState
              title="Aún no hay miembros"
              description="Cuando alguien se sume al hogar, lo vas a ver aquí."
            />
          ) : (
            members.map((member) => (
              <MemberRow
                key={member.membership_id}
                member={member}
                isSelf={member.person_id === current_member.person_id}
                canManageMembers={current_member.can_manage_members}
                canChangeRoles={current_member.can_change_roles}
                onAction={current_member.can_manage_members || current_member.can_change_roles ? () => onMemberAction?.(member) : undefined}
                showActions={current_member.can_manage_members || current_member.can_change_roles}
              />
            ))
          )}
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.muted,
  },
  inviteAction: {
    alignSelf: 'flex-start',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.terracotta[50],
    borderRadius: radius.md,
  },
  membersList: {
    gap: spacing[1],
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing[2],
  },
  memberSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
});
