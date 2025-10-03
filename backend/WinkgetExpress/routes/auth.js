const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { register, login, profile } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.get('/profile', authMiddleware, profile);

module.exports = router;


