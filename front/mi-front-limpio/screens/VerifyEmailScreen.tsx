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
import { actualizarPassword, verificarCodigoRecuperacion } from '../services/authService';

type VerifyEmailScreenProps = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

interface VerifyEmailErrores {
  email: string;
  codigo: string;
  password: string;
  repetirPassword: string;
  global: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const codigoRegex = /^\d{6}$/;

const erroresIniciales: VerifyEmailErrores = {
  email: '',
  codigo: '',
  password: '',
  repetirPassword: '',
  global: '',
};

const obtenerMensajeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'No pudimos actualizar la contraseña. Intentá nuevamente en unos minutos.';
};

export const VerifyEmailScreen = ({ navigation, route }: VerifyEmailScreenProps) => {
  const [email, setEmail] = useState(route.params?.email || '');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [repetirPassword, setRepetirPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errores, setErrores] = useState<VerifyEmailErrores>(erroresIniciales);

  const validarFormulario = (): boolean => {
    const nuevosErrores: VerifyEmailErrores = { ...erroresIniciales };
    const emailNormalizado = email.toLowerCase().trim();
    const codigoLimpio = codigo.trim();
    let isValid = true;

    if (!emailNormalizado || !emailRegex.test(emailNormalizado)) {
      nuevosErrores.email = 'Ingresá un email válido';
      isValid = false;
    }

    if (!codigoRegex.test(codigoLimpio)) {
      nuevosErrores.codigo = 'Ingresá el código de 6 dígitos';
      isValid = false;
    }

    if (password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    if (repetirPassword !== password) {
      nuevosErrores.repetirPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    setErrores(nuevosErrores);
    return isValid;
  };

  const handleActualizarPassword = async () => {
    if (!validarFormulario()) {
      return;
    }

    const emailNormalizado = email.toLowerCase().trim();
    const codigoLimpio = codigo.trim();

    try {
      setIsLoading(true);
      setErrores(erroresIniciales);

      await verificarCodigoRecuperacion({
        email: emailNormalizado,
        codigo: codigoLimpio,
      });

      await actualizarPassword({ password });

      Alert.alert(
        'Contraseña actualizada',
        'Ya podés iniciar sesión con tu nueva contraseña.',
        [
          {
            text: 'Ir al login',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error: unknown) {
      const mensaje = obtenerMensajeError(error);
      setErrores({ ...erroresIniciales, global: mensaje });
      Alert.alert('No pudimos actualizar la contraseña', mensaje);
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
              <Text style={styles.icon}>🔑</Text>
              <Text style={styles.title}>Creá una nueva contraseña</Text>
              <Text style={styles.subtitle}>
                Usá el código que recibiste por email para confirmar el cambio.
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
                  setErrores((prev) => ({ ...prev, email: '', global: '' }));
                }}
              />
              {errores.email ? <Text style={styles.fieldError}>{errores.email}</Text> : null}

              <Text style={styles.label}>Código</Text>
              <TextInput
                style={[styles.input, errores.codigo ? styles.inputError : null]}
                placeholder="123456"
                placeholderTextColor="#A3A3A3"
                keyboardType="number-pad"
                maxLength={6}
                value={codigo}
                onChangeText={(text) => {
                  setCodigo(text.replace(/\D/g, ''));
                  setErrores((prev) => ({ ...prev, codigo: '', global: '' }));
                }}
              />
              {errores.codigo ? <Text style={styles.fieldError}>{errores.codigo}</Text> : null}

              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput
                style={[styles.input, errores.password ? styles.inputError : null]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#A3A3A3"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrores((prev) => ({ ...prev, password: '', global: '' }));
                }}
              />
              {errores.password ? <Text style={styles.fieldError}>{errores.password}</Text> : null}

              <Text style={styles.label}>Repetir contraseña</Text>
              <TextInput
                style={[styles.input, errores.repetirPassword ? styles.inputError : null]}
                placeholder="Repetí la contraseña"
                placeholderTextColor="#A3A3A3"
                secureTextEntry
                value={repetirPassword}
                onChangeText={(text) => {
                  setRepetirPassword(text);
                  setErrores((prev) => ({ ...prev, repetirPassword: '', global: '' }));
                }}
              />
              {errores.repetirPassword ? (
                <Text style={styles.fieldError}>{errores.repetirPassword}</Text>
              ) : null}

              {errores.global ? <Text style={styles.globalError}>{errores.global}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading ? styles.primaryButtonDisabled : null]}
                onPress={handleActualizarPassword}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Pedir un nuevo código</Text>
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

          <Text style={styles.screenIndicator}>04 — VERIFICAR</Text>
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
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#CD7353', fontSize: 14, fontWeight: '600' },
  secondaryLinkButton: { marginTop: 16, alignItems: 'center' },
  secondaryLinkText: { color: '#6B6B6B', fontSize: 14, fontWeight: '500' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', marginTop: 'auto', paddingBottom: 24, letterSpacing: 1 },
});
