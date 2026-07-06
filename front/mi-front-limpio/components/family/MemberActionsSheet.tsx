import React from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, AppButton, ActionPill } from '../ui';
import { colors, radius, spacing, shadows } from '../../constants/theme';
import { ROLE_LABELS, Role } from '../../services/family';
import { FamilyActionFeedback } from './FamilyActionFeedback';

type MemberActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  memberName: string;
  memberRole: string;
  memberPersonId?: string;
  currentPersonId?: string;
  canChangeRoles: boolean;
  canManageMembers: boolean;
  currentRole: string;
  onRemove: () => void;
  onChangeRole?: (newRole: string) => void | Promise<void>;
  onRequestRoleChange?: (newRole: string) => void | Promise<void>;
};

const AVAILABLE_ROLES: { id: Role; label: string }[] = [
  { id: 'adult', label: 'Adulto' },
  { id: 'adolescent', label: 'Adolescente' },
  { id: 'child', label: 'Niño' },
  { id: 'senior', label: 'Adulto mayor' },
  { id: 'guest', label: 'Invitado' },
];

export const MemberActionsSheet: React.FC<MemberActionsSheetProps> = ({
  visible,
  onClose,
  memberName,
  memberRole,
  memberPersonId,
  currentPersonId,
  canChangeRoles,
  canManageMembers,
  currentRole,
  onRemove,
  onChangeRole,
  onRequestRoleChange,
}) => {
  const [selectedRole, setSelectedRole] = React.useState<string>(memberRole);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedbackVisible, setFeedbackVisible] = React.useState(false);
  const [feedbackConfig, setFeedbackConfig] = React.useState<{ type: 'success' | 'error'; title: string; description?: string } | null>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    setSelectedRole(memberRole);
  }, [memberRole, visible]);

  if (!visible) return null;

  const isSelf = memberPersonId && currentPersonId ? memberPersonId === currentPersonId : false;
  const canRemove = canManageMembers && !isSelf;
  const canModifyRole = canChangeRoles && onChangeRole;
  const canRequestRole = !canChangeRoles && onRequestRoleChange && currentRole !== memberRole;
  const currentRoleLabel = ROLE_LABELS[memberRole as Role] ?? memberRole;
  const hasRoleChanged = selectedRole !== memberRole;

  const showFeedback = (type: 'success' | 'error', title: string, description?: string) => {
    setFeedbackConfig({ type, title, description });
    setFeedbackVisible(true);
  };

  const handleRemove = () => {
    Alert.alert(
      'Quitar miembro',
      `¿Seguro que querés quitar a ${memberName} del hogar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => {
            onRemove();
            onClose();
            showFeedback('success', 'Miembro quitado', `${memberName} ya no tiene acceso al hogar.`);
          },
        },
      ],
    );
  };

  const handleChangeRole = async () => {
    if (!onChangeRole) return;
    setActionLoading(true);
    try {
      await onChangeRole(selectedRole);
      onClose();
      showFeedback('success', 'Rol actualizado', `${memberName} ahora es ${ROLE_LABELS[selectedRole as Role] ?? selectedRole}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRole = async () => {
    if (!onRequestRoleChange) return;
    setActionLoading(true);
    try {
      await onRequestRoleChange(selectedRole);
      onClose();
      showFeedback('success', 'Solicitud enviada', 'Tu solicitud de cambio de rol fue enviada.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
        <View style={styles.handleRow}>
          <View style={styles.handle} />
          <AppButton title="Cerrar" variant="ghost" size="sm" onPress={handleCancel} style={styles.closeButton} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <AppText variant="title3">Miembro</AppText>
            <AppText variant="bodySmall" tone="secondary">
              {currentRoleLabel}
              {isSelf && <AppText variant="bodySmall" tone="success"> — Vos</AppText>}
            </AppText>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing[5] }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.memberInfo}>
            <AppText variant="body" weight="600">
              {memberName}
            </AppText>
          </View>

          {canModifyRole ? (
            <View style={styles.section}>
              <AppText variant="title3" style={styles.sectionTitle}>
                Rol en el hogar
              </AppText>
              <AppText variant="bodySmall" tone="secondary">
                Elegí cómo participa en este hogar.
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rolePills}
              >
                {AVAILABLE_ROLES.map((role) => (
                  <ActionPill
                    key={role.id}
                    label={role.label}
                    selected={selectedRole === role.id}
                    disabled={actionLoading}
                    onPress={() => setSelectedRole(role.id)}
                  />
                ))}
              </ScrollView>
              <AppButton
                title="Guardar cambio"
                variant={hasRoleChanged ? 'primary' : 'secondary'}
                size="md"
                loading={actionLoading}
                onPress={handleChangeRole}
                disabled={!hasRoleChanged || actionLoading}
              />
            </View>
          ) : null}

          {canRequestRole ? (
            <View style={styles.section}>
              <AppText variant="title3" style={styles.sectionTitle}>
                Solicitar cambio de rol
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rolePills}
              >
                {AVAILABLE_ROLES.map((role) => (
                  <ActionPill
                    key={role.id}
                    label={role.label}
                    selected={selectedRole === role.id}
                    disabled={actionLoading}
                    onPress={() => setSelectedRole(role.id)}
                  />
                ))}
              </ScrollView>
              <AppButton
                title="Solicitar cambio"
                variant={hasRoleChanged ? 'primary' : 'secondary'}
                size="md"
                loading={actionLoading}
                onPress={handleRequestRole}
                disabled={!hasRoleChanged || actionLoading}
              />
            </View>
          ) : null}

          {canRemove ? (
            <View style={styles.section}>
              <AppText variant="title3" style={styles.sectionTitle}>
                Acceso al hogar
              </AppText>
              <AppText variant="bodySmall" tone="secondary" style={styles.warningText}>
                Esta acción no se puede deshacer. {memberName} perderá el acceso al hogar.
              </AppText>
              <AppButton
                title="Quitar miembro"
                variant="ghost"
                size="sm"
                textStyle={styles.removeText}
                style={styles.removeButton}
                loading={actionLoading}
                onPress={handleRemove}
              />
            </View>
          ) : null}
        </ScrollView>

        {feedbackConfig ? (
          <FamilyActionFeedback
            visible={feedbackVisible}
            type={feedbackConfig.type}
            title={feedbackConfig.title}
            description={feedbackConfig.description}
            lottieSlot={feedbackConfig.type === 'success' ? 'role_updated' : undefined}
            onDismiss={() => setFeedbackVisible(false)}
          />
        ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.surface.overlayStrong,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    minHeight: '48%',
    backgroundColor: colors.background.base,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sheet,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[5],
    position: 'relative',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
  },
  closeButton: {
    position: 'absolute',
    right: spacing[4],
    top: -spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerContent: {
    flex: 1,
    marginRight: spacing[2],
  },
  content: {
    maxHeight: '100%',
  },
  contentContainer: {
    padding: spacing[4],
    gap: spacing[4],
  },
  memberInfo: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    marginBottom: spacing[1],
  },
  rolePills: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  warningText: {
    color: colors.warning.text,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
  removeText: {
    color: colors.danger.text,
  },
});
