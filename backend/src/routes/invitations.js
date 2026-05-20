const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const householdsController = require('../controllers/households.controller')

const router = express.Router()

router.post('/validate', authMiddleware, householdsController.validateInvitation)

module.exports = router
