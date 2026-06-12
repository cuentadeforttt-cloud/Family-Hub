import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import type { AuthStackParamList, PrivateStackParamList } from './types';
import { P00Splash } from '../screens/Splash';
import { AuthLoadingScreen } from '../screens/AuthLoading';
import { P01Registro } from '../screens/Registro';
import { P02CrearGrupo } from '../screens/CrearGrupo';
import { P03InvitarPersonas } from '../screens/InvitarPersonas';
import { JoinHouseholdScreen } from '../screens/JoinHousehold';
import { LoginScreen } from '../screens/Login';
import { ForgotPasswordScreen } from '../screens/ForgotPassword';
import { UpdatePasswordScreen } from '../screens/UpdatePassword';
import { HomeTabNavigator } from './HomeTabNavigator';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const PrivateStack = createNativeStackNavigator<PrivateStackParamList>();

/** Pantalla de error cuando no se pudo cargar el hogar (error de DB/red) */
const HouseholdErrorScreen = () => {
  const { reload } = useHousehold();
  return (
    <View style={errStyles.container}>
      <Text style={errStyles.icon}>⚠️</Text>
      <Text style={errStyles.title}>No pudimos cargar tu hogar</Text>
      <Text style={errStyles.subtitle}>
        Puede ser un problema de conexión o de configuración.{'\n'}
        Revisá tu conexión a internet e intentá de nuevo.
      </Text>
      <TouchableOpacity style={errStyles.btn} onPress={() => void reload()}>
        <Text style={errStyles.btnText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
};

const errStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8', alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon:      { fontSize: 56, marginBottom: 16 },
  title:     { fontSize: 22, fontWeight: '700', color: '#1C1C1C', textAlign: 'center', marginBottom: 12 },
  subtitle:  { fontSize: 15, color: '#6B6B6B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn:       { backgroundColor: '#CD7353', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  btnText:   { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

const PrivateNavigator = () => {
  const { currentHousehold, loading, householdError } = useHousehold();
  const { pendingJoinToken } = useAuth();

  if (loading) return <AuthLoadingScreen />;

  // Error real cargando el hogar (no es "sin hogar") — mostrar pantalla de reintento
  if (householdError) {
    return <HouseholdErrorScreen />;
  }

  // Pending join token takes priority: process the invitation before anything else
  if (pendingJoinToken) {
    return (
      <PrivateStack.Navigator screenOptions={{ headerShown: false }}>
        <PrivateStack.Screen
          name="JoinHousehold"
          component={JoinHouseholdScreen}
          initialParams={{ token: pendingJoinToken }}
        />
        <PrivateStack.Screen name="HomeTabs" component={HomeTabNavigator} />
      </PrivateStack.Navigator>
    );
  }

  // Navigator aplanado: todos los screens siempre registrados.
  // initialRouteName solo aplica en el primer mount; cambios posteriores de
  // currentHousehold NO resetean el stack, permitiendo que navigate/replace
  // post-creación permanezca en P03InvitarPersonas sin ser pisado.
  return (
    <PrivateStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={currentHousehold ? 'HomeTabs' : 'P02CrearGrupo'}
    >
      <PrivateStack.Screen name="HomeTabs" component={HomeTabNavigator} />
      <PrivateStack.Screen name="P02CrearGrupo" component={P02CrearGrupo} />
      <PrivateStack.Screen name="P03InvitarPersonas" component={P03InvitarPersonas} />
      <PrivateStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} />
    </PrivateStack.Navigator>
  );
};

export const AppNavigator = () => {
  const { initialized, loading, session, isPasswordRecovery } = useAuth();

  if (!initialized || loading) return <AuthLoadingScreen />;

  if (isPasswordRecovery) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
      </AuthStack.Navigator>
    );
  }

  if (session) return <PrivateNavigator />;

  return (
    <AuthStack.Navigator initialRouteName="P00Splash" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="P00Splash" component={P00Splash} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="P01Registro" component={P01Registro} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
    </AuthStack.Navigator>
  );
};
