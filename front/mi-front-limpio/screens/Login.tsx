import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { supabase } from '../supabase/index';
export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Completá todos los campos');
      return;
    }

    try {
      console.log('Iniciando sesión directamente en Supabase...');

      // Limpiamos el email de espacios y mayúsculas para evitar errores de credenciales
      const cleanEmail = email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        // Supabase nos dirá si la cuenta no existe o la clave es incorrecta
        Alert.alert('Error', error.message);
        return;
      }

      if (data.session) {
        Alert.alert('¡Bienvenido!', 'Sesión iniciada correctamente');
        // Una vez logueado, navegamos a la siguiente pantalla del flujo
        navigation.navigate('P02CrearGrupo');
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un problema inesperado al intentar entrar');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>👋</Text>
          <Text style={styles.title}>¡Hola de nuevo!</Text>
          <Text style={styles.subtitle}>Ingresá tus credenciales para entrar a tu hogar.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#A3A3A3"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu contraseña"
            placeholderTextColor="#A3A3A3"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#1C1C1C', fontWeight: '500', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#F3F2EE', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 12, padding: 16, color: '#1C1C1C', marginBottom: 20 },
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#CD7353', fontSize: 14, fontWeight: '600' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', paddingBottom: 24, letterSpacing: 1 },
});