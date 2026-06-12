import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import type { HomeTabParamList } from './types';
import { useHousehold } from '../context/HouseholdContext';
import { HomeCoordinador } from '../screens/home/HomeCoordinador';
import { HomeAdulto } from '../screens/home/HomeAdulto';
import { HomeAdolescente } from '../screens/home/HomeAdolescente';
import { HomeAdultoMayor } from '../screens/home/HomeAdultoMayor';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { FeedFamiliarScreen } from '../screens/feed/FeedFamiliarScreen';
import { InventarioScreen } from '../screens/inventory/InventarioScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<HomeTabParamList>();

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
  <View style={{ alignItems: 'center', paddingTop: 6, minWidth: 48 }}>
    <Text style={{ fontSize: 21 }}>{icon}</Text>
    <Text
      style={{
        fontSize: 9,
        marginTop: 2,
        fontWeight: focused ? '700' : '400',
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
          marginTop: 2,
        }}
      />
    )}
  </View>
);

function HomeScreen() {
  const { currentRole, loading, reloading } = useHousehold();

  // Mientras el contexto está cargando el rol mostramos un spinner
  if (loading || reloading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAF8', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#CD7353" />
      </View>
    );
  }

  if (currentRole === 'coordinador')  return <HomeCoordinador />;
  if (currentRole === 'adulto')       return <HomeAdulto />;
  if (currentRole === 'adolescente')  return <HomeAdolescente />;
  if (currentRole === 'adulto_mayor') return <HomeAdultoMayor />;

  // Fallback: rol desconocido
  return <HomeCoordinador />;
}

export function HomeTabNavigator() {
  const { currentRole } = useHousehold();

  const isDark = currentRole === 'coordinador' || currentRole === 'adolescente';
  const isAdultoMayor = currentRole === 'adulto_mayor';

  const accentColor =
    currentRole === 'coordinador'   ? '#CD7353'
    : currentRole === 'adolescente' ? '#6B4FE8'
    : currentRole === 'adulto_mayor' ? '#D4975A'
    : '#CD7353';

  const tabBarBg     = isDark ? '#0D1117' : '#FFFFFF';
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
      {/* 1 – Inicio */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="🏠"
              label="Inicio"
              focused={focused}
              accentColor={accentColor}
            />
          ),
        }}
      />

      {/* 2 – Calendario */}
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="📅"
              label={isAdultoMayor ? 'Mi Día' : 'Calendario'}
              focused={focused}
              accentColor={accentColor}
            />
          ),
        }}
      />

      {/* 3 – Feed Familiar */}
      <Tab.Screen
        name="FeedTab"
        component={FeedFamiliarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="📸"
              label="Feed"
              focused={focused}
              accentColor={accentColor}
            />
          ),
        }}
      />

      {/* 4 – Inventario */}
      <Tab.Screen
        name="InventarioTab"
        component={InventarioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="🛒"
              label="Inventario"
              focused={focused}
              accentColor={accentColor}
            />
          ),
        }}
      />

      {/* 5 – Perfil */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="👤"
              label="Perfil"
              focused={focused}
              accentColor={accentColor}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
