const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { estimate, createParcel, getParcel, verifyOtp, confirmPayment } = require('../controllers/parcelController');

router.post('/estimate', auth, estimate);
router.post('/', auth, createParcel);
router.get('/:id', auth, getParcel);
router.post('/:id/verify-otp', auth, verifyOtp);
router.post('/:id/confirm-payment', auth, confirmPayment);

module.exports = router;


