const express = require('express');
const { protectCaptain } = require('../middleware/auth.middleware');
const {
  listNearbyTrips,
  acceptTrip,
  reachedPickup,
  verifyOtp,
  reachedDestination,
  resendOtp
} = require('../controllers/captain.trip.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protectCaptain);

// GET /api/v1/captain/trips/nearby-trips
router.get('/nearby-trips', listNearbyTrips);

// POST /api/v1/captain/trips/:id/accept
router.post('/:id/accept', acceptTrip);

// POST /api/v1/captain/trips/:id/reached-pickup
router.post('/:id/reached-pickup', reachedPickup);

// POST /api/v1/captain/trips/:id/verify-otp
router.post('/:id/verify-otp', verifyOtp);

// POST /api/v1/captain/trips/:id/reached-destination
router.post('/:id/reached-destination', reachedDestination);

// POST /api/v1/captain/trips/:id/resend-otp
router.post('/:id/resend-otp', resendOtp);

module.exports = router;

