import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'P00Splash'> & {
  loading?: boolean;
};

export const P00Splash = ({ navigation, loading = false }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🏠</Text>
        </View>
        
        <Text style={styles.title}>Tu hogar digital</Text>
        <Text style={styles.subtitle}>
          {loading
            ? 'Estamos preparando tu sesion para que puedas continuar.'
            : "Todo lo que tu familia necesita.\nEn un solo lugar."}
        </Text>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#CD7353" size="small" />
            <Text style={styles.loaderText}>Cargando FamilyHub...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation?.navigate('P01Registro')}
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
  loaderContainer: { marginTop: 24, alignItems: 'center' },
  loaderText: { marginTop: 12, fontSize: 13, color: '#6B6B6B' },
  footer: { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  primaryButton: { backgroundColor: '#CD7353', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { paddingVertical: 12, marginBottom: 24 },
  secondaryButtonText: { color: '#6B6B6B', fontSize: 15, fontWeight: '500' },
  disclaimer: { fontSize: 12, color: '#A3A3A3', marginBottom: 16 },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: 1 },
});
