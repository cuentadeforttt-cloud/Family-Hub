import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { ActionPill, AppButton, AppCard, AppText, ErrorState, Skeleton } from '../../components/ui';
import { ApiError } from '../../services/api';
import { getPlannerSummary, type PlannerSummary } from '../../services/plannerSummary';
import { useAuth } from '../../context/AuthContext';
import { EventForm } from './EventForm';
import { PlannerCalendarScreen } from './PlannerCalendarScreen';
import { PlannerTasksScreen } from './PlannerTasksScreen';
import { TaskForm } from './TaskForm';
import { plannerStyles as S } from './plannerShared';

type PlannerInternalTab = 'tasks' | 'calendar' | 'goals';
type PlannerSheet =
  | { type: 'task'; mode: 'create' | 'edit'; id?: string }
  | { type: 'event'; mode: 'create' | 'edit'; id?: string };

export function PlannerScreen() {
  const route = useRoute<any>();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [activeTab, setActiveTab] = useState<PlannerInternalTab>(route.params?.initialTab ?? 'tasks');
  const [summary, setSummary] = useState<PlannerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<PlannerSheet | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadSummary = useCallback(async (silent = false) => {
    if (!accessToken) return;

    if (!silent) setLoading(true);
    setError(null);

    try {
      const nextSummary = await getPlannerSummary(accessToken);
      setSummary(nextSummary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cargar Planner.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (route.params?.initialTab === 'calendar') {
      setActiveTab('calendar');
    } else if (route.params?.initialTab === 'goals') {
      setActiveTab('goals');
    } else if (route.params?.initialTab === 'tasks') {
      setActiveTab('tasks');
    }

    if (route.params?.initialSheet === 'task') {
      setSheet({ type: 'task', mode: 'create' });
    }

    if (route.params?.initialSheet === 'event') {
      setSheet({ type: 'event', mode: 'create' });
    }

    setRefreshKey((value) => value + 1);
    void loadSummary();
  }, [loadSummary, route.params?.refreshKey, route.params?.initialTab, route.params?.initialSheet, route.params?.sheetKey]);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((value) => value + 1);
      void loadSummary(true);
    }, [loadSummary]),
  );

  const refresh = async () => {
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
    await loadSummary(true);
    setRefreshing(false);
  };

  const changed = () => {
    setRefreshKey((value) => value + 1);
    void loadSummary(true);
  };

  const completeSheetMutation = (message: string) => {
    setSheet(null);
    setToast(message);
    changed();
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >
        <View style={[S.headerRow, { marginBottom: 16 }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="title1">Planner</AppText>
            <AppText variant="bodySmall" tone="secondary" style={S.subtitle}>
              Tareas, eventos y calendario compartido para el hogar.
            </AppText>
          </View>
          <AppButton title="Actualizar" variant="secondary" size="sm" onPress={() => void refresh()} />
        </View>

        {toast ? (
          <View style={S.toastBox}>
            <AppText variant="bodySmall" tone="success" weight="700">{toast}</AppText>
          </View>
        ) : null}

        {loading ? (
          <Skeleton variant="screenSection" />
        ) : null}

        {!loading && error ? (
          <ErrorState description={error} onRetry={() => void loadSummary()} />
        ) : null}

        {!loading && !error && activeTab === 'tasks' ? (
          <>
            <View style={[S.row, { marginBottom: 14 }]}>
              <AppCard variant="quiet" padding="compact" style={{ flex: 1, minWidth: 96 }}>
                <AppText variant="micro" tone="tertiary" weight="700">Pendientes</AppText>
                <AppText variant="title2">
                  {summary?.pending_tasks_count ?? 0}
                </AppText>
              </AppCard>
              <AppCard variant="quiet" padding="compact" style={{ flex: 1, minWidth: 96 }}>
                <AppText variant="micro" tone="tertiary" weight="700">Hoy</AppText>
                <AppText variant="title2">
                  {summary?.today_tasks_count ?? 0}
                </AppText>
              </AppCard>
              <AppCard variant="warning" padding="compact" style={{ flex: 1, minWidth: 96 }}>
                <AppText variant="micro" tone="warning" weight="700">Vencidas</AppText>
                <AppText variant="title2">
                  {summary?.overdue_tasks_count ?? 0}
                </AppText>
              </AppCard>
              <AppCard variant="success" padding="compact" style={{ flex: 1, minWidth: 96 }}>
                <AppText variant="micro" tone="success" weight="700">Por verificar</AppText>
                <AppText variant="title2">
                  {summary?.awaiting_verification_count ?? 0}
                </AppText>
              </AppCard>
            </View>
          </>
        ) : null}

        <View style={[S.row, { marginTop: 4, marginBottom: 14 }]}>
          <ActionPill label="Tareas" selected={activeTab === 'tasks'} onPress={() => setActiveTab('tasks')} />
          <ActionPill label="Calendario" selected={activeTab === 'calendar'} onPress={() => setActiveTab('calendar')} />
          <ActionPill label="Metas" selected={activeTab === 'goals'} onPress={() => setActiveTab('goals')} />
          <ActionPill label="Tarea" tone="primary" onPress={() => setSheet({ type: 'task', mode: 'create' })} />
          <ActionPill label="Evento" tone="primary" onPress={() => setSheet({ type: 'event', mode: 'create' })} />
        </View>

        {activeTab === 'tasks' ? (
          <PlannerTasksScreen
            refreshKey={refreshKey}
            onChanged={changed}
            onCreateTask={() => setSheet({ type: 'task', mode: 'create' })}
            onEditTask={(id) => setSheet({ type: 'task', mode: 'edit', id })}
          />
        ) : null}

        {activeTab === 'calendar' ? (
          <PlannerCalendarScreen
            refreshKey={refreshKey}
            onChanged={changed}
            onCreateEvent={() => setSheet({ type: 'event', mode: 'create' })}
            onEditEvent={(id) => setSheet({ type: 'event', mode: 'edit', id })}
          />
        ) : null}

        {activeTab === 'goals' ? (
          <View style={S.emptyBox}>
            <AppText variant="title3" align="center">Metas</AppText>
            <AppText variant="bodySmall" tone="secondary" align="center">Proximamente.</AppText>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(sheet)} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={S.sheetBackdrop} onPress={() => setSheet(null)}>
          <Pressable style={S.sheetPanel}>
            {sheet?.type === 'task' ? (
              <TaskForm
                mode={sheet.mode}
                taskId={sheet.id}
                embedded
                onClose={() => setSheet(null)}
                onSaved={completeSheetMutation}
              />
            ) : null}
            {sheet?.type === 'event' ? (
              <EventForm
                mode={sheet.mode}
                eventId={sheet.id}
                embedded
                onClose={() => setSheet(null)}
                onSaved={completeSheetMutation}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
