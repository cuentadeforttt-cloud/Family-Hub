import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHousehold } from '../context/HouseholdContext';

type RoleTheme = {
  bg: string; surface: string; text: string; textMuted: string;
  primary: string; border: string; accent: string;
  fs: number; touch: number;
};

function getRoleTheme(role: string | null): RoleTheme {
  switch (role) {
    case 'adulto':
      return { bg: '#FAFAF8', surface: '#FFFFFF', text: '#1C1C1C', textMuted: '#6B6B6B',
               primary: '#CD7353', border: '#E2DFD6', accent: '#7C9E7A', fs: 1.0, touch: 44 };
    case 'adolescente':
      return { bg: '#0F172A', surface: '#1E293B', text: '#FFFFFF', textMuted: '#94A3B8',
               primary: '#6B4FE8', border: 'rgba(107,79,232,0.2)', accent: '#CD7353', fs: 1.0, touch: 44 };
    case 'adulto_mayor':
      return { bg: '#FFFAF5', surface: '#FFFFFF', text: '#1A1A1A', textMuted: '#555555',
               primary: '#D4975A', border: 'rgba(212,151,90,0.25)', accent: '#7C9E7A', fs: 1.2, touch: 56 };
    default: // coordinador
      return { bg: '#FAFAF8', surface: '#FFFFFF', text: '#1C1C1C', textMuted: '#6B6B6B',
               primary: '#CD7353', border: '#E2DFD6', accent: '#CD7353', fs: 1.0, touch: 44 };
  }
}

const ROL_LABELS: Record<string, string> = {
  coordinador: 'Coordinador', adulto: 'Adulto', adolescente: 'Adolescente', adulto_mayor: 'Adulto mayor',
};

const ROL_EMOJI: Record<string, string> = {
  coordinador: '👑', adulto: '👤', adolescente: '🎮', adulto_mayor: '🌟',
};

export const FamilyScreen = () => {
  const { currentHousehold, members, currentRole } = useHousehold();

  const T = useMemo(() => getRoleTheme(currentRole), [currentRole]);
  const S = useMemo(() => getStyles(T), [T]);
  const f = (size: number) => Math.round(size * T.fs);

  const isAdultoMayor = currentRole === 'adulto_mayor';
  const isAdolescente = currentRole === 'adolescente';
  const isCoordinador = currentRole === 'coordinador';

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[S.title, { fontSize: f(isAdultoMayor ? 28 : 24) }]}>
          {isAdultoMayor ? '👨‍👩‍👧 Tu familia' : (isAdolescente ? '👥 Mi familia' : 'Familia')}
        </Text>
        {currentHousehold && (
          <Text style={[S.subtitle, { fontSize: f(14) }]}>{currentHousehold.nombre}</Text>
        )}

        {members.length === 0 && (
          <View style={S.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧</Text>
            <Text style={[S.emptyText, { fontSize: f(16) }]}>
              {isAdultoMayor ? 'Tu familia aparecerá aquí' : 'Aún no hay miembros en el hogar'}
            </Text>
          </View>
        )}

        {isAdultoMayor ? (
          // ── Adulto Mayor: large accessible cards with call button ──────────
          members.map(m => (
            <View key={m.id} style={[S.elderCard, { minHeight: T.touch * 1.4 }]}>
              <View style={[S.elderAvatar, { backgroundColor: T.primary + '22' }]}>
                <Text style={{ fontSize: f(28) }}>{ROL_EMOJI[m.rol] ?? '👤'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: f(20), fontWeight: '700', color: T.text }}>
                  {m.user?.nombre ?? 'Miembro'}
                </Text>
                <Text style={{ fontSize: f(15), color: T.textMuted, marginTop: 2 }}>
                  {ROL_LABELS[m.rol] ?? m.rol}
                </Text>
              </View>
              <TouchableOpacity style={[S.callBtn, { minHeight: T.touch, minWidth: T.touch }]}>
                <Text style={{ fontSize: f(22) }}>📞</Text>
                <Text style={{ fontSize: f(12), color: T.primary, fontWeight: '700', marginTop: 2 }}>Llamar</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : isAdolescente ? (
          // ── Adolescente: dark navy social cards ───────────────────────────
          members.map(m => (
            <View key={m.id} style={S.teenCard}>
              <View style={[S.teenAvatar, { backgroundColor: T.primary + '30' }]}>
                <Text style={{ fontSize: 24 }}>{ROL_EMOJI[m.rol] ?? '👤'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: T.text }}>
                  {m.user?.nombre ?? 'Miembro'}
                </Text>
                <Text style={{ fontSize: 13, color: T.primary, fontWeight: '600', marginTop: 2 }}>
                  {ROL_LABELS[m.rol] ?? m.rol}
                </Text>
              </View>
              <View style={[S.statusDot, { backgroundColor: T.accent }]} />
            </View>
          ))
        ) : (
          // ── Coordinador / Adulto: clean list ──────────────────────────────
          members.map(m => (
            <View key={m.id} style={S.memberRow}>
              <View style={[S.avatar, { backgroundColor: T.primary + '18' }]}>
                <Text style={{ fontSize: 20 }}>{ROL_EMOJI[m.rol] ?? '👤'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[S.memberName, { fontSize: f(16) }]}>{m.user?.nombre ?? 'Miembro'}</Text>
                {isCoordinador && (
                  <Text style={[S.memberRole, { fontSize: f(13) }]}>
                    {ROL_LABELS[m.rol] ?? m.rol}
                  </Text>
                )}
              </View>
              {isCoordinador && m.rol === 'coordinador' && (
                <View style={S.coordinatorBadge}>
                  <Text style={S.coordinatorBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          ))
        )}

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
    title: { fontSize: 24, fontWeight: '800', color: T.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: T.primary, fontWeight: '600', marginBottom: 24 },

    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { color: T.textMuted, textAlign: 'center' },

    // Adulto mayor
    elderCard: { backgroundColor: T.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center' },
    elderAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    callBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },

    // Adolescente
    teenCard: { backgroundColor: T.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center' },
    teenAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },

    // Coordinador / Adulto
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    memberName: { fontSize: 16, fontWeight: '600', color: T.text },
    memberRole: { fontSize: 13, color: T.textMuted, textTransform: 'capitalize', marginTop: 2 },
    coordinatorBadge: { backgroundColor: T.primary + '20', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
    coordinatorBadgeText: { fontSize: 12, color: T.primary, fontWeight: '700' },
  });
}
