import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { HomeTabParamList, PlannerStackParamList } from './types';
import { useHousehold } from '../context/HouseholdContext';
import { HomeCoordinador } from '../screens/home/HomeCoordinador';
import { HomeAdulto } from '../screens/home/HomeAdulto';
import { HomeAdolescente } from '../screens/home/HomeAdolescente';
import { HomeAdultoMayor } from '../screens/home/HomeAdultoMayor';
import { FamilyScreen } from '../screens/FamilyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PlannerScreen } from '../screens/planner/PlannerScreen';
import { CreateTaskScreen } from '../screens/planner/CreateTaskScreen';
import { EditTaskScreen } from '../screens/planner/EditTaskScreen';
import { CreateEventScreen } from '../screens/planner/CreateEventScreen';
import { EditEventScreen } from '../screens/planner/EditEventScreen';

const Tab = createBottomTabNavigator<HomeTabParamList>();
const PlannerStack = createNativeStackNavigator<PlannerStackParamList>();

const TabIcon = ({
  mark,
  label,
  focused,
}: {
  mark: string;
  label: string;
  focused: boolean;
}) => (
  <View style={{ alignItems: 'center', paddingTop: 6, minWidth: 48 }}>
    <Text
      style={{
        fontSize: 15,
        width: 28,
        height: 24,
        borderRadius: 12,
        textAlign: 'center',
        lineHeight: 24,
        overflow: 'hidden',
        color: '#FFF8EA',
        backgroundColor: focused ? 'rgba(255,248,234,0.22)' : 'transparent',
        fontWeight: '900',
      }}
    >
      {mark}
    </Text>
    <Text
      style={{
        fontSize: 9,
        marginTop: 2,
        fontWeight: focused ? '700' : '400',
        color: focused ? '#FFF8EA' : 'rgba(255,248,234,0.76)',
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
          backgroundColor: '#FFF8EA',
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

function PlannerStackScreen() {
  return (
    <PlannerStack.Navigator screenOptions={{ headerShown: false }}>
      <PlannerStack.Screen name="PlannerHome" component={PlannerScreen} />
      <PlannerStack.Screen name="CreateTask" component={CreateTaskScreen} />
      <PlannerStack.Screen name="EditTask" component={EditTaskScreen} />
      <PlannerStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <PlannerStack.Screen name="EditEvent" component={EditEventScreen} />
    </PlannerStack.Navigator>
  );
}

function EmptyQuickActionScreen() {
  return <View style={{ flex: 1, backgroundColor: '#F7F6F1' }} />;
}

function QuickAddTabButton() {
  const navigation = useNavigation<any>();
  const [visible, setVisible] = React.useState(false);

  const openPlannerRoute = (initialTab: 'tasks' | 'calendar', initialSheet: 'task' | 'event') => {
    setVisible(false);
    navigation.navigate('PlannerTab', {
      screen: 'PlannerHome',
      params: {
        initialTab,
        initialSheet,
        sheetKey: Date.now(),
        refreshKey: Date.now(),
      },
    });
  };

  const showSoon = () => {
    setVisible(false);
    // Alert is intentionally avoided here to keep the tab button lightweight.
    navigation.navigate('PlannerTab', {
      screen: 'PlannerHome',
      params: { initialTab: 'goals', refreshKey: Date.now() },
    });
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', top: -18 }}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => setVisible(true)}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#FFF8EA',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: '#CD7353',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Text style={{ color: '#CD7353', fontSize: 34, fontWeight: '800', lineHeight: 38 }}>+</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(23,32,26,0.36)', justifyContent: 'flex-end' }}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#FFF8EA',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 22,
              paddingBottom: 34,
              borderTopWidth: 1,
              borderColor: '#E5D8C7',
            }}
          >
            <Text style={{ color: '#17201A', fontSize: 22, fontWeight: '900', marginBottom: 4 }}>
              Acciones rapidas
            </Text>
            <Text style={{ color: '#6E6254', fontSize: 14, marginBottom: 18 }}>
              Crear en el Planner del hogar.
            </Text>
            <TouchableOpacity
              activeOpacity={0.86}
              style={{ backgroundColor: '#CD7353', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 16, marginBottom: 10 }}
              onPress={() => openPlannerRoute('tasks', 'task')}
            >
              <Text style={{ color: '#FFF8EA', fontWeight: '900', fontSize: 16 }}>Crear tarea</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.86}
              style={{ backgroundColor: '#FFFFFF', borderColor: '#CD7353', borderWidth: 1, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 16 }}
              onPress={() => openPlannerRoute('calendar', 'event')}
            >
              <Text style={{ color: '#CD7353', fontWeight: '900', fontSize: 16 }}>Crear evento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.86}
              style={{ backgroundColor: '#ECF3EA', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 16, marginTop: 10 }}
              onPress={showSoon}
            >
              <Text style={{ color: '#496E47', fontWeight: '900', fontSize: 16 }}>Preguntar a Geni</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function HomeTabNavigator() {
  const { currentRole } = useHousehold();

  const isAdultoMayor = currentRole === 'adulto_mayor';
  const tabBarBg = '#CD7353';
  const tabBarBorder = 'rgba(255,248,234,0.18)';
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
              label="Home"
              focused={focused}
              mark="H"
            />
          ),
        }}
      />

      {/* 2 – Calendario */}
      <Tab.Screen
        name="PeopleTab"
        component={FamilyScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="People"
              focused={focused}
              mark="P"
            />
          ),
        }}
      />

      {/* 3 – Feed Familiar */}
      <Tab.Screen
        name="AddTab"
        component={EmptyQuickActionScreen}
        options={{
          tabBarButton: () => <QuickAddTabButton />,
        }}
        listeners={{ tabPress: (event) => event.preventDefault() }}
      />

      {/* 4 – Inventario */}
      <Tab.Screen
        name="PlannerTab"
        component={PlannerStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Planner"
              focused={focused}
              mark="Pl"
            />
          ),
        }}
      />

      {/* 5 – Perfil */}
      <Tab.Screen
        name="MoreTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="More"
              focused={focused}
              mark="..."
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
