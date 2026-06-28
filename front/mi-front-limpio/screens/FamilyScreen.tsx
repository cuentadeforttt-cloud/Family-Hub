import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ActionPill, AppButton, AppCard, AppScreen, AppText, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { colors, radius, spacing } from '../constants/theme';
import { HomePlusIcon } from '../constants/icons';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { finalizeHouseholdMember, type JoinRequest } from '../services/api';
import {
  approvePendingJoinRequest,
  listPendingJoinRequests,
  rejectPendingJoinRequest,
  type PendingRole,
} from '../services/invitations';

const ROLE_LABELS: Record<string, string> = {
  coordinator: 'Coordinador/a',
  coordinador: 'Coordinador/a',
  adult: 'Adulto',
  adulto: 'Adulto',
  adolescent: 'Adolescente',
  adolescente: 'Adolescente',
  child: 'Nino/a',
  senior: 'Adulto mayor',
  adulto_mayor: 'Adulto mayor',
  guest: 'Invitado/a',
};

const APPROVAL_ROLES: { id: PendingRole; label: string }[] = [
  { id: 'adult', label: 'Adulto' },
  { id: 'adolescent', label: 'Adolescente' },
  { id: 'child', label: 'Nino/a' },
  { id: 'senior', label: 'Adulto mayor' },
  { id: 'guest', label: 'Invitado/a' },
];

const shortId = (value: string) => (value.length > 8 ? `${value.slice(0, 8)}...` : value);

export const FamilyScreen = () => {
  const navigation = useNavigation<any>();
  const { authMe, session } = useAuth();
  const {
    currentHousehold,
    currentRole,
    householdError,
    isCoordinator,
    loading,
    members,
    reload,
    reloading,
    refreshMembers,
  } = useHousehold();

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [roleByRequest, setRoleByRequest] = useState<Record<string, PendingRole>>({});
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const activeMembership = useMemo(() => {
    const householdId = currentHousehold?.id;
    if (!householdId) return null;

    return authMe?.memberships.find(
      (membership) => membership.household_id === householdId && membership.status === 'active',
    ) ?? null;
  }, [authMe?.memberships, currentHousehold?.id]);

  const currentRoleLabel = currentRole ? ROLE_LABELS[currentRole] ?? currentRole : 'Sin rol activo';

  const loadRequests = useCallback(async () => {
    if (!currentHousehold?.id || !isCoordinator) {
      setJoinRequests([]);
      setRequestsError(null);
      return;
    }

    setRequestsLoading(true);
    const { requests, error } = await listPendingJoinRequests(currentHousehold.id);

    if (error) {
      setRequestsError(error);
    } else {
      setRequestsError(null);
      setJoinRequests(requests);
      setRoleByRequest((current) => {
        const next = { ...current };
        requests.forEach((request) => {
          if (!next[request.id]) next[request.id] = 'adult';
        });
        return next;
      });
    }

    setRequestsLoading(false);
  }, [currentHousehold?.id, isCoordinator]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const refreshFamily = useCallback(async () => {
    await refreshMembers();
    await loadRequests();
  }, [loadRequests, refreshMembers]);

  const handleInvite = () => {
    if (!currentHousehold?.id) return;
    navigation.navigate('P03InvitarPersonas', { householdId: currentHousehold.id });
  };

  const handleApprove = async (request: JoinRequest) => {
    if (!currentHousehold?.id) return;

    setActingRequestId(request.id);
    setActionMessage(null);
    const role = roleByRequest[request.id] ?? 'adult';
    const { error } = await approvePendingJoinRequest(currentHousehold.id, request.id, role);

    if (error) {
      setRequestsError(error);
    } else {
      setActionMessage('Solicitud aprobada.');
      await refreshFamily();
    }

    setActingRequestId(null);
  };

  const handleReject = async (request: JoinRequest) => {
    if (!currentHousehold?.id) return;

    setActingRequestId(request.id);
    setActionMessage(null);
    const { error } = await rejectPendingJoinRequest(currentHousehold.id, request.id);

    if (error) {
      setRequestsError(error);
    } else {
      setActionMessage('Solicitud rechazada.');
      await refreshFamily();
    }

    setActingRequestId(null);
  };

  const removeMember = async (membershipId: string) => {
    const accessToken = session?.access_token;
    const householdId = currentHousehold?.id;

    if (!accessToken || !householdId) {
      Alert.alert('No se pudo quitar', 'Tu sesion expiro o no hay hogar activo.');
      return;
    }

    setRemovingMemberId(membershipId);
    setActionMessage(null);

    try {
      await finalizeHouseholdMember(accessToken, householdId, membershipId);
      setActionMessage('Miembro quitado del hogar.');
      await refreshFamily();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos quitar este miembro.';
      Alert.alert('No se pudo quitar', message);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const confirmRemove = (membershipId: string, displayName: string) => {
    Alert.alert(
      'Quitar miembro',
      `${displayName} dejara de tener acceso activo a este hogar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => void removeMember(membershipId),
        },
      ],
    );
  };

  return (
    <AppScreen scroll bottomInset="tab" background="base" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="title1">Familia</AppText>
          <AppText variant="bodySmall" tone="secondary">
            Personas, roles y accesos del hogar.
          </AppText>
        </View>
        <ActionPill label={currentRoleLabel} tone={isCoordinator ? 'primary' : 'success'} />
      </View>

      {actionMessage ? (
        <AppCard variant="success" padding="compact">
          <AppText variant="bodySmall" tone="success" weight="700">
            {actionMessage}
          </AppText>
        </AppCard>
      ) : null}

      {householdError ? (
        <ErrorState description={householdError} onRetry={() => void refreshFamily()} />
      ) : null}

      <AppCard highlighted padding="generous">
        <View style={styles.householdCard}>
          <View style={styles.householdMark}>
            <AppText variant="title3" tone="primary" weight="700">
              H
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title3">{currentHousehold?.nombre ?? 'Hogar'}</AppText>
            <AppText variant="bodySmall" tone="secondary">
              {members.length} miembro{members.length === 1 ? '' : 's'} activo{members.length === 1 ? '' : 's'}
            </AppText>
          </View>
        </View>
      </AppCard>

{isCoordinator ? (
        <AppCard variant="quiet" padding="default">
          <View style={styles.inviteRow}>
            <View style={styles.inviteLabel}>
              <HomePlusIcon name="person-add" size={20} color={colors.terracotta[600]} />
              <View style={{ flex: 1 }}>
                <AppText variant="title3">Invitaciones</AppText>
                <AppText variant="bodySmall" tone="secondary">
                  Genera links reales y aproba solicitudes del hogar.
                </AppText>
              </View>
            </View>
            <AppButton title="Invitar" size="sm" onPress={handleInvite} disabled={!currentHousehold?.id} />
          </View>
        </AppCard>
      ) : null}

{isCoordinator ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <HomePlusIcon name="person-add" size={20} color={colors.terracotta[600]} />
              <AppText variant="title3">Solicitudes pendientes</AppText>
            </View>
            <AppButton
              title="Actualizar"
              variant="ghost"
              size="sm"
              loading={requestsLoading}
              onPress={() => void loadRequests()}
            />
          </View>

          {requestsError ? (
            <ErrorState
              title="No pudimos cargar solicitudes"
              description={requestsError}
              onRetry={() => void loadRequests()}
            />
          ) : requestsLoading ? (
            <Skeleton variant="screenSection" />
          ) : joinRequests.length === 0 ? (
            <AppCard variant="quiet" padding="compact">
              <AppText variant="bodySmall" tone="secondary">
                No hay solicitudes pendientes.
              </AppText>
            </AppCard>
          ) : (
            <View style={styles.stack}>
              {joinRequests.map((request) => {
                const selectedRole = roleByRequest[request.id] ?? 'adult';
                const acting = actingRequestId === request.id;

                return (
                  <AppCard key={request.id} variant="warning" padding="default">
                    <View style={styles.stack}>
                      <View>
                        <AppText variant="body" weight="700">
                          Persona {shortId(request.person_id)}
                        </AppText>
                        <AppText variant="caption" tone="secondary">
                          Solicitud {shortId(request.id)}
                        </AppText>
                      </View>
                      <View style={styles.pillRow}>
                        {APPROVAL_ROLES.map((role) => (
                          <ActionPill
                            key={role.id}
                            label={role.label}
                            selected={selectedRole === role.id}
                            disabled={acting}
                            onPress={() => setRoleByRequest((current) => ({ ...current, [request.id]: role.id }))}
                          />
                        ))}
                      </View>
                      <View style={styles.actionsRow}>
                        <AppButton
                          title="Aprobar"
                          variant="primary"
                          size="sm"
                          loading={acting}
                          onPress={() => void handleApprove(request)}
                          style={styles.actionButton}
                        />
                        <AppButton
                          title="Rechazar"
                          variant="danger"
                          size="sm"
                          disabled={acting}
                          onPress={() => void handleReject(request)}
                          style={styles.actionButton}
                        />
                      </View>
                    </View>
                  </AppCard>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

<View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <HomePlusIcon name="people" size={20} color={colors.terracotta[600]} />
            <AppText variant="title3">Miembros</AppText>
          </View>
          {(loading || reloading) ? <ActionPill label="Actualizando" tone="primary" disabled /> : null}
        </View>

        {loading ? (
          <Skeleton variant="screenSection" />
        ) : members.length === 0 ? (
          <EmptyState
            title="Aun no hay miembros"
            description="Cuando alguien se sume al hogar, lo vas a ver aca."
            actionLabel={isCoordinator ? 'Invitar personas' : undefined}
            onAction={isCoordinator ? handleInvite : undefined}
          />
        ) : (
          <View style={styles.stack}>
{members.map((member) => {
              const displayName = member.user?.nombre ?? 'Miembro';
              const roleLabel = ROLE_LABELS[member.rol] ?? member.rol;
              const isSelf = activeMembership?.id === member.id;
              const canRemove = isCoordinator && !isSelf;

              return (
                <AppCard key={member.id} padding="default">
                  <View style={styles.memberRow}>
                    <View style={styles.avatar}>
                      <AppText variant="body" weight="700">
                        {displayName.trim().slice(0, 1).toUpperCase() || 'M'}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.memberTitleRow}>
                        <AppText variant="body" weight="700">
                          {displayName}
                        </AppText>
                        {isSelf ? <ActionPill label="Vos" tone="success" disabled /> : null}
                      </View>
                      <View style={styles.memberMetaRow}>
                        <HomePlusIcon name="ribbon" size={14} color={colors.text.tertiary} />
                        <AppText variant="bodySmall" tone="secondary">
                          {roleLabel}
                        </AppText>
                      </View>
                    </View>
                    {canRemove ? (
                      <AppButton
                        title="Quitar"
                        variant="danger"
                        size="sm"
                        loading={removingMemberId === member.id}
                        onPress={() => confirmRemove(member.id, displayName)}
                      />
                    ) : null}
                  </View>
                </AppCard>
              );
            })}
          </View>
        )}
      </View>
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
  householdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  householdMark: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotta[50],
    borderWidth: 1,
    borderColor: colors.terracotta[100],
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  inviteLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  stack: {
    gap: spacing[3],
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  memberTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sage[50],
    borderWidth: 1,
    borderColor: colors.sage[100],
  },
});
