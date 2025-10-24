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

// POST /api/v1/captain/trips/:type/:id/accept
router.post('/:type/:id/accept', acceptTrip);

// POST /api/v1/captain/trips/:type/:id/reached-pickup
router.post('/:type/:id/reached-pickup', reachedPickup);

// POST /api/v1/captain/trips/:type/:id/verify-otp
router.post('/:type/:id/verify-otp', verifyOtp);

// POST /api/v1/captain/trips/:type/:id/reached-destination
router.post('/:type/:id/reached-destination', reachedDestination);

// POST /api/v1/captain/trips/:type/:id/resend-otp
router.post('/:type/:id/resend-otp', resendOtp);

module.exports = router;

