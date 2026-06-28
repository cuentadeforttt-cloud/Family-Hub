import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { HomePlusIcon } from '../constants/icons';
import { colors } from '../constants/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROL_DISPLAY: Record<string, string> = {
  coordinador: 'Coordinador del hogar',
  adulto: 'Adulto',
  adolescente: 'Adolescente',
  adulto_mayor: 'Adulto mayor',
};

const ROL_COLORS: Record<string, string> = {
  coordinador: '#CD7353',
  adulto: '#7C9E7A',
  adolescente: '#6B4FE8',
  adulto_mayor: '#D4975A',
};

const AVATAR_BG_COLORS = ['#CD7353', '#6B4FE8', '#7C9E7A', '#D4975A', '#E57373', '#64B5F6'];

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
}

function formatMemberSince(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────
export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const { currentHousehold, currentRole, isCoordinator, members } = useHousehold();

  // Settings toggles (UI only — not persisted yet)
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [inviteTab, setInviteTab] = useState<'admin' | 'miembros'>('admin');

  const myName = user?.user_metadata?.nombre ?? 'Usuario';
  const myInitials = getInitials(myName);
  const myAvatarColor = getAvatarColor(myName);
  const myEmail = user?.email ?? '—';
  const memberSince = user?.created_at ? formatMemberSince(user.created_at) : '—';

  const accentColor = ROL_COLORS[currentRole ?? ''] ?? '#CD7353';
  const rolLabel = ROL_DISPLAY[currentRole ?? ''] ?? (currentRole ?? '—');

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => void signOut() },
      ],
    );
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView
        style={S.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Header bar ──────────────────────────────────────────────── */}
        <View style={S.headerBar}>
          <Text style={S.headerTitle}>Mi Perfil</Text>
          {currentHousehold && (
            <View style={S.grupoChip}>
              <Text style={S.grupoChipText}>🏠 {currentHousehold.nombre}</Text>
            </View>
          )}
        </View>

        {/* ── Avatar + identity ───────────────────────────────────────── */}
        <View style={S.avatarSection}>
          <View style={[S.avatarCircle, { backgroundColor: myAvatarColor }]}>
            <Text style={S.avatarText}>{myInitials}</Text>
          </View>
          <Text style={S.userName}>{myName}</Text>
          <View style={[S.roleBadge, { backgroundColor: accentColor + '18' }]}>
            <Text style={[S.roleBadgeText, { color: accentColor }]}>{rolLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Editar perfil', 'Próximamente.')}>
            <Text style={[S.editProfileLink, { color: accentColor }]}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <View style={S.statsRow}>
          {[
            { value: '147', label: 'Actividades' },
            { value: '38',  label: 'Racha' },
            { value: '12',  label: 'Logros' },
          ].map((stat, i) => (
            <React.Fragment key={stat.label}>
              <View style={S.statItem}>
                <Text style={[S.statValue, { color: accentColor }]}>{stat.value}</Text>
                <Text style={S.statLabel}>{stat.label}</Text>
              </View>
              {i < 2 && <View style={S.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Info cards ──────────────────────────────────────────────── */}
        <View style={S.section}>
          <InfoRow icon={<HomePlusIcon name="mail" size={20} color="#888888" />} label="Email" value={myEmail} />
          <InfoRow icon={<HomePlusIcon name="calendar" size={20} color="#888888" />} label="Miembro desde" value={memberSince} />
          {currentHousehold && (
            <InfoRow icon={<HomePlusIcon name="home" size={20} color="#888888" />} label="Hogar" value={currentHousehold.nombre} />
          )}
        </View>

        {/* ── Mi familia ──────────────────────────────────────────────── */}
        <View style={S.sectionHeader}>
          <View style={S.sectionTitleRow}>
            <HomePlusIcon name="people" size={20} color={accentColor} />
            <Text style={S.sectionTitle}>Mi familia</Text>
          </View>
          <Text style={S.sectionCount}>{members.length} miembros</Text>
        </View>
        <View style={S.section}>
          {members.length === 0 ? (
            <Text style={S.emptyText}>No hay miembros en el hogar aún.</Text>
          ) : (
            members.map(m => {
              const mName = m.user?.nombre ?? 'Miembro';
              const mInitials = getInitials(mName);
              const mColor = getAvatarColor(mName);
              const mRolColor = ROL_COLORS[m.rol] ?? '#888888';
              return (
                <View key={m.id} style={S.memberRow}>
                  <View style={[S.memberAvatar, { backgroundColor: mColor }]}>
                    <Text style={S.memberAvatarText}>{mInitials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.memberName}>{mName}</Text>
                    <Text style={[S.memberRole, { color: mRolColor }]}>
                      {ROL_DISPLAY[m.rol] ?? m.rol}
                    </Text>
                  </View>
                  {m.user_id === user?.id && (
                    <View style={[S.youBadge, { backgroundColor: accentColor + '18' }]}>
                      <Text style={[S.youBadgeText, { color: accentColor }]}>Tú</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── Configuración ───────────────────────────────────────────── */}
        <View style={S.sectionHeader}>
          <View style={S.sectionTitleRow}>
            <HomePlusIcon name="settings" size={20} color={accentColor} />
            <Text style={S.sectionTitle}>Configuración</Text>
          </View>
        </View>
        <View style={S.section}>
          <View style={S.settingRow}>
            <HomePlusIcon name="notifications" size={22} color="#888888" />
            <View style={{ flex: 1 }}>
              <Text style={S.settingLabel}>Notificaciones</Text>
              <Text style={S.settingDesc}>Alertas del hogar y eventos</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: '#E2DFD6', true: accentColor }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[S.settingRow, S.settingRowBorder]}>
            <HomePlusIcon name="shield-checkmark" size={22} color="#888888" />
            <View style={{ flex: 1 }}>
              <Text style={S.settingLabel}>Privacidad y seguridad</Text>
              <Text style={S.settingDesc}>Datos y contraseña</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Privacidad', 'Próximamente.')}>
              <Text style={S.chevron}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={[S.settingRow, S.settingRowBorder]}>
            <HomePlusIcon name="color-palette" size={22} color="#888888" />
            <View style={{ flex: 1 }}>
              <Text style={S.settingLabel}>Apariencia</Text>
              <Text style={S.settingDesc}>Tema y preferencias</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Apariencia', 'Próximamente.')}>
              <Text style={S.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Área de invitación (solo coordinador) ───────────────────── */}
        {isCoordinator && (
          <>
            <View style={S.sectionHeader}>
              <View style={S.sectionTitleRow}>
                <HomePlusIcon name="person-add" size={20} color={accentColor} />
                <Text style={S.sectionTitle}>Área de invitación</Text>
              </View>
            </View>
            <View style={S.section}>
              {/* Admin / Miembros toggle */}
              <View style={S.inviteToggle}>
                <TouchableOpacity
                  style={[S.inviteTabBtn, inviteTab === 'admin' && S.inviteTabBtnActive]}
                  onPress={() => setInviteTab('admin')}
                >
                  <Text style={[S.inviteTabText, inviteTab === 'admin' && S.inviteTabTextActive]}>
                    Administradores
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.inviteTabBtn, inviteTab === 'miembros' && S.inviteTabBtnActive]}
                  onPress={() => setInviteTab('miembros')}
                >
                  <Text style={[S.inviteTabText, inviteTab === 'miembros' && S.inviteTabTextActive]}>
                    Miembros ({members.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {inviteTab === 'admin' ? (
                <View style={S.inviteInfoBox}>
                  <Text style={S.inviteInfoText}>
                    👑 Como coordinador puedes gestionar el hogar, invitar nuevos miembros y configurar los permisos de cada integrante.
                  </Text>
                  <TouchableOpacity
                    style={[S.inviteActionBtn, { backgroundColor: accentColor }]}
                    onPress={() => Alert.alert('Invitar', 'Ve a Configuración → Invitar personas para generar un enlace QR.')}
                  >
                    <Text style={S.inviteActionBtnText}>Invitar personas</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {members.map(m => {
                    const mName = m.user?.nombre ?? 'Miembro';
                    const mInitials = getInitials(mName);
                    const mColor = getAvatarColor(mName);
                    return (
                      <View key={m.id} style={S.memberRow}>
                        <View style={[S.memberAvatar, { backgroundColor: mColor }]}>
                          <Text style={S.memberAvatarText}>{mInitials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={S.memberName}>{mName}</Text>
                          <Text style={[S.memberRole, { color: ROL_COLORS[m.rol] ?? '#888' }]}>
                            {ROL_DISPLAY[m.rol] ?? m.rol}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Cerrar sesión ───────────────────────────────────────────── */}
        <TouchableOpacity style={S.signOutBtn} onPress={handleSignOut}>
          <Text style={S.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── InfoRow helper ───────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={S.infoRow}>
      <View style={S.infoIconWrapper}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={S.infoLabel}>{label}</Text>
        <Text style={S.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF8' },
  scroll: { flex: 1 },

  // Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1C' },
  grupoChip: {
    backgroundColor: '#F0EDE8',
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  grupoChipText: { fontSize: 12, fontWeight: '600', color: '#888888' },

  // Section headers with icons
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Avatar section
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1C1C1C', marginBottom: 8 },
  roleBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, marginBottom: 10 },
  roleBadgeText: { fontWeight: '700', fontSize: 13 },
  editProfileLink: { fontSize: 13, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2DFD6',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  statDivider: { width: 1, backgroundColor: '#E2DFD6', marginVertical: 4 },

  // Generic section
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2DFD6',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1C1C1C' },
  sectionCount: { fontSize: 13, color: '#888888', fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#888888', textAlign: 'center', padding: 20 },

  // Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
  },
  infoIconWrapper: {
    width: 28, alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: '#888888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1C1C1C', fontWeight: '500' },

  // Member rows
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },
  memberRole: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  youBadge: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8 },
  youBadgeText: { fontSize: 11, fontWeight: '700' },

  // Settings rows
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  settingRowBorder: { borderTopWidth: 1, borderTopColor: '#F0EDE8' },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },
  settingDesc: { fontSize: 12, color: '#888888', marginTop: 1 },
  chevron: { fontSize: 22, color: '#CCCCCC', fontWeight: '600' },

  // Invite area
  inviteToggle: {
    flexDirection: 'row', margin: 14, marginBottom: 10,
    backgroundColor: '#F3F2EE', borderRadius: 10, padding: 3,
  },
  inviteTabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  inviteTabBtnActive: { backgroundColor: '#FFFFFF' },
  inviteTabText: { fontSize: 13, fontWeight: '600', color: '#888888' },
  inviteTabTextActive: { color: '#1C1C1C' },
  inviteInfoBox: { padding: 14, paddingTop: 4 },
  inviteInfoText: { fontSize: 14, color: '#555555', lineHeight: 20, marginBottom: 14 },
  inviteActionBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  inviteActionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Sign out
  signOutBtn: {
    marginHorizontal: 20, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E57373',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
  },
  signOutText: { color: '#E57373', fontWeight: '700', fontSize: 15 },
});
