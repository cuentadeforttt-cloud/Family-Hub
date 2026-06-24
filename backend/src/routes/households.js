const express = require('express')
const authFinalMiddleware = require('../middleware/authFinalMiddleware')
const householdsController = require('../controllers/households.controller')

const router = express.Router()

const legacyInvitationFlowDisabled = (req, res) =>
  res.status(410).json({
    error: 'legacy_invitation_flow_disabled',
    message: 'Legacy invitations flow is disabled. Use invite links flow.',
  })

router.post('/', authFinalMiddleware, householdsController.createHousehold)
router.post(
  '/:household_id/members/:membership_id/finalize',
  authFinalMiddleware,
  householdsController.finalizeHouseholdMember,
)
router.post('/:household_id/invitations', legacyInvitationFlowDisabled)

module.exports = router
