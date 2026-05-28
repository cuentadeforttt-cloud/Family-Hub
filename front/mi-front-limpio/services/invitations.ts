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
    .order('created_at', { ascending: false });

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
  userId: string,
): Promise<{ householdId: string | null; error: string | null }> {
  // Fetch the invitation
  const { data: inv, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .single();

  if (fetchError || !inv) {
    return { householdId: null, error: 'La invitación no existe o ya fue usada.' };
  }

  if (new Date(inv.expires_at) < new Date()) {
    return { householdId: null, error: 'Esta invitación expiró. Solicita una nueva al coordinador.' };
  }

  // Join the household
  const { error: joinError } = await supabase.from('household_members').insert({
    user_id: userId,
    household_id: inv.household_id,
    rol: inv.rol_asignado,
    invited_by: inv.created_by,
  });

  if (joinError) {
    if (joinError.code === '23505') {
      return { householdId: null, error: 'Ya eres miembro de este hogar.' };
    }
    return { householdId: null, error: 'No pudimos unirte al hogar. Intenta nuevamente.' };
  }

  // Mark invitation as used (best-effort — done client-side; ideally a server RPC)
  await supabase
    .from('invitations')
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq('id', inv.id);

  return { householdId: inv.household_id, error: null };
}
