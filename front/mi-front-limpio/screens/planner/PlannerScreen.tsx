import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
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
            <Text style={S.title}>Planner</Text>
            <Text style={S.subtitle}>
              Tareas, eventos y calendario compartido para el hogar.
            </Text>
          </View>
          <TouchableOpacity style={S.secondaryBtn} onPress={() => void refresh()}>
            <Text style={S.secondaryText}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {toast ? (
          <View style={S.toastBox}>
            <Text style={S.toastText}>{toast}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={[S.emptyBox, { minHeight: 120 }]}>
            <ActivityIndicator color="#CD7353" />
          </View>
        ) : null}

        {!loading && error ? (
          <View style={S.errorBox}>
            <Text style={S.errorText}>{error}</Text>
            <TouchableOpacity style={[S.secondaryBtn, { marginTop: 10 }]} onPress={() => void loadSummary()}>
              <Text style={S.secondaryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && activeTab === 'tasks' ? (
          <>
            <View style={[S.row, { marginBottom: 14 }]}>
              <View style={[S.card, { flex: 1, minWidth: 96 }]}>
                <Text style={S.label}>Pendientes</Text>
                <Text style={{ color: '#17201A', fontSize: 26, fontWeight: '800' }}>
                  {summary?.pending_tasks_count ?? 0}
                </Text>
              </View>
              <View style={[S.card, { flex: 1, minWidth: 96 }]}>
                <Text style={S.label}>Hoy</Text>
                <Text style={{ color: '#17201A', fontSize: 26, fontWeight: '800' }}>
                  {summary?.today_tasks_count ?? 0}
                </Text>
              </View>
              <View style={[S.card, { flex: 1, minWidth: 96 }]}>
                <Text style={S.label}>Vencidas</Text>
                <Text style={{ color: '#17201A', fontSize: 26, fontWeight: '800' }}>
                  {summary?.overdue_tasks_count ?? 0}
                </Text>
              </View>
              <View style={[S.card, { flex: 1, minWidth: 96 }]}>
                <Text style={S.label}>Por verificar</Text>
                <Text style={{ color: '#17201A', fontSize: 26, fontWeight: '800' }}>
                  {summary?.awaiting_verification_count ?? 0}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        <View style={[S.row, { marginTop: 4, marginBottom: 14 }]}>
          <TouchableOpacity
            style={[S.chip, activeTab === 'tasks' && S.chipActive]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text style={[S.chipText, activeTab === 'tasks' && S.chipTextActive]}>Tareas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.chip, activeTab === 'calendar' && S.chipActive]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[S.chipText, activeTab === 'calendar' && S.chipTextActive]}>Calendario</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.chip, activeTab === 'goals' && S.chipActive]}
            onPress={() => setActiveTab('goals')}
          >
            <Text style={[S.chipText, activeTab === 'goals' && S.chipTextActive]}>Metas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.secondaryBtn} onPress={() => setSheet({ type: 'task', mode: 'create' })}>
            <Text style={S.secondaryText}>+ Tarea</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.secondaryBtn} onPress={() => setSheet({ type: 'event', mode: 'create' })}>
            <Text style={S.secondaryText}>+ Evento</Text>
          </TouchableOpacity>
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
            <Text style={S.emptyTitle}>Metas</Text>
            <Text style={S.emptyText}>Proximamente.</Text>
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
