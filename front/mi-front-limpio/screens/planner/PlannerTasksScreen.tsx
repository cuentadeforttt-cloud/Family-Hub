import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ApiError } from '../../services/api';
import {
  cancelPlannerTask,
  completePlannerTask,
  listPlannerTasks,
  verifyPlannerTask,
  type PlannerTask,
  type PlannerTaskPriority,
} from '../../services/plannerTasks';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useAppRefresh } from '../../context/AppRefreshContext';
import { dateToYMD, formatDate, formatTime, plannerStyles as S, priorityLabels, statusLabels } from './plannerShared';

type Props = {
  refreshKey?: number;
  onChanged?: () => void;
  onCreateTask?: () => void;
  onEditTask?: (taskId: string) => void;
};

type FilterKey = 'open' | 'mine' | 'family' | 'today' | 'overdue' | 'awaiting' | 'done' | 'cancelled';

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'open', label: 'Pendientes' },
  { key: 'mine', label: 'Mias' },
  { key: 'family', label: 'Familia' },
  { key: 'today', label: 'Hoy' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'awaiting', label: 'Por verificar' },
  { key: 'done', label: 'Hechas' },
  { key: 'cancelled', label: 'Canceladas' },
];

export function PlannerTasksScreen({ refreshKey, onChanged, onCreateTask, onEditTask }: Props) {
  const { session, authMe, loading: authLoading } = useAuth();
  const { members } = useHousehold();
  const { plannerChangedAt, markPlannerChanged } = useAppRefresh();
  const accessToken = session?.access_token;

  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('open');

  const loadTasks = useCallback(async () => {
    if (!accessToken || authLoading) return;

    setLoading(true);
    setError(null);

    try {
      const { tasks: nextTasks } = await listPlannerTasks(accessToken, { include_cancelled: true, limit: 500 });
      setTasks(nextTasks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cargar las tareas.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, authLoading]);

  useEffect(() => {
    if (!authLoading && !accessToken) {
      setLoading(false);
      return;
    }
    void loadTasks();
  }, [loadTasks, refreshKey, authLoading, accessToken]);

  useEffect(() => {
    if (!loading && plannerChangedAt > 0) {
      void loadTasks();
    }
  }, [plannerChangedAt]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => map.set(member.id, member.user?.nombre || 'Miembro'));
    return map;
  }, [members]);

  const myMembershipId = useMemo(() => {
    const householdId = authMe?.active_household?.id;
    return authMe?.memberships.find(
      (membership) => membership.household_id === householdId && membership.status === 'active',
    )?.id ?? '';
  }, [authMe?.active_household?.id, authMe?.memberships]);

  const visibleTasks = useMemo(() => {
    const today = dateToYMD(new Date());

    const filtered = tasks.filter((task) => {
      const isOpen = ['pending', 'awaiting_verification'].includes(task.status);
      if (filter === 'mine') return isOpen && task.assigned_to_member_id === myMembershipId;
      if (filter === 'family') return isOpen;
      if (filter === 'today') return task.status !== 'cancelled' && task.due_date === today;
      if (filter === 'overdue') return task.status === 'pending' && Boolean(task.due_date) && task.due_date! < today;
      if (filter === 'awaiting') return task.status === 'awaiting_verification';
      if (filter === 'done') return ['completed', 'verified'].includes(task.status);
      if (filter === 'cancelled') return task.status === 'cancelled';
      return isOpen;
    });

    const getPriorityScore = (task: PlannerTask) => {
      if (task.status === 'pending' && task.due_date && task.due_date < today) return 0;
      if (task.status === 'awaiting_verification') return 1;
      if (task.due_date === today) return 2;
      if (task.due_date && task.due_date > today) return 3;
      if (task.status === 'pending') return 4;
      return 5;
    };

    const priorityOrder: Record<PlannerTaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return filtered.sort((a, b) => {
      const priorityDiff = getPriorityScore(a) - getPriorityScore(b);
      if (priorityDiff !== 0) return priorityDiff;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [filter, myMembershipId, tasks]);

  const runMutation = async (task: PlannerTask, action: 'complete' | 'verify') => {
    if (!accessToken) return;

    setSavingId(task.id);
    const previousTasks = tasks;

    if (action === 'complete') {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: item.requires_verification ? 'awaiting_verification' : 'completed',
                completed_at: new Date().toISOString(),
              }
            : item,
        ),
      );
    }

    try {
      let resultTask: PlannerTask | undefined;
      if (action === 'complete') {
        const response = await completePlannerTask(accessToken, task.id);
        resultTask = response.task;
      }
      if (action === 'verify') {
        const response = await verifyPlannerTask(accessToken, task.id);
        resultTask = response.task;
      }
      if (resultTask) {
        setTasks((current) => current.map((item) => (item.id === task.id ? resultTask! : item)));
      }
      markPlannerChanged();
      await loadTasks();
      onChanged?.();
    } catch (err) {
      setTasks(previousTasks);
      Alert.alert('Planner', err instanceof ApiError ? err.message : 'No pudimos actualizar la tarea.');
    } finally {
      setSavingId(null);
    }
  };

  const confirmCancel = (task: PlannerTask) => {
    if (!accessToken) return;
    Alert.alert('¿Cancelar esta tarea?', 'No se va a borrar definitivamente, pero dejará de aparecer como pendiente.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar tarea',
        style: 'destructive',
        onPress: async () => {
          setSavingId(task.id);
          try {
            await cancelPlannerTask(accessToken, task.id);
            markPlannerChanged();
            await loadTasks();
            onChanged?.();
          } catch (err) {
            Alert.alert('Planner', err instanceof ApiError ? err.message : 'No pudimos cancelar la tarea.');
          } finally {
            setSavingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[S.emptyBox, { minHeight: 160 }]}>
        <ActivityIndicator color="#CD7353" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={S.errorBox}>
        <Text style={S.errorText}>{error}</Text>
        <TouchableOpacity style={[S.secondaryBtn, { marginTop: 10 }]} onPress={() => void loadTasks()}>
          <Text style={S.secondaryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={[S.headerRow, { marginBottom: 12 }]}>
        <Text style={S.sectionTitle}>Tareas</Text>
        <TouchableOpacity style={S.primaryBtn} onPress={onCreateTask}>
          <Text style={S.btnText}>Nueva tarea</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[S.filterChip, active && S.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[S.filterChipText, active && S.filterChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {visibleTasks.length === 0 ? (
        <View style={S.emptyBox}>
          <Text style={S.emptyTitle}>Acá van a aparecer tus tareas</Text>
          <Text style={S.emptyText}>Creá una tarea o asigná una responsabilidad para organizar el hogar.</Text>
          <TouchableOpacity style={[S.primaryBtn, { marginTop: 14 }]} onPress={onCreateTask}>
            <Text style={S.btnText}>Crear tarea</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {visibleTasks.map((task) => {
        const getDisplayName = (member: typeof task.assigned_member | typeof task.completed_member | typeof task.verified_member) => {
          if (!member) return 'Miembro';
          return member.display_name || 'Miembro';
        };

        const getPersonLabel = () => {
          if (task.status === 'pending' || task.status === 'cancelled') {
            const name = task.assigned_to_member_id
              ? memberNameById.get(task.assigned_to_member_id) ?? getDisplayName(task.assigned_member)
              : null;
            return name || task.assigned_member?.display_name || 'Sin asignar';
          }

          if (task.status === 'completed' || task.status === 'awaiting_verification' || task.status === 'verified') {
            const name = getDisplayName(task.completed_member);
            return name;
          }

          return 'Sin asignar';
        };

        const getSecondaryLabel = () => {
          if (task.status === 'awaiting_verification') {
            return 'Pendiente de verificación';
          }
          if (task.status === 'verified' && task.verified_member) {
            return `Verificada por ${getDisplayName(task.verified_member)}`;
          }
          if (task.status === 'cancelled') {
            return null;
          }
          return null;
        };

        const personLabel = getPersonLabel();
        const secondaryLabel = getSecondaryLabel();
        const isSaving = savingId === task.id;
        const today = dateToYMD(new Date());
        const isOverdue = task.status === 'pending' && Boolean(task.due_date) && task.due_date! < today;

        return (
          <View key={task.id} style={S.card}>
            <View style={[S.headerRow, { alignItems: 'flex-start' }]}>
              <TouchableOpacity
                style={[S.checkbox, ['completed', 'verified'].includes(task.status) && S.checkboxChecked]}
                onPress={() => task.status === 'pending' ? void runMutation(task, 'complete') : undefined}
                disabled={isSaving || task.status !== 'pending'}
              >
                <Text style={S.checkboxText}>{['completed', 'verified'].includes(task.status) ? '✓' : ''}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#17201A', fontSize: 17, fontWeight: '800' }}>{task.title}</Text>
                <Text style={[S.muted, { marginTop: 4 }]}>
                  {formatDate(task.due_date)} {formatTime(task.due_time)}
                </Text>
              </View>
              <View style={[S.badge, isOverdue && S.badgeDanger]}>
                <Text style={[S.badgeText, isOverdue && S.badgeDangerText]}>
                  {isOverdue && filter !== 'done' && filter !== 'cancelled' ? 'Vencida' : statusLabels[task.status]}
                </Text>
              </View>
            </View>
            {task.description ? <Text style={[S.muted, { marginTop: 8 }]}>{task.description}</Text> : null}
            <Text style={[S.muted, { marginTop: 8 }]}>
              {priorityLabels[task.priority]} · {task.category || task.template_key || 'Sin categoria'} · {personLabel}
            </Text>
            {secondaryLabel ? (
              <Text style={[S.muted, { marginTop: 4 }]}>{secondaryLabel}</Text>
            ) : (
              <Text style={[S.muted, { marginTop: 4 }]}>
                {task.requires_verification ? 'Requiere verificacion' : 'No requiere verificacion'}
              </Text>
            )}

            <View style={[S.row, { marginTop: 12 }]}>
              {task.status === 'pending' ? (
                <TouchableOpacity
                  style={[S.secondaryBtn, isSaving && { opacity: 0.6 }]}
                  onPress={() => void runMutation(task, 'complete')}
                  disabled={isSaving}
                >
                  <Text style={S.secondaryText}>Completar</Text>
                </TouchableOpacity>
              ) : null}
              {task.status === 'awaiting_verification' ? (
                <TouchableOpacity
                  style={[S.secondaryBtn, isSaving && { opacity: 0.6 }]}
                  onPress={() => void runMutation(task, 'verify')}
                  disabled={isSaving}
                >
                  <Text style={S.secondaryText}>Verificar</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={S.secondaryBtn} onPress={() => onEditTask?.(task.id)}>
                <Text style={S.secondaryText}>Editar</Text>
              </TouchableOpacity>
              {task.status !== 'cancelled' ? (
                <TouchableOpacity style={S.dangerBtn} onPress={() => confirmCancel(task)} disabled={isSaving}>
                  <Text style={S.dangerText}>Cancelar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
