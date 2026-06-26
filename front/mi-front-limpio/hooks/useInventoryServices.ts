import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import {
  createProductsService,
  createInventoryItemsService,
  createTemplatesService,
  createInventorySettingsService,
  createInventoryBusinessLogic,
  type ProductsService,
  type InventoryItemsService,
  type TemplatesService,
  type InventorySettingsService,
  type InventoryBusinessLogic,
} from '../services/inventory';

export function useInventoryServices() {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const householdId = currentHousehold?.id;
  const userId = user?.id;

  const services = useMemo(() => {
    if (!householdId || !userId) {
      return null;
    }

    const productsService = createProductsService(householdId, userId);
    const inventoryItemsService = createInventoryItemsService(householdId, userId);
    const templatesService = createTemplatesService(householdId, userId);
    const inventorySettingsService = createInventorySettingsService(householdId, userId);
    const inventoryBusinessLogic = createInventoryBusinessLogic(
      productsService,
      inventoryItemsService,
      templatesService,
      inventorySettingsService,
      householdId,
      userId
    );

    return {
      productsService,
      inventoryItemsService,
      templatesService,
      inventorySettingsService,
      inventoryBusinessLogic,
    };
  }, [householdId, userId]);

  return services;
}

export type InventoryServices = ReturnType<typeof useInventoryServices> extends null
  ? never
  : ReturnType<typeof useInventoryServices>;