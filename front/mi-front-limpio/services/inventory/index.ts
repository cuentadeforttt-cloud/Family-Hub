export { createProductsService, type ProductsService } from './products';
export { createInventoryItemsService, type InventoryItemsService } from './inventoryItems';
export { createTemplatesService, type TemplatesService } from './templates';
export { createInventorySettingsService, type InventorySettingsService } from './settings';
export { createInventoryBusinessLogic, type InventoryBusinessLogic } from './businessLogic';

export type {
  ProductFilters,
  ProductCreateInput,
  ProductUpdateInput,
} from './products';

export type {
  InventoryItemCreateInput,
  InventoryItemUpdateInput,
} from './inventoryItems';

export type {
  TemplateCreateInput,
  TemplateUpdateInput,
} from './templates';