import React from 'react';
import { Animated } from 'react-native';
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
import { APP_ICONS, HomePlusIcon } from '../constants/icons';

const Tab = createBottomTabNavigator<HomeTabParamList>();
const PlannerStack = createNativeStackNavigator<PlannerStackParamList>();

const TabIcon = ({
  iconKey,
  label,
  focused,
}: {
  iconKey: keyof typeof APP_ICONS.bottomTabs;
  label: string;
  focused: boolean;
}) => {
  const iconName = APP_ICONS.bottomTabs[iconKey];
  const iconColor = '#FFF8EA';
  const scale = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.timing(scale, {
      toValue: focused ? 1.06 : 1,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);
  
  return (
    <View style={{ alignItems: 'center', paddingTop: 6, minWidth: 48 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <HomePlusIcon
          name={iconName}
          size={24}
          color={iconColor}
          style={{
            backgroundColor: focused ? 'rgba(255,248,234,0.22)' : 'transparent',
            borderRadius: 12,
            padding: 2,
          }}
        />
      </Animated.View>
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
};

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
  const pendingAction = React.useRef<(() => void) | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const runAfterQuickActionsClosed = (callback: () => void) => {
    pendingAction.current = callback;
    setVisible(false);
  };

  React.useEffect(() => {
    if (!visible && pendingAction.current) {
      const action = pendingAction.current;
      pendingAction.current = null;
      setTimeout(action, 250);
    }
  }, [visible]);

  const openPlannerRoute = (initialTab: 'tasks' | 'calendar', initialSheet: 'task' | 'event') => {
    runAfterQuickActionsClosed(() => {
      navigation.navigate('PlannerTab', {
        screen: 'PlannerHome',
        params: {
          initialTab,
          initialSheet,
          sheetKey: Date.now(),
          refreshKey: Date.now(),
        },
      });
    });
  };

const showSoon = () => {
    runAfterQuickActionsClosed(() => {
      navigation.navigate('PlannerTab', {
        screen: 'PlannerHome',
        params: { initialTab: 'goals', refreshKey: Date.now() },
      });
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
        <HomePlusIcon
          name={APP_ICONS.bottomTabs.add}
          size={34}
          color="#CD7353"
        />
      </TouchableOpacity>

<Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(23,32,26,0.36)', justifyContent: 'flex-end' }}
          onPress={() => setVisible(false)}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: '#FFF8EA',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 22,
              paddingBottom: 34,
              borderTopWidth: 1,
              borderColor: '#E5D8C7',
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative' }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5D8C7', opacity: 0.8 }} />
              <TouchableOpacity
                style={{ position: 'absolute', right: 0, top: -4, paddingHorizontal: 12, paddingVertical: 6 }}
                onPress={() => setVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ color: '#8A8178', fontSize: 13, fontWeight: '700' }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#17201A', fontSize: 22, fontWeight: '900', marginBottom: 4, textAlign: 'center' }}>
              Acciones rapidas
            </Text>
            <Text style={{ color: '#6E6254', fontSize: 14, marginBottom: 18, textAlign: 'center' }}>
              Crear en el Planner del hogar.
            </Text>
<TouchableOpacity
              activeOpacity={0.86}
              style={{ backgroundColor: '#CD7353', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              onPress={() => openPlannerRoute('tasks', 'task')}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,248,234,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <HomePlusIcon name={APP_ICONS.quickActions.createTask} size={20} color="#FFF8EA" />
              </View>
              <Text style={{ color: '#FFF8EA', fontWeight: '900', fontSize: 16 }}>Crear tarea</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.86}
              style={{ backgroundColor: '#FFFFFF', borderColor: '#CD7353', borderWidth: 1, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              onPress={() => openPlannerRoute('calendar', 'event')}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(205,115,83,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <HomePlusIcon name={APP_ICONS.quickActions.createEvent} size={20} color="#CD7353" />
              </View>
              <Text style={{ color: '#CD7353', fontWeight: '900', fontSize: 16 }}>Crear evento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.86}
              style={{ backgroundColor: '#ECF3EA', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 16, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              onPress={showSoon}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(73,110,71,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <HomePlusIcon name={APP_ICONS.quickActions.geni} size={20} color="#496E47" />
              </View>
<Text style={{ color: '#496E47', fontWeight: '900', fontSize: 16 }}>Preguntar a Geni</Text>
            </TouchableOpacity>
          </Animated.View>
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
              iconKey="home"
              label="Home"
              focused={focused}
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
              iconKey="people"
              label="People"
              focused={focused}
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
              iconKey="planner"
              label="Planner"
              focused={focused}
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
              iconKey="more"
              label="More"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
