import { supabase } from '../supabase';

export type Household = {
  id: string;
  nombre: string;
  tipo: 'nucleo' | 'con_abuelos' | 'separados' | 'otro' | null;
  foto_url: string | null;
  created_by: string | null;
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

/**
 * Asegura que exista una fila en public.users para el usuario autenticado.
 * Usa RPC SECURITY DEFINER para saltear RLS (necesario para cuentas creadas
 * antes de que se aplicara el trigger on_auth_user_created).
 */
export async function ensurePublicUser(): Promise<void> {
  await supabase.rpc('ensure_public_user');
}

/**
 * Garantiza que exista una fila en public.users para el usuario actual.
 * Estrategia en capas:
 *   1. RPC SECURITY DEFINER (migration_006) — bypasea RLS, siempre funciona
 *   2. INSERT directo — funciona si el JWT es válido y el trigger no corrió antes
 * Ambos pasos son idempotentes (ON CONFLICT DO NOTHING).
 */
async function guaranteePublicUser(): Promise<void> {
  // Capa 1: RPC SECURITY DEFINER (migration_006+)
  const { error: rpcError } = await supabase.rpc('ensure_public_user');
  if (!rpcError) return; // éxito

  if (rpcError.code !== 'PGRST202') {
    // Error real, no "función no encontrada"
    throw new Error(`ensure_public_user RPC failed: ${rpcError.message}`);
  }

  // Capa 2: PGRST202 = migration_006 no aplicada → INSERT directo como fallback
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return; // sin sesión, no hay nada que hacer

  const { error: insertError } = await supabase.from('users').insert({
    id: authUser.id,
    email: authUser.email ?? '',
    nombre:
      (authUser.user_metadata?.nombre as string | undefined)
      ?? authUser.email?.split('@')[0]
      ?? 'Usuario',
  });

  // 23505 = ya existe (trigger ya corrió) → ignorar
  if (insertError && insertError.code !== '23505') {
    console.warn('[guaranteePublicUser] insert directo error:', insertError.code, insertError.message);
    // Continuar de todas formas: si el usuario ya existe (pero RLS lo oculta),
    // el INSERT de household puede aún funcionar
  }
}

export async function createHousehold(
  nombre: string,
  tipo: Household['tipo'],
  userId: string,
): Promise<{ household: Household | null; error: string | null }> {
  // Garantiza fila en public.users antes del INSERT (FK en households.created_by)
  try {
    await guaranteePublicUser();
  } catch {
    // Error inesperado en el paso de garantía — continuar e intentar igual
    console.warn('[createHousehold] guaranteePublicUser threw, continuing anyway');
  }

  const { data: household, error: hhError } = await supabase
    .from('households')
    .insert({ nombre: nombre.trim(), tipo, created_by: userId })
    .select()
    .single();

  if (!hhError && household) {
    // Camino feliz: INSERT directo funcionó (auth.uid() válido)
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

  // Camino alternativo: INSERT directo bloqueado por RLS (auth.uid() null = problema de JWT ES256)
  // Usar create_household_rpc SECURITY DEFINER (migration_008) que bypasea RLS
  if (hhError?.code === '42501' || hhError?.code === '42P01') {
    console.warn('[createHousehold] Direct INSERT blocked, trying create_household_rpc fallback');

    const { data: rpcData, error: rpcError } = await supabase
      .rpc('create_household_rpc', { p_nombre: nombre.trim(), p_tipo: tipo ?? null });

    if (rpcError) {
      if (rpcError.code === 'PGRST202') {
        // migration_008 no aplicada aún
        return {
          household: null,
          error: 'Error de permisos al crear el hogar. Cerrá sesión, volvé a iniciar sesión e intentá de nuevo.',
        };
      }
      return { household: null, error: 'No pudimos crear el hogar. Intenta nuevamente.' };
    }

    const result = rpcData as { household_id: string | null; household: Household | null; error: string | null } | null;

    if (result?.error) {
      return { household: null, error: result.error };
    }

    if (!result?.household_id) {
      return { household: null, error: 'No pudimos crear el hogar. Intenta nuevamente.' };
    }

    // Construir objeto Household desde el resultado del RPC
    const createdHousehold = result.household ?? {
      id: result.household_id,
      nombre: nombre.trim(),
      tipo,
      foto_url: null,
      created_by: userId,
      created_at: new Date().toISOString(),
    } as Household;

    return { household: createdHousehold, error: null };
  }

  return { household: null, error: 'No pudimos crear el hogar. Intenta nuevamente.' };
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
      // Sin hogar todavía — no es un error
      return { household: null, role: null, error: null };
    }
    // Cualquier otro error (RLS, red, etc.) — reportar para que el contexto lo maneje
    return { household: null, role: null, error: error?.message ?? 'No pudimos cargar tu hogar.' };
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
    .select('*, user:users!user_id(nombre, email, avatar_url)')
    .eq('household_id', householdId);

  if (error) {
    return { members: [], error: 'No pudimos cargar los miembros del hogar.' };
  }

  return { members: (data as HouseholdMember[]) ?? [], error: null };
}
