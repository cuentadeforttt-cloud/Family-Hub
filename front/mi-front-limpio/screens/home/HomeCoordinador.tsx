import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { ActionPill, AppButton, AppCard, AppScreen, AppText } from '../../components/ui';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { HomePlannerSections } from './HomePlannerSections';

type Task = any;
type CalendarEvent = any;

const PRIORITY_COLORS: Record<string, string> = { alta: colors.danger.base, media: colors.warning.base, baja: colors.success.base };

const ROL_EMOJI: Record<string, string> = {
  coordinador: '👑', adulto: '👤', adolescente: '🎮', adulto_mayor: '🌟',
};

const CATEGORY_COLORS: Record<string, string> = {
  trabajo: colors.info.base, escuela: colors.sage[500], familia: colors.sand[500],
  personal: colors.terracotta[500], salud: colors.success.base, deporte: colors.sage[500], otro: colors.text.muted,
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FamilyPulse() {
  const { members } = useHousehold();

  return (
    <AppCard variant="default" padding="default" style={styles.card}>
      <AppText variant="micro" tone="tertiary" weight="700" style={styles.cardLabelSmall}>FAMILIA</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
        {members.length === 0 ? (
          <AppText variant="bodySmall" tone="tertiary">Sin miembros aun</AppText>
        ) : members.map(m => (
          <View key={m.id} style={styles.memberItem}>
            <View style={[styles.memberAvatarRing, { borderColor: C.primary }]}>
              <Text style={styles.memberEmoji}>{ROL_EMOJI[m.rol] ?? '👤'}</Text>
            </View>
            <AppText variant="micro" tone="secondary" weight="700">{m.user?.nombre?.split(' ')[0] ?? 'Miembro'}</AppText>
          </View>
        ))}
      </ScrollView>
      <AppText variant="caption" tone="tertiary">
        {members.length} miembro{members.length !== 1 ? 's' : ''} en el hogar
      </AppText>
    </AppCard>
  );
}

function DailyBriefing({ eventCount, taskCount }: { eventCount: number; taskCount: number }) {
  const hour = new Date().getHours();
  const progress = Math.max(0, Math.min(100, Math.round(((hour - 6) / 16) * 100)));

  return (
    <AppCard variant="warning" padding="default" style={[styles.card, styles.briefingCard]}>
      <View style={styles.briefingHeader}>
        <Text style={styles.briefingIcon}>✨</Text>
        <AppText variant="micro" tone="warning" weight="700" style={styles.cardLabelSmall}>RESUMEN DE HOY</AppText>
      </View>
      <View style={styles.briefingRow}>
        <AppText variant="bodySmall" tone="secondary" style={styles.briefingItem}>{eventCount} evento{eventCount !== 1 ? 's' : ''} familiares</AppText>
      </View>
      <View style={styles.briefingRow}>
        <AppText variant="bodySmall" tone="secondary" style={styles.briefingItem}>{taskCount} tarea{taskCount !== 1 ? 's' : ''} pendiente{taskCount !== 1 ? 's' : ''}</AppText>
      </View>
      <View style={styles.progressRow}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <AppText variant="micro" tone="tertiary" style={styles.progressLabel}>{progress}% del dia</AppText>
      </View>
    </AppCard>
  );
}

function QuickActions({ householdId }: { householdId: string }) {
  const navigation = useNavigation<any>();

  const openPlanner = (initialTab: 'tasks' | 'calendar', initialSheet: 'task' | 'event') => {
    navigation.navigate('PlannerTab', {
      screen: 'PlannerHome',
      params: { initialTab, initialSheet, sheetKey: Date.now(), refreshKey: Date.now() },
    });
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
      <ActionPill label="Tarea" selected onPress={() => openPlanner('tasks', 'task')} style={styles.actionPill} />
      <ActionPill label="Evento" tone="primary" onPress={() => openPlanner('calendar', 'event')} style={styles.actionPill} />
      <ActionPill label="Invitar" tone="success" onPress={() => navigation.navigate('P03InvitarPersonas', { householdId })} style={styles.actionPill} />
      <TouchableOpacity style={[styles.actionPill, styles.sosBtn]} accessibilityRole="button">
        <AppText variant="micro" tone="inverse" weight="700">SOS</AppText>
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
    <AppCard variant="default" padding="default" style={[styles.card, styles.budgetCard]}>
      <View style={styles.budgetLeft}>
        <AppText variant="title1" tone="warning" style={styles.budgetPct}>72%</AppText>
        <AppText variant="caption" tone="tertiary" style={styles.budgetLabel}>del presupuesto{'\n'}mensual usado</AppText>
      </View>
      <View style={styles.budgetRight}>
        <AppText variant="title3" style={styles.budgetAmount}>$3.200</AppText>
        <AppText variant="caption" tone="tertiary">restantes</AppText>
        <AppButton title="Gasto" variant="secondary" size="sm" style={styles.addExpenseBtn} />
      </View>
    </AppCard>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export const HomeCoordinador = () => {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.user_metadata?.nombre?.split(' ')[0] ?? 'Coordinador';

  return (
    <AppScreen scroll bottomInset="tab" contentContainerStyle={styles.content}>

        <View style={styles.topBar}>
          <View>
            <AppText variant="title2">{greeting}, {firstName}</AppText>
            <AppText variant="caption" tone="tertiary" style={styles.dateLabel}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </AppText>
          </View>
          <View style={styles.notifBell}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </View>
        </View>

        {currentHousehold && (
          <AppText variant="caption" tone="warning" weight="700" style={styles.householdName}>{currentHousehold.nombre}</AppText>
        )}

        <FamilyPulse />
        <DailyBriefing eventCount={0} taskCount={0} />
        {currentHousehold && <QuickActions householdId={currentHousehold.id} />}
        <HomePlannerSections />
        <View style={{ height: 20 }} />
        <BudgetCard />
        <View style={{ height: 40 }} />
    </AppScreen>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg: colors.background.base,
  surface: colors.surface.card,
  surface2: colors.surface.soft,
  border: colors.border.subtle,
  text: colors.text.primary,
  textMuted: colors.text.tertiary,
  textDim: colors.text.secondary,
  primary: colors.terracotta[500],
  amber: colors.warning.base,
  red: colors.danger.base,
  green: colors.success.base,
};

const styles = StyleSheet.create({
  content: { paddingTop: spacing[1] },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] },
  greeting: { fontSize: 26, fontWeight: '700', color: C.text },
  dateLabel: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  notifBell: { paddingTop: 4 },
  householdName: { marginBottom: spacing[4] },

  card: { marginBottom: spacing[4], ...shadows.card },
  cardLabelSmall: { fontSize: 11, letterSpacing: 0.8, color: C.textMuted, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  textMuted: { color: C.textMuted, fontSize: 13 },

  memberScroll: { marginBottom: 10 },
  memberItem: { alignItems: 'center', marginRight: 16, minWidth: 52 },
  memberAvatarRing: { width: 52, height: 52, borderRadius: radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[1], backgroundColor: colors.background.soft },
  memberEmoji: { fontSize: 28 },
  memberName: { fontSize: 11, color: C.textDim, fontWeight: '500' },
  memberStatus: { fontSize: 12, color: C.textMuted },

  briefingCard: { backgroundColor: colors.warning.soft },
  briefingHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  briefingIcon: { fontSize: 14 },
  briefingRow: { marginBottom: 8 },
  briefingItem: { fontSize: 14, color: C.textDim, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  progressBg: { flex: 1, height: 6, backgroundColor: colors.sand[100], borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: C.textMuted, width: 70 },

  actionsScroll: { marginBottom: spacing[4], marginHorizontal: -spacing[1] },
  actionPill: { marginHorizontal: spacing[1] },
  sosBtn: { backgroundColor: colors.danger.base, borderColor: colors.danger.base, minHeight: 44, paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
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
  addExpenseBtn: { marginTop: spacing[2] },
  addExpenseText: { color: C.primary, fontSize: 12, fontWeight: '600' },
});
