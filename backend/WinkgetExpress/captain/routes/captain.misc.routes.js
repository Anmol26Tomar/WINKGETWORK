const express = require('express');
const { protectCaptain } = require('../middleware/auth.middleware');
const { getStats, getEarnings, getTransactions, getWalletBalance } = require('../controllers/captain.dashboard.controller');
const { getProfile } = require('../controllers/captain.auth.controller');

const router = express.Router();

router.use(protectCaptain);

// Align with frontend endpoints
router.get('/captain/stats', getStats);
router.get('/earnings', getEarnings);
router.get('/transactions', getTransactions);
router.get('/wallet/balance', getWalletBalance);
router.get('/profile', getProfile);

module.exports = router;



