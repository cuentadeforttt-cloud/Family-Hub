import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type CrearGrupoProps = NativeStackScreenProps<RootStackParamList, 'P02CrearGrupo'>;

export const P02CrearGrupo = ({ navigation }: CrearGrupoProps) => {
  const [nombreHogar, setNombreHogar] = useState('');
  const [tipoFamilia, setTipoFamilia] = useState('nucleo');

  // Función auxiliar para renderizar los botones de selección
  const renderPill = (id: string, icon: string, label: string) => {
    const isSelected = tipoFamilia === id;
    return (
      <TouchableOpacity 
        style={[styles.pill, isSelected && styles.pillSelected]} 
        onPress={() => setTipoFamilia(id)}
      >
        <Text style={styles.pillText}>{icon}  {label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🏠 ❤️</Text>
          <Text style={styles.title}>Nombrá tu hogar</Text>
          <Text style={styles.subtitle}>Este será el espacio privado de tu familia.{'\n'}Solo los que vos invites pueden entrar.</Text>
        </View>

        <View style={styles.form}>
          <TextInput 
            style={styles.input} 
            placeholder="Familia García" 
            placeholderTextColor="#A3A3A3" 
            value={nombreHogar} 
            onChangeText={setNombreHogar} 
          />

          <Text style={styles.label}>¿Qué describe mejor a tu familia?</Text>
          
          <View style={styles.pillsContainer}>
            {renderPill('nucleo', '👨‍👩‍👧‍👦', 'Núcleo')}
            {renderPill('abuelos', '🏡', 'Con abuelos')}
            {renderPill('separados', '🏘️', 'Separados')}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryButtonText}>Crear hogar</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.screenIndicator}>02 — CREAR GRUPO</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 50, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 22 },
  form: { width: '100%' },
  input: { backgroundColor: '#F3F2EE', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 12, padding: 16, color: '#1C1C1C', marginBottom: 32, fontSize: 16 },
  label: { fontSize: 14, color: '#1C1C1C', fontWeight: '500', marginBottom: 16 },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  pill: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2DFD6', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16 },
  pillSelected: { backgroundColor: '#F5E6DF', borderColor: '#CD7353' },
  pillText: { fontSize: 14, color: '#1C1C1C', fontWeight: '500' },
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', paddingBottom: 24, letterSpacing: 1 },
});
