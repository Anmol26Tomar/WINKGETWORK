const express = require('express');
const {
  signupCaptain,
  requestOtp,
  verifyOtpAndLogin,
  loginWithPassword,
  getProfile
} = require('../controllers/captain.auth.controller');
const { protectCaptain } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/v1/captain/auth/signup
router.post('/signup', signupCaptain);

// POST /api/v1/captain/auth/login-password
router.post('/login-password', loginWithPassword);

// POST /api/v1/captain/auth/login-otp-request
router.post('/login-otp-request', requestOtp);

// POST /api/v1/captain/auth/login-otp-verify
router.post('/login-otp-verify', verifyOtpAndLogin);

// GET /api/v1/captain/auth/profile (protected)
router.get('/profile', protectCaptain, getProfile);

module.exports = router;

