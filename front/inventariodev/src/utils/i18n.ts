import * as Localization from 'expo-localization';

// Tipos para las traducciones
export interface Translations {
  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    viewInventory: string;
    shoppingList: string;
    idealTemplates: string;
    export: string;
    settings: string;
    expiringSoon: string;
    lowStock: string;
    lowStockDescription: string;
    expired: string;
    expiredDescription: string;
    products: string;
    units: string;
    alerts: string;
    actionRequired: string;
    inNextDays: string;
    needRestocking: string;
    addFirstProduct: string;
  };

  // Inventario
  inventory: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noProducts: string;
    addProduct: string;
    units: string;
    noExpiryDate: string;
    expiringSoon: string;
    expired: string;
    category: string;
    simpleView: string;
    noSearchResults: string;
    tryOtherSearchTerms: string;
    addProductsToConfigure: string;
    excellent: string;
  };

  // Producto
  product: {
    title: string;
    name: string;
    description: string;
    category: string;
    currentStock: string;
    expiryDate: string;
    save: string;
    cancel: string;
    delete: string;
    confirmDelete: string;
    deleteMessage: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    noDescription: string;
    selectDateOptional: string;
  };

  // Plantillas
  templates: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noProducts: string;
    idealQuantity: string;
    addProduct: string;
    save: string;
    currentStock: string;
    noCategory: string;
    simpleView: string;
    noDescription: string;
    noSearchResults: string;
    tryOtherSearchTerms: string;
    addFirstProduct: string;
  };

  // Lista de compra
  shopping: {
    title: string;
    subtitle: string;
    noItems: string;
    purchase: string;
    quantity: string;
    confirm: string;
    cancel: string;
    purchased: string;
    currentStock: string;
    idealStock: string;
    needed: string;
    noCategory: string;
    expires: string;
    inventoryUpToDate: string;
    urgency: {
      high: string;
      medium: string;
      low: string;
      none: string;
    };
  };

  // Configuración
  settings: {
    title: string;
    subtitle: string;
    expiryDays: string;
    expiryDaysDescription: string;
    notifications: string;
    lowStockAlerts: string;
    lowStockAlertsDescription: string;
    notificationsEnabled: string;
    notificationsEnabledDescription: string;
    data: string;
    appInformation: string;
    save: string;
    reset: string;
    resetConfirmation: string;
    resetMessage: string;
    appInfo: string;
    createdBy: string;
    version: string;
    expiryAlerts: string;
  };

  // Exportar
  export: {
    title: string;
    subtitle: string;
    exportInventory: string;
    exportInventoryDescription: string;
    shoppingList: string;
    shoppingListDescription: string;
    summary: string;
    products: string;
    units: string;
    templates: string;
    toBuy: string;
    exportJson: string;
    generateList: string;
    emptyList: string;
    noLowStock: string;
    availableToExport: string;
    needRestocking: string;
  };

  // Importar
  import: {
    title: string;
    description: string;
    placeholder: string;
    import: string;
    clear: string;
    emptyJson: string;
    invalidFormat: string;
    invalidJson: string;
    missingName: string;
    importedCount: string;
    partialSuccess: string;
    errors: string;
  };

  // Modal agregar producto
  addProduct: {
    title: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    initialStock: string;
    expiryDate: string;
    add: string;
    adding: string;
    cancel: string;
    optional: string;
    selectDate: string;
  };

  // Modal compra
  purchase: {
    title: string;
    quantity: string;
    quantityPlaceholder: string;
    confirm: string;
    cancel: string;
    description: string;
    markPurchased: string;
  };

  consume: {
    title: string;
    quantity: string;
    quantityPlaceholder: string;
    expiryDate: string;
    expiryDatePlaceholder: string;
    description: string;
    markConsumed: string;
    confirm: string;
    cancel: string;
    currentStock: string;
    newExpiryDate: string;
  };

  // Próximos a caducar
  expiry: {
    title: string;
    subtitle: string;
    noExpiring: string;
    expires: string;
    daysLeft: string;
    noDate: string;
    expired: string;
    today: string;
  };

  // Común
  common: {
    loading: string;
    error: string;
    success: string;
    confirm: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    date: string;
    quantity: string;
    name: string;
    description: string;
    category: string;
  };
}

// Traducciones en español
const spanish: Translations = {
  dashboard: {
    title: 'Stockly',
    subtitle: 'Tu asistente de inventario inteligente',
    viewInventory: 'Inventario',
    shoppingList: 'Lista de Compra',
    idealTemplates: 'Plantillas Ideales',
    export: 'Exportar',
    settings: 'Configuración',
    expiringSoon: 'Próximos a caducar',
    lowStock: 'Stock bajo',
    lowStockDescription: 'Necesitan reposición',
    expired: 'Expirados',
    expiredDescription: 'Ya han caducado',
    products: 'Productos',
    units: 'Unidades',
    alerts: 'Alertas',
    actionRequired: 'Acción requerida',
    inNextDays: 'En los próximos {days} días',
    needRestocking: 'Necesitan reposición',
    addFirstProduct: 'Agregar Primer Producto',
  },
  inventory: {
    title: 'Inventario',
    subtitle: 'Gestiona tus productos',
    searchPlaceholder: 'Buscar productos...',
    noProducts: 'No hay productos en el inventario',
    addProduct: 'Agregar Producto',
    units: 'unidades',
    noExpiryDate: 'Sin fecha',
    expiringSoon: 'Próximo a caducar',
    expired: 'Caducado',
    category: 'Categoría',
    simpleView: 'Vista simple',
    noSearchResults: 'No se encontraron productos',
    tryOtherSearchTerms: 'Intenta con otros términos de búsqueda',
    addProductsToConfigure:
      'Agrega productos en el inventario para configurar sus plantillas ideales. El stock ideal es independiente del stock actual del producto.',
    excellent: '¡Excelente!',
  },
  product: {
    title: 'Detalles del Producto',
    name: 'Nombre',
    description: 'Descripción',
    category: 'Categoría',
    currentStock: 'Stock Actual',
    expiryDate: 'Fecha de Caducidad',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirmDelete: 'Confirmar Eliminación',
    deleteMessage: '¿Estás seguro de que quieres eliminar este producto?',
    namePlaceholder: 'Leche, Pan, Manzanas...',
    descriptionPlaceholder: 'Leche entera de 1L, Pan integral...',
    noDescription: 'Sin descripción',
    selectDateOptional: 'Seleccionar fecha (opcional)',
  },
  templates: {
    title: 'Plantillas Ideales',
    subtitle: 'Configura el stock ideal para cada producto',
    searchPlaceholder: 'Buscar productos...',
    noProducts: 'No hay productos en las plantillas',
    idealQuantity: 'Cantidad Ideal',
    addProduct: 'Agregar Producto',
    save: 'Guardar',
    currentStock: 'Stock actual',
    noCategory: 'Sin categoría',
    simpleView: 'Vista simple',
    noDescription: 'Sin descripción',
    noSearchResults: 'No se encontraron productos',
    tryOtherSearchTerms: 'Intenta con otros términos de búsqueda',
    addFirstProduct:
      'Agrega tu primer producto para comenzar a gestionar tu inventario',
  },
  shopping: {
    title: 'Lista de Compra',
    subtitle: 'Productos que necesitas comprar',
    noItems: 'No hay productos para comprar',
    purchase: 'Comprar',
    quantity: 'Cantidad',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    purchased: 'Comprado',
    currentStock: 'Stock actual',
    idealStock: 'Stock ideal',
    needed: 'Necesitas',
    noCategory: 'Sin categoría',
    expires: 'Caduca',
    inventoryUpToDate:
      'No hay productos que necesiten reposición. Tu inventario está al día.',
    urgency: {
      high: 'Urgente',
      medium: 'Media',
      low: 'Baja',
      none: 'Normal',
    },
  },
  settings: {
    title: 'Configuración',
    subtitle: 'Personaliza tu experiencia',
    expiryAlerts: 'Alertas de Caducidad',
    expiryDays: 'Días de anticipación',
    expiryDaysDescription:
      'Recibe alertas cuando los productos caduquen en los próximos días',
    notifications: 'Notificaciones',
    lowStockAlerts: 'Alertas de stock bajo',
    lowStockAlertsDescription:
      'Recibe notificaciones cuando el stock esté bajo',
    notificationsEnabled: 'Notificaciones habilitadas',
    notificationsEnabledDescription:
      'Activa o desactiva todas las notificaciones',
    data: 'Datos',
    appInformation: 'Información de la aplicación',
    save: 'Guardar Cambios',
    reset: 'Restablecer',
    resetConfirmation: 'Restablecer Configuración',
    resetMessage:
      '¿Estás seguro de que quieres restablecer toda la configuración a los valores por defecto?',
    appInfo:
      'Stockly v1.0.0\nCreada por Adrián Bravo\nGestión de inventario simplificada',
    createdBy: 'Creada por Adrián Bravo',
    version: 'Versión 1.0.0',
  },
  export: {
    title: 'Exportar Datos',
    subtitle: 'Exporta tu inventario y genera listas de compra',
    exportInventory: 'Exportar Inventario',
    exportInventoryDescription:
      'Exporta todos los productos en formato JSON con información completa',
    shoppingList: 'Lista de Compra',
    shoppingListDescription:
      'Genera una lista de productos que necesitas comprar según las plantillas ideales',
    summary: 'Resumen de Datos',
    products: 'Productos',
    units: 'Unidades',
    templates: 'Plantillas',
    toBuy: 'Por Comprar',
    exportJson: 'Exportar JSON',
    generateList: 'Generar Lista',
    emptyList: 'Lista vacía',
    noLowStock: 'No hay productos con stock bajo',
    availableToExport: 'disponibles para exportar',
    needRestocking: 'necesitan reposición',
  },
  import: {
    title: 'Importar Datos',
    description:
      'Pega el JSON con los productos que quieres importar. Solo el nombre es obligatorio.',
    placeholder: 'Pega aquí tu JSON...',
    import: 'Importar',
    clear: 'Limpiar',
    emptyJson: 'El campo JSON está vacío',
    invalidFormat: 'El JSON debe ser un array de productos',
    invalidJson: 'El JSON no es válido',
    missingName: 'Producto sin nombre',
    importedCount: '{count} productos insertados',
    partialSuccess: 'Importación parcial',
    errors: 'Errores',
  },
  addProduct: {
    title: 'Agregar Producto',
    name: 'Nombre del Producto',
    namePlaceholder: 'Ej: Leche entera',
    description: 'Descripción',
    descriptionPlaceholder: 'Descripción opcional del producto',
    category: 'Categoría',
    categoryPlaceholder: 'Ej: Lácteos',
    initialStock: 'Stock Inicial',
    expiryDate: 'Fecha de Caducidad',
    add: 'Agregar',
    cancel: 'Cancelar',
    adding: 'Agregando...',
    optional: 'opcional',
    selectDate: 'Seleccionar fecha',
  },
  purchase: {
    title: 'Marcar como Comprado',
    quantity: 'Cantidad comprada',
    quantityPlaceholder: 'Ejemplo: 4',
    description: 'Esta cantidad se sumará al stock actual del producto',
    markPurchased: 'Marcar Comprado',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },

  consume: {
    title: 'Consumir Producto',
    quantity: 'Cantidad consumida',
    quantityPlaceholder: '4',
    expiryDate: 'Fecha de caducidad',
    expiryDatePlaceholder: 'Seleccionar fecha (opcional)',
    description: 'Esta cantidad se restará del stock actual del producto',
    markConsumed: 'Marcar Consumido',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    currentStock: 'Stock actual',
    newExpiryDate: 'Nueva fecha de caducidad',
  },
  expiry: {
    title: 'Próximos a Caducar',
    subtitle: 'productos caducan en los próximos {days} días',
    noExpiring: 'No hay productos próximos a caducar',
    expires: 'Caduca',
    daysLeft: 'días restantes',
    noDate: 'Sin fecha',
    expired: 'Caducado',
    today: 'Hoy',
  },
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    search: 'Buscar',
    filter: 'Filtrar',
    date: 'Fecha',
    quantity: 'Cantidad',
    name: 'Nombre',
    description: 'Descripción',
    category: 'Categoría',
  },
};

// Traducciones en inglés
const english: Translations = {
  dashboard: {
    title: 'Stockly',
    subtitle: 'Your intelligent inventory assistant',
    viewInventory: 'Inventory',
    shoppingList: 'Shopping List',
    idealTemplates: 'Ideal Templates',
    export: 'Export',
    settings: 'Settings',
    expiringSoon: 'Expiring Soon',
    lowStock: 'Low Stock',
    lowStockDescription: 'Need restocking',
    expired: 'Expired',
    expiredDescription: 'Already expired',
    products: 'Products',
    units: 'Units',
    alerts: 'Alerts',
    actionRequired: 'Action required',
    inNextDays: 'In the next {days} days',
    needRestocking: 'Need restocking',
    addFirstProduct: 'Add First Product',
  },
  inventory: {
    title: 'Inventory',
    subtitle: 'Manage your products',
    searchPlaceholder: 'Search products...',
    noProducts: 'No products in inventory',
    addProduct: 'Add Product',
    units: 'units',
    noExpiryDate: 'No date',
    expiringSoon: 'Expiring soon',
    expired: 'Expired',
    category: 'Category',
    simpleView: 'Simple view',
    noSearchResults: 'No products found',
    tryOtherSearchTerms: 'Try other search terms',
    addProductsToConfigure:
      "Add products to inventory to configure their ideal templates. Ideal stock is independent of the product's current stock.",
    excellent: 'Excellent!',
  },
  product: {
    title: 'Product Details',
    name: 'Name',
    description: 'Description',
    category: 'Category',
    currentStock: 'Current Stock',
    expiryDate: 'Expiry Date',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Confirm Deletion',
    deleteMessage: 'Are you sure you want to delete this product?',
    namePlaceholder: 'Milk, Bread, Apples...',
    descriptionPlaceholder: 'Whole milk 1L, Whole grain bread...',
    noDescription: 'No description',
    selectDateOptional: 'Select date (optional)',
  },
  templates: {
    title: 'Ideal Templates',
    subtitle: 'Configure the ideal stock for each product',
    searchPlaceholder: 'Search products...',
    noProducts: 'No products in templates',
    idealQuantity: 'Ideal Quantity',
    addProduct: 'Add Product',
    save: 'Save',
    currentStock: 'Current stock',
    noCategory: 'No category',
    simpleView: 'Simple view',
    noDescription: 'No description',
    noSearchResults: 'No products found',
    tryOtherSearchTerms: 'Try other search terms',
    addFirstProduct: 'Add your first product to start managing your inventory',
  },
  shopping: {
    title: 'Shopping List',
    subtitle: 'Products you need to buy based on ideal templates',
    noItems: 'No items to buy',
    purchase: 'Purchase',
    quantity: 'Quantity',
    confirm: 'Confirm',
    cancel: 'Cancel',
    purchased: 'Purchased',
    currentStock: 'Current stock',
    idealStock: 'Ideal stock',
    needed: 'You need',
    noCategory: 'No category',
    expires: 'Expires',
    inventoryUpToDate:
      'No products need restocking. Your inventory is up to date.',
    urgency: {
      high: 'Urgent',
      medium: 'Medium',
      low: 'Low',
      none: 'Normal',
    },
  },
  settings: {
    title: 'Settings',
    subtitle: 'Customize your experience',
    expiryAlerts: 'Expiry Alerts',
    expiryDays: 'Alert Days',
    expiryDaysDescription:
      'Receive alerts when products expire in the coming days',
    notifications: 'Notifications',
    lowStockAlerts: 'Low stock alerts',
    lowStockAlertsDescription: 'Receive notifications when stock is low',
    notificationsEnabled: 'Notifications enabled',
    notificationsEnabledDescription: 'Enable or disable all notifications',
    data: 'Data',
    appInformation: 'Application information',
    save: 'Save Changes',
    reset: 'Reset',
    resetConfirmation: 'Reset Configuration',
    resetMessage:
      'Are you sure you want to reset all configuration to default values?',
    appInfo:
      'Stockly v1.0.0\nCreated by Adrián Bravo\nSimplified inventory management',
    createdBy: 'Created by Adrián Bravo',
    version: 'Version 1.0.0',
  },
  export: {
    title: 'Export Data',
    subtitle: 'Export your inventory and generate shopping lists',
    exportInventory: 'Export Inventory',
    exportInventoryDescription:
      'Export all products in JSON format with complete information',
    shoppingList: 'Shopping List',
    shoppingListDescription:
      'Generate a list of products you need to buy according to ideal templates',
    summary: 'Data Summary',
    products: 'Products',
    units: 'Units',
    templates: 'Templates',
    toBuy: 'To Buy',
    exportJson: 'Export JSON',
    generateList: 'Generate List',
    emptyList: 'Empty list',
    noLowStock: 'No products with low stock',
    availableToExport: 'available to export',
    needRestocking: 'need restocking',
  },
  import: {
    title: 'Import Data',
    description:
      'Paste the JSON with the products you want to import. Only the name is required.',
    placeholder: 'Paste your JSON here...',
    import: 'Import',
    clear: 'Clear',
    emptyJson: 'The JSON field is empty',
    invalidFormat: 'The JSON must be an array of products',
    invalidJson: 'The JSON is not valid',
    missingName: 'Product without name',
    importedCount: '{count} products inserted',
    partialSuccess: 'Partial import',
    errors: 'Errors',
  },
  addProduct: {
    title: 'Add Product',
    name: 'Product Name',
    namePlaceholder: 'E.g: Whole milk',
    description: 'Description',
    descriptionPlaceholder: 'Optional product description',
    category: 'Category',
    categoryPlaceholder: 'E.g: Dairy',
    initialStock: 'Initial Stock',
    expiryDate: 'Expiry Date',
    add: 'Add',
    cancel: 'Cancel',
    adding: 'Adding...',
    optional: 'optional',
    selectDate: 'Select date',
  },
  purchase: {
    title: 'Mark as Purchased',
    quantity: 'Quantity purchased',
    quantityPlaceholder: 'Example: 4',
    description:
      'This quantity will be added to the current stock of the product',
    markPurchased: 'Mark Purchased',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },

  consume: {
    title: 'Consume Product',
    quantity: 'Quantity consumed',
    quantityPlaceholder: '4',
    expiryDate: 'Expiry date',
    expiryDatePlaceholder: 'Select date (optional)',
    description:
      'This quantity will be subtracted from the current stock of the product',
    markConsumed: 'Mark Consumed',
    confirm: 'Confirm',
    cancel: 'Cancel',
    currentStock: 'Current stock',
    newExpiryDate: 'New expiry date',
  },
  expiry: {
    title: 'Expiring Soon',
    subtitle: 'expire in the next {days} days',
    noExpiring: 'No products expiring soon',
    expires: 'Expires',
    daysLeft: 'days left',
    noDate: 'No date',
    expired: 'Expired',
    today: 'Today',
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    date: 'Date',
    quantity: 'Quantity',
    name: 'Name',
    description: 'Description',
    category: 'Category',
  },
};

// Función para obtener el idioma del dispositivo
const getDeviceLanguage = (): string => {
  try {
    // Intentar obtener el idioma del dispositivo
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      return languageCode || 'en';
    }

    return 'en'; // Fallback a inglés
  } catch (error) {
    console.warn('Error getting device language:', error);
    return 'en'; // Fallback a inglés
  }
};

// Función para obtener las traducciones según el idioma
export const getTranslations = (): Translations => {
  const language = getDeviceLanguage();

  switch (language) {
    case 'en':
      return english;
    case 'es':
      return spanish;
    default:
      return english;
  }
};

// Hook para usar las traducciones en componentes
export const useTranslations = (): Translations => {
  return getTranslations();
};

// Función para obtener una traducción específica
export const t = (key: string): string => {
  const translations = getTranslations();
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return value;
};
