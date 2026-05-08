import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { P00Splash } from '../screens/Splash';
import { P01Registro } from '../screens/Registro';
import { P02CrearGrupo } from '../screens/CrearGrupo';
import { LoginScreen } from '../screens/Login'; // El que hicimos en el paso anterior
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { HomeScreen } from '../screens/Home';

export type RootStackParamList = {
  P00Splash: undefined;
  P01Registro: undefined;
  P02CrearGrupo: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email?: string } | undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="P00Splash" 
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="P00Splash" component={P00Splash} />
      <Stack.Screen name="P01Registro" component={P01Registro} />
      <Stack.Screen name="P02CrearGrupo" component={P02CrearGrupo} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};
