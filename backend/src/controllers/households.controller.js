const { randomUUID } = require('crypto')
const { createSupabaseForToken, supabase } = require('../config/supabase')
const { buildMe } = require('../lib/me.service')

const COORDINATOR_ROLE = 'coordinador'
const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'
const DEFAULT_LANGUAGE = 'es-419'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const createHttpError = (statusCode, message, code) => {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '')

const requireUuidParam = (value, name) => {
  const normalized = normalizeString(value)

  if (!UUID_PATTERN.test(normalized)) {
    throw createHttpError(400, `${name} invalido.`, `${name}/invalid`)
  }

  return normalized
}

const isDbValidationError = (error) => {
  const message = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase()

  return (
    error?.code === '23514' ||
    error?.code === '22P02' ||
    message.includes('invalid input value for enum') ||
    message.includes('violates check constraint')
  )
}

const isUniqueViolation = (error) => error?.code === '23505'

const isMissingOptionalColumnError = (error, columnName) => {
  const message = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase()

  return error?.code === 'PGRST204' || message.includes(`'${columnName.toLowerCase()}'`)
}

const safeDeleteHouseholdMember = async (householdId, userId) => {
  if (!householdId || !userId) {
    return
  }

  await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId)
}

const fetchHouseholdById = async (householdId) => {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .maybeSingle()

  if (error) {
    throw createHttpError(500, error.message)
  }

  return data
}

const fetchHouseholdMembership = async (householdId, userId) => {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw createHttpError(500, error.message)
  }

  return data
}

const insertInvitation = async (payload) => {
  const withCreator = {
    ...payload,
    created_by: payload.created_by,
  }

  const firstAttempt = await supabase.from('invitations').insert(withCreator).select('*').single()

  if (!firstAttempt.error) {
    return firstAttempt
  }

  if (!isMissingOptionalColumnError(firstAttempt.error, 'created_by')) {
    return firstAttempt
  }

  const withoutCreator = { ...payload }
  delete withoutCreator.created_by

  return supabase.from('invitations').insert(withoutCreator).select('*').single()
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const mapCreateHouseholdRpcError = (error) => {
  const message = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`

  if (error?.code === '22023' || message.includes('household_name_required')) {
    return createHttpError(400, 'name es obligatorio.', 'household/invalid_name')
  }

  if (message.includes('person_not_found')) {
    return createHttpError(409, 'No existe people para el usuario autenticado.', 'auth/person_not_found')
  }

  if (error?.code === '28000' || message.includes('not_authenticated')) {
    return createHttpError(401, 'No autenticado.', 'auth/unauthorized')
  }

  if (error?.code === '23505' || message.includes('household_slug_conflict')) {
    return createHttpError(409, 'El slug del hogar ya existe.', 'household/slug_conflict')
  }

  return createHttpError(500, 'No se pudo crear el hogar.', 'household/create_failed')
}

const mapFinalizeMemberRpcError = (error) => {
  const message = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase()

  if (error?.code === '28000' || message.includes('not_authenticated')) {
    return createHttpError(401, 'No autenticado.', 'auth/unauthorized')
  }

  if (message.includes('not_household_coordinator') || error?.code === '42501') {
    return createHttpError(403, 'Solo un coordinator activo puede quitar miembros.', 'household/not_coordinator')
  }

  if (message.includes('membership_not_found')) {
    return createHttpError(404, 'Miembro no encontrado.', 'membership/not_found')
  }

  if (message.includes('membership_not_active')) {
    return createHttpError(409, 'La membresia no esta activa.', 'membership/not_active')
  }

  if (message.includes('cannot_finalize_self')) {
    return createHttpError(400, 'No podes quitarte desde esta accion.', 'membership/cannot_finalize_self')
  }

  if (message.includes('cannot_finalize_last_coordinator')) {
    return createHttpError(409, 'No se puede quitar al ultimo coordinator del hogar.', 'membership/last_coordinator')
  }

  if (
    error?.code === 'PGRST202' ||
    message.includes('schema cache') ||
    message.includes('function') && message.includes('finalize_household_member')
  ) {
    return createHttpError(
      500,
      'RPC finalize_household_member no disponible en Supabase. Revisar migracion/schema cache.',
      'membership/finalize_rpc_unavailable',
    )
  }

  return createHttpError(500, 'No se pudo quitar el miembro.', 'membership/finalize_failed')
}

const createHousehold = async (req, res) => {
  try {
    const accessToken = req.accessToken
    const user = req.user
    const name = normalizeString(req.body?.name)
    const slug = normalizeString(req.body?.slug) || null
    const timezone = normalizeString(req.body?.timezone) || DEFAULT_TIMEZONE
    const defaultLanguage = normalizeString(req.body?.default_language) || DEFAULT_LANGUAGE
    const config = req.body?.config ?? {}

    if (!accessToken || !user?.id) {
      throw createHttpError(401, 'No autenticado.', 'auth/unauthorized')
    }

    if (!name) {
      throw createHttpError(400, 'name es obligatorio.', 'household/invalid_name')
    }

    if (!isPlainObject(config)) {
      throw createHttpError(400, 'config debe ser un objeto JSON.', 'household/invalid_config')
    }

    const scopedClient = createSupabaseForToken(accessToken)
    const { data, error } = await scopedClient.rpc('create_household', {
      p_name: name,
      p_slug: slug,
      p_timezone: timezone,
      p_default_language: defaultLanguage,
      p_config: config,
    })

    if (error) {
      throw mapCreateHouseholdRpcError(error)
    }

    if (!data?.household || !data?.membership || !data?.person) {
      throw createHttpError(500, 'No se pudo crear el hogar.', 'household/create_failed')
    }

    const me = await buildMe({ user, accessToken })

    return res.status(201).json({
      household: data.household,
      membership: data.membership,
      person: data.person,
      me,
    })
  } catch (error) {
    const statusCode = error.statusCode ?? 500

    return res.status(statusCode).json({
      error: statusCode >= 500 ? 'No se pudo crear el hogar.' : error.message,
      code: statusCode >= 500 ? 'household/create_failed' : error.code,
    })
  }
}

const finalizeHouseholdMember = async (req, res) => {
  try {
    if (!req.user?.id || !req.accessToken) {
      throw createHttpError(401, 'No autenticado.', 'auth/unauthorized')
    }

    const householdId = requireUuidParam(req.params?.household_id, 'household_id')
    const membershipId = requireUuidParam(req.params?.membership_id, 'membership_id')
    const scopedClient = createSupabaseForToken(req.accessToken)

    const { data, error } = await scopedClient.rpc('finalize_household_member', {
      p_household_id: householdId,
      p_membership_id: membershipId,
    })

    if (error) {
      console.error('[finalizeHouseholdMember] RPC error', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      throw mapFinalizeMemberRpcError(error)
    }

    if (!data?.membership) {
      throw createHttpError(500, 'La RPC no devolvio membership.', 'membership/invalid_rpc_response')
    }

    return res.status(200).json({
      membership: data.membership,
    })
  } catch (error) {
    const statusCode = error.statusCode ?? 500

    return res.status(statusCode).json({
      error: statusCode >= 500 ? 'No se pudo quitar el miembro.' : error.message,
      code: statusCode >= 500 ? 'membership/finalize_failed' : error.code,
    })
  }
}

const createHouseholdInvitation = async (req, res) => {
  try {
    const userId = req.user?.id
    const householdId = normalizeString(req.params?.household_id)
    const rolAsignado = normalizeString(req.body?.rol_asignado)

    if (!userId) {
      return res.status(401).json({ error: 'Token invalido o expirado' })
    }

    if (!householdId) {
      throw createHttpError(400, 'household_id es obligatorio.')
    }

    if (!rolAsignado) {
      throw createHttpError(400, 'rol_asignado invalido.')
    }

    const household = await fetchHouseholdById(householdId)

    if (!household) {
      throw createHttpError(404, 'Hogar no encontrado.')
    }

    const membership = await fetchHouseholdMembership(householdId, userId)

    if (!membership || membership.rol !== COORDINATOR_ROLE) {
      throw createHttpError(403, 'Solo un coordinador puede crear invitaciones.')
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const invitationResult = await insertInvitation({
      household_id: householdId,
      token,
      rol_asignado: rolAsignado,
      expires_at: expiresAt,
      created_by: userId,
    })

    if (invitationResult.error || !invitationResult.data) {
      if (isDbValidationError(invitationResult.error)) {
        throw createHttpError(400, 'rol_asignado invalido.')
      }

      throw createHttpError(
        500,
        invitationResult.error?.message ?? 'No se pudo crear la invitacion.',
      )
    }

    return res.status(201).json({
      token,
      link: `https://familyhub.app/join/${token}`,
      expires_at: invitationResult.data.expires_at,
    })
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({
      error: error.message ?? 'Error inesperado al crear la invitacion.',
    })
  }
}

const validateInvitation = async (req, res) => {
  try {
    const userId = req.user?.id
    const token = normalizeString(req.body?.token)

    if (!userId) {
      return res.status(401).json({ error: 'Token invalido o expirado' })
    }

    if (!token) {
      throw createHttpError(400, 'token es obligatorio.')
    }

    const invitationResult = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (invitationResult.error) {
      throw createHttpError(500, invitationResult.error.message)
    }

    if (!invitationResult.data) {
      throw createHttpError(404, 'Invitacion no encontrada.')
    }

    const invitation = invitationResult.data

    if (invitation.used_at) {
      throw createHttpError(409, 'La invitacion ya fue usada.')
    }

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      throw createHttpError(410, 'La invitacion esta vencida.')
    }

    const existingMembership = await fetchHouseholdMembership(invitation.household_id, userId)

    if (existingMembership) {
      throw createHttpError(409, 'El usuario ya pertenece a este hogar.')
    }

    const memberResult = await supabase
      .from('household_members')
      .insert({
        household_id: invitation.household_id,
        user_id: userId,
        rol: invitation.rol_asignado,
      })
      .select('*')
      .single()

    if (memberResult.error || !memberResult.data) {
      if (isUniqueViolation(memberResult.error)) {
        throw createHttpError(409, 'El usuario ya pertenece a este hogar.')
      }

      throw createHttpError(
        500,
        memberResult.error?.message ?? 'No se pudo crear la membresia del hogar.',
      )
    }

    const usedAt = new Date().toISOString()
    const updateInvitationResult = await supabase
      .from('invitations')
      .update({
        used_at: usedAt,
        used_by: userId,
      })
      .eq('token', token)
      .is('used_at', null)
      .select('*')
      .maybeSingle()

    if (updateInvitationResult.error || !updateInvitationResult.data) {
      await safeDeleteHouseholdMember(invitation.household_id, userId)

      if (!updateInvitationResult.error && !updateInvitationResult.data) {
        throw createHttpError(409, 'La invitacion ya fue usada.')
      }

      throw createHttpError(
        500,
        updateInvitationResult.error?.message ?? 'No se pudo marcar la invitacion como usada.',
      )
    }

    const household = await fetchHouseholdById(invitation.household_id)

    return res.status(200).json({
      mensaje: 'Invitacion validada correctamente.',
      invitacion: updateInvitationResult.data,
      member: memberResult.data,
      hogar: household,
    })
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({
      error: error.message ?? 'Error inesperado al validar la invitacion.',
    })
  }
}

module.exports = {
  createHousehold,
  createHouseholdInvitation,
  finalizeHouseholdMember,
  validateInvitation,
}
