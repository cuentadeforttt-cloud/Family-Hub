import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 1. EL NUEVO ESTADO DE ERRORES
  const [errores, setErrores] = useState({
    email: '',
    password: '',
    global: ''
  });

  const handleLogin = async () => {
    // Limpiamos errores previos
    let nuevosErrores = { email: '', password: '', global: '' };
    let isValid = true;

    // Validaciones Frontend
    if (!email.trim()) {
      nuevosErrores.email = 'Ingresá tu email';
      isValid = false;
    }
    
    if (!password) {
      nuevosErrores.password = 'Ingresá tu contraseña';
      isValid = false;
    }

    if (!isValid) {
      setErrores(nuevosErrores);
      return;
    }

    // Validaciones Backend
    try {
      console.log('Iniciando sesión en Node...');
      const response = await api.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password: password
      });

      if (response.status === 200) {
        setErrores({ email: '', password: '', global: '' });
        // navigation.navigate('Home'); 
      }
    } catch (error: any) {
      const statusCode = error.response?.status;
      if (statusCode === 429) {
        nuevosErrores.global = 'Muchos intentos seguidos. Esperá un momento.';
      } else {
        nuevosErrores.global = 'El email o la contraseña son incorrectos.';
      }
      setErrores(nuevosErrores);
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
              <Text style={styles.icon}>👋</Text>
              <Text style={styles.title}>¡Hola de nuevo!</Text>
              <Text style={styles.subtitle}>Ingresá tus credenciales para entrar a tu hogar.</Text>
            </View>

            <View style={styles.form}>
              
              <Text style={styles.label}>Email</Text>
              <TextInput 
                // ESTILO CONDICIONAL: Si hay error en email, se suma inputError
                style={[styles.input, errores.email ? styles.inputError : null]} 
                placeholder="tu@email.com" 
                placeholderTextColor="#A3A3A3" 
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={(text) => {
                  setEmail(text);
                  // LIMPIEZA AUTOMÁTICA: Borramos el error apenas el usuario escribe
                  setErrores(prev => ({ ...prev, email: '', global: '' }));
                }} 
              />
              {/* RENDERIZADO CONDICIONAL: Texto de error debajo del input */}
              {errores.email ? <Text style={styles.fieldError}>{errores.email}</Text> : null}


              <Text style={styles.label}>Contraseña</Text>
              <TextInput 
                style={[styles.input, errores.password ? styles.inputError : null]} 
                placeholder="Tu contraseña" 
                placeholderTextColor="#A3A3A3" 
                secureTextEntry 
                value={password} 
                onChangeText={(text) => {
                  setPassword(text);
                  setErrores(prev => ({ ...prev, password: '', global: '' }));
                }} 
              />
              {errores.password ? <Text style={styles.fieldError}>{errores.password}</Text> : null}

              {/* ERROR GLOBAL: Justo arriba del botón principal */}
              {errores.global ? <Text style={styles.globalError}>{errores.global}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => navigation.navigate('P01Registro')}
              >
                <Text style={styles.linkText}>¿No tenés cuenta? Registrate acá</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.screenIndicator}>01 — LOGIN</Text>

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
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#1C1C1C', fontWeight: '500', marginBottom: 8, marginLeft: 4 },
  
  // ESTILOS BASE Y DE ERROR
  input: { backgroundColor: '#F3F2EE', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 12, padding: 16, color: '#1C1C1C', marginBottom: 20 },
  inputError: { borderColor: '#D32F2F', borderWidth: 1.5 }, // Borde rojo remarcado
  fieldError: { color: '#D32F2F', fontSize: 12, marginTop: -16, marginBottom: 16, marginLeft: 4, fontWeight: '500' },
  globalError: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#CD7353', fontSize: 14, fontWeight: '600' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', marginTop: 'auto', paddingBottom: 24, letterSpacing: 1 },
});