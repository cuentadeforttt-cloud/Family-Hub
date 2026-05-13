import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export const AuthLoadingScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.title}>Tu hogar digital</Text>
        <Text style={styles.subtitle}>
          Estamos preparando tu sesion para que puedas continuar.
        </Text>
        <ActivityIndicator color="#CD7353" size="small" style={styles.loader} />
      </View>
      <Text style={styles.screenIndicator}>AUTH - BOOTSTRAP</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1C', marginBottom: 16 },
  subtitle: { fontSize: 15, color: '#6B6B6B', textAlign: 'center', lineHeight: 22 },
  loader: { marginTop: 24 },
  screenIndicator: {
    fontSize: 10,
    color: '#A3A3A3',
    textAlign: 'center',
    paddingBottom: 24,
    letterSpacing: 1,
  },
});
