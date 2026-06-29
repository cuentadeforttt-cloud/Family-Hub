import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
  plannerStyles as S,
} from './plannerShared';
import { CalendarDayCell, AgendaItemCard } from './PlannerCalendarComponents';
import { spacing } from '../../constants/theme';

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

const viewLabels: Record<PlannerCalendarView, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
};

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
  const today = useMemo(() => dateToYMD(new Date()), []);
  const viewLabel = viewLabels[view];

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

  return (
    <View style={{ flex: 1 }}>
      <View style={[S.headerRow, { marginBottom: 16 }]}>
        <View>
          <Text style={S.sectionTitle}>Calendario familiar</Text>
          <Text style={S.subtitle}>
            {view === 'day' ? 'Ves un día a la vez' : view === 'week' ? 'Ves la semana completa' : 'Ves todo el mes'}
          </Text>
        </View>
        <TouchableOpacity style={S.primaryBtn} onPress={onCreateEvent}>
          <Text style={S.btnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingRight: spacing[4] }}>
        {(['day', 'week', 'month'] as PlannerCalendarView[]).map((viewKey) => {
          const active = view === viewKey;
          return (
            <TouchableOpacity
              key={viewKey}
              style={[S.calendarViewChip, active && S.calendarViewChipActive]}
              onPress={() => setView(viewKey)}
            >
              <Text style={[S.calendarViewChipText, active && S.calendarViewChipTextActive]}>{viewLabels[viewKey]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[S.row, { marginBottom: 14 }]}>
        <TouchableOpacity
          style={[S.secondaryBtn, { flex: 1, minHeight: 40, paddingVertical: 8 }]}
          onPress={() => setSelectedDate((prev) => moveDate(prev, view, -1))}
        >
          <Text style={S.secondaryText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.primaryBtn, { flex: 1, minHeight: 40, paddingVertical: 8, marginLeft: spacing[2] }]}
          onPress={() => setSelectedDate(new Date())}
        >
          <Text style={S.btnText}>Hoy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.secondaryBtn, { flex: 1, minHeight: 40, paddingVertical: 8, marginLeft: spacing[2] }]}
          onPress={() => setSelectedDate((prev) => moveDate(prev, view, 1))}
        >
          <Text style={S.secondaryText}>Siguiente</Text>
        </TouchableOpacity>
      </View>

      <Text style={[S.label, { marginBottom: 10, textTransform: 'none', fontSize: 13 }]}>
        {view === 'month'
          ? `Este mes de ${selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
          : view === 'week'
          ? `Esta semana del ${formatDate(dateToYMD(addDays(selectedDate, -selectedDate.getDay())))} al ${formatDate(dateToYMD(addDays(selectedDate, 6 - selectedDate.getDay())))}`
          : `Hoy, ${formatDate(dateToYMD(selectedDate))}`}
      </Text>

      <View style={[S.monthGrid, { marginBottom: 20 }]}>
        {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, index) => (
          <Text key={day} style={S.monthWeekday}>{day.slice(0, 1)}</Text>
        ))}
        {monthDays.map((day, index) => {
          const dateKey = day ? dateToYMD(day) : '';
          const selected = dateKey === selectedDateKey;
          const isToday = dateKey === today;
          const dayItems = groupedItems.find(([dk]) => dk === dateKey)?.[1] ?? [];
          const hasEvent = dayItems.some((item) => item.type === 'event');
          const hasTask = dayItems.some((item) => item.type === 'task');

          return (
            <CalendarDayCell
              key={`${dateKey || 'blank'}-${index}`}
              day={day}
              dateKey={dateKey}
              selected={selected}
              isToday={isToday}
              hasEvent={hasEvent}
              hasTask={hasTask}
              onPress={() => day && setSelectedDate(day)}
            />
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
        <View style={S.calendarEmptyState}>
          <Text style={S.calendarEmptyTitle}>📅 No hay nada programado</Text>
          <Text style={S.calendarEmptyText}>
            Todavía no tenés eventos ni tareas. <Text style={{ fontWeight: '700' }}>Sumá un evento familiar</Text> para empezar a organizar la semana.
          </Text>
          <TouchableOpacity style={[S.primaryBtn, { marginTop: 8 }]} onPress={onCreateEvent}>
            <Text style={S.btnText}>Crear evento</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && groupedItems.length > 0 && selectedDateItems.length === 0 ? (
        <View style={S.calendarEmptyState}>
          <Text style={S.calendarEmptyTitle}>✨ Día tranquilo</Text>
          <Text style={S.calendarEmptyText}>
            No tenés nada programado para este día. Aprovechá para descansar o sumá una tarea familiar.
          </Text>
          <TouchableOpacity style={[S.secondaryBtn, { marginTop: 8 }]} onPress={onCreateEvent}>
            <Text style={S.secondaryText}>Crear evento</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && groupedItems.length > 0 ? (
        <View>
          {([[selectedDateKey, selectedDateItems] as [string, PlannerCalendarItem[]]])
            .filter(([, dateItems]) => dateItems.length > 0)
            .map(([dateKey, dateItems]) => (
            <View key={dateKey}>
              <Text style={[S.label, { marginTop: 8, textTransform: 'none', fontSize: 13 }]}>
                Agenda de {formatDate(dateKey)}
              </Text>
              {dateItems.map((item) => {
                const uniqueKey = item.type === 'event' ? item.occurrence_id ?? item.id : item.id;
                const isSaving = savingId === item.id;

                return (
                  <AgendaItemCard
                    key={uniqueKey}
                    item={item}
                    isSaving={isSaving}
                    onEditEvent={(evt) => {
                      const context =
                        evt.is_recurring_occurrence && !evt.is_override
                          ? {
                              baseEventId: evt.id,
                              occurrenceId: evt.occurrence_id,
                              occurrenceStartsAt: evt.starts_at,
                              occurrenceEndsAt: evt.ends_at ?? undefined,
                              isGeneratedRecurringOccurrence: true,
                            }
                          : undefined;
                      onEditEvent?.(evt.id, context);
                    }}
                    onCancelEvent={(eventId) => {
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
                    }}
                    onEditTask={(taskId) => onEditTask?.(taskId)}
                    onCompleteTask={async (taskId) => {
                      if (!accessToken) {
                        Alert.alert('Planner', 'No hay sesión activa para completar la tarea.');
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
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
