import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from './types';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { ProductDetailScreen } from '../screens/inventory/ProductDetailScreen';
import { ShoppingListScreen } from '../screens/inventory/ShoppingListScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export function InventoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: 'Inventario',
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({
          title: route.params?.productId ? 'Detalle' : 'Producto',
        })}
      />
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{
          title: 'Lista de compras',
        }}
      />
    </Stack.Navigator>
  );
}