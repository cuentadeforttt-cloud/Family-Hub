import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';

export const P01Registro = ({ navigation }: any) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [errores, setErrores] = useState({
    nombre: '',
    email: '',
    password: '',
    global: '',
  });

  const handleSignup = async () => {
    const fullName = nombre.trim();
    const emailNormalizado = email.toLowerCase().trim();
    const nuevosErrores = { nombre: '', email: '', password: '', global: '' };
    let isValid = true;

    if (isLoading) {
      return;
    }

    if (!fullName) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailNormalizado || !emailRegex.test(emailNormalizado)) {
      nuevosErrores.email = 'Ingresá un email válido';
      isValid = false;
    }

    if (password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    if (!isValid) {
      setErrores(nuevosErrores);
      Alert.alert('Error', 'Revisá los datos ingresados antes de continuar.');
      return;
    }

    try {
      setIsLoading(true);

      if (__DEV__) {
        try {
          await api.post('/auth/dev-signup', {
            nombre: fullName,
            email: emailNormalizado,
            password,
          });

          setErrores({ nombre: '', email: '', password: '', global: '' });
          setNombre('');
          setEmail('');
          setPassword('');

          Alert.alert('Registro dev listo', 'Cuenta creada y confirmada para seguir avanzando.', [
            {
              text: 'Continuar',
              onPress: () => navigation.navigate('P02CrearGrupo'),
            },
          ]);
          return;
        } catch (devError: any) {
          const statusCode = devError.response?.status;
          const mensajeDev = devError.response?.data?.mensaje || devError.message || '';

          if (statusCode !== 403) {
            console.error('Error en registro dev:', {
              status: statusCode,
              mensaje: mensajeDev,
              data: devError.response?.data,
            });

            if (statusCode === 409 || mensajeDev.toLowerCase().includes('already')) {
              nuevosErrores.email = 'Este email ya está registrado. Iniciá sesión para continuar.';
            } else {
              nuevosErrores.global = mensajeDev || 'No pudimos crear la cuenta dev.';
            }

            setErrores(nuevosErrores);
            Alert.alert('Error de registro dev', nuevosErrores.global || nuevosErrores.email);
            return;
          }
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailNormalizado,
        password,
        options: {
          emailRedirectTo: 'familyhub://auth/callback',
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Error de Supabase al registrar:', {
          message: error.message,
          name: error.name,
          status: error.status,
          code: error.code,
        });

        const mensajeError = error.message.toLowerCase();

        if (
          mensajeError.includes('already registered') ||
          mensajeError.includes('already exists') ||
          mensajeError.includes('user already')
        ) {
          nuevosErrores.email = 'Este email ya tiene una cuenta. Si todavía no la confirmaste, revisá tu correo.';
          setErrores(nuevosErrores);
          Alert.alert(
            'Cuenta pendiente',
            'Este email ya tiene una cuenta. Revisá tu bandeja de entrada para confirmar el registro antes de iniciar sesión.',
          );
          return;
        }

        nuevosErrores.global = 'No pudimos crear la cuenta. Intentá nuevamente en unos minutos.';
        setErrores(nuevosErrores);
        Alert.alert('Error de registro', nuevosErrores.global);
        return;
      }

      if (data.user?.identities?.length === 0) {
        nuevosErrores.email = 'Este email ya tiene una cuenta pendiente de confirmación.';
        setErrores(nuevosErrores);
        Alert.alert(
          'Cuenta pendiente',
          'Este email ya fue registrado. Revisá tu bandeja de entrada para confirmar la cuenta antes de iniciar sesión.',
          [
            {
              text: 'Ir al login',
              onPress: () => navigation.navigate('Login'),
            },
          ],
        );
        return;
      }

      setErrores({ nombre: '', email: '', password: '', global: '' });
      setNombre('');
      setEmail('');
      setPassword('');

      Alert.alert('¡Registro casi listo!', 'Revisa tu bandeja de entrada para confirmar tu cuenta.', [
        {
          text: 'Ir al login',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error: any) {
      console.error('Catch técnico de registro:', {
        message: error?.message,
        name: error?.name,
        status: error?.status,
        code: error?.code,
        cause: error?.cause,
        stack: error?.stack,
      });

      const mensajeSupabase = error.message?.toLowerCase() || '';

      if (mensajeSupabase.includes('rate limit') || mensajeSupabase.includes('too many')) {
        nuevosErrores.global = 'Muchos intentos seguidos. Esperá un momento.';
      } else if (
        mensajeSupabase.includes('already registered') ||
        mensajeSupabase.includes('already exists') ||
        mensajeSupabase.includes('user already')
      ) {
        nuevosErrores.email = 'Este email ya tiene una cuenta. Si todavía no la confirmaste, revisá tu correo.';
      } else {
        nuevosErrores.global = 'Error inesperado al registrarte.';
      }

      setErrores(nuevosErrores);
      Alert.alert('Error', nuevosErrores.global || nuevosErrores.email || 'Error inesperado al registrarte.');
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
              <Text style={styles.icon}>👤</Text>
              <Text style={styles.title}>¿Quién sos?</Text>
              <Text style={styles.subtitle}>Primero lo básico. Después te presentamos a tu familia.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Tu nombre</Text>
              <TextInput
                style={[styles.input, errores.nombre ? styles.inputError : null]}
                placeholder="Valeria"
                placeholderTextColor="#A3A3A3"
                value={nombre}
                onChangeText={(text) => {
                  setNombre(text);
                  setErrores((prev) => ({ ...prev, nombre: '', global: '' }));
                }}
              />
              {errores.nombre ? <Text style={styles.fieldError}>{errores.nombre}</Text> : null}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errores.email ? styles.inputError : null]}
                placeholder="tu@email.com"
                placeholderTextColor="#A3A3A3"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrores((prev) => ({ ...prev, email: '', global: '' }));
                }}
              />
              {errores.email ? <Text style={styles.fieldError}>{errores.email}</Text> : null}

              <Text style={styles.label}>Contraseña</Text>
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

              {errores.global ? <Text style={styles.globalError}>{errores.global}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading ? styles.primaryButtonDisabled : null]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continuar con email →</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.circle}>°</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <Text style={styles.googleButtonText}>G   Continuar con Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.screenIndicator}>01 — REGISTRO</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  keyboardContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', paddingHorizontal: 20 },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#1C1C1C', fontWeight: '500', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#F3F2EE', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 12, padding: 16, color: '#1C1C1C', marginBottom: 20, fontSize: 15 },
  inputError: { borderColor: '#D32F2F', borderWidth: 1.5 },
  fieldError: { color: '#D32F2F', fontSize: 12, marginTop: -16, marginBottom: 16, marginLeft: 4, fontWeight: '500' },
  globalError: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2DFD6' },
  circle: { marginHorizontal: 16, color: '#A3A3A3', fontSize: 12 },
  googleButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2DFD6', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  googleButtonText: { color: '#1C1C1C', fontSize: 15, fontWeight: '600' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', marginTop: 'auto', paddingBottom: 24, letterSpacing: 1 },
});
