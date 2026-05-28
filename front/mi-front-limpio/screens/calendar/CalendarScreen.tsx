import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { getHouseholdSchedules, upsertSchedule, deleteSchedule } from '../../services/schedules';
import type { Schedule, ScheduleInput } from '../../services/schedules';
import { getHouseholdEvents, type CalendarEvent } from '../../services/events';

const DAYS_WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type DisplayEvent = {
  id: string; time: string; title: string;
  member: string; color: string; conflict: boolean;
};

const CATEGORIES: Schedule['category'][] = ['trabajo','escuela','deporte','salud','familia','personal','otro'];
const CATEGORY_ICONS: Record<Schedule['category'], string> = {
  trabajo: '💼', escuela: '📚', deporte: '⚽', salud: '💊', familia: '🏠', personal: '🎯', otro: '📌',
};
const RECURRENCE_OPTIONS: Schedule['recurrence'][] = ['none','daily','weekly','monthly'];
const RECURRENCE_LABELS: Record<Schedule['recurrence'], string> = {
  none: 'Sin repetir', daily: 'Diaria', weekly: 'Semanal', monthly: 'Mensual',
};
const PALETTE = ['#CD7353','#6B4FE8','#7C9E7A','#D4975A','#D4A853','#E57373','#64B5F6','#81C784'];
// ─────────────────────────────────────────────────────────────────────────────

// ─── Role theme ───────────────────────────────────────────────────────────────
type RoleTheme = {
  bg: string; surface: string; text: string; textMuted: string;
  primary: string; border: string; amber: string;
  modalBg: string; modalInputBg: string;
  fs: number;    // font size multiplier
  touch: number; // min touch target height
};

function getRoleTheme(role: string | null): RoleTheme {
  switch (role) {
    case 'adulto':
      return { bg: '#FAFAF8', surface: '#FFFFFF', text: '#1C1C1C', textMuted: '#6B6B6B',
               primary: '#CD7353', border: '#E2DFD6', amber: '#F59E0B',
               modalBg: '#FFFFFF', modalInputBg: '#F3F2EE', fs: 1.0, touch: 44 };
    case 'adolescente':
      return { bg: '#0F172A', surface: '#1E293B', text: '#FFFFFF', textMuted: '#94A3B8',
               primary: '#6B4FE8', border: 'rgba(107,79,232,0.2)', amber: '#F59E0B',
               modalBg: '#1E293B', modalInputBg: '#0F172A', fs: 1.0, touch: 44 };
    case 'adulto_mayor':
      return { bg: '#FFFAF5', surface: '#FFFFFF', text: '#1A1A1A', textMuted: '#555555',
               primary: '#D4975A', border: 'rgba(212,151,90,0.25)', amber: '#D4975A',
               modalBg: '#FFFFFF', modalInputBg: '#F5F0E8', fs: 1.2, touch: 56 };
    default: // coordinador
      return { bg: '#0D1117', surface: '#161B22', text: '#FFFFFF', textMuted: '#888888',
               primary: '#CD7353', border: 'rgba(205,115,83,0.15)', amber: '#F59E0B',
               modalBg: '#1C2128', modalInputBg: '#0D1117', fs: 1.0, touch: 44 };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'calendar' | 'routines';

export const CalendarScreen = () => {
  const { user } = useAuth();
  const { currentHousehold, members, currentRole } = useHousehold();
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const T = useMemo(() => getRoleTheme(currentRole), [currentRole]);
  const S = useMemo(() => getStyles(T), [T]);

  const isAdultoMayor = currentRole === 'adulto_mayor';
  const isAdolescente = currentRole === 'adolescente';
  const routinesTabLabel = isAdultoMayor ? 'Recordatorios' : (isAdolescente ? 'Mi Agenda' : 'Rutinas');
  const f = (size: number) => Math.round(size * T.fs);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formStart, setFormStart] = useState('08:00');
  const [formEnd, setFormEnd] = useState('09:00');
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formRecurrence, setFormRecurrence] = useState<Schedule['recurrence']>('weekly');
  const [formCategory, setFormCategory] = useState<Schedule['category']>('trabajo');
  const [formColor, setFormColor] = useState('#CD7353');
  const [formSaving, setFormSaving] = useState(false);

  const loadSchedules = useCallback(async () => {
    if (!currentHousehold) return;
    const { schedules: s } = await getHouseholdSchedules(currentHousehold.id);
    setSchedules(s);
  }, [currentHousehold]);

  useEffect(() => { void loadSchedules(); }, [loadSchedules]);

  useEffect(() => {
    if (!currentHousehold) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    void getHouseholdEvents(currentHousehold.id, from, to).then(r => setEvents(r.events));
  }, [currentHousehold]);

  const weekDates = useMemo(() => {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    return DAYS_WEEK.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const dayEvents = useMemo<DisplayEvent[]>(() => {
    return events
      .filter(e => new Date(e.start_at).toDateString() === selectedDate.toDateString())
      .map(e => ({
        id: e.id,
        time: formatEventTime(e.start_at),
        title: e.title,
        member: '',
        color: e.color,
        conflict: false,
      }));
  }, [events, selectedDate]);

  const saveSchedule = async () => {
    if (!formTitle.trim() || !user || !currentHousehold) return;
    setFormSaving(true);
    const input: ScheduleInput = {
      household_id: currentHousehold.id,
      user_id: user.id,
      title: formTitle.trim(),
      start_time: formStart,
      end_time: formEnd || null,
      recurrence: formRecurrence,
      recurrence_days: formRecurrence === 'weekly' ? formDays : null,
      recurrence_day: null,
      color: formColor,
      category: formCategory,
    };
    const { error } = await upsertSchedule(input);
    if (error) Alert.alert('Error', error);
    else { await loadSchedules(); setModalVisible(false); resetForm(); }
    setFormSaving(false);
  };

  const resetForm = () => {
    setFormTitle(''); setFormStart('08:00'); setFormEnd('09:00');
    setFormDays([1,2,3,4,5]); setFormRecurrence('weekly');
    setFormCategory('trabajo'); setFormColor('#CD7353');
  };

  const toggleDay = (d: number) =>
    setFormDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const memberSchedules = (userId: string) => schedules.filter(s => s.user_id === userId);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Top tab bar */}
      <View style={S.tabBar}>
        {(['calendar', 'routines'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[S.tab, activeTab === t && S.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[S.tabText, activeTab === t && S.tabTextActive]}>
              {t === 'calendar' ? 'Calendario' : routinesTabLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'calendar' ? (
          <>
            {/* Month header */}
            <View style={S.monthRow}>
              <TouchableOpacity style={S.chevron}><Text style={S.chevronText}>‹</Text></TouchableOpacity>
              <Text style={[S.monthLabel, { fontSize: f(18) }]}>Mayo 2025</Text>
              <TouchableOpacity style={S.chevron}><Text style={S.chevronText}>›</Text></TouchableOpacity>
            </View>

            {/* Week day selector */}
            <View style={S.weekRow}>
              {weekDates.map((wd, i) => {
                const today = new Date();
                const isToday = wd.toDateString() === today.toDateString();
                const isSelected = wd.toDateString() === selectedDate.toDateString();
                const dots = events
                  .filter(e => new Date(e.start_at).toDateString() === wd.toDateString())
                  .map(e => e.color)
                  .slice(0, 3);
                return (
                  <TouchableOpacity
                    key={DAYS_WEEK[i]}
                    style={[S.dayCell, isSelected && S.dayCellSelected, { minHeight: T.touch }]}
                    onPress={() => setSelectedDate(wd)}
                  >
                    <Text style={[S.dayLetter, isSelected && S.dayLetterSelected]}>{DAYS_WEEK[i]}</Text>
                    <Text style={[S.dayNumber, { fontSize: f(17) }, isSelected && S.dayNumberSelected, isToday && S.dayNumberToday]}>
                      {wd.getDate()}
                    </Text>
                    <View style={S.dotRow}>
                      {dots.map((c, j) => (
                        <View key={j} style={[S.dot, { backgroundColor: c }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Member filter — hidden for adulto_mayor (simplify UX) */}
            {!isAdultoMayor && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.filterScroll}>
                <TouchableOpacity style={[S.filterPill, S.filterPillActive]}>
                  <Text style={S.filterPillTextActive}>Todos</Text>
                </TouchableOpacity>
                {members.map(m => (
                  <TouchableOpacity key={m.id} style={S.filterPill}>
                    <Text style={S.filterPillText}>{m.user?.nombre?.split(' ')[0] ?? 'Miembro'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Day title */}
            <Text style={[S.dayTitle, { fontSize: f(16) }]}>
              {selectedDate.toLocaleDateString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>

            {dayEvents.length === 0 && (
              <View style={S.emptyDay}>
                <Text style={[S.emptyDayText, { fontSize: f(16) }]}>
                  {isAdultoMayor ? '¡Hoy no tienes citas! Disfruta el día 🌞' : 'Sin eventos este día ✨'}
                </Text>
              </View>
            )}

            {dayEvents.map(ev => (
              <View
                key={ev.id}
                style={[S.eventCard, { borderLeftColor: ev.color }, ev.conflict && S.eventCardConflict]}
              >
                {isAdultoMayor ? (
                  // Large accessible event layout for elders
                  <>
                    <Text style={{ fontSize: f(26), fontWeight: '800', color: T.primary, marginRight: 16 }}>
                      {ev.time}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: f(19), fontWeight: '700', color: T.text }}>{ev.title}</Text>
                      <Text style={{ fontSize: f(14), color: T.textMuted, marginTop: 2 }}>{ev.member}</Text>
                    </View>
                  </>
                ) : (
                  // Standard event layout
                  <>
                    <View style={S.eventLeft}>
                      {ev.conflict && <Text style={S.conflictBadge}>⚠️ Conflicto</Text>}
                      {isAdolescente && (
                        <Text style={{ fontSize: 12, color: T.primary, fontWeight: '700', marginBottom: 2 }}>
                          {ev.time}
                        </Text>
                      )}
                      <Text style={[S.eventTitle, { fontSize: f(15) }]}>{ev.title}</Text>
                      <Text style={[S.eventMember, { fontSize: f(12) }]}>{ev.member}</Text>
                    </View>
                    <View style={[S.memberColorDot, { backgroundColor: ev.color }]} />
                  </>
                )}
              </View>
            ))}

            {/* Free time card — hidden for adulto_mayor (too complex) */}
            {!isAdultoMayor && (
              <View style={S.freeTimeCard}>
                <Text style={S.freeTimeTitle}>✨ Tiempo libre en familia detectado</Text>
                <Text style={S.freeTimeDesc}>El sábado de 14:00 a 17:00 todos están libres</Text>
                <TouchableOpacity style={S.freeTimeBtn}>
                  <Text style={S.freeTimeBtnText}>+ Agregar plan familiar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Large add button for adulto_mayor */}
            {isAdultoMayor && (
              <TouchableOpacity
                style={[S.elderAddBtn, { minHeight: T.touch + 10 }]}
                onPress={() => { resetForm(); setModalVisible(true); }}
              >
                <Text style={[S.elderAddBtnText, { fontSize: f(17) }]}>+ Agregar cita o recordatorio</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* Routines / Recordatorios tab */}
            <View style={S.routinesHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[S.routinesTitle, { fontSize: f(20) }]}>
                  {isAdultoMayor ? 'Mis recordatorios' : 'Horarios de la familia'}
                </Text>
                <Text style={[S.routinesSubtitle, { fontSize: f(13) }]}>
                  {isAdultoMayor
                    ? 'Tus rutinas y recordatorios diarios'
                    : 'Configura las rutinas de cada integrante'}
                </Text>
              </View>
              <TouchableOpacity
                style={[S.addRoutineBtn, { minHeight: T.touch, justifyContent: 'center' }]}
                onPress={() => { resetForm(); setModalVisible(true); }}
              >
                <Text style={[S.addRoutineBtnText, { fontSize: f(13) }]}>+ Agregar</Text>
              </TouchableOpacity>
            </View>

            {members.length === 0 && (
              <Text style={[S.noMembersText, { fontSize: f(14) }]}>No hay miembros en el hogar aún.</Text>
            )}
            {members.map(m => {
              const mSchedules = memberSchedules(m.user_id);
              const isExpanded = expandedMember === m.user_id;
              return (
                <View key={m.id} style={S.memberSection}>
                  <TouchableOpacity
                    style={[S.memberSectionHeader, { minHeight: T.touch }]}
                    onPress={() => setExpandedMember(isExpanded ? null : m.user_id)}
                  >
                    <View style={S.memberAvatarSmall}>
                      <Text style={{ fontSize: 20 }}>👤</Text>
                    </View>
                    <Text style={[S.memberSectionName, { fontSize: f(15) }]}>{m.user?.nombre ?? 'Miembro'}</Text>
                    <Text style={[S.memberSectionCount, { fontSize: f(12) }]}>{mSchedules.length} rutinas</Text>
                    <Text style={S.memberSectionChevron}>{isExpanded ? '▾' : '▸'}</Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={S.memberSectionBody}>
                      {mSchedules.length === 0 ? (
                        <Text style={[S.noRoutinesText, { fontSize: f(13) }]}>Sin rutinas configuradas</Text>
                      ) : (
                        mSchedules.map(s => (
                          <View key={s.id} style={[S.routineEntry, { borderLeftColor: s.color, minHeight: T.touch }]}>
                            <Text style={{ fontSize: f(20) }}>{CATEGORY_ICONS[s.category]}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={[S.routineTitle, { fontSize: f(14) }]}>{s.title}</Text>
                              <Text style={[S.routineMeta, { fontSize: f(12) }]}>
                                {s.start_time}{s.end_time ? ` – ${s.end_time}` : ''} · {RECURRENCE_LABELS[s.recurrence]}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={{ minHeight: T.touch, minWidth: T.touch, alignItems: 'center', justifyContent: 'center' }}
                              onPress={async () => { await deleteSchedule(s.id); await loadSchedules(); }}
                            >
                              <Text style={S.deleteBtn}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                      {m.user_id === user?.id && (
                        <TouchableOpacity
                          style={[S.addForMemberBtn, { minHeight: T.touch }]}
                          onPress={() => { resetForm(); setModalVisible(true); }}
                        >
                          <Text style={[S.addForMemberText, { fontSize: f(13) }]}>+ Agregar rutina</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            <Text style={[S.templatesLabel, { fontSize: f(11) }]}>Aplicar plantilla</Text>
            <View style={S.templateRow}>
              {['Semana laboral', 'Semana escolar', 'Fin de semana'].map(t => (
                <TouchableOpacity key={t} style={[S.templatePill, { minHeight: T.touch, justifyContent: 'center' }]}>
                  <Text style={[S.templatePillText, { fontSize: f(13) }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add routine / reminder modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <ScrollView style={S.modalCard} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            <Text style={[S.modalTitle, { fontSize: f(20) }]}>
              {isAdultoMayor ? 'Nuevo recordatorio' : 'Nueva rutina'}
            </Text>
            <TextInput
              style={[S.modalInput, { fontSize: f(15), minHeight: T.touch }]}
              placeholder={isAdultoMayor ? 'Ej. Pastilla de la mañana' : 'Nombre (ej. Gimnasio)'}
              placeholderTextColor={T.textMuted}
              value={formTitle}
              onChangeText={setFormTitle}
            />
            <View style={S.timeRow}>
              <TextInput
                style={[S.modalInput, { flex: 1, fontSize: f(14), minHeight: T.touch }]}
                placeholder="Inicio 08:00"
                placeholderTextColor={T.textMuted}
                value={formStart}
                onChangeText={setFormStart}
              />
              <Text style={{ marginHorizontal: 8, color: T.textMuted, fontSize: f(14) }}>→</Text>
              <TextInput
                style={[S.modalInput, { flex: 1, fontSize: f(14), minHeight: T.touch }]}
                placeholder="Fin 09:00"
                placeholderTextColor={T.textMuted}
                value={formEnd}
                onChangeText={setFormEnd}
              />
            </View>

            <Text style={[S.modalLabel, { fontSize: f(12) }]}>Días</Text>
            <View style={S.dayToggles}>
              {DAYS_WEEK.map((d, i) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    S.dayToggle,
                    formDays.includes(i + 1) && S.dayToggleActive,
                    { width: Math.round(36 * T.fs), height: Math.round(36 * T.fs), borderRadius: Math.round(18 * T.fs) },
                  ]}
                  onPress={() => toggleDay(i + 1)}
                >
                  <Text style={[S.dayToggleText, formDays.includes(i + 1) && S.dayToggleTextActive, { fontSize: f(13) }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[S.modalLabel, { fontSize: f(12) }]}>Recurrencia</Text>
            <View style={S.recurrenceRow}>
              {RECURRENCE_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[S.recurrencePill, formRecurrence === r && S.recurrencePillActive, { minHeight: T.touch, justifyContent: 'center' }]}
                  onPress={() => setFormRecurrence(r)}
                >
                  <Text style={[S.recurrenceText, formRecurrence === r && S.recurrenceTextActive, { fontSize: f(12) }]}>
                    {RECURRENCE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[S.modalLabel, { fontSize: f(12) }]}>Categoría</Text>
            <View style={S.categoryGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[S.categoryBtn, formCategory === c && S.categoryBtnActive, { minHeight: T.touch }]}
                  onPress={() => setFormCategory(c)}
                >
                  <Text style={{ fontSize: f(20) }}>{CATEGORY_ICONS[c]}</Text>
                  <Text style={[S.categoryBtnText, { fontSize: f(10) }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[S.modalLabel, { fontSize: f(12) }]}>Color</Text>
            <View style={S.paletteRow}>
              {PALETTE.map(col => (
                <TouchableOpacity
                  key={col}
                  style={[
                    S.colorDot,
                    { backgroundColor: col, width: Math.round(28 * T.fs), height: Math.round(28 * T.fs), borderRadius: Math.round(14 * T.fs) },
                    formColor === col && S.colorDotSelected,
                  ]}
                  onPress={() => setFormColor(col)}
                />
              ))}
            </View>

            <View style={S.modalActions}>
              <TouchableOpacity
                style={[S.cancelBtn, { minHeight: T.touch }]}
                onPress={() => { setModalVisible(false); resetForm(); }}
              >
                <Text style={[S.cancelBtnText, { fontSize: f(14) }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.saveBtn, formSaving && { opacity: 0.6 }, { minHeight: T.touch }]}
                onPress={() => void saveSchedule()}
                disabled={formSaving}
              >
                <Text style={[S.saveBtnText, { fontSize: f(15) }]}>{formSaving ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

function getStyles(T: RoleTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: T.bg },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.border },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: T.primary },
    tabText: { fontSize: 15, color: T.textMuted, fontWeight: '600' },
    tabTextActive: { color: T.text, fontWeight: '700' },
    container: { flex: 1, backgroundColor: T.bg },
    content: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 },

    // Calendar tab
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 16 },
    monthLabel: { fontSize: 18, fontWeight: '700', color: T.text },
    chevron: { padding: 8 },
    chevronText: { fontSize: 22, color: T.primary },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    dayCell: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12 },
    dayCellSelected: { backgroundColor: T.primary },
    dayLetter: { fontSize: 11, color: T.textMuted, fontWeight: '600', marginBottom: 2 },
    dayLetterSelected: { color: '#FFF' },
    dayNumber: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 4 },
    dayNumberSelected: { color: '#FFF' },
    dayNumberToday: { color: T.primary },
    dotRow: { flexDirection: 'row', gap: 2 },
    dot: { width: 5, height: 5, borderRadius: 2.5 },

    filterScroll: { marginBottom: 16 },
    filterPill: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: T.border, marginRight: 8 },
    filterPillActive: { backgroundColor: T.primary, borderColor: T.primary },
    filterPillText: { fontSize: 13, color: T.textMuted, fontWeight: '600' },
    filterPillTextActive: { fontSize: 13, color: '#FFF', fontWeight: '600' },

    dayTitle: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 12, textTransform: 'capitalize' },
    emptyDay: { paddingVertical: 32, alignItems: 'center' },
    emptyDayText: { fontSize: 16, color: T.textMuted, textAlign: 'center' },
    eventCard: { backgroundColor: T.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center' },
    eventCardConflict: { borderColor: T.amber + '60' },
    eventLeft: { flex: 1 },
    conflictBadge: { fontSize: 11, color: T.amber, fontWeight: '700', marginBottom: 4 },
    eventTitle: { fontSize: 15, fontWeight: '600', color: T.text, marginBottom: 2 },
    eventMember: { fontSize: 12, color: T.textMuted },
    memberColorDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },

    freeTimeCard: { backgroundColor: T.surface, borderRadius: 14, padding: 16, marginTop: 8, borderWidth: 1, borderColor: T.primary + '40' },
    freeTimeTitle: { fontSize: 14, fontWeight: '700', color: T.text, marginBottom: 4 },
    freeTimeDesc: { fontSize: 13, color: T.textMuted, marginBottom: 12 },
    freeTimeBtn: { borderWidth: 1.5, borderColor: T.primary, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
    freeTimeBtnText: { color: T.primary, fontWeight: '600', fontSize: 13 },

    elderAddBtn: { backgroundColor: T.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
    elderAddBtnText: { color: '#FFF', fontWeight: '700' },

    // Routines tab
    routinesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    routinesTitle: { fontSize: 20, fontWeight: '800', color: T.text },
    routinesSubtitle: { fontSize: 13, color: T.textMuted, marginTop: 2 },
    addRoutineBtn: { backgroundColor: T.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
    addRoutineBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    noMembersText: { color: T.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 32 },
    memberSection: { backgroundColor: T.surface, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
    memberSectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    memberAvatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.border, alignItems: 'center', justifyContent: 'center' },
    memberSectionName: { flex: 1, fontSize: 15, fontWeight: '700', color: T.text },
    memberSectionCount: { fontSize: 12, color: T.textMuted },
    memberSectionChevron: { fontSize: 16, color: T.textMuted, marginLeft: 4 },
    memberSectionBody: { borderTopWidth: 1, borderTopColor: T.border, padding: 12 },
    noRoutinesText: { color: T.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
    routineEntry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderLeftWidth: 3, paddingLeft: 10, marginBottom: 6, gap: 8 },
    routineTitle: { fontSize: 14, fontWeight: '600', color: T.text },
    routineMeta: { fontSize: 12, color: T.textMuted, marginTop: 2 },
    deleteBtn: { fontSize: 16, color: T.textMuted, paddingHorizontal: 4 },
    addForMemberBtn: { paddingVertical: 10, alignItems: 'center' },
    addForMemberText: { color: T.primary, fontSize: 13, fontWeight: '600' },

    templatesLabel: { fontSize: 11, color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 10 },
    templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    templatePill: { borderWidth: 1.5, borderColor: T.primary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
    templatePillText: { color: T.primary, fontWeight: '600', fontSize: 13 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: T.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 16 },
    modalInput: { backgroundColor: T.modalInputBg, borderRadius: 10, padding: 12, color: T.text, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: T.border },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    modalLabel: { fontSize: 12, color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 8 },
    dayToggles: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
    dayToggle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.border },
    dayToggleActive: { backgroundColor: T.primary, borderColor: T.primary },
    dayToggleText: { fontSize: 13, fontWeight: '700', color: T.textMuted },
    dayToggleTextActive: { color: '#FFF' },
    recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    recurrencePill: { borderWidth: 1.5, borderColor: T.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
    recurrencePillActive: { backgroundColor: T.primary, borderColor: T.primary },
    recurrenceText: { fontSize: 12, color: T.textMuted, fontWeight: '600' },
    recurrenceTextActive: { color: '#FFF' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    categoryBtn: { alignItems: 'center', borderWidth: 1.5, borderColor: T.border, borderRadius: 10, padding: 8, minWidth: 64 },
    categoryBtnActive: { borderColor: T.primary, backgroundColor: T.primary + '22' },
    categoryBtnText: { fontSize: 10, color: T.textMuted, marginTop: 2, textTransform: 'capitalize' },
    paletteRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    colorDotSelected: { borderWidth: 3, borderColor: '#FFF' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { color: T.textMuted, fontWeight: '600' },
    saveBtn: { flex: 2, backgroundColor: T.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  });
}
