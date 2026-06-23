import { StyleSheet } from 'react-native';
import type { PlannerTaskPriority, PlannerTaskStatus } from '../../services/plannerTasks';

export const priorityLabels: Record<PlannerTaskPriority, string> = {
  low: 'Baja',
  medium: 'Normal',
  high: 'Alta',
  critical: 'Critica',
};

export const statusLabels: Record<PlannerTaskStatus, string> = {
  pending: 'Pendiente',
  completed: 'Completada',
  awaiting_verification: 'Por verificar',
  verified: 'Verificada',
  cancelled: 'Cancelada',
};

export const recurrenceLabels = {
  none: 'No repetir',
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
} as const;

export const dateToYMD = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const buildLocalIso = (date: string, time: string) => {
  const safeTime = time.trim() || '00:00';
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = safeTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0).toISOString();
};

export const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

export const formatTime = (value?: string | null) => {
  if (!value) return '';
  if (value.includes('T')) {
    return new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  return value.slice(0, 5);
};

export const plannerStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F6F1' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: '#17201A', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#647067', fontSize: 14, lineHeight: 20, marginTop: 4 },
  sectionTitle: { color: '#17201A', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2DFD6',
    padding: 14,
    marginBottom: 10,
  },
  muted: { color: '#647067', fontSize: 13, lineHeight: 19 },
  label: { color: '#647067', fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCD8CD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#17201A',
    fontSize: 15,
    marginBottom: 12,
  },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: '#CD7353',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CD7353',
    paddingVertical: 11,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dangerBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B84A3C',
    paddingVertical: 11,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryText: { color: '#CD7353', fontSize: 14, fontWeight: '800' },
  dangerText: { color: '#B84A3C', fontSize: 14, fontWeight: '800' },
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCD8CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#CD7353', borderColor: '#CD7353' },
  chipText: { color: '#516057', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: '#EEEAE2',
  },
  badgeText: { color: '#516057', fontSize: 12, fontWeight: '800' },
  badgeDanger: { backgroundColor: '#FFF4F2' },
  badgeDangerText: { color: '#A33A2B' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CD7353',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: { backgroundColor: '#CD7353' },
  checkboxText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  errorBox: {
    backgroundColor: '#FFF4F2',
    borderColor: '#F1B5AB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  errorText: { color: '#A33A2B', fontSize: 14, lineHeight: 20 },
  emptyBox: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { color: '#17201A', textAlign: 'center', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  emptyText: { color: '#647067', textAlign: 'center', fontSize: 15, lineHeight: 21 },
  toastBox: {
    backgroundColor: '#ECF3EA',
    borderColor: '#A9BFA4',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  toastText: { color: '#2F5D45', fontSize: 14, fontWeight: '800' },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,32,26,0.38)',
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    maxHeight: '92%',
    minHeight: '72%',
    backgroundColor: '#F7F6F1',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    borderTopWidth: 1,
    borderColor: '#E2DFD6',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFD6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 14,
  },
  monthWeekday: {
    width: '14.285%',
    textAlign: 'center',
    color: '#647067',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  monthDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  monthDaySelected: { backgroundColor: '#CD7353' },
  monthDayText: { color: '#17201A', fontSize: 14, fontWeight: '800' },
  monthDayTextSelected: { color: '#FFFFFF' },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7F9A72',
    marginTop: 3,
  },
  eventDotSelected: { backgroundColor: '#FFFFFF' },
});
