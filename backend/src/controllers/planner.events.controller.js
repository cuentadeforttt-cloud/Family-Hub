const { getPlannerContext } = require('../services/planner.context.service')
const eventsService = require('../services/planner.events.service')

const sendPlannerError = (res, error) =>
  res.status(error.statusCode ?? 500).json({
    error: error.statusCode && error.statusCode < 500 ? error.message : 'Error interno.',
    code: error.code ?? 'internal_error',
  })

const listEvents = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await eventsService.listEvents(context, req.query ?? {})

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const createEvent = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await eventsService.createEvent(context, req.body ?? {})

    return res.status(201).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const updateEvent = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await eventsService.updateEvent(context, req.params.id, req.body ?? {})

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const cancelEvent = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await eventsService.cancelEvent(context, req.params.id)

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

module.exports = {
  cancelEvent,
  createEvent,
  listEvents,
  updateEvent,
}
