const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Registro
router.post('/signup', authController.signUp);

// Login
router.post('/login', authController.login);

module.exports = router;