import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { HomePlannerSections } from './HomePlannerSections';

type CalendarEvent = any;

const CATEGORY_ICONS: Record<string, string> = {
  salud: '💊', trabajo: '💼', escuela: '📚', familia: '🏠',
  personal: '🎯', deporte: '⚽', otro: '📌',
};

const CATEGORY_LABELS: Record<string, string> = {
  salud: 'Médico / Salud', trabajo: 'Trabajo', escuela: 'Educación',
  familia: 'Familia', personal: 'Personal', deporte: 'Deporte', otro: 'Otro',
};

const MOCK_PHOTOS = [
  { id: '1', emoji: '🤳', from: 'Laura',   desc: 'Cumpleaños de Ana' },
  { id: '2', emoji: '🎂', from: 'Marco',   desc: 'Paseo del domingo' },
  { id: '3', emoji: '🌳', from: 'Familia', desc: 'En el parque' },
];

const MOCK_VOICE = [
  { id: '1', from: 'Laura', emoji: '👩', duration: '0:43', date: 'Ayer' },
  { id: '2', from: 'Marco', emoji: '👨', duration: '1:12', date: 'Hace 2 días' },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${suffix}`;
}

export const HomeAdultoMayor = () => {
  const { user } = useAuth();
  const { currentHousehold, members } = useHousehold();

  const [checkedIn, setCheckedIn] = useState(false);
  const [sosVisible, setSosVisible] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const firstName = user?.user_metadata?.nombre?.split(' ')[0] ?? 'Bienvenida';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const fetchData = useCallback(async () => {
    if (!currentHousehold || !user) return;
    setEventsLoading(true);
    setTodayEvents([]);
    setEventsLoading(false);
  }, [currentHousehold, user]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleCheckin = () => {
    setCheckedIn(true);
    Alert.alert('✅ ¡Mensaje enviado!', 'Tu familia recibió una notificación. 💛', [
      { text: 'Gracias', style: 'cancel' },
    ]);
  };

  const sendSOS = () => {
    setSosVisible(false);
    Alert.alert('🚨 Alerta enviada', 'Tu familia fue notificada. Alguien te contactará pronto.');
  };

  // Build contacts list from real household members
  const contacts = members
    .filter(m => m.user_id !== user?.id)
    .slice(0, 4)
    .map(m => ({
      id: m.id,
      emoji: m.rol === 'coordinador' ? '👑' : m.rol === 'adolescente' ? '🧒' : '👤',
      name: m.user?.nombre ?? 'Familiar',
    }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Greeting header */}
        <View style={styles.greetingCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
            <Text style={styles.greetingDate}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.avatarLarge}>
            <Text style={{ fontSize: 36 }}>👵</Text>
          </View>
        </View>

        <HomePlannerSections />

        {/* "Estoy bien" button */}
        <TouchableOpacity
          style={[styles.wellbeingBtn, checkedIn && styles.wellbeingBtnDone]}
          onPress={handleCheckin}
          accessibilityRole="button"
          accessibilityLabel="Estoy bien hoy"
        >
          <Text style={styles.wellbeingBtnText}>{checkedIn ? '✅ Ya avisé que estoy bien' : '✅ Estoy bien hoy'}</Text>
          <Text style={styles.wellbeingBtnSub}>La familia recibirá una notificación</Text>
        </TouchableOpacity>
        <Text style={styles.lastCheckin}>Ayer a las 8:32 AM ✓</Text>

        {false ? (
          <>
        {/* Appointments / events today */}
        <Text style={styles.sectionTitle}>📋 Hoy</Text>
        {eventsLoading ? (
          <ActivityIndicator color={C.amber} size="large" style={{ marginVertical: 16 }} />
        ) : todayEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>🌞 Hoy no tienes citas.{'\n'}¡Disfruta el día!</Text>
          </View>
        ) : todayEvents.map(ev => (
          <View key={ev.id} style={styles.appointmentCard}>
            <Text style={styles.appointmentTime}>{formatTime(ev.start_at)}</Text>
            <View style={styles.appointmentDivider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.appointmentCategory}>
                {CATEGORY_ICONS[ev.category] ?? '📌'} {CATEGORY_LABELS[ev.category] ?? ev.category}
              </Text>
              <Text style={styles.appointmentTitle}>{ev.title}</Text>
            </View>
          </View>
        ))}

          </>
        ) : null}

        {/* Family photos */}
        <Text style={styles.sectionTitle}>📷 Fotos de tu familia</Text>
        <Text style={styles.photosMeta}>3 fotos nuevas esta semana</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
          {MOCK_PHOTOS.map((p, idx) => (
            <View key={p.id} style={[styles.photoCard, idx === 0 && styles.photoCardFeatured]}>
              <View style={styles.photoPlaceholder}>
                <Text style={{ fontSize: idx === 0 ? 64 : 52 }}>{p.emoji}</Text>
              </View>
              <Text style={styles.photoFrom}>{p.from}</Text>
              <Text style={styles.photoDesc}>{p.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Voice messages */}
        <Text style={styles.sectionTitle}>🎙️ Mensajes de voz</Text>
        {MOCK_VOICE.map(v => (
          <View key={v.id} style={styles.voiceCard}>
            <Text style={{ fontSize: 42, marginRight: 12 }}>{v.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.voiceName}>{v.from}</Text>
              <Text style={styles.voiceMeta}>{v.duration} · {v.date}</Text>
            </View>
            <TouchableOpacity
              style={[styles.playBtn, playingId === v.id && styles.playBtnActive]}
              onPress={() => setPlayingId(playingId === v.id ? null : v.id)}
              accessibilityRole="button"
              accessibilityLabel={`Reproducir mensaje de ${v.from}`}
            >
              <Text style={styles.playBtnText}>{playingId === v.id ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.recordBtn} accessibilityRole="button" accessibilityLabel="Grabar respuesta">
          <Text style={styles.recordBtnText}>🎙️  Grabar respuesta</Text>
        </TouchableOpacity>

        {/* Quick contacts */}
        <Text style={styles.sectionTitle}>📞 Llamar a la familia</Text>
        {contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sin familiares en el hogar aún</Text>
          </View>
        ) : (
          <View style={styles.contactsGrid}>
            {contacts.map(c => (
              <TouchableOpacity key={c.id} style={styles.contactCard} accessibilityRole="button" accessibilityLabel={`Llamar a ${c.name}`}>
                <Text style={{ fontSize: 40, marginBottom: 6 }}>{c.emoji}</Text>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.callLabel}>Llamar</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* SOS floating button */}
      <TouchableOpacity
        style={styles.sosFloat}
        onPress={() => setSosVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Botón de emergencia SOS"
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      {/* SOS confirmation modal */}
      <Modal visible={sosVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚨 Emergencia</Text>
            <Text style={styles.modalText}>¿Enviar alerta a toda tu familia?</Text>
            <TouchableOpacity style={styles.modalSendBtn} onPress={sendSOS}>
              <Text style={styles.modalSendText}>Sí, enviar alerta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSosVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const C = {
  bg: '#FFFAF5',
  surface: '#FFFFFF',
  border: '#F0E8DC',
  text: '#1A1A1A',
  textMuted: '#777777',
  amber: '#D4975A',
  primary: '#CD7353',
  sage: '#7C9E7A',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  greetingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.amber + '22',
    borderRadius: 20, padding: 20, marginBottom: 20, marginTop: 8,
  },
  greeting: { fontSize: 22, color: C.text, fontWeight: '500' },
  greetingName: { fontSize: 32, fontWeight: '800', color: C.text, marginBottom: 4 },
  greetingDate: { fontSize: 16, color: C.textMuted },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.amber + '33', alignItems: 'center', justifyContent: 'center' },

  wellbeingBtn: {
    backgroundColor: C.amber,
    borderRadius: 20, paddingVertical: 22, paddingHorizontal: 20,
    alignItems: 'center', marginBottom: 8,
  },
  wellbeingBtnDone: { backgroundColor: C.sage },
  wellbeingBtnText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  wellbeingBtnSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  lastCheckin: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginBottom: 24 },

  sectionTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 14, marginTop: 8 },
  appointmentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 16, padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 5, borderLeftColor: C.amber,
    minHeight: 80,
  },
  appointmentTime: { fontSize: 22, fontWeight: '800', color: C.amber, marginRight: 12 },
  appointmentDivider: { width: 1, height: 48, backgroundColor: C.border, marginRight: 12 },
  appointmentCategory: { fontSize: 14, color: C.textMuted, fontWeight: '600', marginBottom: 4 },
  appointmentTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptyCard: { backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  emptyText: { fontSize: 18, color: C.textMuted, textAlign: 'center', lineHeight: 28 },

  photosMeta: { fontSize: 14, color: C.amber, fontWeight: '600', marginBottom: 12, marginTop: -8 },
  photosScroll: { marginBottom: 24, marginHorizontal: -4 },
  photoCard: { backgroundColor: C.surface, borderRadius: 16, padding: 12, marginHorizontal: 6, width: 150, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  photoCardFeatured: { width: 170, borderColor: C.amber },
  photoPlaceholder: { width: '100%', aspectRatio: 1, backgroundColor: C.amber + '22', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  photoFrom: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  photoDesc: { fontSize: 12, color: C.textMuted, textAlign: 'center' },

  voiceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, minHeight: 80,
  },
  voiceName: { fontSize: 20, fontWeight: '700', color: C.text },
  voiceMeta: { fontSize: 14, color: C.textMuted, marginTop: 2 },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  playBtnActive: { backgroundColor: C.primary },
  playBtnText: { fontSize: 22, color: '#FFFFFF' },
  recordBtn: { borderWidth: 2, borderColor: C.amber, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  recordBtnText: { fontSize: 18, color: C.amber, fontWeight: '700' },

  contactsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  contactCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: C.surface, borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: C.border, minHeight: 110, justifyContent: 'center',
  },
  contactName: { fontSize: 14, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 4 },
  callLabel: { fontSize: 14, color: C.sage, fontWeight: '600' },

  sosFloat: {
    position: 'absolute', bottom: 100, right: 20,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  sosText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 12 },
  modalText: { fontSize: 20, color: C.textMuted, textAlign: 'center', marginBottom: 28, lineHeight: 28 },
  modalSendBtn: { backgroundColor: '#DC2626', borderRadius: 14, paddingVertical: 18, width: '100%', alignItems: 'center', marginBottom: 12 },
  modalSendText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  modalCancelBtn: { paddingVertical: 14, width: '100%', alignItems: 'center' },
  modalCancelText: { color: C.textMuted, fontSize: 16, fontWeight: '600' },
});
