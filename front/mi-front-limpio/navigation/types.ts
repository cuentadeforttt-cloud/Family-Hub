export type AuthStackParamList = {
  P00Splash: undefined;
  Login: undefined;
  P01Registro: undefined;
  ForgotPassword: undefined;
  UpdatePassword: undefined;
};

export type PrivateStackParamList = {
  P02CrearGrupo: undefined;
  P03InvitarPersonas: { householdId: string };
  HomeTabs: undefined;
  JoinHousehold: { token: string };
  PendingApprovalFallback: undefined;
  HouseholdSelectionFallback: undefined;
  AccessSuspendedFallback: undefined;
  InventoryStack: undefined;
  ProductDetail: { productId: string };
};

export type InventoryStackParamList = {
  Inventory: undefined;
  ProductDetail: { productId: string };
  AddProduct: undefined;
  ShoppingList: undefined;
};

export type HomeTabParamList = {
  HomeTab: undefined;
  PeopleTab: undefined;
  AddTab: undefined;
  InventoryTab: undefined;
  PlannerTab: undefined;
  MoreTab: undefined;
};

export type PlannerStackParamList = {
  PlannerHome: {
    refreshKey?: number;
    initialTab?: 'tasks' | 'calendar' | 'goals';
    initialSheet?: 'task' | 'event';
    sheetKey?: number;
  } | undefined;
  CreateTask: undefined;
  EditTask: { taskId: string };
  CreateEvent: undefined;
  EditEvent: { eventId: string };
};

export type RootStackParamList = AuthStackParamList & PrivateStackParamList;
