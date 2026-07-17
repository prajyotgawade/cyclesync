export type RootStackParamList = {
  Splash: undefined;
  AuthNavigator: undefined;
  AppNavigator: undefined;
  LogModal: { date: string }; // Opened as a full-screen sheet/modal
};

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  CalendarTab: undefined;
  LogPlaceholder: undefined;
  Insights: undefined;
  Settings: undefined;
};
