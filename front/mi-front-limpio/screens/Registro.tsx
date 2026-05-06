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

export const P01Registro = ({ navigation }: any) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errores, setErrores] = useState({
    nombre: '',
    email: '',
    password: '',
    global: ''
  });

  const handleSignup = async () => {
    let nuevosErrores = { nombre: '', email: '', password: '', global: '' };
    let isValid = true;

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      nuevosErrores.email = 'Ingresá un email válido';
      isValid = false;
    }

    if (password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    if (!isValid) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const response = await api.post('/auth/signup', {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        password
      });
      
      if (response.status === 201) {
        navigation.navigate('P02CrearGrupo');
      }
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.mensaje?.toLowerCase() || '';
      const statusCode = error.response?.status;

      if (statusCode === 429) {
        nuevosErrores.global = 'Muchos intentos seguidos. Esperá un momento.';
      } else if (mensajeBackend.includes('already registered') || mensajeBackend.includes('existe')) {
        nuevosErrores.email = 'Este email ya está registrado.';
      } else {
        nuevosErrores.global = error.response?.data?.mensaje || 'Error inesperado al registrarte.';
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
                    setErrores(prev => ({ ...prev, nombre: '', global: '' }));
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
                    setErrores(prev => ({ ...prev, email: '', global: '' }));
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
                    setErrores(prev => ({ ...prev, password: '', global: '' }));
                  }} 
                />
                {errores.password ? <Text style={styles.fieldError}>{errores.password}</Text> : null}

                {/* ERROR GLOBAL */}
                {errores.global ? <Text style={styles.globalError}>{errores.global}</Text> : null}

                <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
                  <Text style={styles.primaryButtonText}>Continuar con email →</Text>
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
  
  // ESTILOS BASE Y DE ERROR
  input: { backgroundColor: '#F3F2EE', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 12, padding: 16, color: '#1C1C1C', marginBottom: 20, fontSize: 15 },
  inputError: { borderColor: '#D32F2F', borderWidth: 1.5 },
  fieldError: { color: '#D32F2F', fontSize: 12, marginTop: -16, marginBottom: 16, marginLeft: 4, fontWeight: '500' },
  globalError: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 16, fontWeight: '600' },

  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2DFD6' },
  circle: { marginHorizontal: 16, color: '#A3A3A3', fontSize: 12 },
  googleButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2DFD6', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  googleButtonText: { color: '#1C1C1C', fontSize: 15, fontWeight: '600' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', marginTop: 'auto', paddingBottom: 24, letterSpacing: 1 },
});