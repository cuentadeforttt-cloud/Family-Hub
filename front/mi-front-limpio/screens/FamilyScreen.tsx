import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, AppScreen } from '../components/ui';
import { spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import {
  FamilyMembersCard,
  FamilyPendingSheet,
  MemberActionsSheet,
  InviteLinkSheet,
  FamilyActionFeedback,
  type FeedbackType,
} from '../components/family';
import {
  type FamilyData,
  type FamilyMember,
  type PendingRole,
  ROLE_LABELS,
  type Role,
  getHouseholdFamily,
  finalizeMember,
  updateMemberRole,
  requestRoleChange,
  approveRoleChange,
  rejectRoleChange,
  cancelMyRoleRequest,
} from '../services/family';
import { createInvitation, revokeInvitation } from '../services/invitations';

export const FamilyScreen = () => {
  const { session, authMe, authMeLoading } = useAuth();
  const { currentHousehold } = useHousehold();
  const accessToken = session?.access_token ?? null;
  const authMeActiveHouseholdId = authMe?.active_household?.id ?? authMe?.person?.active_household_id ?? null;
  const householdId = currentHousehold?.id ?? authMeActiveHouseholdId ?? null;

  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingSheetVisible, setPendingSheetVisible] = useState(false);
  const [actionsSheetVisible, setActionsSheetVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [inviteLinkVisible, setInviteLinkVisible] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: FeedbackType;
    title: string;
    description?: string;
    lottieSlot?: string;
  } | null>(null);

  const showFeedback = useCallback((nextFeedback: {
    type: FeedbackType;
    title: string;
    description?: string;
    lottieSlot?: string;
  }) => {
    setFeedback(nextFeedback);
  }, []);

  const loadFamily = useCallback(async () => {
    if (__DEV__) {
      console.log('[FamilyScreen] load params', {
        hasToken: Boolean(accessToken),
        householdId,
        currentHouseholdId: currentHousehold?.id,
        authMeActiveHouseholdId,
      });
    }

    if (!householdId) {
      setFamilyData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!accessToken) {
      setFamilyData(null);
      setError('Tu sesión expiró. Inicia sesión nuevamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getHouseholdFamily(accessToken, householdId);

    if (__DEV__) {
      console.log('[FamilyScreen] family response', {
        hasData: Boolean(data),
        error: fetchError,
        membersCount: data?.members?.length,
      });
    }

    if (fetchError) {
      setError(fetchError);
      setFamilyData(null);
    } else if (data) {
      setFamilyData(data);
    } else {
      setFamilyData(null);
    }

    setLoading(false);
  }, [accessToken, authMeActiveHouseholdId, currentHousehold?.id, householdId]);

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  const handleRetry = () => {
    void loadFamily();
  };

  const handleMemberAction = useCallback((member: FamilyMember) => {
    setSelectedMember(member);
    setActionsSheetVisible(true);
  }, []);

  const handlePendingPress = useCallback(() => {
    setPendingSheetVisible(true);
  }, []);

  const handleInvitePress = useCallback(async () => {
    setInviteLinkVisible(true);
  }, []);

  const handleCreateInviteFromSheet = useCallback(async (): Promise<string | null> => {
    if (!householdId) return 'No pudimos encontrar el hogar activo.';

    try {
      const { invitation, error: inviteError } = await createInvitation(householdId);

      if (inviteError) {
        return inviteError;
      } else if (invitation) {
        await loadFamily();
        showFeedback({
          type: 'success',
          title: 'Invitación lista',
          description: 'Ya podés compartir el QR o el link.',
          lottieSlot: 'invite_created',
        });
      }
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos crear la invitación.';
      return msg;
    }
  }, [householdId, loadFamily, showFeedback]);

  const handleCopyInviteLink = useCallback(async () => {
    if (!familyData?.invite_links) return;

    const activeLink = familyData.invite_links.find(
      (link) => !link.revoked_at && !link.expires_at,
    );

    if (activeLink) {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || process.env.EXPO_PUBLIC_APP_URL || 'https://homeplus.app';
      const inviteUrl = `${baseUrl}/join?token=${activeLink.token}`;
      
      Alert.alert('Link de invitación', inviteUrl);
    }
  }, [familyData?.invite_links]);

  const handleRevokeInviteLink = useCallback(async () => {
    if (!householdId || !familyData?.invite_links) return;

    const activeLink = familyData.invite_links.find(
      (link) => !link.revoked_at && !link.expires_at,
    );

    if (activeLink) {
      try {
        const { error } = await revokeInvitation(householdId, activeLink.id);
        if (error) {
          Alert.alert('Error', error);
        } else {
          showFeedback({
            type: 'success',
            title: 'Invitación revocada',
            description: 'El link dejó de dar acceso al hogar.',
            lottieSlot: 'invite_revoked',
          });
        }
        await loadFamily();
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'No pudimos revocar el link.';
        Alert.alert('Error', msg);
      }
    }
  }, [householdId, familyData?.invite_links, loadFamily, showFeedback]);

  const handleApproveJoin = useCallback(async (membershipId: string, role: PendingRole) => {
    if (!householdId) return;

    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    try {
      const { approveJoinRequest } = await import('../services/api');
      await approveJoinRequest(accessToken, householdId, membershipId, role);
      showFeedback({
        type: 'success',
        title: 'Solicitud aprobada',
        description: 'La persona ya puede participar del hogar.',
        lottieSlot: 'request_approved',
      });
      await loadFamily();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos aprobar la solicitud.';
      Alert.alert('Error', msg);
    }
  }, [accessToken, householdId, loadFamily, showFeedback]);

  const handleRejectJoin = useCallback(async (membershipId: string) => {
    if (!householdId) return;

    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    try {
      const { rejectJoinRequest } = await import('../services/api');
      await rejectJoinRequest(accessToken, householdId, membershipId);
      showFeedback({
        type: 'info',
        title: 'Solicitud rechazada',
        description: 'La solicitud quedó cerrada.',
        lottieSlot: 'request_rejected',
      });
      await loadFamily();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos rechazar la solicitud.';
      Alert.alert('Error', msg);
    }
  }, [accessToken, householdId, loadFamily, showFeedback]);

  const handleApproveRoleRequest = useCallback(async (requestId: string) => {
    if (!householdId) return;
    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    try {
      const { error: actionError } = await approveRoleChange(accessToken, householdId, requestId);
      if (actionError) {
        Alert.alert('Error', actionError);
        return;
      }
      showFeedback({
        type: 'success',
        title: 'Cambio aprobado',
        description: 'El rol fue actualizado en el hogar.',
        lottieSlot: 'role_updated',
      });
      await loadFamily();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos aprobar la solicitud.';
      Alert.alert('Error', msg);
    }
  }, [accessToken, householdId, loadFamily, showFeedback]);

  const handleRejectRoleRequest = useCallback(async (requestId: string) => {
    if (!householdId) return;
    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    try {
      const { error: actionError } = await rejectRoleChange(accessToken, householdId, requestId);
      if (actionError) {
        Alert.alert('Error', actionError);
        return;
      }
      showFeedback({
        type: 'info',
        title: 'Cambio rechazado',
        description: 'La solicitud de rol quedó cerrada.',
        lottieSlot: 'role_rejected',
      });
      await loadFamily();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos rechazar la solicitud.';
      Alert.alert('Error', msg);
    }
  }, [accessToken, householdId, loadFamily, showFeedback]);

  const handleCancelRoleRequest = useCallback(async (requestId: string) => {
    if (!householdId) return;
    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    try {
      const { error: actionError } = await cancelMyRoleRequest(accessToken, householdId, requestId);
      if (actionError) {
        Alert.alert('Error', actionError);
        return;
      }
      showFeedback({
        type: 'info',
        title: 'Solicitud cancelada',
        description: 'El pedido de cambio ya no está pendiente.',
        lottieSlot: 'role_request_cancelled',
      });
      await loadFamily();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos cancelar la solicitud.';
      Alert.alert('Error', msg);
    }
  }, [accessToken, householdId, loadFamily, showFeedback]);

  const handleRemoveMember = useCallback(async () => {
    if (!householdId || !selectedMember) return;
    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    Alert.alert(
      'Quitar miembro',
      `${selectedMember.display_name} dejará de tener acceso activo a este hogar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: actionError } = await finalizeMember(accessToken, householdId, selectedMember.membership_id);
              if (actionError) {
                Alert.alert('Error', actionError);
                return;
              }
              showFeedback({
                type: 'success',
                title: 'Miembro quitado',
                description: `${selectedMember.display_name} ya no tiene acceso a este hogar.`,
                lottieSlot: 'member_removed',
              });
              await loadFamily();
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'No pudimos quitar el miembro.';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  }, [accessToken, householdId, selectedMember, loadFamily, showFeedback]);

  const handleChangeMemberRole = useCallback(async (newRole: string) => {
    if (!householdId || !selectedMember) return;
    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    try {
      const { error: actionError } = await updateMemberRole(
        accessToken,
        householdId,
        selectedMember.membership_id,
        newRole as 'coordinator' | 'adult' | 'adolescent' | 'child' | 'senior' | 'guest',
      );
      if (actionError) {
        Alert.alert('Error', actionError);
        return;
      }
      const roleLabel = ROLE_LABELS[newRole as Role] ?? newRole;
      showFeedback({
        type: 'success',
        title: 'Rol actualizado',
        description: `${selectedMember.display_name} ahora es ${roleLabel}.`,
        lottieSlot: 'role_updated',
      });
      await loadFamily();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos actualizar el rol.';
      Alert.alert('Error', msg);
    }
  }, [accessToken, householdId, selectedMember, loadFamily, showFeedback]);

  const handleRequestRoleChange = useCallback(async (newRole: string) => {
    if (!householdId) return;
    if (!accessToken) {
      Alert.alert('Error', 'Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }

    try {
      const { error: actionError } = await requestRoleChange(
        accessToken,
        householdId,
        newRole as 'coordinator' | 'adult' | 'adolescent' | 'child' | 'senior' | 'guest',
      );
      if (actionError) {
        Alert.alert('Error', actionError);
        return;
      }
      showFeedback({
        type: 'success',
        title: 'Solicitud enviada',
        description: 'El pedido de cambio de rol quedó pendiente.',
        lottieSlot: 'role_updated',
      });
      await loadFamily();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos enviar la solicitud.';
      Alert.alert('Error', msg);
    }
  }, [accessToken, householdId, loadFamily, showFeedback]);

  const currentMember = familyData?.current_member;
  const hasPermissions = currentMember?.can_manage_members || currentMember?.can_change_roles;

  const activeInviteLink = familyData?.invite_links?.find(
    (link) => !link.revoked_at && !link.expires_at,
  );
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || process.env.EXPO_PUBLIC_APP_URL || 'https://homeplus.app';
  const inviteUrl = activeInviteLink ? `${baseUrl}/join?token=${activeInviteLink.token}` : null;

  return (
    <AppScreen scroll bottomInset="tab" background="base" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="title1">Familia</AppText>
          <AppText variant="bodySmall" tone="secondary">
            Personas, roles y accesos del hogar.
          </AppText>
        </View>
      </View>

      <FamilyMembersCard
        familyData={familyData}
        loading={loading || authMeLoading}
        error={error}
        onRetry={handleRetry}
        onMemberAction={handleMemberAction}
        onPendingPress={handlePendingPress}
        onInvitePress={handleInvitePress}
      />

      {familyData ? (
          <>
            <FamilyPendingSheet
              visible={pendingSheetVisible}
              onClose={() => setPendingSheetVisible(false)}
              joinRequests={familyData.join_requests ?? []}
              roleRequests={familyData.role_requests ?? []}
              inviteLinks={familyData.invite_links ?? []}
              canReviewJoinRequests={currentMember?.can_review_join_requests ?? false}
              canChangeRoles={currentMember?.can_change_roles ?? false}
              canManageMembers={currentMember?.can_manage_members ?? false}
              canInvite={currentMember?.can_invite ?? false}
              currentPersonId={currentMember?.person_id ?? ''}
              onApproveJoin={handleApproveJoin}
              onRejectJoin={handleRejectJoin}
              onApproveRoleRequest={handleApproveRoleRequest}
              onRejectRoleRequest={handleRejectRoleRequest}
              onCancelRoleRequest={handleCancelRoleRequest}
              onCopyInviteLink={handleCopyInviteLink}
              onRevokeInviteLink={hasPermissions ? handleRevokeInviteLink : undefined}
              onCreateInviteLink={handleInvitePress}
            />
            <InviteLinkSheet
              visible={inviteLinkVisible}
              onClose={() => setInviteLinkVisible(false)}
              inviteUrl={inviteUrl}
              inviteToken={activeInviteLink?.token ?? null}
              hasActiveLink={Boolean(activeInviteLink)}
              onCreateInvite={handleCreateInviteFromSheet}
              onRevokeInviteLink={hasPermissions ? handleRevokeInviteLink : undefined}
              canRevoke={hasPermissions}
            />
          </>
      ) : null}

      <MemberActionsSheet
        visible={actionsSheetVisible}
        onClose={() => setActionsSheetVisible(false)}
        memberName={selectedMember?.display_name ?? ''}
        memberRole={selectedMember?.role ?? ''}
        memberPersonId={selectedMember?.person_id}
        currentPersonId={currentMember?.person_id}
        canChangeRoles={currentMember?.can_change_roles ?? false}
        canManageMembers={currentMember?.can_manage_members ?? false}
        currentRole={currentMember?.role ?? ''}
        onRemove={handleRemoveMember}
        onChangeRole={handleChangeMemberRole}
        onRequestRoleChange={handleRequestRoleChange}
      />

      <FamilyActionFeedback
        visible={Boolean(feedback)}
        type={feedback?.type ?? 'success'}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        lottieSlot={feedback?.lottieSlot}
        onDismiss={() => setFeedback(null)}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
});
