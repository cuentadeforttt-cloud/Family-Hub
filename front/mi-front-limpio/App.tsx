import React from 'react';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { AuthProvider } from './context/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import type { RootStackParamList } from './navigation/types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'familyhub://'],
  config: {
    screens: {
      P00Splash: '',
      Login: 'login',
      P01Registro: 'registro',
      ForgotPassword: 'forgot-password',
      UpdatePassword: 'auth/callback',
      P02CrearGrupo: 'crear-grupo',
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
