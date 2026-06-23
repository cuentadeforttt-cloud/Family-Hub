const { getPlannerContext } = require('../services/planner.context.service')
const summaryService = require('../services/planner.summary.service')

const sendPlannerError = (res, error) =>
  res.status(error.statusCode ?? 500).json({
    error: error.statusCode && error.statusCode < 500 ? error.message : 'Error interno.',
    code: error.code ?? 'internal_error',
  })

const getSummary = async (req, res) => {
  try {
    const context = await getPlannerContext(req)
    const payload = await summaryService.getSummary(context)

    return res.status(200).json(payload)
  } catch (error) {
    return sendPlannerError(res, error)
  }
}

module.exports = {
  getSummary,
}
