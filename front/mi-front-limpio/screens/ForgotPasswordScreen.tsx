import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { enviarCodigoRecuperacion } from '../services/authService';

type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

interface ForgotPasswordErrores {
  email: string;
  global: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const obtenerMensajeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'No pudimos enviar el código. Intentá nuevamente en unos minutos.';
};

export const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errores, setErrores] = useState<ForgotPasswordErrores>({
    email: '',
    global: '',
  });

  const handleEnviarCodigo = async () => {
    const emailNormalizado = email.toLowerCase().trim();
    const nuevosErrores: ForgotPasswordErrores = { email: '', global: '' };

    if (!emailNormalizado || !emailRegex.test(emailNormalizado)) {
      nuevosErrores.email = 'Ingresá un email válido';
      setErrores(nuevosErrores);
      return;
    }

    try {
      setIsLoading(true);
      setMensajeExito('');
      setErrores(nuevosErrores);

      await enviarCodigoRecuperacion({ email: emailNormalizado });

      setMensajeExito('Te enviamos un código de 6 dígitos para recuperar tu contraseña.');
      Alert.alert(
        'Código enviado',
        'Revisá tu correo e ingresá el código para crear una nueva contraseña.',
        [
          {
            text: 'Ingresar código',
            onPress: () => navigation.navigate('VerifyEmail', { email: emailNormalizado }),
          },
        ],
      );
    } catch (error: unknown) {
      const mensaje = obtenerMensajeError(error);
      setErrores({ email: '', global: mensaje });
      Alert.alert('No pudimos enviar el código', mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          overScrollMode="never"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.icon}>🔐</Text>
              <Text style={styles.title}>Recuperá tu contraseña</Text>
              <Text style={styles.subtitle}>
                Ingresá tu email y te mandamos un código para volver a entrar.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errores.email ? styles.inputError : null]}
                placeholder="tu@email.com"
                placeholderTextColor="#A3A3A3"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setMensajeExito('');
                  setErrores((prev) => ({ ...prev, email: '', global: '' }));
                }}
              />
              {errores.email ? <Text style={styles.fieldError}>{errores.email}</Text> : null}

              {mensajeExito ? <Text style={styles.successText}>{mensajeExito}</Text> : null}
              {errores.global ? <Text style={styles.globalError}>{errores.global}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading ? styles.primaryButtonDisabled : null]}
                onPress={handleEnviarCodigo}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Enviando...' : 'Enviar código'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('VerifyEmail', { email: email.toLowerCase().trim() })}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Ya tengo un código</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryLinkButton}
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.secondaryLinkText}>Volver al login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.screenIndicator}>03 — RECUPERAR</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  keyboardContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingVertical: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#1C1C1C', fontWeight: '500', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#F3F2EE', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 12, padding: 16, color: '#1C1C1C', marginBottom: 20, fontSize: 15 },
  inputError: { borderColor: '#D32F2F', borderWidth: 1.5 },
  fieldError: { color: '#D32F2F', fontSize: 12, marginTop: -16, marginBottom: 16, marginLeft: 4, fontWeight: '500' },
  globalError: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  successText: { color: '#2E7D32', fontSize: 14, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#CD7353', fontSize: 14, fontWeight: '600' },
  secondaryLinkButton: { marginTop: 16, alignItems: 'center' },
  secondaryLinkText: { color: '#6B6B6B', fontSize: 14, fontWeight: '500' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', marginTop: 'auto', paddingBottom: 24, letterSpacing: 1 },
});
