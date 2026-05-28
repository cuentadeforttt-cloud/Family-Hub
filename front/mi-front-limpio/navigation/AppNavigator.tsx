import React from 'react';
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

const PrivateNavigator = () => {
  const { currentHousehold, loading } = useHousehold();
  const { pendingJoinToken } = useAuth();

  if (loading) return <AuthLoadingScreen />;

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

  return (
    <PrivateStack.Navigator screenOptions={{ headerShown: false }}>
      {currentHousehold ? (
        <>
          <PrivateStack.Screen name="HomeTabs" component={HomeTabNavigator} />
          <PrivateStack.Screen name="P03InvitarPersonas" component={P03InvitarPersonas} />
          <PrivateStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} />
        </>
      ) : (
        <>
          <PrivateStack.Screen name="P02CrearGrupo" component={P02CrearGrupo} />
          <PrivateStack.Screen name="P03InvitarPersonas" component={P03InvitarPersonas} />
          <PrivateStack.Screen name="HomeTabs" component={HomeTabNavigator} />
          <PrivateStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} />
        </>
      )}
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
