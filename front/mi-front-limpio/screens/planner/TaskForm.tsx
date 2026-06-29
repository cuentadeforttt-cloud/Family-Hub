import React, { useEffect, useMemo, useState } from 'react';
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
import { StyleSheet } from 'react-native';
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
import { useAppRefresh } from '../../context/AppRefreshContext';
import { addDays, dateToYMD, plannerStyles as S, priorityLabels, formatDate } from './plannerShared';
import { colors } from '../../constants/theme';

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
  const { markPlannerChanged } = useAppRefresh();
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
  const [inputFocus, setInputFocus] = useState<string | null>(null);

  const activeMembers = useMemo(() => members, [members]);
  const myMembershipId = useMemo(() => {
    const householdId = authMe?.active_household?.id;
    return authMe?.memberships.find(
      (membership) => membership.household_id === householdId && membership.status === 'active',
    )?.id ?? '';
  }, [authMe?.active_household?.id, authMe?.memberships]);

  const isFormReadyForSubmit = useMemo(() => {
    if (authLoading || loading || saving) return false;
    if (!accessToken) return false;
    if (!title.trim()) return false;

    if (mode === 'create') {
      return true;
    }
    if (mode === 'edit' && taskId) {
      return true;
    }
    return false;
  }, [authLoading, loading, saving, accessToken, title, mode, taskId]);

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

  const handlePressOutside = () => {
    Keyboard.dismiss();
  };

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
      const message = 'No hay sesión activa para guardar la tarea.';
      setError(message);
      Alert.alert('Planner', message);
      return;
    }

    if (!title.trim()) {
      setError('Agregá un título para la tarea.');
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

    if (__DEV__) {
      console.log('[TaskForm submit]', {
        mode,
        hasAccessToken: Boolean(accessToken),
        authLoading,
        loading,
        saving,
        title,
        requiresVerification,
        payloadRequiresVerification: payload.requires_verification,
      });
    }

    setSaving(true);

    try {
      if (mode === 'edit' && taskId) {
        await updatePlannerTask(accessToken, taskId, payload);
        markPlannerChanged();
        const successMsg = 'Tarea actualizada.';
        if (onSaved) {
          onSaved(successMsg);
        } else {
          Alert.alert('Planner', successMsg);
        }
      } else {
        await createPlannerTask(accessToken, payload);
        markPlannerChanged();
        const successMsg = 'Tarea creada.';
        if (onSaved) {
          onSaved(successMsg);
        } else {
          Alert.alert('Planner', successMsg);
        }
      }

      if (!onSaved) {
        navigation.navigate('PlannerHome', { refreshKey: Date.now() });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No pudimos guardar la tarea. Probá de nuevo.';
      setError(message);
      Alert.alert('Planner', message);

      if (__DEV__ && err instanceof ApiError) {
        console.error('[TaskForm submit error]', {
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
            <Text style={S.title}>{mode === 'edit' ? 'Editar tarea' : 'Crear tarea'}</Text>
            <Text style={S.subtitle}>
              {mode === 'edit'
                ? 'Ajustá los detalles sin perder el seguimiento.'
                : 'Sumá una responsabilidad para que la casa avance sin confusiones.'}
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

        <Text style={S.formLabelHuman}>¿Qué hay que hacer?</Text>
        <View style={[S.row, { marginBottom: 12 }]}>
          {PLANNER_TASK_TEMPLATES.map((template) => {
            const active = templateKey === template.key;
            return (
              <TouchableOpacity
                key={template.key}
                style={[S.taskFormChip, active && S.taskFormChipActive]}
                onPress={() => selectTemplate(template.key)}
              >
                <Text style={[S.taskFormChipText, active && S.taskFormChipTextActive]}>{template.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[S.taskFormChip, templateKey === OTHER_PLANNER_TEMPLATE.key && S.taskFormChipActive]}
            onPress={() => selectTemplate('other')}
          >
            <Text style={[S.taskFormChipText, templateKey === 'other' && S.taskFormChipTextActive]}>Otro</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            S.formInputFocused,
            inputFocus === 'title' && S.formInputFocusedFocus,
            error && !title.trim() && { borderColor: colors.danger.base },
          ]}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setTitleTouched(true);
            if (error && !titleTouched) setError(null);
          }}
          onFocus={() => setInputFocus('title')}
          onBlur={() => setInputFocus(null)}
          placeholder="Ej. Comprar leche"
        />
        {!title.trim() && titleTouched ? (
          <Text style={S.formErrorInline}>Agregá un título para la tarea.</Text>
        ) : null}

        <Text style={S.formLabelHuman}>Responsable</Text>
        <View style={[S.row, { marginBottom: 12 }]}>
          <TouchableOpacity
            style={[S.taskFormChip, !assignedMemberId && S.taskFormChipActive]}
            onPress={() => setAssignedMemberId('')}
          >
            <Text style={[S.taskFormChipText, !assignedMemberId && S.taskFormChipTextActive]}>Sin asignar</Text>
          </TouchableOpacity>
          {myMembershipId ? (
            <TouchableOpacity
              style={[S.taskFormChip, assignedMemberId === myMembershipId && S.taskFormChipActive]}
              onPress={() => setAssignedMemberId(myMembershipId)}
            >
              <Text style={[S.taskFormChipText, assignedMemberId === myMembershipId && S.taskFormChipTextActive]}>Yo</Text>
            </TouchableOpacity>
          ) : null}
          {activeMembers
            .filter((member) => member.id !== myMembershipId)
            .map((member) => {
            const active = assignedMemberId === member.id;
            return (
              <TouchableOpacity
                key={member.id}
                style={[S.taskFormChip, active && S.taskFormChipActive]}
                onPress={() => setAssignedMemberId(member.id)}
              >
                <Text style={[S.taskFormChipText, active && S.taskFormChipTextActive]}>{getMemberName(member)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={S.formLabelHuman}>¿Para cuándo?</Text>
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
              <TouchableOpacity key={key} style={[S.taskFormChip, active && S.taskFormChipActive]} onPress={() => selectQuickDate(key)}>
                <Text style={[S.taskFormChipText, active && S.taskFormChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={S.formLabelHuman}>Prioridad</Text>
        <View style={[S.row, { marginBottom: 12 }]}>
          {priorityOptions.map((item) => {
            const active = priority === item;
            const priorityChipStyle =
              item === 'low'
                ? S.taskFormChipPriorityLow
                : item === 'medium'
                ? S.taskFormChipPriorityNormal
                : S.taskFormChipPriorityHigh;
            const priorityChipActiveStyle =
              item === 'low'
                ? S.taskFormChipPriorityLowActive
                : item === 'medium'
                ? S.taskFormChipPriorityNormalActive
                : S.taskFormChipPriorityHighActive;
            const priorityChipTextStyle =
              item === 'low'
                ? S.taskFormChipPriorityLowText
                : item === 'medium'
                ? S.taskFormChipPriorityNormalText
                : S.taskFormChipPriorityHighText;
            const priorityChipTextActiveStyle =
              item === 'low'
                ? S.taskFormChipPriorityLowTextActive
                : item === 'medium'
                ? S.taskFormChipPriorityNormalTextActive
                : S.taskFormChipPriorityHighTextActive;
            return (
              <TouchableOpacity
                key={item}
                style={[S.taskFormChip, priorityChipStyle, active && priorityChipActiveStyle]}
                onPress={() => setPriority(item)}
              >
                <Text style={[priorityChipTextStyle, active && priorityChipTextActiveStyle]}>{priorityLabels[item]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[S.verificationCompactCard]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={S.verificationTitle}>Pedir revisión</Text>
            <Text style={S.verificationHelper}>
              Útil para tareas que otra persona tiene que confirmar.
            </Text>
            <Text style={S.verificationStatus}>
              {requiresVerification ? 'Con revisión' : 'Sin revisión'}
            </Text>
          </View>
          <Switch
            value={requiresVerification}
            onValueChange={setRequiresVerification}
            trackColor={{ false: colors.border.default, true: colors.terracotta[100] }}
            thumbColor={requiresVerification ? colors.terracotta[500] : colors.surface.card}
          />
        </View>

        <TouchableOpacity style={S.secondaryBtn} onPress={() => setShowMore((value) => !value)}>
          <Text style={S.secondaryText}>{showMore ? 'Ocultar detalles' : 'Agregar detalles'}</Text>
        </TouchableOpacity>

        {showMore ? (
          <View style={{ marginTop: 14 }}>
            <Text style={S.formLabelHuman}>Detalles</Text>
            <TextInput
              style={[S.formInputFocused, inputFocus === 'description' && S.formInputFocusedFocus]}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setInputFocus('description')}
              onBlur={() => setInputFocus(null)}
              placeholder="Notas para el hogar"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.formLabelHuman}>Fecha exacta</Text>
                <TextInput
                  style={[S.formInputFocused, inputFocus === 'dueDate' && S.formInputFocusedFocus]}
                  value={dueDate}
                  onChangeText={(value) => {
                    setDueDate(value);
                    setQuickDate(value ? 'custom' : 'none');
                  }}
                  onFocus={() => setInputFocus('dueDate')}
                  onBlur={() => setInputFocus(null)}
                  placeholder="2025-06-30"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.formLabelHuman}>Hora</Text>
                <TextInput
                  style={[S.formInputFocused, inputFocus === 'dueTime' && S.formInputFocusedFocus]}
                  value={dueTime}
                  onChangeText={setDueTime}
                  onFocus={() => setInputFocus('dueTime')}
                  onBlur={() => setInputFocus(null)}
                  placeholder="14:30"
                />
              </View>
            </View>

            {templateKey === 'other' ? (
              <>
                <Text style={S.formLabelHuman}>Categoría</Text>
                <TextInput
                  style={[S.formInputFocused, inputFocus === 'category' && S.formInputFocusedFocus]}
                  value={category}
                  onChangeText={setCategory}
                  onFocus={() => setInputFocus('category')}
                  onBlur={() => setInputFocus(null)}
                  placeholder="Ej. Jardín"
                />
              </>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            S.primaryBtn,
            { marginTop: 16 },
            (!isFormReadyForSubmit || saving) && { opacity: 0.6 },
          ]}
          onPress={() => void submit()}
          disabled={saving || loading || authLoading || !isFormReadyForSubmit}
        >
          <Text style={S.btnText}>
            {saving
              ? (mode === 'edit' ? 'Guardando...' : 'Creando tarea...')
              : mode === 'edit'
              ? 'Guardar cambios'
              : 'Crear tarea'}
          </Text>
        </TouchableOpacity>
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
