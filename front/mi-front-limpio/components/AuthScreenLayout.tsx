import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  screenIndicator: string;
  centerContent?: boolean;
};

export const AuthScreenLayout = ({
  children,
  screenIndicator,
  centerContent = false,
}: AuthScreenLayoutProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            centerContent ? styles.centerContent : styles.startContent,
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>{children}</View>
          <Text style={styles.screenIndicator}>{screenIndicator}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F4' },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  centerContent: { justifyContent: 'center' },
  startContent: { justifyContent: 'flex-start' },
  inner: { width: '100%' },
  screenIndicator: {
    fontSize: 10,
    color: '#A3A3A3',
    textAlign: 'center',
    paddingTop: 16,
    letterSpacing: 1,
  },
});
