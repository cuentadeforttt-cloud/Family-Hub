import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ApiError } from '../../services/api';
import {
  cancelPlannerEvent,
  createEventOccurrenceOverride,
  createPlannerEvent,
  listPlannerEvents,
  updatePlannerEvent,
  type CreatePlannerEventPayload,
  type PlannerEventRecurrence,
} from '../../services/plannerEvents';
import { useAuth } from '../../context/AuthContext';
import { useAppRefresh } from '../../context/AppRefreshContext';
import { buildLocalIso, dateToYMD, plannerStyles as S, recurrenceLabels } from './plannerShared';
import { colors } from '../../constants/theme';

type EventFormProps = {
  mode: 'create' | 'edit';
  embedded?: boolean;
  eventId?: string;
  baseEventId?: string;
  occurrenceId?: string;
  occurrenceStartsAt?: string;
  occurrenceEndsAt?: string;
  isGeneratedRecurringOccurrence?: boolean;
  onClose?: () => void;
  onSaved?: (message: string) => void;
};

const recurrenceOptions: PlannerEventRecurrence[] = ['none', 'daily', 'weekly', 'monthly'];

const splitIso = (value?: string | null) => {
  if (!value) return { date: dateToYMD(new Date()), time: '09:00' };
  const date = new Date(value);
  return {
    date: dateToYMD(date),
    time: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
};

export function EventForm({
  mode,
  embedded = false,
  eventId: eventIdProp,
  baseEventId,
  occurrenceId,
  occurrenceStartsAt,
  occurrenceEndsAt,
  isGeneratedRecurringOccurrence,
  onClose,
  onSaved,
}: EventFormProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session, loading: authLoading } = useAuth();
  const { markPlannerChanged } = useAppRefresh();
  const accessToken = session?.access_token;
  const eventId = eventIdProp ?? route.params?.eventId as string | undefined;

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editScope, setEditScope] = useState<'occurrence' | 'series'>('occurrence');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(dateToYMD(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [recurrence, setRecurrence] = useState<PlannerEventRecurrence>('none');

  const isFormReadyForSubmit = React.useMemo(() => {
    if (authLoading || loading || saving) return false;
    if (!accessToken) return false;
    if (!title.trim()) return false;

    if (mode === 'create') {
      return true;
    }
    if (mode === 'edit' && eventId) {
      if (isGeneratedRecurringOccurrence) {
        if (editScope === 'occurrence') {
          return Boolean(baseEventId && occurrenceStartsAt);
        }
        if (editScope === 'series') {
          return Boolean(baseEventId);
        }
      }
      return true;
    }
    return false;
  }, [authLoading, loading, saving, accessToken, title, mode, eventId, isGeneratedRecurringOccurrence, editScope, baseEventId, occurrenceStartsAt]);

  useEffect(() => {
    const loadEvent = async () => {
      if (mode !== 'edit' || !accessToken || !eventId || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        const { events } = await listPlannerEvents(accessToken, {
          from: '2020-01-01T00:00:00.000Z',
          to: '2100-12-31T23:59:59.999Z',
          include_cancelled: true,
          include_recurring: true,
        });
        const event = events.find((item) => item.id === eventId);

        if (!event) {
          setError('No pudimos encontrar este evento.');
          return;
        }

        const start = splitIso(event.starts_at);
        const end = splitIso(event.ends_at);
        setTitle(event.title);
        setDescription(event.description ?? '');
        setDate(start.date);
        setStartTime(start.time);
        setEndTime(end.time);
        setAllDay(event.all_day);
        setLocationName(event.location_name ?? '');
        setRecurrence(event.recurrence);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'No pudimos cargar el evento.');
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'edit' && authLoading) {
      setLoading(true);
    }

    if (mode !== 'edit' || !authLoading) {
      void loadEvent();
    }
  }, [accessToken, eventId, mode, authLoading]);

  const submit = async () => {
    if (authLoading) {
      const message = 'Estamos preparando tu sesión. Intentá de nuevo en un momento.';
      setError(message);
      Alert.alert('Planner', message);
      return;
    }

    if (loading) {
      const message = 'Estamos preparando el formulario. Intentá de nuevo en un momento.';
      setError(message);
      Alert.alert('Planner', message);
      return;
    }

    if (!accessToken) {
      const message = 'No hay sesión activa para guardar el evento.';
      setError(message);
      Alert.alert('Planner', message);
      return;
    }

    if (!title.trim()) {
      Alert.alert('Planner', 'Agregá un título para el evento.');
      return;
    }

    if (mode === 'edit' && isGeneratedRecurringOccurrence) {
      if (editScope === 'occurrence' && (!baseEventId || !occurrenceStartsAt)) {
        Alert.alert('Planner', 'No hay información suficiente para editar este evento recurrente.');
        return;
      }
      if (editScope === 'series' && !baseEventId) {
        Alert.alert('Planner', 'No hay información suficiente para editar este evento recurrente.');
        return;
      }
    }

    const startsAt = buildLocalIso(date, allDay ? '00:00' : startTime);
    const endsAt = allDay ? undefined : buildLocalIso(date, endTime || startTime);

    if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
      Alert.alert('Planner', 'La hora de fin no puede ser anterior al inicio.');
      return;
    }

    const payload: CreatePlannerEventPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      starts_at: startsAt,
      ends_at: endsAt,
      all_day: allDay,
      location_name: locationName.trim() || undefined,
      recurrence,
    };

    if (__DEV__) {
      console.log('[EventForm submit]', {
        mode,
        hasAccessToken: Boolean(accessToken),
        authLoading,
        eventId,
        isGeneratedRecurringOccurrence,
        editScope,
        baseEventId,
        occurrenceStartsAt,
        occurrenceEndsAt,
        payload,
      });
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === 'edit' && eventId) {
        let targetEventId = eventId;

if (isGeneratedRecurringOccurrence) {
            if (editScope === 'occurrence') {
              if (!baseEventId || !occurrenceStartsAt) {
                const message = 'No hay información suficiente para editar este evento recurrente.';
                setError(message);
                Alert.alert('Planner', message);
                return;
              }

              const overrideResponse = await createEventOccurrenceOverride(accessToken, baseEventId, {
                original_occurrence_start_at: occurrenceStartsAt,
                starts_at: occurrenceStartsAt,
                ends_at: occurrenceEndsAt ?? undefined,
              });
              targetEventId = overrideResponse.event.id;
            } else if (editScope === 'series') {
              if (!baseEventId) {
                const message = 'No hay información suficiente para editar este evento recurrente.';
                setError(message);
                Alert.alert('Planner', message);
                return;
              }
              targetEventId = baseEventId;
            }
          }

        await updatePlannerEvent(accessToken, targetEventId, payload);
        markPlannerChanged();
        if (onSaved) {
          onSaved('Evento actualizado.');
        } else {
          Alert.alert('Planner', 'Evento actualizado.');
        }
      } else {
        await createPlannerEvent(accessToken, payload);
        markPlannerChanged();
        if (onSaved) {
          onSaved('Evento creado.');
        } else {
          Alert.alert('Planner', 'Evento creado.');
        }
      }

      if (!onSaved) {
        navigation.navigate('PlannerHome', { refreshKey: Date.now(), initialTab: 'calendar' });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No pudimos guardar el evento.';
      setError(message);
      Alert.alert('Planner', message);

      if (__DEV__ && err instanceof ApiError) {
        console.error('[EventForm submit error]', {
          message: err.message,
          status: err.status,
          code: err.code,
          debugMessage: err.debugMessage,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const cancelEvent = () => {
    if (!accessToken || !eventId) return;

    Alert.alert('¿Cancelar este evento?', 'Dejará de aparecer como próximo evento.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar evento',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await cancelPlannerEvent(accessToken, eventId);
            markPlannerChanged();
            if (onSaved) {
              onSaved('Evento cancelado.');
            } else {
              Alert.alert('Planner', 'Evento cancelado.');
              navigation.navigate('PlannerHome', { refreshKey: Date.now(), initialTab: 'calendar' });
            }
          } catch (err) {
            Alert.alert('Planner', err instanceof ApiError ? err.message : 'No pudimos cancelar el evento.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const closeForm = () => {
    if (onClose) {
      onClose();
      return;
    }

    navigation.goBack();
  };

  const handlePressOutside = () => {
    Keyboard.dismiss();
  };

  const content = loading ? (
    <View style={[S.content, { minHeight: 220, justifyContent: 'center' }]}>
      <ActivityIndicator color="#CD7353" />
    </View>
  ) : (
    <Pressable style={{ flex: 1 }} onPress={handlePressOutside}>
      <KeyboardAwareScrollView
        style={embedded ? undefined : S.scroll}
        contentContainerStyle={embedded ? { paddingBottom: 26 } : S.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={48}
      >
        <View style={[S.headerRow, { marginBottom: 18 }]}>
          <View style={{ flex: 1 }}>
            <Text style={S.title}>{mode === 'edit' ? 'Editar evento' : 'Crear evento'}</Text>
            <Text style={S.subtitle}>
              {mode === 'edit'
                ? 'Ajustá los detalles sin perder la coordinación familiar.'
                : 'Agendá un momento importante para que todos estén al tanto.'}
            </Text>
          </View>
          <TouchableOpacity style={S.secondaryBtn} onPress={closeForm}>
            <Text style={S.secondaryText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={S.errorBox}>
            <Text style={S.errorText}>{error}</Text>
          </View>
        ) : null}

        {mode === 'edit' && isGeneratedRecurringOccurrence ? (
          <View style={S.eventScopeCard}>
            <Text style={S.formLabelHuman}>Alcance de la edición</Text>
            <View style={[S.row, { gap: 8 }]}>
              <TouchableOpacity
                style={[
                  S.eventFormChip,
                  editScope === 'occurrence' && S.eventFormChipActive,
                  { flex: 1, alignItems: 'center', paddingVertical: 10 },
                ]}
                onPress={() => setEditScope('occurrence')}
              >
                <Text
                  style={[
                    S.eventFormChipText,
                    editScope === 'occurrence' && S.eventFormChipTextActive,
                  ]}
                >
                  Solo este evento
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  S.eventFormChip,
                  editScope === 'series' && S.eventFormChipActive,
                  { flex: 1, alignItems: 'center', paddingVertical: 10 },
                ]}
                onPress={() => setEditScope('series')}
              >
                <Text
                  style={[
                    S.eventFormChipText,
                    editScope === 'series' && S.eventFormChipTextActive,
                  ]}
                >
                  Toda la serie
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={S.eventScopeHelper}>
              Elegí si este cambio afecta solo esta fecha o toda la serie.
            </Text>
          </View>
        ) : null}

        <View style={S.eventFormSection}>
            <Text style={S.formLabelHuman}>¿Qué evento es?</Text>
            <TextInput
              style={[S.eventFormInput, S.eventFormInputFocus]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej. Control médico, Cumpleaños de Ana..."
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={S.eventFormSection}>
            <Text style={S.formLabelHuman}>Descripción</Text>
            <TextInput
              style={[S.eventFormInput, S.textArea, S.eventFormInputFocus]}
              value={description}
              onChangeText={setDescription}
              placeholder="Notas adicionales del evento..."
              placeholderTextColor={colors.text.tertiary}
              multiline
            />
          </View>

          <View style={S.eventFormSection}>
            <Text style={S.formLabelHuman}>Fecha</Text>
            <TextInput
              style={[S.eventFormInput, S.eventFormInputFocus]}
              value={date}
              onChangeText={setDate}
              placeholder="2024-06-15"
              placeholderTextColor={colors.text.tertiary}
            />
            <Text style={S.formHelperText}>Usá el formato AAAA-MM-DD.</Text>
          </View>

          <View style={S.allDayCompactCard}>
            <Text style={S.allDayLabel}>Todo el día</Text>
            <Switch value={allDay} onValueChange={setAllDay} />
          </View>

          {!allDay ? (
            <View style={S.eventFormSection}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={S.formLabelHuman}>Hora de inicio</Text>
                  <TextInput
                    style={[S.eventFormInput, S.eventFormInputFocus]}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.formLabelHuman}>Hora de fin</Text>
                  <TextInput
                    style={[S.eventFormInput, S.eventFormInputFocus]}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="18:30"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>
              </View>
              <Text style={S.formHelperText}>Usá formato 24hs, ej. 14:30.</Text>
            </View>
          ) : null}

          <View style={S.eventFormSection}>
            <Text style={S.formLabelHuman}>Lugar</Text>
            <TextInput
              style={[S.eventFormInput, S.eventFormInputFocus]}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Ej. Sanatorio Güemes, Casa de María..."
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

        <View style={S.eventFormSection}>
            <Text style={S.formLabelHuman}>Repetición</Text>
            <View style={[S.row, { marginBottom: 0 }]}>
              {recurrenceOptions.map((item) => {
                const active = recurrence === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[S.eventFormChip, active && S.eventFormChipActive]}
                    onPress={() => setRecurrence(item)}
                  >
                    <Text style={[S.eventFormChipText, active && S.eventFormChipTextActive]}>
                      {recurrenceLabels[item]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        <TouchableOpacity
          style={[S.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={() => void submit()}
          disabled={saving || loading || authLoading || !isFormReadyForSubmit}
        >
          <Text style={S.btnText}>
            {saving
              ? mode === 'edit'
                ? 'Guardando...'
                : 'Creando evento...'
              : mode === 'edit'
              ? 'Guardar cambios'
              : 'Crear evento'}
          </Text>
        </TouchableOpacity>

        {mode === 'edit' ? (
          <TouchableOpacity
            style={[S.dangerBtn, { marginTop: 12 }, saving && { opacity: 0.6 }]}
            onPress={cancelEvent}
            disabled={saving}
          >
            <Text style={S.dangerText}>Cancelar evento</Text>
          </TouchableOpacity>
        ) : null}
      </KeyboardAwareScrollView>
    </Pressable>
  );

  if (embedded) {
    return content;
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {content}
    </SafeAreaView>
  );
}
