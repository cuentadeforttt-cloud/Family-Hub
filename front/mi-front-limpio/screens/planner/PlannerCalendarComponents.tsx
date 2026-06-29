import React, { useMemo } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { plannerStyles as S } from './plannerShared';
import { colors } from '../../constants/theme';

type CalendarDayCellProps = {
  day: Date | null;
  dateKey: string;
  selected: boolean;
  isToday: boolean;
  hasEvent: boolean;
  hasTask: boolean;
  onPress?: () => void;
};

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  dateKey,
  selected,
  isToday,
  hasEvent,
  hasTask,
  onPress,
}) => {
  const scale = useMemo(() => new Animated.Value(1), []);

  if (!day) {
    return <View style={[S.monthDay, { opacity: 0 }]} />;
  }

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const dayText = day.getDate();
  const both = hasEvent && hasTask;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          S.calendarMonthDay,
          selected ? S.calendarMonthDaySelected : {},
          isToday && !selected ? S.calendarMonthDayToday : {},
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            S.calendarMonthDayText,
            selected ? S.calendarMonthDayTextSelected : {},
            isToday && !selected ? S.calendarMonthDayTextToday : {},
            isToday && selected ? S.calendarMonthDayTextTodaySelected : {},
          ]}
        >
          {dayText}
        </Text>
        {both ? (
          <View style={S.calendarIndicatorBoth}>
            <View style={[S.calendarIndicatorBothInner, { backgroundColor: colors.terracotta[500] }]} />
            <View style={[S.calendarIndicatorBothInner, { backgroundColor: colors.sage[500] }]} />
          </View>
        ) : hasEvent ? (
          <View style={[S.calendarIndicator, S.calendarIndicatorEvent]} />
        ) : hasTask ? (
          <View style={[S.calendarIndicator, S.calendarIndicatorTask]} />
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

type AgendaItemCardProps = {
  item: any;
  isSaving: boolean;
  onEditEvent: (item: any) => void;
  onCancelEvent: (eventId: string) => void;
  onEditTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
};

const formatTimeShort = (value?: string | null) => {
  if (!value) return '';
  if (value.includes('T')) {
    return new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  return value.slice(0, 5);
};

export const AgendaItemCard: React.FC<AgendaItemCardProps> = ({
  item,
  isSaving,
  onEditEvent,
  onCancelEvent,
  onEditTask,
  onCompleteTask,
}) => {
  if (item.type === 'event') {
    return (
      <View style={[S.calendarAgendaCard, S.calendarAgendaCardEvent]}>
        <View style={S.calendarAgendaHeader}>
          <View style={{ flex: 1 }}>
            <Text style={S.calendarAgendaTitle}>{item.title}</Text>
            <Text style={S.calendarAgendaMeta}>
              {item.all_day ? 'Todo el día' : `${formatTimeShort(item.starts_at)} - ${item.ends_at ? formatTimeShort(item.ends_at) : ''}`}
            </Text>
            {item.location_name ? (
              <Text style={S.calendarAgendaLocation}>{item.location_name}</Text>
            ) : null}
          </View>
          <View style={[S.calendarAgendaBadge, S.calendarAgendaBadgeEvent]}>
            <Text style={[S.calendarAgendaBadgeText, S.calendarAgendaBadgeTextEvent]}>Evento</Text>
          </View>
        </View>
        <View style={S.calendarAgendaActions}>
          <TouchableOpacity
            style={[S.secondaryBtn, { minHeight: 36, paddingVertical: 6 }]}
            onPress={() => onEditEvent(item)}
          >
            <Text style={S.secondaryText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.dangerBtn, { minHeight: 36, paddingVertical: 6 }, isSaving && { opacity: 0.6 }]}
            onPress={() => onCancelEvent(item.id)}
            disabled={isSaving}
          >
            <Text style={S.dangerText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isCompleted = item.status === 'completed' || item.status === 'verified';
  const isPending = item.status === 'pending' || item.status === 'awaiting_verification';
  const isHighPriority = item.priority === 'high';
  const isCriticalPriority = item.priority === 'critical';

  const priorityLabel = item.priority === 'high' ? 'Alta' : item.priority === 'critical' ? 'Crítica' : item.priority === 'medium' ? 'Normal' : 'Baja';
  const statusLabel = item.status === 'completed' ? 'Completada' : item.status === 'verified' ? 'Verificada' : item.status === 'awaiting_verification' ? 'Por verificar' : 'Pendiente';

  return (
    <View
      style={[
        S.calendarAgendaCard,
        S.calendarAgendaCardTask,
        isHighPriority ? S.calendarAgendaCardTaskHigh : {},
        isCriticalPriority ? S.calendarAgendaCardTaskCritical : {},
      ]}
    >
      <View style={S.calendarAgendaHeader}>
        <View style={{ flex: 1 }}>
          <Text style={S.calendarAgendaTitle}>{item.title}</Text>
          <Text style={S.calendarAgendaMeta}>
            {item.due_time ? formatTimeShort(item.due_time) : ''} · {priorityLabel} · {statusLabel}
          </Text>
        </View>
        <View
          style={[
            S.calendarAgendaBadge,
            isCompleted
              ? S.calendarAgendaBadgeTaskCompleted
              : S.calendarAgendaBadgeTask,
          ]}
        >
          <Text
            style={[
              S.calendarAgendaBadgeText,
              isCompleted
                ? S.calendarAgendaBadgeTextCompleted
                : S.calendarAgendaBadgeTextTask,
            ]}
          >
            Tarea
          </Text>
        </View>
      </View>
      <View style={S.calendarAgendaActions}>
        {isPending ? (
          <TouchableOpacity
            style={[S.secondaryBtn, { minHeight: 36, paddingVertical: 6 }, isSaving && { opacity: 0.6 }]}
            onPress={() => onCompleteTask(item.id)}
            disabled={isSaving}
          >
            <Text style={S.secondaryText}>Completar</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[S.secondaryBtn, { minHeight: 36, paddingVertical: 6 }]}
          onPress={() => onEditTask(item.id)}
        >
          <Text style={S.secondaryText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};