const { randomUUID } = require('crypto')
const { supabase } = require('../config/supabase')

const COORDINATOR_ROLE = 'coordinador'
const VALID_HOUSEHOLD_TYPES = new Set(['nucleo', 'abuelos', 'separados'])

const createHttpError = (statusCode, message) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '')

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

const safeDeleteHousehold = async (householdId) => {
  if (!householdId) {
    return
  }

  await supabase.from('households').delete().eq('id', householdId)
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

const createHousehold = async (req, res) => {
  try {
    const userId = req.user?.id
    const nombre = normalizeString(req.body?.nombre)
    const tipo = normalizeString(req.body?.tipo).toLowerCase()

    if (!userId) {
      return res.status(401).json({ error: 'Token invalido o expirado' })
    }

    if (!nombre) {
      throw createHttpError(400, 'nombre es obligatorio.')
    }

    if (!tipo || !VALID_HOUSEHOLD_TYPES.has(tipo)) {
      throw createHttpError(400, 'tipo invalido.')
    }

    const householdResult = await supabase
      .from('households')
      .insert({
        nombre,
        tipo,
        created_by: userId,
      })
      .select('*')
      .single()

    if (householdResult.error || !householdResult.data) {
      if (isDbValidationError(householdResult.error)) {
        throw createHttpError(400, 'tipo invalido.')
      }

      throw createHttpError(500, householdResult.error?.message ?? 'No se pudo crear el hogar.')
    }

    const household = householdResult.data

    const memberResult = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: userId,
        rol: COORDINATOR_ROLE,
      })
      .select('*')
      .single()

    if (memberResult.error || !memberResult.data) {
      await safeDeleteHousehold(household.id)
      throw createHttpError(
        500,
        memberResult.error?.message ?? 'No se pudo crear la membresia del coordinador.',
      )
    }

    return res.status(201).json({
      hogar: household,
      member: memberResult.data,
    })
  } catch (error) {
    return res.status(error.statusCode ?? 500).json({
      error: error.message ?? 'Error inesperado al crear el hogar.',
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
  validateInvitation,
}
