import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
import { lightHaptic } from '../../utils/haptics';

type Props = {
  refreshKey?: number;
  onChanged?: () => void;
  onCreateTask?: () => void;
  onEditTask?: (taskId: string) => void;
};

type FilterKey = 'open' | 'mine' | 'family' | 'today' | 'overdue' | 'awaiting' | 'done' | 'cancelled';

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'open', label: 'Pendientes' },
  { key: 'mine', label: 'Mías' },
  { key: 'family', label: 'Familia' },
  { key: 'today', label: 'Hoy' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'awaiting', label: 'Por verificar' },
  { key: 'done', label: 'Hechas' },
  { key: 'cancelled', label: 'Canceladas' },
];

type TaskCardProps = {
  task: PlannerTask;
  filter: FilterKey;
  memberNameById: Map<string, string>;
  today: string;
  savingId: string | null;
  onEditTask?: (taskId: string) => void;
  onComplete: (task: PlannerTask) => void;
  onVerify: (task: PlannerTask) => void;
  onCancel: (task: PlannerTask) => void;
};

function TaskCard({
  task,
  filter,
  memberNameById,
  today,
  savingId,
  onEditTask,
  onComplete,
  onVerify,
  onCancel,
}: TaskCardProps) {
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
      return getDisplayName(task.completed_member);
    }

    return 'Sin asignar';
  };

  const getSecondaryLabel = () => {
    if (task.status === 'awaiting_verification') {
      return 'Lista para revisar';
    }
    if (task.status === 'verified' && task.verified_member) {
      return `Verificada por ${getDisplayName(task.verified_member)}`;
    }
    if (task.status === 'cancelled') {
      return null;
    }
    if (task.requires_verification) {
      return 'Requiere verificación';
    }
    return null;
  };

  const isSaving = savingId === task.id;
  const isCompleted = ['completed', 'verified'].includes(task.status);
  const isOverdue = task.status === 'pending' && Boolean(task.due_date) && task.due_date! < today;
  const isPending = task.status === 'pending';
  const isAwaiting = task.status === 'awaiting_verification';

  const checkboxAnim = useMemo(() => new Animated.Value(isCompleted ? 1 : 0), [isCompleted]);
  const pressAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    Animated.timing(checkboxAnim, {
      toValue: isCompleted ? 1 : 0,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [isCompleted, checkboxAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const getPriorityBorder = (priority: PlannerTaskPriority) => {
    switch (priority) {
      case 'low': return S.taskCardBorderLow;
      case 'high': return S.taskCardBorderHigh;
      case 'critical': return S.taskCardBorderCritical;
      default: return S.taskCardBorderNormal;
    }
  };

  const getBadgeStyle = () => {
    if (isOverdue && filter !== 'done' && filter !== 'cancelled') return [S.badge, S.taskBadgeOverdue];
    if (task.status === 'verified') return [S.badge, S.taskBadgeVerified];
    if (task.status === 'completed') return [S.badge, S.taskBadgeCompleted];
    if (task.status === 'awaiting_verification') return [S.badge, S.taskBadgeAwaiting];
    if (task.status === 'cancelled') return [S.badge, S.taskBadgeCancelled];
    return [S.badge, S.taskBadgePending];
  };

  const getBadgeText = () => {
    if (isOverdue && filter !== 'done' && filter !== 'cancelled') return 'Vencida';
    if (task.status === 'awaiting_verification') return 'Necesita revisión';
    return statusLabels[task.status];
  };

  const getBadgeTextStyle = () => {
    if (isOverdue && filter !== 'done' && filter !== 'cancelled') return [S.badgeText, S.taskBadgeOverdueText];
    if (task.status === 'verified') return [S.badgeText, S.taskBadgeVerifiedText];
    if (task.status === 'completed') return [S.badgeText, S.taskBadgeCompletedText];
    if (task.status === 'awaiting_verification') return [S.badgeText, S.taskBadgeAwaitingText];
    if (task.status === 'cancelled') return [S.badgeText, S.taskBadgeCancelledText];
    return [S.badgeText, S.taskBadgePendingText];
  };

  const personLabel = getPersonLabel();
  const secondaryLabel = getSecondaryLabel();

  return (
    <Animated.View style={[S.card, getPriorityBorder(task.priority), { marginBottom: 12 }, { opacity: pressAnim }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[S.headerRow, { alignItems: 'flex-start' }]}>
          <Animated.View style={[S.checkboxAnimated, isCompleted && S.checkboxAnimatedChecked, { transform: [{ scale: checkboxAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
            <Text style={S.checkboxText}>{isCompleted ? '✓' : ''}</Text>
          </Animated.View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ color: '#17201A', fontSize: 17, fontWeight: '700' }}>{task.title}</Text>
            <Text style={S.taskDateLabel}>
              {formatDate(task.due_date)} {formatTime(task.due_time)}
              {task.due_date === today && ' · Para hoy'}
              {isOverdue && ' · Vencida'}
            </Text>
          </View>
          <View style={getBadgeStyle()}>
            <Text style={getBadgeTextStyle()}>{getBadgeText()}</Text>
          </View>
        </View>
        {task.description ? <Text style={S.taskDescription}>{task.description}</Text> : null}
        
        <View style={S.taskMetadataRow}>
          <View style={S.taskMetadataChip}>
            <Text style={S.taskMetadataChipText}>{priorityLabels[task.priority]}</Text>
          </View>
          <View style={S.taskMetadataChip}>
            <Text style={S.taskMetadataChipText}>{task.category || task.template_key || 'Sin categoría'}</Text>
          </View>
        </View>
        
        <Text style={S.taskPersonLabel}>Asignada a {personLabel}</Text>
        
        {secondaryLabel ? (
          <Text style={[S.muted, { marginTop: 6 }]}>{secondaryLabel}</Text>
        ) : null}

        <View style={S.taskActionsRow}>
          {isPending ? (
            <TouchableOpacity
              style={[S.taskPrimaryAction, isSaving && { opacity: 0.6 }]}
              onPress={() => onComplete(task)}
              disabled={isSaving}
            >
              <Text style={S.taskPrimaryActionText}>Completar</Text>
            </TouchableOpacity>
          ) : null}
          {isAwaiting ? (
            <TouchableOpacity
              style={[S.taskPrimaryAction, isSaving && { opacity: 0.6 }]}
              onPress={() => onVerify(task)}
              disabled={isSaving}
            >
              <Text style={S.taskPrimaryActionText}>Verificar</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity 
            style={[S.taskSecondaryAction, isSaving && { opacity: 0.6 }]} 
            onPress={() => onEditTask?.(task.id)}
            disabled={isSaving}
          >
            <Text style={S.taskSecondaryActionText}>Editar</Text>
          </TouchableOpacity>
          {task.status !== 'cancelled' ? (
            <TouchableOpacity 
              style={[S.dangerBtn, isSaving && { opacity: 0.6 }]} 
              onPress={() => onCancel(task)} 
              disabled={isSaving}
            >
              <Text style={S.dangerText}>Cancelar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

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

  const today = dateToYMD(new Date());

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      open: 0,
      mine: 0,
      family: 0,
      today: 0,
      overdue: 0,
      awaiting: 0,
      done: 0,
      cancelled: 0,
    };

    tasks.forEach((task) => {
      const isOpen = ['pending', 'awaiting_verification'].includes(task.status);
      if (isOpen) counts.open++;
      if (isOpen && task.assigned_to_member_id === myMembershipId) counts.mine++;
      if (isOpen) counts.family++;
      if (task.status !== 'cancelled' && task.due_date === today) counts.today++;
      if (task.status === 'pending' && Boolean(task.due_date) && task.due_date! < today) counts.overdue++;
      if (task.status === 'awaiting_verification') counts.awaiting++;
      if (['completed', 'verified'].includes(task.status)) counts.done++;
      if (task.status === 'cancelled') counts.cancelled++;
    });

    return counts;
  }, [tasks, myMembershipId, today]);

  const visibleTasks = useMemo(() => {
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
  }, [filter, myMembershipId, tasks, today]);

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

  const confirmComplete = async (task: PlannerTask) => {
    await lightHaptic();
    await runMutation(task, 'complete');
  };

  const confirmVerify = async (task: PlannerTask) => {
    await lightHaptic();
    await runMutation(task, 'verify');
  };

  const confirmCancel = (task: PlannerTask) => {
    if (!accessToken) return;
    Alert.alert('¿Cancelar esta tarea?', 'No se va a borrar definitivamente, pero dejará de aparecer como pendiente.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar tarea',
        style: 'destructive',
        onPress: async () => {
          await lightHaptic();
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
          const count = filterCounts[item.key];
          return (
            <TouchableOpacity
              key={item.key}
              style={[S.filterChipWithCount, active && S.filterChipCountActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[S.filterChipCountText, active && S.filterChipCountTextActive]}>{item.label}</Text>
              <View style={[S.filterCountBadge, active && S.filterCountBadgeActive]}>
                <Text style={[S.filterCountText, active && S.filterCountTextActive]}>{count}</Text>
              </View>
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

      {visibleTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          filter={filter}
          memberNameById={memberNameById}
          today={today}
          savingId={savingId}
          onEditTask={onEditTask}
          onComplete={confirmComplete}
          onVerify={confirmVerify}
          onCancel={confirmCancel}
        />
      ))}
    </View>
  );
}