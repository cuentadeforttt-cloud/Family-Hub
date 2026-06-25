import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ApiError } from '../../services/api';
import {
  cancelPlannerEvent,
  createPlannerEvent,
  listPlannerEvents,
  updatePlannerEvent,
  type CreatePlannerEventPayload,
  type PlannerEventRecurrence,
} from '../../services/plannerEvents';
import { useAuth } from '../../context/AuthContext';
import { buildLocalIso, dateToYMD, plannerStyles as S, recurrenceLabels } from './plannerShared';

type EventFormProps = {
  mode: 'create' | 'edit';
  embedded?: boolean;
  eventId?: string;
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
  onClose,
  onSaved,
}: EventFormProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session, loading: authLoading } = useAuth();
  const accessToken = session?.access_token;
  const eventId = eventIdProp ?? route.params?.eventId as string | undefined;

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(dateToYMD(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [recurrence, setRecurrence] = useState<PlannerEventRecurrence>('none');

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
          include_recurring: false,
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
    if (!accessToken) {
      Alert.alert('Planner', 'Necesitas iniciar sesion nuevamente.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Planner', 'El titulo es obligatorio.');
      return;
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

    setSaving(true);
    setError(null);

    try {
      if (mode === 'edit' && eventId) {
        await updatePlannerEvent(accessToken, eventId, payload);
        if (onSaved) {
          onSaved('Evento actualizado.');
        } else {
          Alert.alert('Planner', 'Evento actualizado.');
        }
      } else {
        await createPlannerEvent(accessToken, payload);
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
    } finally {
      setSaving(false);
    }
  };

  const cancelEvent = () => {
    if (!accessToken || !eventId) return;

    Alert.alert('¿Cancelar este evento?', 'Dejara de aparecer como proximo evento.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar evento',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await cancelPlannerEvent(accessToken, eventId);
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

  const content = loading ? (
    <View style={[S.content, { minHeight: 220, justifyContent: 'center' }]}>
      <ActivityIndicator color="#CD7353" />
    </View>
  ) : (
      <ScrollView
        style={embedded ? undefined : S.scroll}
        contentContainerStyle={embedded ? { paddingBottom: 26 } : S.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[S.headerRow, { marginBottom: 18 }]}>
          <View style={{ flex: 1 }}>
            <Text style={S.title}>{mode === 'edit' ? 'Editar evento' : 'Nuevo evento'}</Text>
            <Text style={S.subtitle}>Recurrencia simple y agenda compartida del hogar.</Text>
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

        <Text style={S.label}>Titulo</Text>
        <TextInput style={S.input} value={title} onChangeText={setTitle} placeholder="Ej. Control medico" />

        <Text style={S.label}>Descripcion</Text>
        <TextInput
          style={[S.input, S.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Notas del evento"
          multiline
        />

        <Text style={S.label}>Fecha</Text>
        <TextInput style={S.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

        <View style={[S.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={{ color: '#17201A', fontWeight: '800', fontSize: 15 }}>Todo el dia</Text>
          <Switch value={allDay} onValueChange={setAllDay} />
        </View>

        {!allDay ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={S.label}>Inicio</Text>
              <TextInput style={S.input} value={startTime} onChangeText={setStartTime} placeholder="HH:mm" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.label}>Fin</Text>
              <TextInput style={S.input} value={endTime} onChangeText={setEndTime} placeholder="HH:mm" />
            </View>
          </View>
        ) : null}

        <Text style={S.label}>Ubicacion</Text>
        <TextInput style={S.input} value={locationName} onChangeText={setLocationName} placeholder="Ej. Sanatorio" />

        <Text style={S.label}>Recurrencia</Text>
        <View style={[S.row, { marginBottom: 18 }]}>
          {recurrenceOptions.map((item) => {
            const active = recurrence === item;
            return (
              <TouchableOpacity
                key={item}
                style={[S.chip, active && S.chipActive]}
                onPress={() => setRecurrence(item)}
              >
                <Text style={[S.chipText, active && S.chipTextActive]}>{recurrenceLabels[item]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[S.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={() => void submit()}
          disabled={saving}
        >
          <Text style={S.btnText}>{saving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear evento'}</Text>
        </TouchableOpacity>

        {mode === 'edit' ? (
          <TouchableOpacity
            style={[S.dangerBtn, { marginTop: 10 }, saving && { opacity: 0.6 }]}
            onPress={cancelEvent}
            disabled={saving}
          >
            <Text style={S.dangerText}>Cancelar evento</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
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
