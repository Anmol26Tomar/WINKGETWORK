const { Trip } = require('../models/Trip.model');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp.helpers');

const listNearbyTrips = async (req, res) => {
  try {
    const captain = req.captain;
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Find trips within radius that match captain's services
    // Since Trip model uses lat/lng structure, we need to calculate distance manually
    const trips = await Trip.find({
      status: 'assigned',
      captainId: null,
      serviceType: { $in: captain.servicesOffered },
    }).limit(50);

    // Filter trips by distance from captain's location
    const nearbyTrips = trips.filter(trip => {
      const tripLat = trip.pickup.coords.lat;
      const tripLng = trip.pickup.coords.lng;
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (tripLat - latitude) * Math.PI / 180;
      const dLng = (tripLng - longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(latitude * Math.PI / 180) * Math.cos(tripLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= radiusKm;
    }).slice(0, 20); // Limit to 20 trips

    res.json({ trips: nearbyTrips });
  } catch (error) {
    console.error('List nearby trips error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const acceptTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const captain = req.captain;

    // Atomic update to implement first-accept-wins
    const result = await Trip.findOneAndUpdate(
      { 
        _id: id, 
        status: 'assigned', 
        captainId: null 
      },
      { 
        status: 'accepted', 
        captainId: captain._id,
        sessionId: Date.now().toString() // Unique session ID
      },
      { new: true }
    );

    if (!result) {
      return res.status(400).json({ message: 'Trip not available or already accepted' });
    }

    // Generate OTPs for pickup and drop
    const pickupOtp = generateOtp();
    const dropOtp = generateOtp();
    
    const pickupOtpHash = hashOtp(pickupOtp);
    const dropOtpHash = hashOtp(dropOtp);

    // Update trip with OTP hashes
    await Trip.findByIdAndUpdate(id, {
      otpPickupHash: pickupOtpHash,
      otpDropHash: dropOtpHash
    });

    res.json({
      message: 'Trip accepted successfully',
      trip: result,
      otps: {
        pickup: pickupOtp,
        drop: dropOtp
      }
    });
  } catch (error) {
    console.error('Accept trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const reachedPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const captain = req.captain;

    const trip = await Trip.findOneAndUpdate(
      { 
        _id: id, 
        captainId: captain._id,
        status: { $in: ['accepted', 'payment_confirmed', 'enroute_pickup'] }
      },
      { status: 'at_pickup' },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or invalid status' });
    }

    res.json({ message: 'Status updated successfully', trip });
  } catch (error) {
    console.error('Reached pickup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyTripOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, phase } = req.body;
    const captain = req.captain;

    if (!otp || !phase) {
      return res.status(400).json({ message: 'OTP and phase are required' });
    }

    const trip = await Trip.findOne({ 
      _id: id, 
      captainId: captain._id 
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    let isValidOtp = false;
    let newStatus = '';

    if (phase === 'pickup') {
      isValidOtp = verifyOtp(otp, trip.otpPickupHash);
      newStatus = 'enroute_drop';
    } else if (phase === 'drop') {
      isValidOtp = verifyOtp(otp, trip.otpDropHash);
      newStatus = 'completed';
    }

    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update trip status
    await Trip.findByIdAndUpdate(id, { status: newStatus });

    res.json({ 
      message: 'OTP verified successfully',
      status: newStatus
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const reachedDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const captain = req.captain;

    const trip = await Trip.findOneAndUpdate(
      { 
        _id: id, 
        captainId: captain._id,
        status: 'enroute_drop'
      },
      { status: 'at_destination' },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or invalid status' });
    }

    // Return payment QR info (mock data)
    res.json({ 
      message: 'Status updated successfully', 
      trip,
      paymentUrl: `https://payment.example.com/trip/${id}`
    });
  } catch (error) {
    console.error('Reached destination error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { phase } = req.body;
    const captain = req.captain;

    if (!phase) {
      return res.status(400).json({ message: 'Phase is required' });
    }

    const trip = await Trip.findOne({ 
      _id: id, 
      captainId: captain._id 
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Generate new OTP
    const newOtp = generateOtp();
    const newOtpHash = hashOtp(newOtp);

    // Update trip with new OTP hash
    const updateField = phase === 'pickup' ? 'otpPickupHash' : 'otpDropHash';
    await Trip.findByIdAndUpdate(id, { [updateField]: newOtpHash });

    res.json({ 
      message: 'OTP resent successfully',
      otp: newOtp
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  listNearbyTrips,
  acceptTrip,
  reachedPickup,
  verifyOtp: verifyTripOtp,
  reachedDestination,
  resendOtp
};
