import { supabase } from '../supabase';
import type { HouseholdMember } from './households';

export type Invitation = {
  id: string;
  household_id: string;
  token: string;
  rol_asignado: HouseholdMember['rol'];
  created_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
};

export async function createInvitation(
  householdId: string,
  rolAsignado: HouseholdMember['rol'],
  createdBy: string,
): Promise<{ invitation: Invitation | null; error: string | null }> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      household_id: householdId,
      rol_asignado: rolAsignado,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error || !data) {
    return { invitation: null, error: 'No pudimos generar la invitación. Intenta nuevamente.' };
  }

  return { invitation: data as Invitation, error: null };
}

export async function getPendingInvitations(
  householdId: string,
): Promise<{ invitations: Invitation[]; error: string | null }> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('household_id', householdId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });

  if (error) {
    return { invitations: [], error: 'No pudimos cargar las invitaciones.' };
  }

  return { invitations: (data as Invitation[]) ?? [], error: null };
}

export async function revokeInvitation(
  invitationId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .is('used_at', null);

  if (error) {
    return { error: 'No pudimos revocar la invitación.' };
  }

  return { error: null };
}

export async function joinHouseholdByToken(
  token: string,
  _userId: string, // kept for API compatibility — server uses auth.uid() internally
): Promise<{ householdId: string | null; error: string | null }> {
  // Use a SECURITY DEFINER RPC so the invitee (who has no household yet) can
  // read the invitation, insert themselves, and mark it as used atomically —
  // without needing direct SELECT/UPDATE access on the invitations table.
  const { data, error } = await supabase
    .rpc('join_household_by_token', { p_token: token });

  if (error) {
    return { householdId: null, error: 'No pudimos unirte al hogar. Intenta nuevamente.' };
  }

  const result = data as { household_id: string | null; rol: string | null; error: string | null };

  if (result?.error) {
    return { householdId: null, error: result.error };
  }

  return { householdId: result?.household_id ?? null, error: null };
}
