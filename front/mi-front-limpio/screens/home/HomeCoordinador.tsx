import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { AppScreen, AppText } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';
import { HomePlannerSections } from './HomePlannerSections';

// ─── Main screen ─────────────────────────────────────────────────────────────

export const HomeCoordinador = () => {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.user_metadata?.nombre?.split(' ')[0] ?? 'Coordinador';

  return (
    <AppScreen scroll bottomInset="tab" contentContainerStyle={styles.content}>

        <View style={styles.topBar}>
          <View>
            <AppText variant="title2">{greeting}, {firstName}</AppText>
            <AppText variant="caption" tone="tertiary" style={styles.dateLabel}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </AppText>
          </View>
          <View style={styles.notifBell}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </View>
        </View>

        {currentHousehold && (
          <AppText variant="caption" tone="warning" weight="700" style={styles.householdName}>{currentHousehold.nombre}</AppText>
        )}

        <HomePlannerSections />
        <View style={{ height: 40 }} />
    </AppScreen>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  text: colors.text.primary,
  textMuted: colors.text.tertiary,
};

const styles = StyleSheet.create({
  content: { paddingTop: spacing[1] },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] },
  greeting: { fontSize: 26, fontWeight: '700', color: C.text },
  dateLabel: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  notifBell: { paddingTop: 4 },
  householdName: { marginBottom: spacing[4] },
});
