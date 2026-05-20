const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const householdsController = require('../controllers/households.controller')

const router = express.Router()

router.post('/', authMiddleware, householdsController.createHousehold)
router.post(
  '/:household_id/invitations',
  authMiddleware,
  householdsController.createHouseholdInvitation,
)

module.exports = router
