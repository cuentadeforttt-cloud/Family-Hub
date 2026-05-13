import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList, PrivateStackParamList } from './types';
import { P00Splash } from '../screens/Splash';
import { AuthLoadingScreen } from '../screens/AuthLoading';
import { P01Registro } from '../screens/Registro';
import { P02CrearGrupo } from '../screens/CrearGrupo';
import { LoginScreen } from '../screens/Login';
import { ForgotPasswordScreen } from '../screens/ForgotPassword';
import { UpdatePasswordScreen } from '../screens/UpdatePassword';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const PrivateStack = createNativeStackNavigator<PrivateStackParamList>();

export const AppNavigator = () => {
  const { initialized, loading, session, isPasswordRecovery } = useAuth();

  if (!initialized || loading) {
    return <AuthLoadingScreen />;
  }

  if (isPasswordRecovery) {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <AuthStack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
      </AuthStack.Navigator>
    );
  }

  if (session) {
    return (
      <PrivateStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <PrivateStack.Screen name="P02CrearGrupo" component={P02CrearGrupo} />
      </PrivateStack.Navigator>
    );
  }

  return (
    <AuthStack.Navigator
      initialRouteName="P00Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="P00Splash" component={P00Splash} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="P01Registro" component={P01Registro} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
    </AuthStack.Navigator>
  );
};
