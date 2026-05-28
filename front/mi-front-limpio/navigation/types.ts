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
};

export type HomeTabParamList = {
  HomeTab: undefined;
  CalendarTab: undefined;
  FamilyTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = AuthStackParamList & PrivateStackParamList;
