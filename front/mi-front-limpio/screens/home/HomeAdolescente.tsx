import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { HomePlannerSections } from './HomePlannerSections';

type Task = any;
type CalendarEvent = any;

const MOODS = [
  { emoji: '😴', label: 'Cansada',   ring: '#6B7280' },
  { emoji: '😤', label: 'Enojada',   ring: '#DC2626' },
  { emoji: '😐', label: 'Bien',      ring: '#9CA3AF' },
  { emoji: '😊', label: 'Contenta',  ring: '#F59E0B' },
  { emoji: '🤩', label: '¡Genial!',  ring: '#6B4FE8' },
];

const MOCK_ACTIVITY = [
  { id: '1', avatar: '👨', name: 'Papá',   text: 'completó la compra del mercado 💪' },
  { id: '2', avatar: '👩', name: 'Mamá',   text: 'agregó: Cena especial el sábado 🎉' },
  { id: '3', avatar: '📷', name: 'Familia', text: 'Nueva foto familiar subida' },
];

const MOCK_CHALLENGE = {
  title: '30 min sin pantallas en familia',
  members: [
    { name: 'Yo',   avatar: '🧒', pct: 70 },
    { name: 'Mamá', avatar: '👩', pct: 85 },
    { name: 'Papá', avatar: '👨', pct: 50 },
    { name: 'Ana',  avatar: '👧', pct: 90 },
  ],
};

const XP_BY_PRIORITY: Record<Task['priority'], number> = { alta: 80, media: 50, baja: 30 };
const STARS_BY_PRIORITY: Record<Task['priority'], number> = { alta: 3, media: 2, baja: 1 };
const CATEGORY_EMOJI: Record<string, string> = {
  trabajo: '💼', escuela: '📚', familia: '🏠', personal: '🎯',
  salud: '💊', deporte: '⚽', otro: '⭐',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const HomeAdolescente = () => {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [mood, setMood] = useState(3);
  const [xp] = useState(280);
  const [streak] = useState(7);
  const MAX_XP = 400;

  const firstName = user?.user_metadata?.nombre?.split(' ')[0] ?? 'Tú';

  const earnedXp = tasks
    .filter(t => completedIds.has(t.id))
    .reduce((s, t) => s + XP_BY_PRIORITY[t.priority], 0);
  const totalXp = xp + earnedXp;

  const fetchData = useCallback(async () => {
    if (!currentHousehold || !user) return;
    setDataLoading(true);
    setTasks([]);
    setTodayEvents([]);
    setDataLoading(false);
  }, [currentHousehold, user]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const completeQuest = async (id: string) => {
    if (completedIds.has(id)) return;
    setCompletedIds(prev => new Set([...prev, id]));
  };

  const currentMood = MOODS[mood];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero gradient header */}
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.greeting}>¡Hola, {firstName}! 👋</Text>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>Nivel 4 · {totalXp}/{MAX_XP} XP</Text>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${Math.min(100, (totalXp / MAX_XP) * 100)}%` as any }]} />
              </View>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak} días</Text>
          </View>
        </View>

        <HomePlannerSections variant="dark" />

        {/* Mood ring */}
        <View style={styles.moodCard}>
          <View style={[styles.moodRing, { borderColor: currentMood.ring, shadowColor: currentMood.ring }]}>
            <Text style={styles.moodEmoji}>{currentMood.emoji}</Text>
          </View>
          <Text style={styles.moodLabel}>{currentMood.label}</Text>
          <Text style={styles.moodHint}>¿Cómo estás hoy? Toca para cambiar</Text>
          <View style={styles.moodOptions}>
            {MOODS.map((m, i) => (
              <TouchableOpacity key={i} onPress={() => setMood(i)} style={[styles.moodBtn, mood === i && { transform: [{ scale: 1.3 }] }]}>
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {false ? (
          <>
        {/* Quests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚔️ Misiones de hoy</Text>
        </View>
        {dataLoading ? (
          <ActivityIndicator color={C.violet} style={{ marginVertical: 12 }} />
        ) : tasks.length === 0 ? (
          <View style={styles.questCard}>
            <Text style={{ color: C.textMuted, fontSize: 14, textAlign: 'center' }}>
              Sin misiones pendientes 🎉
            </Text>
          </View>
        ) : tasks.map((t, idx) => {
          const done = completedIds.has(t.id);
          const isBonus = idx === 0 && tasks.length > 1;
          const stars = STARS_BY_PRIORITY[t.priority];
          const questXp = XP_BY_PRIORITY[t.priority];
          const emoji = CATEGORY_EMOJI['personal'];
          return (
            <View key={t.id} style={[styles.questCard, isBonus && styles.questBonus, done && styles.questDone]}>
              {isBonus && <Text style={styles.bonusLabel}>MISIÓN BONUS 🌟</Text>}
              <View style={styles.questRow}>
                <Text style={styles.questEmoji}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.questTitle, done && styles.strikethru]}>{t.title}</Text>
                  <View style={styles.questMeta}>
                    <Text style={styles.questStars}>{'⭐'.repeat(stars)}</Text>
                  </View>
                </View>
                <View style={styles.questRight}>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpBadgeText}>+{questXp} XP</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.questCheck, done && styles.questCheckDone]}
                    onPress={() => !done && void completeQuest(t.id)}
                  >
                    <Text style={{ fontSize: 14, color: done ? '#FFF' : 'transparent' }}>✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* Schedule */}
        <Text style={styles.sectionTitle}>📅 Mi agenda de hoy</Text>
        {dataLoading ? (
          <ActivityIndicator color={C.violet} style={{ marginVertical: 8 }} />
        ) : (
          <View style={styles.scheduleCard}>
            {todayEvents.length === 0 ? (
              <Text style={{ color: C.textMuted, fontSize: 13, paddingVertical: 8 }}>Sin eventos hoy ✨</Text>
            ) : todayEvents.map((item, idx) => (
              <View key={item.id} style={[styles.scheduleRow, idx < todayEvents.length - 1 && styles.scheduleRowBorder]}>
                <Text style={{ fontSize: 22 }}>📌</Text>
                <Text style={styles.scheduleTime}>{formatTime(item.start_at)}</Text>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
              </View>
            ))}
          </View>
        )}

          </>
        ) : null}

        {/* Family activity */}
        <Text style={styles.sectionTitle}>👨‍👩‍👧 En la familia</Text>
        <View style={styles.scheduleCard}>
          {MOCK_ACTIVITY.map((a, idx) => (
            <View key={a.id} style={[styles.activityRow, idx < MOCK_ACTIVITY.length - 1 && styles.scheduleRowBorder]}>
              <Text style={{ fontSize: 26 }}>{a.avatar}</Text>
              <Text style={styles.activityText}>
                <Text style={styles.activityName}>{a.name}</Text> {a.text}
              </Text>
              <TouchableOpacity style={styles.reactBtn}>
                <Text style={{ fontSize: 16 }}>➕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Family challenge */}
        <View style={styles.challengeCard}>
          <Text style={styles.challengeLabel}>🏆 DESAFÍO FAMILIAR · SEMANA</Text>
          <Text style={styles.challengeTitle}>{MOCK_CHALLENGE.title}</Text>
          <View style={styles.challengeMembers}>
            {MOCK_CHALLENGE.members.map(m => (
              <View key={m.name} style={styles.challengeMember}>
                <Text style={{ fontSize: 26 }}>{m.avatar}</Text>
                <View style={styles.challengeBarBg}>
                  <View style={[styles.challengeBarFill, { width: `${m.pct}%` as any }]} />
                </View>
                <Text style={styles.challengePct}>{m.pct}%</Text>
              </View>
            ))}
          </View>
          <View style={styles.groupBarBg}>
            <View style={[styles.groupBarFill, { width: '74%' }]} />
          </View>
          <Text style={styles.challengeMotivation}>¡Casi llegan! 🔥 74% grupal</Text>
        </View>

        {/* Private space */}
        <TouchableOpacity style={styles.privateCard}>
          <Text style={styles.lockIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.privateTitle}>Mi espacio privado</Text>
            <Text style={styles.privateSubtitle}>Próximamente</Text>
          </View>
          <Text style={styles.privateArrow}>›</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: 'rgba(107,79,232,0.2)',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  violet: '#6B4FE8',
  primary: '#CD7353',
  gold: '#D4A853',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  heroHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: C.violet,
    marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 20,
    paddingTop: 16, marginBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  heroContent: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 10 },
  xpRow: { gap: 4 },
  xpLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  xpBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: 8, backgroundColor: '#FFFFFF', borderRadius: 4 },
  streakBadge: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  moodCard: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  moodRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  moodEmoji: { fontSize: 44 },
  moodLabel: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  moodHint: { fontSize: 12, color: C.textMuted, marginBottom: 12 },
  moodOptions: { flexDirection: 'row', gap: 12 },
  moodBtn: { padding: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

  questCard: { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.violet },
  questBonus: { borderColor: C.gold + '80', borderLeftColor: C.gold },
  questDone: { opacity: 0.5 },
  bonusLabel: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 0.8, marginBottom: 6 },
  questRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questEmoji: { fontSize: 28 },
  questTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  strikethru: { textDecorationLine: 'line-through', color: C.textMuted },
  questMeta: { flexDirection: 'row', alignItems: 'center' },
  questStars: { fontSize: 12 },
  questRight: { alignItems: 'center', gap: 6 },
  xpBadge: { backgroundColor: C.gold + '33', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  xpBadgeText: { fontSize: 11, fontWeight: '800', color: C.gold },
  questCheck: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.violet, alignItems: 'center', justifyContent: 'center' },
  questCheckDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },

  scheduleCard: { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  scheduleRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  scheduleTime: { fontSize: 13, color: C.textMuted, fontWeight: '600', width: 44 },
  scheduleTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  activityName: { fontWeight: '700', color: C.text },
  activityText: { flex: 1, fontSize: 13, color: C.textMuted, lineHeight: 18 },
  reactBtn: { padding: 4 },

  challengeCard: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1.5, borderTopColor: C.violet, borderColor: C.border },
  challengeLabel: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 0.8, marginBottom: 6 },
  challengeTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 14 },
  challengeMembers: { gap: 8, marginBottom: 12 },
  challengeMember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  challengeBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  challengeBarFill: { height: 6, backgroundColor: C.violet, borderRadius: 3 },
  challengePct: { fontSize: 11, color: C.textMuted, width: 32, textAlign: 'right' },
  groupBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  groupBarFill: { height: 8, backgroundColor: C.gold, borderRadius: 4 },
  challengeMotivation: { fontSize: 13, color: C.gold, fontWeight: '600', textAlign: 'center' },

  privateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border, gap: 10 },
  lockIcon: { fontSize: 22 },
  privateTitle: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  privateSubtitle: { fontSize: 12, color: C.textMuted + '88', marginTop: 2 },
  privateArrow: { fontSize: 22, color: C.textMuted },
});
