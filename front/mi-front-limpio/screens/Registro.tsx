import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthTextInput } from '../components/AuthTextInput';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'P01Registro'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const P01Registro = ({ navigation }: Props) => {
  const { signUp } = useAuth();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const submitSignup = async () => {
    if (loading) {
      return;
    }

    Keyboard.dismiss();

    const trimmedNombre = nombre.trim();
    const trimmedEmail = email.trim();

    if (!trimmedNombre) {
      setSuccessMessage(null);
      setErrorMessage('Ingresa tu nombre para crear la cuenta.');
      return;
    }

    if (!trimmedEmail) {
      setSuccessMessage(null);
      setErrorMessage('Ingresa tu email para crear la cuenta.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setSuccessMessage(null);
      setErrorMessage('Ingresa un email valido.');
      return;
    }

    if (!password.trim()) {
      setSuccessMessage(null);
      setErrorMessage('Ingresa una contrasena para continuar.');
      return;
    }

    if (password.length < 8) {
      setSuccessMessage(null);
      setErrorMessage('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setSuccessMessage(null);
      setErrorMessage('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await signUp({
      nombre: trimmedNombre,
      email: trimmedEmail,
      password,
    });

    if (result.error) {
      setErrorMessage(result.error);
      setLoading(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccessMessage(
        'Tu cuenta fue creada. Revisa tu correo para confirmar el acceso antes de iniciar sesion.',
      );
      setPassword('');
      setConfirmPassword('');
    }

    setLoading(false);
  };

  return (
    <AuthScreenLayout screenIndicator="01 - REGISTRO">
      <View style={styles.header}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.title}>Quien sos?</Text>
        <Text style={styles.subtitle}>
          Primero lo basico. Despues te presentamos a tu familia.
        </Text>
      </View>

      <View style={styles.form}>
        <AuthTextInput
          label="Tu nombre"
          placeholder="Valeria"
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          returnKeyType="next"
          blurOnSubmit={false}
          editable={!loading}
          value={nombre}
          onChangeText={(value) => {
            clearMessages();
            setNombre(value);
          }}
          onSubmitEditing={() => emailInputRef.current?.focus()}
        />

        <AuthTextInput
          ref={emailInputRef}
          label="Email"
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          blurOnSubmit={false}
          editable={!loading}
          value={email}
          onChangeText={(value) => {
            clearMessages();
            setEmail(value);
          }}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />

        <AuthTextInput
          ref={passwordInputRef}
          label="Contrasena"
          placeholder="Minimo 8 caracteres"
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
            clearMessages();
            setPassword(value);
          }}
          onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
        />

        <AuthTextInput
          ref={confirmPasswordInputRef}
          label="Confirmar contrasena"
          placeholder="Repite tu contrasena"
          isPasswordField
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          editable={!loading}
          value={confirmPassword}
          onChangeText={(value) => {
            clearMessages();
            setConfirmPassword(value);
          }}
          onSubmitEditing={() => void submitSignup()}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={() => void submitSignup()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta"
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creando cuenta...' : 'Continuar con email'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.circle}>o</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={() =>
            setErrorMessage('El ingreso con Google quedara para una fase posterior del MVP.')
          }
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Continuar con Google proximamente"
        >
          <Text style={styles.googleButtonText}>Continuar con Google (proximamente)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Ir a login"
        >
          <Text style={styles.linkText}>Ya tienes cuenta? Inicia sesion</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', paddingHorizontal: 20 },
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
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2DFD6' },
  circle: { marginHorizontal: 16, color: '#A3A3A3', fontSize: 12 },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFD6',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButtonText: { color: '#1C1C1C', fontSize: 15, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#CD7353', fontSize: 14, fontWeight: '600' },
});
