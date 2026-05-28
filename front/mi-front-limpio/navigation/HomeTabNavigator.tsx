import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import type { HomeTabParamList } from './types';
import { useHousehold } from '../context/HouseholdContext';
import { HomeCoordinador } from '../screens/home/HomeCoordinador';
import { HomeAdulto } from '../screens/home/HomeAdulto';
import { HomeAdolescente } from '../screens/home/HomeAdolescente';
import { HomeAdultoMayor } from '../screens/home/HomeAdultoMayor';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { FamilyScreen } from '../screens/FamilyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<HomeTabParamList>();

const DARK_ROLES = ['coordinador', 'adolescente'] as const;

const TabIcon = ({
  icon,
  label,
  focused,
  accentColor,
}: {
  icon: string;
  label: string;
  focused: boolean;
  accentColor: string;
}) => (
  <View style={{ alignItems: 'center', paddingTop: 6, minWidth: 52 }}>
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text
      style={{
        fontSize: 10,
        marginTop: 2,
        fontWeight: focused ? '600' : '400',
        color: focused ? accentColor : '#888888',
      }}
    >
      {label}
    </Text>
    {focused && (
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: accentColor,
          marginTop: 3,
        }}
      />
    )}
  </View>
);

function HomeScreen() {
  const { currentRole } = useHousehold();
  if (currentRole === 'coordinador')  return <HomeCoordinador />;
  if (currentRole === 'adulto')       return <HomeAdulto />;
  if (currentRole === 'adolescente')  return <HomeAdolescente />;
  if (currentRole === 'adulto_mayor') return <HomeAdultoMayor />;
  return null;
}

export function HomeTabNavigator() {
  const { currentRole } = useHousehold();

  const isDark = currentRole === 'coordinador' || currentRole === 'adolescente';
  const isAdultoMayor = currentRole === 'adulto_mayor';

  const accentColor =
    currentRole === 'coordinador'  ? '#CD7353'
    : currentRole === 'adolescente' ? '#6B4FE8'
    : currentRole === 'adulto_mayor' ? '#D4975A'
    : '#CD7353';

  const tabBarBg = isDark ? '#0D1117' : '#FFFFFF';
  const tabBarBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tabBarHeight = isAdultoMayor ? 84 : 72;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: tabBarBorder,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: isAdultoMayor ? 12 : 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label={isAdultoMayor ? 'Inicio' : 'Inicio'} focused={focused} accentColor={accentColor} />
          ),
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📅" label={isAdultoMayor ? 'Mi Día' : 'Calendario'} focused={focused} accentColor={accentColor} />
          ),
        }}
      />
      <Tab.Screen
        name="FamilyTab"
        component={FamilyScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👨‍👩‍👧" label="Familia" focused={focused} accentColor={accentColor} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={currentRole === 'adolescente' ? '👤' : '👤'}
              label={isAdultoMayor ? 'Llamar' : 'Perfil'}
              focused={focused}
              accentColor={accentColor}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
