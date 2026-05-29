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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { getHouseholdTasks, completeTask as completeTaskService, type Task } from '../../services/tasks';
import { getTodayEvents, type CalendarEvent } from '../../services/events';
import type { PrivateStackParamList } from '../../navigation/types';

const PRIORITY_COLORS = { alta: '#DC2626', media: '#F59E0B', baja: '#22C55E' } as const;

const ROL_EMOJI: Record<string, string> = {
  coordinador: '👑', adulto: '👤', adolescente: '🎮', adulto_mayor: '🌟',
};

const CATEGORY_COLORS: Record<string, string> = {
  trabajo: '#6B4FE8', escuela: '#7C9E7A', familia: '#D4A853',
  personal: '#CD7353', salud: '#CD7353', deporte: '#7C9E7A', otro: '#888888',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FamilyPulse() {
  const { members } = useHousehold();

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabelSmall}>FAMILIA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
        {members.length === 0 ? (
          <Text style={styles.textMuted}>Sin miembros aún</Text>
        ) : members.map(m => (
          <View key={m.id} style={styles.memberItem}>
            <View style={[styles.memberAvatarRing, { borderColor: C.primary }]}>
              <Text style={styles.memberEmoji}>{ROL_EMOJI[m.rol] ?? '👤'}</Text>
            </View>
            <Text style={styles.memberName}>{m.user?.nombre?.split(' ')[0] ?? 'Miembro'}</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.memberStatus}>
        {members.length} miembro{members.length !== 1 ? 's' : ''} en el hogar
      </Text>
    </View>
  );
}

function DailyBriefing({ eventCount, taskCount }: { eventCount: number; taskCount: number }) {
  const hour = new Date().getHours();
  const progress = Math.max(0, Math.min(100, Math.round(((hour - 6) / 16) * 100)));

  return (
    <View style={[styles.card, styles.briefingCard]}>
      <View style={styles.briefingHeader}>
        <Text style={styles.briefingIcon}>✨</Text>
        <Text style={styles.cardLabelSmall}>RESUMEN DE HOY</Text>
      </View>
      <View style={styles.briefingRow}>
        <Text style={styles.briefingItem}>📅  {eventCount} evento{eventCount !== 1 ? 's' : ''} familiares</Text>
      </View>
      <View style={styles.briefingRow}>
        <Text style={styles.briefingItem}>✅  {taskCount} tarea{taskCount !== 1 ? 's' : ''} pendiente{taskCount !== 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.progressRow}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{progress}% del día</Text>
      </View>
    </View>
  );
}

function QuickActions({ householdId }: { householdId: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<PrivateStackParamList>>();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
      <TouchableOpacity style={[styles.actionPill, { backgroundColor: 'transparent', borderColor: C.primary }]} accessibilityRole="button">
        <Text style={styles.actionText}>+ Tarea</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionPill, { backgroundColor: 'transparent', borderColor: C.primary }]} accessibilityRole="button">
        <Text style={styles.actionText}>+ Evento</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionPill, { backgroundColor: 'transparent', borderColor: C.primary }]}
        accessibilityRole="button"
        onPress={() => navigation.navigate('P03InvitarPersonas', { householdId })}
      >
        <Text style={styles.actionText}>Invitar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionPill, styles.sosBtn]} accessibilityRole="button">
        <Text style={[styles.actionText, { color: '#FFFFFF' }]}>🚨 SOS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Timeline({ events, loading }: { events: CalendarEvent[]; loading: boolean }) {
  const now = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

  return (
    <View>
      <Text style={styles.sectionTitle}>Hoy en familia</Text>
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} />
      ) : events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sin eventos programados para hoy ✨</Text>
        </View>
      ) : events.map((event, idx) => {
        const time = formatTime(event.start_at);
        const isPast = time < now;
        const color = event.color || CATEGORY_COLORS[event.category] || C.primary;
        return (
          <View key={event.id} style={styles.timelineRow}>
            <Text style={[styles.timelineTime, isPast && styles.muted]}>{time}</Text>
            <View style={styles.timelineDot}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              {idx < events.length - 1 && <View style={[styles.dotLine, { backgroundColor: color + '40' }]} />}
            </View>
            <View style={[styles.timelineCard, isPast && styles.timelineCardPast]}>
              <Text style={[styles.timelineTitle, isPast && styles.muted]}>{event.title}</Text>
              <View style={styles.timelineMeta}>
                <View style={[styles.categoryTag, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.categoryText, { color }]}>{event.category}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PendingTasks({
  tasks,
  loading,
  onComplete,
}: {
  tasks: Task[];
  loading: boolean;
  onComplete: (id: string) => void;
}) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tareas pendientes</Text>
        {tasks.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tasks.length}</Text>
          </View>
        )}
      </View>
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginVertical: 8 }} />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sin tareas pendientes 🎉</Text>
        </View>
      ) : tasks.map(t => (
        <View key={t.id} style={styles.taskCard}>
          <TouchableOpacity onPress={() => onComplete(t.id)} style={styles.taskCheck}>
            <View style={styles.taskCheckCircle} />
          </TouchableOpacity>
          <Text style={styles.taskTitle}>{t.title}</Text>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[t.priority] }]} />
        </View>
      ))}
    </View>
  );
}

function BudgetCard() {
  return (
    <View style={[styles.card, styles.budgetCard]}>
      <View style={styles.budgetLeft}>
        <Text style={styles.budgetPct}>72%</Text>
        <Text style={styles.budgetLabel}>del presupuesto{'\n'}mensual usado</Text>
      </View>
      <View style={styles.budgetRight}>
        <Text style={styles.budgetAmount}>$3.200</Text>
        <Text style={styles.budgetRemaining}>restantes</Text>
        <TouchableOpacity style={styles.addExpenseBtn}>
          <Text style={styles.addExpenseText}>+ Gasto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export const HomeCoordinador = () => {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.user_metadata?.nombre?.split(' ')[0] ?? 'Coordinador';

  const fetchData = useCallback(async () => {
    if (!currentHousehold) return;
    setDataLoading(true);
    const [evResult, taskResult] = await Promise.all([
      getTodayEvents(currentHousehold.id),
      getHouseholdTasks(currentHousehold.id, 'pendiente'),
    ]);
    setTodayEvents(evResult.events);
    setPendingTasks(taskResult.tasks);
    setDataLoading(false);
  }, [currentHousehold]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleCompleteTask = async (taskId: string) => {
    await completeTaskService(taskId);
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName}</Text>
            <Text style={styles.dateLabel}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={styles.notifBell}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </View>
        </View>

        {currentHousehold && (
          <Text style={styles.householdName}>🏠 {currentHousehold.nombre}</Text>
        )}

        <FamilyPulse />
        <DailyBriefing eventCount={todayEvents.length} taskCount={pendingTasks.length} />
        {currentHousehold && <QuickActions householdId={currentHousehold.id} />}
        <Timeline events={todayEvents} loading={dataLoading} />
        <View style={{ height: 20 }} />
        <PendingTasks tasks={pendingTasks} loading={dataLoading} onComplete={id => void handleCompleteTask(id)} />
        <View style={{ height: 20 }} />
        <BudgetCard />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#1C2128',
  border: 'rgba(205,115,83,0.15)',
  text: '#FFFFFF',
  textMuted: '#888888',
  textDim: '#C8C8C8',
  primary: '#CD7353',
  amber: '#F59E0B',
  red: '#DC2626',
  green: '#22C55E',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8, marginBottom: 6 },
  greeting: { fontSize: 26, fontWeight: '700', color: C.text },
  dateLabel: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  notifBell: { paddingTop: 4 },
  householdName: { fontSize: 13, color: C.primary, marginBottom: 16 },

  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardLabelSmall: { fontSize: 11, letterSpacing: 0.8, color: C.textMuted, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  textMuted: { color: C.textMuted, fontSize: 13 },

  memberScroll: { marginBottom: 10 },
  memberItem: { alignItems: 'center', marginRight: 16, minWidth: 52 },
  memberAvatarRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  memberEmoji: { fontSize: 28 },
  memberName: { fontSize: 11, color: C.textDim, fontWeight: '500' },
  memberStatus: { fontSize: 12, color: C.textMuted },

  briefingCard: { backgroundColor: C.surface2 },
  briefingHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  briefingIcon: { fontSize: 14 },
  briefingRow: { marginBottom: 8 },
  briefingItem: { fontSize: 14, color: C.textDim, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  progressBg: { flex: 1, height: 6, backgroundColor: '#2D3748', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: C.textMuted, width: 70 },

  actionsScroll: { marginBottom: 14, marginHorizontal: -4 },
  actionPill: { borderWidth: 1.5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 4 },
  sosBtn: { backgroundColor: C.red },
  actionText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  badge: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: C.textMuted, fontSize: 14 },

  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineTime: { width: 46, fontSize: 12, color: C.textMuted, paddingTop: 14, fontWeight: '600' },
  timelineDot: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 14 },
  dotLine: { width: 2, flex: 1, minHeight: 40, marginTop: 2 },
  timelineCard: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 12, marginLeft: 8, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  timelineCardPast: { opacity: 0.5 },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 4 },
  timelineMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  categoryText: { fontSize: 10, fontWeight: '600' },
  muted: { color: C.textMuted + 'AA', opacity: 0.6 },

  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  taskCheck: { marginRight: 12 },
  taskCheckCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.textMuted },
  taskTitle: { flex: 1, fontSize: 15, color: C.text },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },

  budgetCard: { flexDirection: 'row', alignItems: 'center' },
  budgetLeft: { flex: 1 },
  budgetPct: { fontSize: 36, fontWeight: '800', color: C.primary },
  budgetLabel: { fontSize: 12, color: C.textMuted, lineHeight: 18, marginTop: 2 },
  budgetRight: { alignItems: 'flex-end' },
  budgetAmount: { fontSize: 22, fontWeight: '700', color: C.text },
  budgetRemaining: { fontSize: 12, color: C.textMuted },
  addExpenseBtn: { marginTop: 8, borderWidth: 1, borderColor: C.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  addExpenseText: { color: C.primary, fontSize: 12, fontWeight: '600' },
});
