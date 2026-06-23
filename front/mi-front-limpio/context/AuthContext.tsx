import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import {
  ApiError,
  authLogin,
  authLogout,
  authRegister,
  getAuthMe,
  type AuthMe,
  type AuthSession,
} from '../services/api';
import { supabase } from '../supabase';
import { getAuthErrorMessage } from '../utils/authErrors';

const PENDING_JOIN_KEY = 'pendingJoinToken';

type AuthActionResult = {
  error: string | null;
};

type SignUpResult = AuthActionResult & {
  needsEmailConfirmation: boolean;
};

type SignInParams = {
  email: string;
  password: string;
};

type SignUpParams = {
  email: string;
  password: string;
  nombre: string;
};

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  authMe: AuthMe | null;
  authMeLoading: boolean;
  authMeError: string | null;
  isPasswordRecovery: boolean;
  pendingJoinToken: string | null;
  signIn: (params: SignInParams) => Promise<AuthActionResult>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  signOut: () => Promise<AuthActionResult>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  refreshSession: () => Promise<AuthActionResult>;
  refetchMe: () => Promise<AuthMe | null>;
  handleIncomingUrl: (url: string) => Promise<AuthActionResult>;
  clearPasswordRecovery: () => void;
  clearPendingJoinToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CALLBACK_PATH = 'auth/callback';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getFirstValue = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

const getAuthRedirectUrl = () => Linking.createURL(AUTH_CALLBACK_PATH);

const parseAuthUrl = (url: string) => {
  const normalizedUrl = url.includes('#') ? url.replace('#', '?') : url;
  const { path, queryParams } = Linking.parse(normalizedUrl);

  const accessToken = getFirstValue(queryParams?.access_token);
  const refreshToken = getFirstValue(queryParams?.refresh_token);
  const code = getFirstValue(queryParams?.code);
  const type = getFirstValue(queryParams?.type);
  const errorCode = getFirstValue(queryParams?.error_code);
  const errorDescription = getFirstValue(queryParams?.error_description);

  return {
    path: path ?? '',
    queryParams: queryParams ?? {},
    accessToken,
    refreshToken,
    code,
    type,
    errorCode,
    errorDescription,
    hasAuthParams: Boolean(accessToken || refreshToken || code || errorCode || errorDescription),
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authMe, setAuthMe] = useState<AuthMe | null>(null);
  const [authMeLoading, setAuthMeLoading] = useState(false);
  const [authMeError, setAuthMeError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [pendingJoinToken, setPendingJoinToken] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const authMeRequestIdRef = useRef(0);

  const applySession = useCallback((nextSession: Session | null) => {
    if (!isMountedRef.current) {
      return;
    }

    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  }, []);

  const clearAuthMe = useCallback(() => {
    authMeRequestIdRef.current += 1;
    setAuthMe(null);
    setAuthMeError(null);
    setAuthMeLoading(false);
  }, []);

  const loadAuthMe = useCallback(async (accessToken: string): Promise<AuthMe | null> => {
    const requestId = authMeRequestIdRef.current + 1;
    authMeRequestIdRef.current = requestId;

    if (isMountedRef.current) {
      setAuthMeLoading(true);
      setAuthMeError(null);
    }

    try {
      const nextAuthMe = await getAuthMe(accessToken);

      if (isMountedRef.current && authMeRequestIdRef.current === requestId) {
        setAuthMe(nextAuthMe);
      }

      return nextAuthMe;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'No pudimos cargar tu sesion de HomePlus.';

      if (isMountedRef.current && authMeRequestIdRef.current === requestId) {
        setAuthMe(null);
        setAuthMeError(message);
      }

      return null;
    } finally {
      if (isMountedRef.current && authMeRequestIdRef.current === requestId) {
        setAuthMeLoading(false);
      }
    }
  }, []);

  const persistBackendSession = useCallback(
    async (backendSession: AuthSession): Promise<AuthActionResult> => {
      if (!backendSession.access_token || !backendSession.refresh_token) {
        return {
          error: 'El backend no devolvio una sesion valida. Intenta nuevamente.',
        };
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: backendSession.access_token,
        refresh_token: backendSession.refresh_token,
      });

      if (error) {
        return {
          error: getAuthErrorMessage(
            error,
            'No pudimos guardar tu sesion en este dispositivo. Intenta nuevamente.',
          ),
        };
      }

      applySession(data.session);
      return { error: null };
    },
    [applySession],
  );

  const refreshSession = useCallback(async (): Promise<AuthActionResult> => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        error: getAuthErrorMessage(
          error,
          'No pudimos recuperar tu sesion actual. Intenta nuevamente.',
        ),
      };
    }

    applySession(data.session);
    return { error: null };
  }, [applySession]);

  const refetchMe = useCallback(async (): Promise<AuthMe | null> => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      clearAuthMe();
      return null;
    }

    return loadAuthMe(accessToken);
  }, [clearAuthMe, loadAuthMe, session?.access_token]);

  const handleIncomingUrl = useCallback(
    async (url: string): Promise<AuthActionResult> => {
      const { path, accessToken, refreshToken, code, type, errorCode, errorDescription, hasAuthParams, queryParams } =
        parseAuthUrl(url);

      // Handle invitation join link: familyhub://join?token=xxx
      const joinToken = getFirstValue(queryParams?.token);
      if ((path === 'join' || path === '/join') && joinToken) {
        if (isMountedRef.current) setPendingJoinToken(joinToken);
        await AsyncStorage.setItem(PENDING_JOIN_KEY, joinToken);
        return { error: null };
      }

      if (!hasAuthParams) {
        return { error: null };
      }

      if (errorCode || errorDescription) {
        return {
          error: getAuthErrorMessage(
            errorDescription ?? errorCode,
            'No pudimos procesar el enlace recibido. Solicita uno nuevo.',
          ),
        };
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          return {
            error: getAuthErrorMessage(
              error,
              'No pudimos validar el enlace de acceso. Solicita uno nuevo.',
            ),
          };
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          return {
            error: getAuthErrorMessage(
              error,
              'No pudimos abrir tu sesion desde el enlace. Solicita uno nuevo.',
            ),
          };
        }
      }

      if (type === 'recovery') {
        setIsPasswordRecovery(true);
      }

      await refreshSession();
      return { error: null };
    },
    [refreshSession],
  );

  useEffect(() => {
    isMountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }

      setLoading(false);
      setInitialized(true);
    });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url);
    });

    const appStateSubscription =
      Platform.OS !== 'web'
        ? AppState.addEventListener('change', (state) => {
            if (state === 'active') {
              supabase.auth.startAutoRefresh();
            } else {
              supabase.auth.stopAutoRefresh();
            }
          })
        : null;

    if (Platform.OS !== 'web') {
      supabase.auth.startAutoRefresh();
    }

    const bootstrapAuth = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl) {
          const result = await handleIncomingUrl(initialUrl);

          if (result.error) {
            console.warn(result.error);
          }
        }

        await refreshSession();

        // Restore any pending join token that survived an app restart
        const storedToken = await AsyncStorage.getItem(PENDING_JOIN_KEY);
        if (storedToken && isMountedRef.current) {
          setPendingJoinToken(storedToken);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
      linkingSubscription.remove();
      appStateSubscription?.remove();

      if (Platform.OS !== 'web') {
        supabase.auth.stopAutoRefresh();
      }
    };
  }, [applySession, handleIncomingUrl, refreshSession]);

  useEffect(() => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      clearAuthMe();
      return;
    }

    void loadAuthMe(accessToken);
  }, [clearAuthMe, loadAuthMe, session?.access_token]);

  const signIn = useCallback(async ({ email, password }: SignInParams): Promise<AuthActionResult> => {
    try {
      const response = await authLogin({
        email: normalizeEmail(email),
        password,
      });

      const persistResult = await persistBackendSession(response.session);

      if (persistResult.error) {
        return persistResult;
      }

      await loadAuthMe(response.session.access_token);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof ApiError
          ? error.message
          : 'No pudimos iniciar sesion. Revisa tus datos e intenta nuevamente.',
      };
    }
  }, [loadAuthMe, persistBackendSession]);

  const signUp = useCallback(
    async ({ email, password, nombre }: SignUpParams): Promise<SignUpResult> => {
      try {
        const response = await authRegister({
          email: normalizeEmail(email),
          password,
          display_name: nombre.trim(),
        });

        if (!response.session) {
          clearAuthMe();
          return {
            error: null,
            needsEmailConfirmation: response.requires_email_confirmation,
          };
        }

        const persistResult = await persistBackendSession(response.session);

        if (persistResult.error) {
          return {
            error: persistResult.error,
            needsEmailConfirmation: false,
          };
        }

        await loadAuthMe(response.session.access_token);
        return {
          error: null,
          needsEmailConfirmation: false,
        };
      } catch (error) {
        return {
          error: error instanceof ApiError
            ? error.message
            : 'No pudimos crear tu cuenta. Verifica tus datos e intenta nuevamente.',
          needsEmailConfirmation: false,
        };
      }
    },
    [clearAuthMe, loadAuthMe, persistBackendSession],
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    let backendError: string | null = null;

    try {
      await authLogout(session?.access_token);
    } catch (error) {
      backendError = error instanceof ApiError
        ? error.message
        : 'No pudimos cerrar tu sesion en el servidor.';
    }

    const { error } = await supabase.auth.signOut({ scope: 'local' });

    setIsPasswordRecovery(false);
    clearAuthMe();

    if (error) {
      return {
        error: getAuthErrorMessage(
          error,
          'No pudimos limpiar tu sesion local. Intenta nuevamente.',
        ),
      };
    }

    return { error: backendError };
  }, [clearAuthMe, session?.access_token]);

  const resetPassword = useCallback(async (email: string): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: getAuthRedirectUrl(),
    });

    if (error) {
      return {
        error: getAuthErrorMessage(
          error,
          'No pudimos enviar el enlace de recuperacion. Intenta nuevamente.',
        ),
      };
    }

    return { error: null };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return {
        error: getAuthErrorMessage(
          error,
          'No pudimos actualizar tu contrasena. Solicita un nuevo enlace e intenta nuevamente.',
        ),
      };
    }

    setIsPasswordRecovery(false);
    return { error: null };
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  const clearPendingJoinToken = useCallback(async () => {
    setPendingJoinToken(null);
    await AsyncStorage.removeItem(PENDING_JOIN_KEY);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user,
      loading,
      initialized,
      authMe,
      authMeLoading,
      authMeError,
      isPasswordRecovery,
      pendingJoinToken,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshSession,
      refetchMe,
      handleIncomingUrl,
      clearPasswordRecovery,
      clearPendingJoinToken,
    }),
    [
      clearPasswordRecovery,
      clearPendingJoinToken,
      handleIncomingUrl,
      authMe,
      authMeError,
      authMeLoading,
      initialized,
      isPasswordRecovery,
      loading,
      pendingJoinToken,
      refetchMe,
      refreshSession,
      resetPassword,
      session,
      signIn,
      signOut,
      signUp,
      updatePassword,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
};
