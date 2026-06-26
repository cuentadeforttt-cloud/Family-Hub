import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useTranslations } from '../utils/i18n';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import TemplateScreen from '../screens/TemplateScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import ExpiryScreen from '../screens/ExpiryScreen';
import ExportScreen from '../screens/ExportScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  ProductDetail: { productId: string };
  Template: undefined;
  Shopping: undefined;
  Expiry: undefined;
  Export: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const t = useTranslations();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary[600]}
        />
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary[600],
              ...theme.shadows.md,
            },
            headerTintColor: theme.colors.text.inverse,
            headerTitleStyle: {
              fontWeight: theme.typography.fontWeight.bold,
              fontSize: theme.typography.fontSize.lg,
            },
            headerBackTitleVisible: false,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 300,
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 300,
                },
              },
            },
          }}
        >
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{
              title: `📦 ${t.inventory.title}`,
            }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              title: `🔍 ${t.product.title}`,
            }}
          />
          <Stack.Screen
            name="Template"
            component={TemplateScreen}
            options={{
              title: `📋 ${t.templates.title}`,
            }}
          />
          <Stack.Screen
            name="Shopping"
            component={ShoppingScreen}
            options={{
              title: `🛒 ${t.shopping.title}`,
            }}
          />
          <Stack.Screen
            name="Expiry"
            component={ExpiryScreen}
            options={{
              title: `⏰ ${t.expiry.title}`,
            }}
          />
          <Stack.Screen
            name="Export"
            component={ExportScreen}
            options={{
              title: `📊 ${t.export.title}`,
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: `⚙️ ${t.settings.title}`,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  headerLeftContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  dashboardHeaderLogo: {
    height: 60,
    width: 200,
  },
});

export default AppNavigator;
