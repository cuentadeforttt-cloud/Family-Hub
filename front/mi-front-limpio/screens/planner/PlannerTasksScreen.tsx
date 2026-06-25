import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { ApiError } from '../../services/api';
import {
  cancelPlannerTask,
  completePlannerTask,
  listPlannerTasks,
  verifyPlannerTask,
  type PlannerTask,
} from '../../services/plannerTasks';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
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

    return tasks.filter((task) => {
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
      if (action === 'complete') await completePlannerTask(accessToken, task.id);
      if (action === 'verify') await verifyPlannerTask(accessToken, task.id);
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
      <View style={[S.headerRow, { marginBottom: 14 }]}>
        <Text style={S.sectionTitle}>Tareas</Text>
        <TouchableOpacity style={S.primaryBtn} onPress={onCreateTask}>
          <Text style={S.btnText}>Nueva tarea</Text>
        </TouchableOpacity>
      </View>

      <View style={[S.row, { marginBottom: 14 }]}>
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[S.chip, active && S.chipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[S.chipText, active && S.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
        const assignedName = task.assigned_to_member_id
          ? memberNameById.get(task.assigned_to_member_id) ?? task.assigned_member?.display_name ?? 'Miembro'
          : 'Sin asignar';
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
              {priorityLabels[task.priority]} · {task.category || task.template_key || 'Sin categoria'} · {assignedName}
            </Text>
            <Text style={[S.muted, { marginTop: 4 }]}>
              {task.requires_verification ? 'Requiere verificacion' : 'No requiere verificacion'}
            </Text>

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
