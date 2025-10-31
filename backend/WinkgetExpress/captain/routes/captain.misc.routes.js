const express = require('express');
const { protectCaptain } = require('../middleware/auth.middleware');
const { getStats, getEarnings, getTransactions, getWalletBalance } = require('../controllers/captain.dashboard.controller');
const { uploadDocument } = require('../controllers/captain.docs.controller');
const { getProfile } = require('../controllers/captain.auth.controller');

const router = express.Router();
router.use(protectCaptain);

// Align with frontend endpoints
router.get('/stats', getStats);
router.get('/earnings', getEarnings);
router.get('/transactions', getTransactions);
router.get('/wallet/balance', getWalletBalance);
router.get('/profile', getProfile);

// Documents upload (expects { file: base64/dataURI })
router.post('/documents/:type', uploadDocument);

module.exports = router;



