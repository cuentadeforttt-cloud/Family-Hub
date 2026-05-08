import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const P00Splash = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🏠</Text>
        </View>
        
        <Text style={styles.title}>Tu hogar digital</Text>
        <Text style={styles.subtitle}>
          Todo lo que tu familia necesita.{'\n'}En un solo lugar.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('P01Registro')}
        >
          <Text style={styles.primaryButtonText}>Crear mi familia</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')} // Acá lo mandás a la vista de Login que hicimos antes
        >
          <Text style={styles.secondaryButtonText}>Ya tengo un grupo</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>Sin publicidad · Sin algoritmos · Sin incentivos</Text>
        <Text style={styles.screenIndicator}>00 — SPLASH</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' }, // Color crema del fondo
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconContainer: { marginBottom: 24 },
  icon: { fontSize: 80 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1C', marginBottom: 16 },
  subtitle: { fontSize: 15, color: '#6B6B6B', textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { paddingVertical: 12, marginBottom: 24 },
  secondaryButtonText: { color: '#6B6B6B', fontSize: 15, fontWeight: '500' },
  disclaimer: { fontSize: 12, color: '#A3A3A3', marginBottom: 16 },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: 1 },
});
