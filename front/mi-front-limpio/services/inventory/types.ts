export type ProductsService = ReturnType<typeof import('./products').createProductsService>;
export type InventoryItemsService = ReturnType<typeof import('./inventoryItems').createInventoryItemsService>;
export type TemplatesService = ReturnType<typeof import('./templates').createTemplatesService>;
export type InventorySettingsService = ReturnType<typeof import('./settings').createInventorySettingsService>;
export type InventoryBusinessLogic = ReturnType<typeof import('./businessLogic').createInventoryBusinessLogic>;