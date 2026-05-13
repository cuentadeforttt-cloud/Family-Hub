import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthTextInput } from '../components/AuthTextInput';
import { useAuth } from '../context/AuthContext';

export const UpdatePasswordScreen = () => {
  const { updatePassword } = useAuth();
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (loading) {
      return;
    }

    Keyboard.dismiss();

    if (!password.trim()) {
      setErrorMessage('Ingresa una nueva contrasena.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await updatePassword(password);

    if (result.error) {
      setErrorMessage(result.error);
    }

    setLoading(false);
  };

  return (
    <AuthScreenLayout screenIndicator="AUTH - UPDATE PASSWORD" centerContent>
      <View style={styles.header}>
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.title}>Nueva contrasena</Text>
        <Text style={styles.subtitle}>
          Crea una nueva contrasena para volver a entrar a tu hogar digital.
        </Text>
      </View>

      <View style={styles.form}>
        <AuthTextInput
          label="Nueva contrasena"
          placeholder="Minimo 6 caracteres"
          isPasswordField
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          blurOnSubmit={false}
          editable={!loading}
          value={password}
          onChangeText={(value) => {
            clearError();
            setPassword(value);
          }}
          onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
        />

        <AuthTextInput
          ref={confirmPasswordInputRef}
          label="Confirmar contrasena"
          placeholder="Repite tu nueva contrasena"
          isPasswordField
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          editable={!loading}
          value={confirmPassword}
          onChangeText={(value) => {
            clearError();
            setConfirmPassword(value);
          }}
          onSubmitEditing={() => void handleUpdatePassword()}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={() => void handleUpdatePassword()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Guardar nueva contrasena"
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Actualizando...' : 'Guardar contrasena'}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 58, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  errorText: { color: '#B6472C', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  primaryButton: {
    backgroundColor: '#CD7353',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
