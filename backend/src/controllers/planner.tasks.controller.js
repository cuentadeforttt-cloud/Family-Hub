const { getPlannerContext } = require('../services/planner.context.service')
const tasksService = require('../services/planner.tasks.service')

const sendPlannerError = (res, error) =>
  res.status(error.statusCode ?? 500).json({
    error: error.statusCode && error.statusCode < 500 ? error.message : 'Error interno.',
    code: error.code ?? 'internal_error',
  })

const listTasks = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await tasksService.listTasks(context, req.query ?? {})

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const createTask = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await tasksService.createTask(context, req.body ?? {})

    return res.status(201).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const updateTask = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await tasksService.updateTask(context, req.params.id, req.body ?? {})

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const cancelTask = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await tasksService.cancelTask(context, req.params.id)

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const completeTask = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await tasksService.completeTask(context, req.params.id)

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

const verifyTask = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await tasksService.verifyTask(context, req.params.id)

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

module.exports = {
  cancelTask,
  completeTask,
  createTask,
  listTasks,
  updateTask,
  verifyTask,
}
