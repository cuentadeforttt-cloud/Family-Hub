import { StyleSheet } from 'react-native';
import type { PlannerTaskPriority, PlannerTaskStatus } from '../../services/plannerTasks';
import { colors, radius, shadows, spacing } from '../../constants/theme';

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
  safe: { flex: 1, backgroundColor: colors.background.base },
  scroll: { flex: 1 },
  content: { padding: spacing[5], paddingBottom: 96 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  title: { color: colors.text.primary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.text.secondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  sectionTitle: { color: colors.text.primary, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  topbarTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.soft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 12,
    height: 50,
  },
  topbarTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  topbarTabActive: {
    backgroundColor: colors.terracotta[500],
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  topbarTabText: { color: colors.text.secondary, fontWeight: '500', fontSize: 13 },
  topbarTabTextActive: { color: colors.text.inverse, fontWeight: '700' },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: colors.terracotta[50],
    borderColor: colors.terracotta[100],
    borderWidth: 1,
  },
  tabPillText: { color: colors.text.tertiary, fontWeight: '700', fontSize: 13 },
  tabPillTextActive: { color: colors.terracotta[700] },
  statCard: {
    flex: 1,
    minWidth: 84,
    borderRadius: radius.lg,
    padding: spacing[3],
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statLabel: { color: colors.text.tertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' as const },
  statValue: { color: colors.text.primary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  filterScroll: { flexGrow: 1 },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minHeight: 36,
    backgroundColor: colors.surface.soft,
    justifyContent: 'center',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: colors.terracotta[500], borderColor: colors.terracotta[500] },
  filterChipText: { color: colors.text.secondary, fontWeight: '700', fontSize: 13 },
  filterChipTextActive: { color: colors.text.inverse },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.card,
  },
  muted: { color: colors.text.tertiary, fontSize: 13, lineHeight: 19 },
  label: { color: colors.text.tertiary, fontSize: 12, fontWeight: '700', marginBottom: spacing[2], textTransform: 'uppercase' },
  input: {
    minHeight: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.soft,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.text.primary,
    fontSize: 15,
    marginBottom: spacing[3],
  },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: colors.terracotta[500],
    borderRadius: radius.lg,
    minHeight: 44,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.terracotta[300],
    minHeight: 44,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.soft,
  },
  dangerBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger.base,
    minHeight: 44,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger.soft,
  },
  btnText: { color: colors.text.inverse, fontSize: 14, fontWeight: '800' },
  secondaryText: { color: colors.terracotta[600], fontSize: 14, fontWeight: '800' },
  dangerText: { color: colors.danger.text, fontSize: 14, fontWeight: '800' },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surface.soft,
    justifyContent: 'center',
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.terracotta[500], borderColor: colors.terracotta[500] },
  chipText: { color: colors.text.secondary, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: colors.text.inverse },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.sand[50],
  },
  badgeText: { color: colors.text.secondary, fontSize: 12, fontWeight: '800' },
  badgeDanger: { backgroundColor: colors.warning.soft },
  badgeDangerText: { color: colors.warning.text },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.terracotta[500],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.card,
  },
  checkboxChecked: { backgroundColor: colors.terracotta[500] },
  checkboxText: { color: colors.text.inverse, fontSize: 15, fontWeight: '900' },
  errorBox: {
    backgroundColor: colors.danger.soft,
    borderColor: colors.danger.base,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginVertical: spacing[3],
  },
  errorText: { color: colors.danger.text, fontSize: 14, lineHeight: 20 },
  emptyBox: { paddingVertical: spacing[7], alignItems: 'center' },
  emptyTitle: { color: colors.text.primary, textAlign: 'center', fontSize: 18, fontWeight: '900', marginBottom: spacing[2] },
  emptyText: { color: colors.text.secondary, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  toastBox: {
    backgroundColor: colors.success.soft,
    borderColor: colors.success.base,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  toastText: { color: colors.success.strong, fontSize: 14, fontWeight: '800' },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    maxHeight: '92%',
    minHeight: '72%',
    backgroundColor: colors.background.base,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing[5],
    borderTopWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sheet,
  },
  sheetHandleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    position: 'relative',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.default,
    opacity: 0.6,
  },
  sheetCloseButton: {
    position: 'absolute',
    right: 0,
    top: -6,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.xl,
    padding: spacing[3],
    marginBottom: spacing[4],
    ...shadows.card,
  },
  monthWeekday: {
    width: '14.285%',
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  monthDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  monthDaySelected: { backgroundColor: colors.terracotta[500] },
  monthDayText: { color: colors.text.primary, fontSize: 14, fontWeight: '800' },
  monthDayTextSelected: { color: colors.text.inverse },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.sage[500],
    marginTop: 3,
  },
  eventDotSelected: { backgroundColor: colors.text.inverse },
});
