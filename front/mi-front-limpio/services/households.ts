import { supabase } from '../supabase';

export type Household = {
  id: string;
  nombre: string;
  tipo: 'nucleo' | 'con_abuelos' | 'separados' | 'otro';
  foto_url: string | null;
  created_by: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  user_id: string;
  household_id: string;
  rol: 'coordinador' | 'adulto' | 'adolescente' | 'adulto_mayor';
  joined_at: string;
  invited_by: string | null;
  user?: {
    nombre: string;
    email: string;
    avatar_url: string | null;
  };
};

export async function createHousehold(
  nombre: string,
  tipo: Household['tipo'],
  userId: string,
): Promise<{ household: Household | null; error: string | null }> {
  const { data: household, error: hhError } = await supabase
    .from('households')
    .insert({ nombre: nombre.trim(), tipo, created_by: userId })
    .select()
    .single();

  if (hhError || !household) {
    return { household: null, error: 'No pudimos crear el hogar. Intenta nuevamente.' };
  }

  const { error: memberError } = await supabase.from('household_members').insert({
    user_id: userId,
    household_id: household.id,
    rol: 'coordinador',
  });

  if (memberError) {
    return { household: null, error: 'Hogar creado pero no pudimos asignarte como coordinador.' };
  }

  return { household, error: null };
}

export async function getUserHousehold(
  userId: string,
): Promise<{ household: Household | null; role: HouseholdMember['rol'] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('household_members')
    .select('rol, households(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      // No household yet — not an error
      return { household: null, role: null, error: null };
    }
    return { household: null, role: null, error: 'No pudimos cargar tu hogar.' };
  }

  return {
    household: data.households as unknown as Household,
    role: data.rol,
    error: null,
  };
}

export async function getHouseholdMembers(
  householdId: string,
): Promise<{ members: HouseholdMember[]; error: string | null }> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*, user:users(nombre, email, avatar_url)')
    .eq('household_id', householdId);

  if (error) {
    return { members: [], error: 'No pudimos cargar los miembros del hogar.' };
  }

  return { members: (data as HouseholdMember[]) ?? [], error: null };
}
