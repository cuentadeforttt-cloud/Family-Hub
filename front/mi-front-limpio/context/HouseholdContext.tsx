import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getUserHousehold, getHouseholdMembers } from '../services/households';
import type { Household, HouseholdMember } from '../services/households';
import { useAuth } from './AuthContext';

type HouseholdContextType = {
  currentHousehold: Household | null;
  currentRole: HouseholdMember['rol'] | null;
  members: HouseholdMember[];
  isCoordinator: boolean;
  loading: boolean;
  reloading: boolean;
  householdError: string | null;
  reload: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [currentRole, setCurrentRole]           = useState<HouseholdMember['rol'] | null>(null);
  const [members, setMembers]                   = useState<HouseholdMember[]>([]);
  const [rawLoading, setRawLoading]             = useState(false);
  const [reloading, setReloading]               = useState(false);
  const [householdError, setHouseholdError]     = useState<string | null>(null);

  // ID del último usuario para el que se completó el fetch.
  // undefined = nunca se hizo fetch; null = fetch completado sin usuario.
  const [fetchedForUserId, setFetchedForUserId] = useState<string | null | undefined>(undefined);

  // LOADING DERIVADO — true síncronamente en el render donde user cambia a truthy,
  // antes de que el useEffect dispare load(). Evita que PrivateNavigator monte
  // el stack con initialRouteName incorrecto durante la race condition de auth.
  const loading = rawLoading || (!!user && fetchedForUserId !== user.id);

  // Carga inicial — mantiene el navigator en <AuthLoadingScreen /> hasta resolver
  const load = useCallback(async () => {
    if (!user) {
      setCurrentHousehold(null);
      setCurrentRole(null);
      setMembers([]);
      setHouseholdError(null);
      setFetchedForUserId(null);
      setRawLoading(false);
      return;
    }

    setRawLoading(true);
    setHouseholdError(null);

    const { household, role, error } = await getUserHousehold(user.id);

    if (error) {
      setHouseholdError(error);
      setFetchedForUserId(user.id); // marcar como chequeado aunque sea error
      setRawLoading(false);
      return;
    }

    setCurrentHousehold(household);
    setCurrentRole(role);

    if (household) {
      const { members: m } = await getHouseholdMembers(household.id);
      setMembers(m);
    } else {
      setMembers([]);
    }

    setFetchedForUserId(user.id); // marcar fetch completado para este usuario
    setRawLoading(false);
  }, [user]);

  // Recarga posterior — usa reloading (no rawLoading) para no desmontar el navigator
  const reload = useCallback(async () => {
    if (!user) return;

    setReloading(true);
    setHouseholdError(null);

    const { household, role, error } = await getUserHousehold(user.id);

    if (error) {
      setHouseholdError(error);
      setReloading(false);
      return;
    }

    setCurrentHousehold(household);
    setCurrentRole(role);

    if (household) {
      const { members: m } = await getHouseholdMembers(household.id);
      setMembers(m);
    } else {
      setMembers([]);
    }

    setFetchedForUserId(user.id);
    setReloading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<HouseholdContextType>(
    () => ({
      currentHousehold,
      currentRole,
      members,
      isCoordinator: currentRole === 'coordinador',
      loading,       // derivado: cubre la race condition de auth
      reloading,
      householdError,
      reload,
    }),
    [currentHousehold, currentRole, members, loading, reloading, householdError, reload],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
};

export const useHousehold = () => {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold debe usarse dentro de HouseholdProvider.');
  return ctx;
};
