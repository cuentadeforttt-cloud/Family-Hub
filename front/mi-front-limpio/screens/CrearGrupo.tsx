import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { createHousehold } from '../services/households';
import type { PrivateStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PrivateStackParamList, 'P02CrearGrupo'>;

type FamilyType = 'nucleo' | 'con_abuelos' | 'separados' | 'otro';

const FAMILY_TYPES: { id: FamilyType; icon: string; label: string }[] = [
  { id: 'nucleo',      icon: '👨‍👩‍👧‍👦', label: 'Núcleo' },
  { id: 'con_abuelos', icon: '🏡',      label: 'Con abuelos' },
  { id: 'separados',   icon: '🏘️',      label: 'Separados' },
  { id: 'otro',        icon: '✨',       label: 'Otro' },
];

export const P02CrearGrupo = ({ navigation }: Props) => {
  const { user, signOut } = useAuth();
  const { reload } = useHousehold();
  const [nombreHogar, setNombreHogar] = useState('');
  const [tipoFamilia, setTipoFamilia] = useState<FamilyType>('nucleo');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async () => {
    Keyboard.dismiss();

    if (!nombreHogar.trim()) {
      setErrorMessage('Escribe un nombre para tu hogar antes de continuar.');
      return;
    }

    if (!user) return;

    setLoading(true);
    setErrorMessage(null);

    const { household, error } = await createHousehold(nombreHogar, tipoFamilia, user.id);

    if (error || !household) {
      setErrorMessage(error ?? 'Error inesperado. Intenta nuevamente.');
      setLoading(false);
      return;
    }

    await reload();

    navigation.navigate('P03InvitarPersonas', { householdId: household.id });
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AuthScreenLayout screenIndicator="02 - CREAR GRUPO">
      <View style={styles.topBar}>
        <Text style={styles.userEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
        <TouchableOpacity onPress={() => void handleSignOut()} accessibilityRole="button">
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.icon}>🏠 ❤️</Text>
        <Text style={styles.title}>Nombra tu hogar</Text>
        <Text style={styles.subtitle}>
          Este será el espacio privado de tu familia.{'\n'}Solo las personas que invites pueden entrar.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Familia García"
          placeholderTextColor="#A3A3A3"
          returnKeyType="done"
          editable={!loading}
          value={nombreHogar}
          onChangeText={(v) => { setErrorMessage(null); setNombreHogar(v); }}
          onSubmitEditing={() => void handleCreate()}
        />

        <Text style={styles.label}>¿Qué describe mejor a tu familia?</Text>

        <View style={styles.pillsContainer}>
          {FAMILY_TYPES.map(({ id, icon, label }) => (
            <TouchableOpacity
              key={id}
              style={[styles.pill, tipoFamilia === id && styles.pillSelected]}
              onPress={() => setTipoFamilia(id)}
              disabled={loading}
            >
              <Text style={styles.pillText}>{icon} {label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={() => void handleCreate()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Crear hogar"
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.primaryButtonText}>Crear hogar</Text>
          }
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  userEmail: { fontSize: 12, color: '#6B6B6B', flex: 1, marginRight: 12 },
  logoutText: { color: '#CD7353', fontSize: 13, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 50, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  input: {
    backgroundColor: '#F3F2EE',
    borderWidth: 1,
    borderColor: '#E2DFD6',
    borderRadius: 12,
    padding: 16,
    color: '#1C1C1C',
    marginBottom: 32,
    fontSize: 16,
  },
  label: { fontSize: 14, color: '#1C1C1C', fontWeight: '500', marginBottom: 16 },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  pill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFD6',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pillSelected: { backgroundColor: '#F5E6DF', borderColor: '#CD7353' },
  pillText: { fontSize: 14, color: '#1C1C1C', fontWeight: '500' },
  errorText: { color: '#B6472C', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  primaryButton: {
    backgroundColor: '#CD7353',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
