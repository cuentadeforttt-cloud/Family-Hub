import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthTextInput } from '../components/AuthTextInput';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }

    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const handleResetPassword = async () => {
    if (loading) {
      return;
    }

    Keyboard.dismiss();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setSuccessMessage(null);
      setErrorMessage('Ingresa tu email para recuperar la contrasena.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setSuccessMessage(null);
      setErrorMessage('Ingresa un email valido.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await resetPassword(trimmedEmail);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSuccessMessage(
        'Te enviamos un enlace para recuperar tu contrasena. Revisa tu correo.',
      );
    }

    setLoading(false);
  };

  return (
    <AuthScreenLayout screenIndicator="AUTH - RECOVERY" centerContent>
      <View style={styles.header}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Recupera tu acceso</Text>
        <Text style={styles.subtitle}>
          Ingresa tu email y te enviaremos un enlace para crear una nueva contrasena.
        </Text>
      </View>

      <View style={styles.form}>
        <AuthTextInput
          label="Email"
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          editable={!loading}
          value={email}
          onChangeText={(value) => {
            clearMessages();
            setEmail(value);
          }}
          onSubmitEditing={() => void handleResetPassword()}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={() => void handleResetPassword()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Enviar enlace de recuperacion"
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Volver al login"
        >
          <Text style={styles.linkText}>Volver a iniciar sesion</Text>
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
  successText: { color: '#2F6E4F', fontSize: 13, marginBottom: 12, lineHeight: 18 },
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
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#CD7353', fontSize: 14, fontWeight: '600' },
});
