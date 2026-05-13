import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { useAuth } from '../context/AuthContext';

export const P02CrearGrupo = () => {
  const { signOut, user } = useAuth();
  const [nombreHogar, setNombreHogar] = useState('');
  const [tipoFamilia, setTipoFamilia] = useState('nucleo');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const renderPill = (id: string, icon: string, label: string) => {
    const isSelected = tipoFamilia === id;

    return (
      <TouchableOpacity
        style={[styles.pill, isSelected && styles.pillSelected]}
        onPress={() => setTipoFamilia(id)}
      >
        <Text style={styles.pillText}>
          {icon} {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleCreatePlaceholder = () => {
    Keyboard.dismiss();

    if (!nombreHogar.trim()) {
      setStatusMessage('Escribe un nombre para tu hogar antes de continuar.');
      return;
    }

    setStatusMessage(
      'Tu hogar quedo listo como placeholder. En la siguiente fase conectamos esta pantalla a la base.',
    );
  };

  const handleSignOut = async () => {
    if (loadingLogout) {
      return;
    }

    setLoadingLogout(true);
    const result = await signOut();

    if (result.error) {
      setStatusMessage(result.error);
    }

    setLoadingLogout(false);
  };

  return (
    <AuthScreenLayout screenIndicator="02 - CREAR GRUPO">
      <View style={styles.topBar}>
        <Text style={styles.userEmail}>{user?.email ?? 'Sesion activa'}</Text>
        <TouchableOpacity
          onPress={() => void handleSignOut()}
          disabled={loadingLogout}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesion"
        >
          <Text style={styles.logoutText}>
            {loadingLogout ? 'Cerrando...' : 'Cerrar sesion'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.icon}>🏠 ❤️</Text>
        <Text style={styles.title}>Nombra tu hogar</Text>
        <Text style={styles.subtitle}>
          Este sera el espacio privado de tu familia.{'\n'}Solo las personas que invites
          pueden entrar.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Familia Garcia"
          placeholderTextColor="#A3A3A3"
          returnKeyType="done"
          value={nombreHogar}
          onChangeText={(value) => {
            if (statusMessage) {
              setStatusMessage(null);
            }
            setNombreHogar(value);
          }}
          onSubmitEditing={handleCreatePlaceholder}
        />

        <Text style={styles.label}>Que describe mejor a tu familia?</Text>

        <View style={styles.pillsContainer}>
          {renderPill('nucleo', '👨‍👩‍👧‍👦', 'Nucleo')}
          {renderPill('abuelos', '🏡', 'Con abuelos')}
          {renderPill('separados', '🏘️', 'Separados')}
        </View>

        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCreatePlaceholder}
          accessibilityRole="button"
          accessibilityLabel="Crear hogar"
        >
          <Text style={styles.primaryButtonText}>Crear hogar</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
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
  statusText: { color: '#6B6B6B', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  primaryButton: {
    backgroundColor: '#CD7353',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
