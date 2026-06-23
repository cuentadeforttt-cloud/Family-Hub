import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ApiError } from '../../services/api';
import { listPlannerEvents, type PlannerEvent } from '../../services/plannerEvents';
import { getPlannerSummary, type PlannerSummary } from '../../services/plannerSummary';
import { listPlannerTasks, type PlannerTask } from '../../services/plannerTasks';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';

type Props = {
  variant?: 'light' | 'dark';
};

const C = {
  bg: '#FFFFFF',
  bgDark: '#161B22',
  border: '#E2DFD6',
  borderDark: 'rgba(205,115,83,0.22)',
  text: '#17201A',
  textDark: '#FFFFFF',
  muted: '#647067',
  mutedDark: '#C8C8C8',
  primary: '#CD7353',
  sage: '#7C9E7A',
  danger: '#A33A2B',
};

const toDateOnly = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const formatTime = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const taskStatusLabel: Record<PlannerTask['status'], string> = {
  pending: 'Pendiente',
  awaiting_verification: 'Por verificar',
  completed: 'Completada',
  verified: 'Verificada',
  cancelled: 'Cancelada',
};

const sortHomeTasks = (tasks: PlannerTask[], myMembershipId: string) => {
  const today = toDateOnly(new Date());

  return [...tasks]
    .filter((task) => ['pending', 'awaiting_verification'].includes(task.status))
    .sort((left, right) => {
      const score = (task: PlannerTask) => {
        if (task.status === 'awaiting_verification') return 0;
        if (task.due_date && task.due_date < today) return 1;
        if (task.due_date === today) return 2;
        if (myMembershipId && task.assigned_to_member_id === myMembershipId) return 3;
        if (task.due_date) return 4;
        return 5;
      };

      const scoreDiff = score(left) - score(right);
      if (scoreDiff !== 0) return scoreDiff;

      return (left.due_date ?? '9999-12-31').localeCompare(right.due_date ?? '9999-12-31');
    })
    .slice(0, 5);
};

export function useHomePlannerData() {
  const { session, authMe } = useAuth();
  const { members } = useHousehold();
  const accessToken = session?.access_token;
  const [summary, setSummary] = useState<PlannerSummary | null>(null);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myMembershipId = useMemo(() => {
    const householdId = authMe?.active_household?.id;
    return authMe?.memberships.find(
      (membership) => membership.household_id === householdId && membership.status === 'active',
    )?.id ?? '';
  }, [authMe?.active_household?.id, authMe?.memberships]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => map.set(member.id, member.user?.nombre || 'Miembro'));
    return map;
  }, [members]);

  const refresh = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const [nextSummary, tasksResponse, eventsResponse] = await Promise.all([
        getPlannerSummary(accessToken),
        listPlannerTasks(accessToken, { include_cancelled: false, limit: 100 }),
        listPlannerEvents(accessToken, {
          from: now.toISOString(),
          to: addDays(now, 14).toISOString(),
          include_recurring: true,
        }),
      ]);

      setSummary(nextSummary);
      setTasks(sortHomeTasks(tasksResponse.tasks, myMembershipId));
      setEvents((eventsResponse.events.length > 0 ? eventsResponse.events : nextSummary.upcoming_events).slice(0, 3));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cargar datos del Planner.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, myMembershipId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    error,
    events,
    loading,
    memberNameById,
    refresh,
    summary,
    tasks,
  };
}

export function HomePlannerSections({ variant = 'light' }: Props) {
  const navigation = useNavigation<any>();
  const { error, events, loading, memberNameById, summary, tasks } = useHomePlannerData();
  const dark = variant === 'dark';

  const openPlanner = (initialTab: 'tasks' | 'calendar', initialSheet?: 'task' | 'event') => {
    navigation.navigate('PlannerTab', {
      screen: 'PlannerHome',
      params: {
        initialTab,
        initialSheet,
        sheetKey: Date.now(),
        refreshKey: Date.now(),
      },
    });
  };

  const mock = (label: string) => Alert.alert(label, 'Próximamente.');

  return (
    <View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => openPlanner('tasks', 'task')}>
          <Text style={styles.primaryActionText}>Crear tarea</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => openPlanner('calendar', 'event')}>
          <Text style={styles.secondaryActionText}>Crear evento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mockAction} onPress={() => mock('Preguntar a Geni')}>
          <Text style={styles.mockActionText}>Geni</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={[styles.card, dark && styles.cardDark]}>
          <Text style={[styles.errorText]}>{error}</Text>
        </View>
      ) : null}

      {summary && (summary.overdue_tasks_count > 0 || summary.awaiting_verification_count > 0) ? (
        <View style={[styles.card, dark && styles.cardDark]}>
          <Text style={[styles.cardTitle, dark && styles.cardTitleDark]}>Atención requerida</Text>
          {summary.overdue_tasks_count > 0 ? (
            <Text style={[styles.meta, dark && styles.metaDark]}>{summary.overdue_tasks_count} tareas vencidas</Text>
          ) : null}
          {summary.awaiting_verification_count > 0 ? (
            <Text style={[styles.meta, dark && styles.metaDark]}>{summary.awaiting_verification_count} por verificar</Text>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.card, dark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, dark && styles.cardTitleDark]}>Tareas del hogar</Text>
          <TouchableOpacity onPress={() => openPlanner('tasks')}>
            <Text style={styles.linkText}>Ver tareas</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
        ) : tasks.length === 0 ? (
          <Text style={[styles.emptyText, dark && styles.metaDark]}>Sin tareas pendientes.</Text>
        ) : tasks.map((task) => {
          const assignedName = task.assigned_to_member_id
            ? memberNameById.get(task.assigned_to_member_id) ?? task.assigned_member?.display_name ?? 'Miembro'
            : 'Sin asignar';

          return (
            <TouchableOpacity key={task.id} style={styles.itemRow} onPress={() => openPlanner('tasks')}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, dark && styles.itemTitleDark]}>{task.title}</Text>
                <Text style={[styles.meta, dark && styles.metaDark]}>
                  {task.category || task.template_key || 'Sin categoría'} · {formatDate(task.due_date)} · {assignedName}
                </Text>
              </View>
              <Text style={styles.statusText}>{taskStatusLabel[task.status]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.card, dark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, dark && styles.cardTitleDark]}>Próximos eventos</Text>
          <TouchableOpacity onPress={() => openPlanner('calendar')}>
            <Text style={styles.linkText}>Ver calendario</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
        ) : events.length === 0 ? (
          <Text style={[styles.emptyText, dark && styles.metaDark]}>Sin eventos próximos.</Text>
        ) : events.map((event) => (
          <TouchableOpacity key={event.id} style={styles.itemRow} onPress={() => openPlanner('calendar')}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, dark && styles.itemTitleDark]}>{event.title}</Text>
              <Text style={[styles.meta, dark && styles.metaDark]}>
                {formatDate(event.starts_at)} {event.all_day ? 'Todo el día' : formatTime(event.starts_at)}
                {event.location_name ? ` · ${event.location_name}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  primaryAction: { backgroundColor: C.primary, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  primaryActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderColor: C.primary,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  secondaryActionText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  mockAction: {
    backgroundColor: '#ECF3EA',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  mockActionText: { color: '#496E47', fontSize: 13, fontWeight: '800' },
  card: {
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardDark: { backgroundColor: C.bgDark, borderColor: C.borderDark },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  cardTitle: { color: C.text, fontSize: 17, fontWeight: '900' },
  cardTitleDark: { color: C.textDark },
  linkText: { color: C.primary, fontSize: 13, fontWeight: '900' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124,158,122,0.16)',
  },
  itemTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  itemTitleDark: { color: C.textDark },
  meta: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  metaDark: { color: C.mutedDark },
  statusText: { color: C.sage, fontSize: 11, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 14 },
  errorText: { color: C.danger, fontSize: 14, lineHeight: 20 },
});
