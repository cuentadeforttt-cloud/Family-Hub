import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { AppText, AppButton } from '../ui';
import { colors, radius, spacing, shadows } from '../../constants/theme';
import { FamilyActionFeedback } from './FamilyActionFeedback';

type InviteLinkSheetProps = {
  visible: boolean;
  onClose: () => void;
  inviteUrl: string | null;
  inviteToken: string | null;
  hasActiveLink: boolean;
  onCreateInvite: () => Promise<string | null | void>;
  onRevokeInviteLink?: () => Promise<void>;
  canRevoke?: boolean;
};

export const InviteLinkSheet: React.FC<InviteLinkSheetProps> = ({
  visible,
  onClose,
  inviteUrl,
  inviteToken,
  hasActiveLink,
  onCreateInvite,
  onRevokeInviteLink,
  canRevoke = false,
}) => {
  const [creating, setCreating] = React.useState(false);
  const [revoking, setRevoking] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = React.useState(false);
  const [feedbackConfig, setFeedbackConfig] = React.useState<{ type: 'success' | 'error'; title: string; description?: string } | null>(null);
  const qrScale = React.useRef(new Animated.Value(0.96)).current;
  const qrOpacity = React.useRef(new Animated.Value(0.85)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      setCreating(false);
      setRevoking(false);
      setInlineError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !hasActiveLink) return;

    qrScale.setValue(0.96);
    qrOpacity.setValue(0.85);
    Animated.parallel([
      Animated.timing(qrScale, {
        toValue: 1,
        duration: 720,
        useNativeDriver: true,
      }),
      Animated.timing(qrOpacity, {
        toValue: 1,
        duration: 720,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasActiveLink, qrOpacity, qrScale, visible]);

  const deepLink = inviteToken ? `homeplus://join?token=${inviteToken}` : null;
  const visibleLink = deepLink ?? inviteUrl;

  const showFeedback = (type: 'success' | 'error', title: string, description?: string) => {
    setFeedbackConfig({ type, title, description });
    setFeedbackVisible(true);
  };

  const handleCreate = async () => {
    setCreating(true);
    setInlineError(null);
    try {
      const errorMessage = await onCreateInvite();
      if (typeof errorMessage === 'string' && errorMessage.length > 0) {
        setInlineError('No pudimos crear la invitación.');
        showFeedback('error', 'Error', errorMessage);
      } else {
        showFeedback('success', 'Invitación lista', 'Ya podés compartir el QR o el link.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No pudimos crear la invitación.';
      setInlineError(msg);
      showFeedback('error', 'Error', msg);
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async () => {
    if (!visibleLink) return;
    await Share.share({
      message: `Te invito a unirte a mi hogar en HomePlus. Escaneá el QR o abri este enlace: ${deepLink}`,
      title: 'Invitación HomePlus',
    });
  };

  const handleOpenLink = async () => {
    if (!visibleLink) return;

    const canOpen = await Linking.canOpenURL(visibleLink);
    if (canOpen) {
      await Linking.openURL(visibleLink);
      return;
    }

    Alert.alert('Link de invitacion', visibleLink);
  };

  const handleRevoke = () => {
    Alert.alert(
      'Revocar invitación',
      '¿Seguro que querés revocar este link de invitación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            setRevoking(true);
            try {
              if (onRevokeInviteLink) {
                await onRevokeInviteLink();
                showFeedback('success', 'Invitación revocada', 'El link ya no será válido.');
              }
            } finally {
              setRevoking(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, hasActiveLink ? styles.qrSheet : styles.compactSheet]}
          onPress={(event) => event.stopPropagation()}
        >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
          <AppButton title="Cerrar" variant="ghost" size="sm" onPress={onClose} style={styles.closeButton} />
        </View>

        <View style={styles.header}>
          <AppText variant="title3">Invitación</AppText>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing[5] }]}
          showsVerticalScrollIndicator={false}
        >
          {!hasActiveLink ? (
            <View style={styles.emptyState}>
              <AppText variant="body" tone="secondary" style={styles.emptyDescription}>
                Creá un link para sumar personas al hogar.
              </AppText>
              <AppText variant="body" tone="secondary" style={styles.hiddenCopy}>
                No hay un link de invitación activo. Creá uno para compartir.
              </AppText>
              {inlineError ? (
                <AppText variant="bodySmall" tone="danger" style={styles.inlineError}>
                  No pudimos crear la invitación.
                </AppText>
              ) : null}
              <AppButton
                title="Crear invitación"
                variant="primary"
                size="md"
                loading={creating}
                onPress={handleCreate}
                style={styles.createButton}
              />
            </View>
          ) : (
            <>
              <View style={styles.qrArea}>
                <Animated.View
                  style={[
                    styles.qrCard,
                    {
                      opacity: qrOpacity,
                      transform: [{ scale: qrScale }],
                    },
                  ]}
                >
                  {/* TODO Lottie: QR focus / invite ready animation */}
                  {deepLink ? (
                    <QRCode value={deepLink} size={236} backgroundColor="#FFFFFF" color="#1C1C1C" />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <AppText variant="bodySmall" tone="tertiary">Generando QR...</AppText>
                    </View>
                  )}
                </Animated.View>
                <AppText variant="bodySmall" tone="secondary" style={styles.qrDescription}>
                  Escaneá para unirte al hogar
                </AppText>
              </View>

              {visibleLink ? (
                <View style={styles.linkBlock}>
                  <AppText variant="caption" tone="tertiary" weight="700">
                    Link
                  </AppText>
                  <AppText variant="caption" tone="secondary" selectable style={styles.linkText}>
                    {visibleLink}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.actions}>
                <AppButton
                  title="Compartir"
                  variant="primary"
                  size="md"
                  onPress={handleShare}
                  style={styles.actionButton}
                />
                <AppButton
                  title="Ver link"
                  variant="ghost"
                  size="md"
                  onPress={() => Alert.alert('Link de invitación', inviteUrl ?? '')}
                />
              </View>

              {canRevoke && onRevokeInviteLink ? (
                <View style={styles.revokeSection}>
                  <AppButton
                    title="Revocar invitación"
                    variant="ghost"
                    size="sm"
                    textStyle={styles.revokeText}
                    loading={revoking}
                    onPress={handleRevoke}
                  />
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        {feedbackConfig ? (
          <FamilyActionFeedback
            visible={feedbackVisible}
            type={feedbackConfig.type}
            title={feedbackConfig.title}
            description={feedbackConfig.description}
            lottieSlot={feedbackConfig.type === 'success' ? 'invite_created' : undefined}
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
    backgroundColor: colors.background.base,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing[5],
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sheet,
  },
  compactSheet: {
    maxHeight: '44%',
  },
  qrSheet: {
    maxHeight: '92%',
    minHeight: '62%',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
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
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  content: {
    maxHeight: '100%',
  },
  contentContainer: {
    paddingHorizontal: spacing[5],
    gap: spacing[4],
  },
  emptyState: {
    alignItems: 'flex-start',
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  emptyDescription: {
    maxWidth: 280,
  },
  hiddenCopy: {
    display: 'none',
  },
  inlineError: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.danger.soft,
  },
  createButton: {
    alignSelf: 'flex-start',
  },
  qrArea: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  qrCard: {
    padding: spacing[4],
    backgroundColor: colors.surface.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
  },
  qrPlaceholder: {
    width: 236,
    height: 236,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    borderRadius: radius.lg,
  },
  qrDescription: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  linkBlock: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[3],
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  linkText: {
    lineHeight: 18,
  },
  revokeSection: {
    alignItems: 'flex-start',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  revokeText: {
    color: colors.danger.text,
  },
});
