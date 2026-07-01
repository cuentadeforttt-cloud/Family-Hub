import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppLogo } from '../components/AppLogo';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { AuthTextInput } from '../components/AuthTextInput';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { authErrorHaptic, authSuccessHaptic } from '../utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getLoginErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('network')
    || normalized.includes('fetch')
    || normalized.includes('conectar')
    || normalized.includes('servidor')
  ) {
    return 'No pudimos conectarnos. Probá de nuevo en unos segundos.';
  }

  return 'No pudimos iniciar sesión. Revisá tu correo y contraseña.';
};

const getGoogleErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('network')
    || normalized.includes('fetch')
    || normalized.includes('conectar')
  ) {
    return 'No pudimos conectarnos. Probá de nuevo en unos segundos.';
  }

  if (
    normalized.includes('cancelled')
    || normalized.includes('cancel')
  ) {
    return null;
  }

  return 'No pudimos iniciar sesión con Google. Intentá nuevamente.';
};

export const LoginScreen = ({ navigation }: Props) => {
  const { signIn, signInWithGoogle } = useAuth();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

const submitLogin = async () => {
    if (loading) {
      return;
    }

    Keyboard.dismiss();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      void authErrorHaptic();
      setErrorMessage('Ingresa tu correo para continuar.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      void authErrorHaptic();
      setErrorMessage('Ingresá un correo válido.');
      return;
    }

    if (!password.trim()) {
      void authErrorHaptic();
      setErrorMessage('Ingresá tu contraseña para continuar.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await signIn({
      email: trimmedEmail,
      password,
    });

    if (result.error) {
      void authErrorHaptic();
      setErrorMessage(getLoginErrorMessage(result.error));
    } else {
      void authSuccessHaptic();
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) {
      return;
    }

    Keyboard.dismiss();
    setErrorMessage(null);
    setGoogleLoading(true);

    const result = await signInWithGoogle();

    if (result.error) {
      const errorMessage = getGoogleErrorMessage(result.error);
      if (errorMessage) {
        void authErrorHaptic();
        setErrorMessage(errorMessage);
      }
    }

    setGoogleLoading(false);
  };

  return (
    <AuthScreenLayout screenIndicator="01 - LOGIN" centerContent presentation="premium">
      <View style={styles.header}>
        <AppLogo size={70} rounded style={styles.logo} />
        <Text style={styles.title}>Entra a tu hogar</Text>
        <Text style={styles.subtitle}>
          Organiza tareas, eventos y momentos familiares desde un solo lugar.
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
          returnKeyType="next"
          blurOnSubmit={false}
          editable={!loading}
          value={email}
          onChangeText={(value) => {
            clearError();
            setEmail(value);
          }}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />

        <AuthTextInput
          ref={passwordInputRef}
          label="Contraseña"
          placeholder="Tu contraseña"
          isPasswordField
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          editable={!loading}
          value={password}
          onChangeText={(value) => {
            clearError();
            setPassword(value);
          }}
          onSubmitEditing={() => void submitLogin()}
        />

{errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={() => void submitLogin()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
          onPress={() => void handleGoogleSignIn()}
          disabled={googleLoading || loading}
          accessibilityRole="button"
          accessibilityLabel="Continuar con Google"
        >
          <View style={styles.googleButtonContent}>
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Conectando...' : 'Continuar con Google'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={loading || googleLoading}
          accessibilityRole="button"
          accessibilityLabel="Recuperar contraseña"
        >
          <Text style={styles.forgotText}>Olvidé mi contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('P01Registro')}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Ir a registro"
        >
          <Text style={styles.linkText}>No tenes cuenta? Crea tu espacio familiar</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 30 },
  logo: { marginBottom: 18 },
  title: { fontSize: 27, fontWeight: '700', color: '#1A1714', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B6560', textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  errorText: {
    color: '#A85050',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
    backgroundColor: '#F5E2E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#C17F59',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  forgotButton: { marginTop: 16, alignItems: 'center' },
  forgotText: { color: '#6B6560', fontSize: 14, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center' },
linkText: { color: '#A86B45', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  googleButton: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0D8D0',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: { color: '#1A1714', fontSize: 15, fontWeight: '600' },
});
