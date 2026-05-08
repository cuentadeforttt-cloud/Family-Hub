const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/signup', authController.signUp);
router.post('/dev-signup', authController.devSignUp);
router.post('/login', authController.login);

module.exports = router;
