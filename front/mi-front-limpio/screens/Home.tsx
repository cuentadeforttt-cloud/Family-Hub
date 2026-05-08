import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.title}>FamilyHub</Text>
        <Text style={styles.subtitle}>Ya estás dentro. Desde acá empieza el hogar digital.</Text>
      </View>
      <Text style={styles.screenIndicator}>HOME</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 22 },
  screenIndicator: { fontSize: 10, color: '#A3A3A3', textAlign: 'center', paddingBottom: 24, letterSpacing: 1 },
});
