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
  householdError: string | null;
  reload: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [currentRole, setCurrentRole] = useState<HouseholdMember['rol'] | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [householdError, setHouseholdError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setCurrentHousehold(null);
      setCurrentRole(null);
      setMembers([]);
      setHouseholdError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHouseholdError(null);

    const { household, role, error } = await getUserHousehold(user.id);

    if (error) {
      // Error real (no es "sin hogar") — preservar estado anterior, mostrar error
      setHouseholdError(error);
      setLoading(false);
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

    setLoading(false);
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
      loading,
      householdError,
      reload: load,
    }),
    [currentHousehold, currentRole, members, loading, householdError, load],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
};

export const useHousehold = () => {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold debe usarse dentro de HouseholdProvider.');
  return ctx;
};
