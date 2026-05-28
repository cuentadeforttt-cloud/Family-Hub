import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { createInvitation, getPendingInvitations, revokeInvitation } from '../services/invitations';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import type { PrivateStackParamList } from '../navigation/types';
import type { HouseholdMember } from '../services/households';
import type { Invitation } from '../services/invitations';

type Props = NativeStackScreenProps<PrivateStackParamList, 'P03InvitarPersonas'>;

type Role = HouseholdMember['rol'];

const ROLES: { id: Role; icon: string; label: string; description: string }[] = [
  { id: 'adulto',        icon: '👤',  label: 'Adulto',       description: 'Acceso casi completo, sin administración' },
  { id: 'adolescente',   icon: '🧒',  label: 'Adolescente',  description: 'Vista gamificada con sus tareas y agenda' },
  { id: 'adulto_mayor',  icon: '👴',  label: 'Adulto mayor', description: 'Interfaz simplificada y accesible' },
];

export const P03InvitarPersonas = ({ navigation, route }: Props) => {
  const { user } = useAuth();
  const { reload } = useHousehold();
  const { householdId } = route.params;

  const [selectedRole, setSelectedRole] = useState<Role>('adulto');
  const [activeInvitation, setActiveInvitation] = useState<Invitation | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const deepLink = activeInvitation
    ? `familyhub://join?token=${activeInvitation.token}`
    : null;

  const loadPending = useCallback(async () => {
    setLoadingList(true);
    const { invitations } = await getPendingInvitations(householdId);
    setPendingInvitations(invitations);
    setLoadingList(false);
  }, [householdId]);

  useEffect(() => { void loadPending(); }, [loadPending]);

  const handleGenerate = async () => {
    if (!user) return;
    setLoadingCreate(true);
    const { invitation, error } = await createInvitation(householdId, selectedRole, user.id);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setActiveInvitation(invitation);
      await loadPending();
    }
    setLoadingCreate(false);
  };

  const handleShare = async () => {
    if (!deepLink) return;
    await Share.share({
      message: `Te invito a unirte a mi familia en FamilyHub 🏠\n\nAbre este enlace: ${deepLink}`,
      title: 'Invitación FamilyHub',
    });
  };

  const handleRevoke = async (invId: string) => {
    Alert.alert('Revocar invitación', '¿Estás seguro de que querés cancelar esta invitación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revocar',
        style: 'destructive',
        onPress: async () => {
          await revokeInvitation(invId);
          if (activeInvitation?.id === invId) setActiveInvitation(null);
          await loadPending();
        },
      },
    ]);
  };

  const handleContinue = async () => {
    await reload();
    navigation.navigate('HomeTabs');
  };

  const expiresLabel = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    if (diff <= 0) return 'Expirada';
    if (hours > 0) return `Expira en ${hours}h ${minutes}m`;
    return `Expira en ${minutes} min`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} bounces={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Invitar personas 🙌</Text>
        <Text style={styles.subtitle}>
          Generá un código QR o un enlace para que alguien se una a tu hogar.
        </Text>
      </View>

      {/* Role selector */}
      <Text style={styles.sectionLabel}>Rol del invitado</Text>
      <View style={styles.roleList}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.roleCard, selectedRole === r.id && styles.roleCardSelected]}
            onPress={() => setSelectedRole(r.id)}
          >
            <Text style={styles.roleIcon}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleLabel}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.description}</Text>
            </View>
            {selectedRole === r.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.generateBtn, loadingCreate && styles.buttonDisabled]}
        onPress={() => void handleGenerate()}
        disabled={loadingCreate}
        accessibilityRole="button"
        accessibilityLabel="Generar invitación"
      >
        {loadingCreate
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={styles.generateBtnText}>Generar invitación</Text>
        }
      </TouchableOpacity>

      {/* QR + share */}
      {activeInvitation && deepLink && (
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Invitación generada</Text>
          <Text style={styles.qrSubtitle}>{expiresLabel(activeInvitation.expires_at)}</Text>
          <View style={styles.qrContainer}>
            <QRCode value={deepLink} size={180} backgroundColor="#FFFFFF" color="#1C1C1C" />
          </View>
          <Text style={styles.tokenText} selectable>{deepLink}</Text>
          <View style={styles.qrActions}>
            <TouchableOpacity style={styles.shareBtn} onPress={() => void handleShare()}>
              <Text style={styles.shareBtnText}>Compartir enlace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.revokeBtn}
              onPress={() => void handleRevoke(activeInvitation.id)}
            >
              <Text style={styles.revokeBtnText}>Revocar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pending invitations list */}
      {pendingInvitations.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Invitaciones pendientes</Text>
          {loadingList
            ? <ActivityIndicator color="#CD7353" style={{ marginVertical: 16 }} />
            : pendingInvitations.map((inv) => (
                <View key={inv.id} style={styles.pendingCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingRole}>{inv.rol_asignado}</Text>
                    <Text style={styles.pendingExpiry}>{expiresLabel(inv.expires_at)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => void handleRevoke(inv.id)}>
                    <Text style={styles.revokeSmall}>Revocar</Text>
                  </TouchableOpacity>
                </View>
              ))
          }
        </>
      )}

      {/* Skip + continue */}
      <TouchableOpacity style={styles.continueBtn} onPress={() => void handleContinue()}>
        <Text style={styles.continueBtnText}>Continuar al hogar →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} onPress={() => void handleContinue()}>
        <Text style={styles.skipText}>Invitar más tarde</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 32, marginTop: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B6B6B', lineHeight: 22 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6B6B6B', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  roleList: { gap: 10, marginBottom: 24 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2DFD6',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  roleCardSelected: { borderColor: '#CD7353', backgroundColor: '#FDF3EE' },
  roleIcon: { fontSize: 28 },
  roleLabel: { fontSize: 16, fontWeight: '600', color: '#1C1C1C' },
  roleDesc: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  checkmark: { fontSize: 18, color: '#CD7353', fontWeight: '700' },
  generateBtn: {
    backgroundColor: '#CD7353',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 52,
    justifyContent: 'center',
  },
  generateBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E2DFD6',
  },
  qrTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1C', marginBottom: 4 },
  qrSubtitle: { fontSize: 13, color: '#CD7353', marginBottom: 20 },
  qrContainer: { padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16 },
  tokenText: { fontSize: 11, color: '#6B6B6B', textAlign: 'center', marginBottom: 20, paddingHorizontal: 8 },
  qrActions: { flexDirection: 'row', gap: 12 },
  shareBtn: { flex: 1, backgroundColor: '#CD7353', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  shareBtnText: { color: '#FFFFFF', fontWeight: '600' },
  revokeBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E2DFD6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  revokeBtnText: { color: '#6B6B6B', fontWeight: '500' },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2DFD6',
  },
  pendingRole: { fontSize: 14, fontWeight: '600', color: '#1C1C1C', textTransform: 'capitalize' },
  pendingExpiry: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  revokeSmall: { fontSize: 13, color: '#B6472C', fontWeight: '500' },
  continueBtn: {
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  skipBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  skipText: { color: '#6B6B6B', fontSize: 14 },
});
