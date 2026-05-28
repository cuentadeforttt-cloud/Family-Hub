import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';

type RoleTheme = {
  bg: string; surface: string; text: string; textMuted: string;
  primary: string; border: string; label: string;
  fs: number; touch: number;
};

function getRoleTheme(role: string | null): RoleTheme {
  switch (role) {
    case 'adulto':
      return { bg: '#FAFAF8', surface: '#FFFFFF', text: '#1C1C1C', textMuted: '#6B6B6B',
               primary: '#CD7353', border: '#E2DFD6', label: '#6B6B6B', fs: 1.0, touch: 44 };
    case 'adolescente':
      return { bg: '#0F172A', surface: '#1E293B', text: '#FFFFFF', textMuted: '#94A3B8',
               primary: '#6B4FE8', border: 'rgba(107,79,232,0.2)', label: '#94A3B8', fs: 1.0, touch: 44 };
    case 'adulto_mayor':
      return { bg: '#FFFAF5', surface: '#FFFFFF', text: '#1A1A1A', textMuted: '#555555',
               primary: '#D4975A', border: 'rgba(212,151,90,0.25)', label: '#555555', fs: 1.2, touch: 56 };
    default: // coordinador
      return { bg: '#FAFAF8', surface: '#FFFFFF', text: '#1C1C1C', textMuted: '#6B6B6B',
               primary: '#CD7353', border: '#E2DFD6', label: '#6B6B6B', fs: 1.0, touch: 44 };
  }
}

const ROL_DISPLAY: Record<string, string> = {
  coordinador: 'Coordinador 👑', adulto: 'Adulto', adolescente: 'Adolescente', adulto_mayor: 'Adulto mayor',
};

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const { currentHousehold, currentRole, isCoordinator } = useHousehold();

  const T = useMemo(() => getRoleTheme(currentRole), [currentRole]);
  const S = useMemo(() => getStyles(T), [T]);
  const f = (size: number) => Math.round(size * T.fs);

  const isAdultoMayor = currentRole === 'adulto_mayor';
  const isAdolescente = currentRole === 'adolescente';

  const handleSignOut = async () => { await signOut(); };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
        {/* Header / Avatar area */}
        <View style={S.avatarSection}>
          <View style={[S.avatarCircle, { backgroundColor: T.primary + '22', borderColor: T.primary, width: f(72), height: f(72), borderRadius: f(36) }]}>
            <Text style={{ fontSize: f(32) }}>{isAdolescente ? '🎮' : isAdultoMayor ? '🌟' : isCoordinator ? '👑' : '👤'}</Text>
          </View>
          <Text style={[S.userName, { fontSize: f(22) }]}>
            {user?.user_metadata?.nombre ?? 'Usuario'}
          </Text>
          <View style={[S.roleBadge, { backgroundColor: T.primary + '18' }]}>
            <Text style={[S.roleBadgeText, { fontSize: f(13), color: T.primary }]}>
              {ROL_DISPLAY[currentRole ?? ''] ?? (currentRole ?? '—')}
            </Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={[S.infoCard, { minHeight: T.touch }]}>
          <Text style={[S.infoLabel, { fontSize: f(11) }]}>Nombre</Text>
          <Text style={[S.infoValue, { fontSize: f(16) }]}>{user?.user_metadata?.nombre ?? '—'}</Text>
        </View>
        <View style={[S.infoCard, { minHeight: T.touch }]}>
          <Text style={[S.infoLabel, { fontSize: f(11) }]}>Email</Text>
          <Text style={[S.infoValue, { fontSize: f(16) }]}>{user?.email ?? '—'}</Text>
        </View>
        <View style={[S.infoCard, { minHeight: T.touch }]}>
          <Text style={[S.infoLabel, { fontSize: f(11) }]}>Hogar</Text>
          <Text style={[S.infoValue, { fontSize: f(16) }]}>{currentHousehold?.nombre ?? '—'}</Text>
        </View>
        <View style={[S.infoCard, { minHeight: T.touch }]}>
          <Text style={[S.infoLabel, { fontSize: f(11) }]}>Rol</Text>
          <Text style={[S.infoValue, { fontSize: f(16) }]}>
            {ROL_DISPLAY[currentRole ?? ''] ?? (currentRole ?? '—')}
          </Text>
        </View>

        {/* Adulto mayor: accessibility note */}
        {isAdultoMayor && (
          <View style={[S.infoCard, { backgroundColor: T.primary + '12', borderColor: T.primary + '40' }]}>
            <Text style={{ fontSize: f(15), color: T.text, lineHeight: f(22) }}>
              🔒 Tu sesión está protegida. Para cambiar tu contraseña, pídele ayuda a un familiar.
            </Text>
          </View>
        )}

        {/* Sign out button */}
        <TouchableOpacity
          style={[S.signOutBtn, { minHeight: T.touch + 10 }]}
          onPress={() => void handleSignOut()}
          accessibilityRole="button"
        >
          <Text style={[S.signOutText, { fontSize: f(15) }]}>
            {isAdultoMayor ? '🚪 Cerrar sesión' : 'Cerrar sesión'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

function getStyles(T: RoleTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: T.bg },
    container: { flex: 1 },
    content: { padding: 24 },

    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatarCircle: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
    userName: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 8 },
    roleBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14 },
    roleBadgeText: { fontWeight: '700' },

    infoCard: { backgroundColor: T.surface, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: T.border, justifyContent: 'center' },
    infoLabel: { fontSize: 11, color: T.label, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 16, color: T.text, fontWeight: '500' },

    signOutBtn: { marginTop: 24, borderWidth: 1.5, borderColor: T.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    signOutText: { color: T.primary, fontWeight: '700' },
  });
}
