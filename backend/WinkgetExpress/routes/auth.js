const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { register, login, profile, updateProfile, getBusinessAccess } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, profile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;


