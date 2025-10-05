const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { 
	estimate, 
	createParcel, 
	getParcel, 
	verifyOtp, 
	confirmPayment, 
	getParcelHistory, 
	updateParcelStatus, 
	getParcelTracking,
	testEndpoint 
} = require('../controllers/parcelController');

router.post('/estimate', auth, estimate);
router.post('/', auth, createParcel);
router.get('/history', auth, getParcelHistory);
router.get('/test', auth, testEndpoint);
router.get('/:id', auth, getParcel);
router.get('/:id/tracking', auth, getParcelTracking);
router.post('/:id/verify-otp', auth, verifyOtp);
router.post('/:id/confirm-payment', auth, confirmPayment);
router.put('/:id/status', auth, updateParcelStatus);

module.exports = router;


