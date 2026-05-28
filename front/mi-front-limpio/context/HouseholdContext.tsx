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
  reload: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [currentRole, setCurrentRole] = useState<HouseholdMember['rol'] | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setCurrentHousehold(null);
      setCurrentRole(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { household, role } = await getUserHousehold(user.id);
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
      reload: load,
    }),
    [currentHousehold, currentRole, members, loading, load],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
};

export const useHousehold = () => {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold debe usarse dentro de HouseholdProvider.');
  return ctx;
};
