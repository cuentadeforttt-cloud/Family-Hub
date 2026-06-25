import React, { useEffect, useMemo, useState } from 'react';
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
  createPlannerTask,
  listPlannerTasks,
  updatePlannerTask,
  type CreatePlannerTaskPayload,
  type PlannerTask,
  type PlannerTaskPriority,
  type PlannerTaskTemplateKey,
} from '../../services/plannerTasks';
import { OTHER_PLANNER_TEMPLATE, PLANNER_TASK_TEMPLATES } from '../../services/plannerTemplates';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { addDays, dateToYMD, plannerStyles as S, priorityLabels } from './plannerShared';

type TaskFormProps = {
  mode: 'create' | 'edit';
  embedded?: boolean;
  taskId?: string;
  onClose?: () => void;
  onSaved?: (message: string) => void;
};

type ResponsibilityKey = PlannerTaskTemplateKey | 'other' | '';

const priorityOptions: PlannerTaskPriority[] = ['low', 'medium', 'high'];

const getMemberName = (member: ReturnType<typeof useHousehold>['members'][number]) =>
  member.user?.nombre || 'Miembro';

const getQuickDate = (key: string) => {
  const today = new Date();

  if (key === 'today') return dateToYMD(today);
  if (key === 'tomorrow') return dateToYMD(addDays(today, 1));
  if (key === 'week') return dateToYMD(addDays(today, 7));
  return '';
};

export function TaskForm({
  mode,
  embedded = false,
  taskId: taskIdProp,
  onClose,
  onSaved,
}: TaskFormProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session, authMe, loading: authLoading } = useAuth();
  const { members } = useHousehold();
  const accessToken = session?.access_token;
  const taskId = taskIdProp ?? route.params?.taskId as string | undefined;

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState<ResponsibilityKey>('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PlannerTaskPriority>('medium');
  const [category, setCategory] = useState('');
  const [quickDate, setQuickDate] = useState('today');
  const [dueDate, setDueDate] = useState(dateToYMD(new Date()));
  const [dueTime, setDueTime] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const activeMembers = useMemo(() => members, [members]);
  const myMembershipId = useMemo(() => {
    const householdId = authMe?.active_household?.id;
    return authMe?.memberships.find(
      (membership) => membership.household_id === householdId && membership.status === 'active',
    )?.id ?? '';
  }, [authMe?.active_household?.id, authMe?.memberships]);

  useEffect(() => {
    const loadTask = async () => {
      if (mode !== 'edit' || !accessToken || !taskId || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        const { tasks } = await listPlannerTasks(accessToken, { include_cancelled: true, limit: 500 });
        const task = tasks.find((item) => item.id === taskId) as PlannerTask | undefined;

        if (!task) {
          setError('No pudimos encontrar esta tarea.');
          return;
        }

        setTemplateKey(task.template_key ?? (task.category ? 'other' : ''));
        setTitle(task.title);
        setTitleTouched(true);
        setDescription(task.description ?? '');
        setPriority(task.priority === 'critical' ? 'high' : task.priority);
        setCategory(task.category ?? '');
        setDueDate(task.due_date ?? '');
        setQuickDate(task.due_date ? 'custom' : 'none');
        setDueTime(task.due_time ? task.due_time.slice(0, 5) : '');
        setAssignedMemberId(task.assigned_to_member_id ?? '');
        setRequiresVerification(task.requires_verification);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'No pudimos cargar la tarea.');
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'edit' && authLoading) {
      setLoading(true);
    }

    if (mode !== 'edit' || !authLoading) {
      void loadTask();
    }
  }, [accessToken, mode, taskId, authLoading]);

  const selectTemplate = (key: ResponsibilityKey) => {
    if (key === 'other') {
      setTemplateKey(key);
      setCategory('');
      setShowMore(true);
      return;
    }

    const template = PLANNER_TASK_TEMPLATES.find((item) => item.key === key);
    if (!template) return;

    setTemplateKey(template.key);
    setCategory(template.category);
    if (!titleTouched && !title.trim()) {
      setTitle(template.defaultTitle);
    }
  };

  const selectQuickDate = (key: string) => {
    setQuickDate(key);
    if (key === 'custom') {
      setShowMore(true);
      return;
    }

    setDueDate(getQuickDate(key));
  };

  const closeForm = () => {
    if (onClose) {
      onClose();
      return;
    }

    navigation.goBack();
  };

  const submit = async () => {
    if (!accessToken) {
      Alert.alert('Planner', 'Necesitas iniciar sesion nuevamente.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Planner', 'El titulo es obligatorio.');
      return;
    }

    const payload: CreatePlannerTaskPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category: category.trim() || undefined,
      due_date: dueDate.trim() || undefined,
      due_time: dueTime.trim() || undefined,
      assigned_to_member_id: assignedMemberId || undefined,
      requires_verification: requiresVerification,
    };

    if (templateKey && templateKey !== 'other') {
      payload.template_key = templateKey;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === 'edit' && taskId) {
        await updatePlannerTask(accessToken, taskId, payload);
        if (onSaved) {
          onSaved('Tarea actualizada.');
        } else {
          Alert.alert('Planner', 'Tarea actualizada.');
        }
      } else {
        await createPlannerTask(accessToken, payload);
        if (onSaved) {
          onSaved('Tarea creada.');
        } else {
          Alert.alert('Planner', 'Tarea creada.');
        }
      }

      if (!onSaved) {
        navigation.navigate('PlannerHome', { refreshKey: Date.now() });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No pudimos guardar la tarea.';
      setError(message);
      Alert.alert('Planner', message);
    } finally {
      setSaving(false);
    }
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
            <Text style={S.title}>{mode === 'edit' ? 'Editar tarea' : 'Nueva tarea'}</Text>
            <Text style={S.subtitle}>Los cambios se guardan en el hogar activo.</Text>
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

        <Text style={S.label}>Responsabilidad</Text>
        <View style={[S.row, { marginBottom: 12 }]}>
          {PLANNER_TASK_TEMPLATES.map((template) => {
            const active = templateKey === template.key;
            return (
              <TouchableOpacity
                key={template.key}
                style={[S.chip, active && S.chipActive]}
                onPress={() => selectTemplate(template.key)}
              >
                <Text style={[S.chipText, active && S.chipTextActive]}>{template.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[S.chip, templateKey === OTHER_PLANNER_TEMPLATE.key && S.chipActive]}
            onPress={() => selectTemplate('other')}
          >
            <Text style={[S.chipText, templateKey === 'other' && S.chipTextActive]}>Otro</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.label}>Titulo</Text>
        <TextInput
          style={S.input}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setTitleTouched(true);
          }}
          placeholder="Ej. Comprar leche"
        />

        <Text style={S.label}>Responsable</Text>
        <View style={[S.row, { marginBottom: 12 }]}>
          <TouchableOpacity
            style={[S.chip, !assignedMemberId && S.chipActive]}
            onPress={() => setAssignedMemberId('')}
          >
            <Text style={[S.chipText, !assignedMemberId && S.chipTextActive]}>Sin asignar</Text>
          </TouchableOpacity>
          {myMembershipId ? (
            <TouchableOpacity
              style={[S.chip, assignedMemberId === myMembershipId && S.chipActive]}
              onPress={() => setAssignedMemberId(myMembershipId)}
            >
              <Text style={[S.chipText, assignedMemberId === myMembershipId && S.chipTextActive]}>Yo</Text>
            </TouchableOpacity>
          ) : null}
          {activeMembers
            .filter((member) => member.id !== myMembershipId)
            .map((member) => {
            const active = assignedMemberId === member.id;
            return (
              <TouchableOpacity
                key={member.id}
                style={[S.chip, active && S.chipActive]}
                onPress={() => setAssignedMemberId(member.id)}
              >
                <Text style={[S.chipText, active && S.chipTextActive]}>{getMemberName(member)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={S.label}>Fecha rapida</Text>
        <View style={[S.row, { marginBottom: 12 }]}>
          {[
            ['today', 'Hoy'],
            ['tomorrow', 'Mañana'],
            ['week', 'Esta semana'],
            ['none', 'Sin fecha'],
            ['custom', 'Elegir fecha'],
          ].map(([key, label]) => {
            const active = quickDate === key;
            return (
              <TouchableOpacity key={key} style={[S.chip, active && S.chipActive]} onPress={() => selectQuickDate(key)}>
                <Text style={[S.chipText, active && S.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={S.label}>Prioridad</Text>
        <View style={[S.row, { marginBottom: 12 }]}>
          {priorityOptions.map((item) => {
            const active = priority === item;
            return (
              <TouchableOpacity
                key={item}
                style={[S.chip, active && S.chipActive]}
                onPress={() => setPriority(item)}
              >
                <Text style={[S.chipText, active && S.chipTextActive]}>{priorityLabels[item]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[S.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: '#17201A', fontWeight: '800', fontSize: 15 }}>Requiere verificacion</Text>
            <Text style={S.muted}>Al completar, queda pendiente hasta que otro miembro la verifique.</Text>
          </View>
          <Switch value={requiresVerification} onValueChange={setRequiresVerification} />
        </View>

        <TouchableOpacity style={S.secondaryBtn} onPress={() => setShowMore((value) => !value)}>
          <Text style={S.secondaryText}>{showMore ? 'Ocultar opciones' : 'Mas opciones'}</Text>
        </TouchableOpacity>

        {showMore ? (
          <View style={{ marginTop: 14 }}>
            <Text style={S.label}>Descripcion</Text>
            <TextInput
              style={[S.input, S.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Notas para el hogar"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>Fecha exacta</Text>
                <TextInput
                  style={S.input}
                  value={dueDate}
                  onChangeText={(value) => {
                    setDueDate(value);
                    setQuickDate(value ? 'custom' : 'none');
                  }}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>Hora</Text>
                <TextInput style={S.input} value={dueTime} onChangeText={setDueTime} placeholder="HH:mm" />
              </View>
            </View>

            {templateKey === 'other' ? (
              <>
                <Text style={S.label}>Categoria libre</Text>
                <TextInput style={S.input} value={category} onChangeText={setCategory} placeholder="Ej. Jardin" />
              </>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={[S.primaryBtn, { marginTop: 16 }, saving && { opacity: 0.6 }]}
          onPress={() => void submit()}
          disabled={saving}
        >
          <Text style={S.btnText}>{saving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear tarea'}</Text>
        </TouchableOpacity>
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
