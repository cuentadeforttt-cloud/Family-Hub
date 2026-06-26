import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { ApiError } from '../../services/api';
import { getPlannerCalendar, type PlannerCalendarEventItem, type PlannerCalendarItem, type PlannerCalendarView } from '../../services/plannerCalendar';
import { cancelPlannerEvent } from '../../services/plannerEvents';
import { completePlannerTask } from '../../services/plannerTasks';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useAppRefresh } from '../../context/AppRefreshContext';
import {
  addDays,
  addMonths,
  dateToYMD,
  formatDate,
  formatTime,
  plannerStyles as S,
  priorityLabels,
  recurrenceLabels,
  statusLabels,
} from './plannerShared';

type Props = {
  refreshKey?: number;
  onChanged?: () => void;
  onCreateEvent?: () => void;
  onEditEvent?: (
    eventId: string,
    context?: {
      baseEventId?: string;
      occurrenceId?: string;
      occurrenceStartsAt?: string;
      occurrenceEndsAt?: string;
      isGeneratedRecurringOccurrence?: boolean;
    },
  ) => void;
  onEditTask?: (taskId: string) => void;
};

const viewOptions: Array<{ key: PlannerCalendarView; label: string }> = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

const getItemDateKey = (item: PlannerCalendarItem) =>
  item.type === 'event' ? dateToYMD(new Date(item.starts_at)) : item.due_date ?? '';

const moveDate = (date: Date, view: PlannerCalendarView, direction: -1 | 1) => {
  if (view === 'day') return addDays(date, direction);
  if (view === 'week') return addDays(date, direction * 7);
  return addMonths(date, direction);
};

export function PlannerCalendarScreen({ refreshKey, onChanged, onCreateEvent, onEditEvent, onEditTask }: Props) {
  const { session, loading: authLoading } = useAuth();
  const { members } = useHousehold();
  const { plannerChangedAt, markPlannerChanged } = useAppRefresh();
  const accessToken = session?.access_token;

  const [view, setView] = useState<PlannerCalendarView>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [items, setItems] = useState<PlannerCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = useCallback(async () => {
    if (!accessToken || authLoading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getPlannerCalendar(accessToken, {
        view,
        date: dateToYMD(selectedDate),
      });
      setItems(response.items.filter((item) => item.status !== 'cancelled'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cargar el calendario.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, authLoading, selectedDate, view]);

  useEffect(() => {
    if (!authLoading && !accessToken) {
      setLoading(false);
      return;
    }
    void loadCalendar();
  }, [loadCalendar, refreshKey, authLoading, accessToken]);

  useEffect(() => {
    if (!loading && plannerChangedAt > 0) {
      void loadCalendar();
    }
  }, [plannerChangedAt]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, PlannerCalendarItem[]>();
    items.forEach((item) => {
      const key = getItemDateKey(item);
      if (!key) return;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const selectedDateKey = dateToYMD(selectedDate);
  const selectedDateItems = useMemo(
    () => groupedItems.find(([dateKey]) => dateKey === selectedDateKey)?.[1] ?? [],
    [groupedItems, selectedDateKey],
  );
  const eventDates = useMemo(() => new Set(groupedItems.map(([dateKey]) => dateKey)), [groupedItems]);
  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<Date | null> = Array.from({ length: firstWeekday }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [selectedDate]);

  const completeTask = async (taskId: string) => {
    if (!accessToken) {
      Alert.alert('Planner', 'No hay sesion activa para completar la tarea.');
      return;
    }

    setSavingId(taskId);
    try {
      await completePlannerTask(accessToken, taskId);
      markPlannerChanged();
      await loadCalendar();
      onChanged?.();
    } catch (err) {
      Alert.alert('Planner', err instanceof ApiError ? err.message : 'No pudimos completar la tarea.');
    } finally {
      setSavingId(null);
    }
  };

const handleEditEvent = (item: PlannerCalendarEventItem) => {
  const context =
    item.is_recurring_occurrence && !item.is_override
      ? {
          baseEventId: item.id,
          occurrenceId: item.occurrence_id,
          occurrenceStartsAt: item.starts_at,
          occurrenceEndsAt: item.ends_at ?? undefined,
          isGeneratedRecurringOccurrence: true,
        }
      : undefined;

  onEditEvent?.(item.id, context);
};

  const confirmCancelEvent = (eventId: string) => {
    if (!accessToken) return;

    Alert.alert('¿Cancelar este evento?', 'Dejará de aparecer como próximo evento.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar evento',
        style: 'destructive',
        onPress: async () => {
          setSavingId(eventId);
          try {
            await cancelPlannerEvent(accessToken, eventId);
            markPlannerChanged();
            await loadCalendar();
            onChanged?.();
          } catch (err) {
            Alert.alert('Planner', err instanceof ApiError ? err.message : 'No pudimos cancelar el evento.');
          } finally {
            setSavingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View>
      <View style={[S.headerRow, { marginBottom: 14 }]}>
        <Text style={S.sectionTitle}>Calendario</Text>
        <TouchableOpacity style={S.primaryBtn} onPress={onCreateEvent}>
          <Text style={S.btnText}>Nuevo evento</Text>
        </TouchableOpacity>
      </View>

      <View style={[S.row, { marginBottom: 12 }]}>
        {viewOptions.map((item) => {
          const active = view === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[S.chip, active && S.chipActive]}
              onPress={() => setView(item.key)}
            >
              <Text style={[S.chipText, active && S.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[S.headerRow, { marginBottom: 14 }]}>
        <TouchableOpacity style={S.secondaryBtn} onPress={() => setSelectedDate((prev) => moveDate(prev, view, -1))}>
          <Text style={S.secondaryText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.secondaryBtn} onPress={() => setSelectedDate(new Date())}>
          <Text style={S.secondaryText}>Hoy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.secondaryBtn} onPress={() => setSelectedDate((prev) => moveDate(prev, view, 1))}>
          <Text style={S.secondaryText}>Siguiente</Text>
        </TouchableOpacity>
      </View>

      <Text style={[S.subtitle, { marginBottom: 12 }]}>
        {view === 'month' ? 'Agenda mensual' : view === 'week' ? 'Agenda semanal' : 'Agenda del dia'} · {formatDate(dateToYMD(selectedDate))}
      </Text>

      <View style={S.monthGrid}>
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
          <Text key={`${day}-${index}`} style={S.monthWeekday}>{day}</Text>
        ))}
        {monthDays.map((day, index) => {
          const dateKey = day ? dateToYMD(day) : '';
          const selected = dateKey === selectedDateKey;
          const hasEvents = eventDates.has(dateKey);

          return (
            <TouchableOpacity
              key={`${dateKey || 'blank'}-${index}`}
              style={[S.monthDay, selected && S.monthDaySelected]}
              disabled={!day}
              onPress={() => day ? setSelectedDate(day) : undefined}
            >
              <Text style={[S.monthDayText, selected && S.monthDayTextSelected]}>{day ? day.getDate() : ''}</Text>
              {hasEvents ? <View style={[S.eventDot, selected && S.eventDotSelected]} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={[S.emptyBox, { minHeight: 160 }]}>
          <ActivityIndicator color="#CD7353" />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={S.errorBox}>
          <Text style={S.errorText}>{error}</Text>
          <TouchableOpacity style={[S.secondaryBtn, { marginTop: 10 }]} onPress={() => void loadCalendar()}>
            <Text style={S.secondaryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && groupedItems.length === 0 ? (
        <View style={S.emptyBox}>
          <Text style={S.emptyTitle}>Todavía no hay eventos</Text>
          <Text style={S.emptyText}>Agregá un evento familiar para verlo en el calendario.</Text>
          <TouchableOpacity style={[S.primaryBtn, { marginTop: 14 }]} onPress={onCreateEvent}>
            <Text style={S.btnText}>Crear evento</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && groupedItems.length > 0 && selectedDateItems.length === 0 ? (
        <View style={S.emptyBox}>
          <Text style={S.emptyText}>No hay eventos para este día.</Text>
        </View>
      ) : null}

      {!loading && !error
        ? ([[selectedDateKey, selectedDateItems] as [string, PlannerCalendarItem[]]])
            .filter(([, dateItems]) => dateItems.length > 0)
            .map(([dateKey, dateItems]) => (
            <View key={dateKey} style={{ marginBottom: 8 }}>
              <Text style={[S.label, { marginTop: 8 }]}>{formatDate(dateKey)}</Text>
              {dateItems.map((item) => {
                const uniqueKey = item.type === 'event' ? item.occurrence_id ?? item.id : item.id;
                const isSaving = savingId === item.id;

                if (item.type === 'event') {
                  return (
                    <View key={uniqueKey} style={S.card}>
                      <View style={[S.headerRow, { alignItems: 'flex-start' }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#17201A', fontSize: 16, fontWeight: '800' }}>{item.title}</Text>
                          <Text style={[S.muted, { marginTop: 4 }]}>
                            {item.all_day ? 'Todo el dia' : `${formatTime(item.starts_at)} ${formatTime(item.ends_at)}`}
                          </Text>
                        </View>
                        <View style={S.badge}>
                          <Text style={S.badgeText}>Evento</Text>
                        </View>
                      </View>
                      <Text style={[S.muted, { marginTop: 8 }]}>
                        {item.location_name || 'Sin ubicacion'} · {recurrenceLabels[item.recurrence]}
                      </Text>
                      <View style={[S.row, { marginTop: 12 }]}>
                        <TouchableOpacity style={S.secondaryBtn} onPress={() => handleEditEvent(item)}>
                          <Text style={S.secondaryText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[S.dangerBtn, isSaving && { opacity: 0.6 }]}
                          onPress={() => confirmCancelEvent(item.id)}
                          disabled={isSaving}
                        >
                          <Text style={S.dangerText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={uniqueKey} style={S.card}>
                    <View style={[S.headerRow, { alignItems: 'flex-start' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#17201A', fontSize: 16, fontWeight: '800' }}>{item.title}</Text>
                        <Text style={[S.muted, { marginTop: 4 }]}>
                          {formatTime(item.due_time)} · {priorityLabels[item.priority]} · {statusLabels[item.status]}
                        </Text>
                      </View>
                      <View style={S.badge}>
                        <Text style={S.badgeText}>Tarea</Text>
                      </View>
                    </View>
                    <View style={[S.row, { marginTop: 12 }]}>
                      {['pending', 'awaiting_verification'].includes(item.status) ? (
                        <TouchableOpacity
                          style={[S.secondaryBtn, isSaving && { opacity: 0.6 }]}
                          onPress={() => void completeTask(item.id)}
                          disabled={isSaving}
                        >
                          <Text style={S.secondaryText}>Completar</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity style={S.secondaryBtn} onPress={() => onEditTask?.(item.id)}>
                        <Text style={S.secondaryText}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        : null}
    </View>
  );
}
