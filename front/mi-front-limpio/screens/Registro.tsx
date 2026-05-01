import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../supabase/index'
export const P01Registro = ({ navigation }: any) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Atención', 'Completá todos los campos');
      return;
    }

    try {
      // Creamos la URL dinámica para que el correo te redirija a la app
      const redirectUrl = Linking.createURL('/login');

      // Le pegamos directo a Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            nombre: nombre, // Guardamos el nombre en los metadatos del usuario
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Si el registro fue exitoso (y si tenés la confirmación de email activada)
      Alert.alert(
        '¡Casi listo!',
        'Revisá tu correo para confirmar la cuenta.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }] // O a la pantalla que prefieras
      );

    } catch (error: any) {
      Alert.alert('Error', 'Hubo un problema inesperado en el registro');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>👤</Text>
          <Text style={styles.title}>¿Quién sos?</Text>
          <Text style={styles.subtitle}>Primero lo básico. Después te presentamos a tu familia.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Tu nombre</Text>
          <TextInput style={styles.input} placeholder="Valeria" placeholderTextColor="#A3A3A3" value={nombre} onChangeText={setNombre} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="tu@email.com" placeholderTextColor="#A3A3A3" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" placeholderTextColor="#A3A3A3" secureTextEntry value={password} onChangeText={setPassword} />

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', paddingHorizontal: 20 },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#1C1C1C', fontWeight: '500', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#F3F2EE', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 12, padding: 16, color: '#1C1C1C', marginBottom: 20, fontSize: 15 },
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2DFD6' },
  circle: { marginHorizontal: 16, color: '#A3A3A3', fontSize: 12 },
  googleButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2DFD6', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  googleButtonText: { color: '#1C1C1C', fontSize: 15, fontWeight: '600' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', paddingBottom: 24, letterSpacing: 1 },
});