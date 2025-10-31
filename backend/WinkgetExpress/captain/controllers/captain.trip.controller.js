const Transport = require('../../models/Transport');
const Parcel = require('../../models/Parcel');
const PackersMove = require('../../models/PackersMove');
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

    console.log(`[CaptainTrips] Searching for trips near captain ${captain._id} at (${latitude}, ${longitude}) within ${radiusKm}km`);
    console.log(`[CaptainTrips] Captain vehicle: ${captain.vehicleType}, subtype: ${captain.vehicleSubType}, services: ${captain.servicesOffered}`);

    // Helper function to calculate distance using Haversine formula
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Helper function to check if captain can handle this service
    const canHandleService = (serviceType, vehicleType, vehicleSubType) => {
      // Check if captain's vehicle type matches
      if (captain.vehicleType !== vehicleType) return false;
      
      // Check if captain offers this service
      if (!captain.servicesOffered.includes(serviceType)) return false;
      
      // Check vehicle subtype if provided
      if (vehicleSubType && captain.vehicleSubType && captain.vehicleSubType !== vehicleSubType) {
        return false;
      }
      
      return true;
    };

    // Helper function to filter and format trips
    const filterAndFormatTrips = (trips, tripType) => {
      return trips
        .filter(trip => {
          const distance = calculateDistance(latitude, longitude, trip.pickup.lat, trip.pickup.lng);
          return distance <= radiusKm;
        })
        .map(trip => ({
          id: trip._id,
          type: tripType,
          pickup: trip.pickup,
          delivery: trip.destination || trip.delivery,
          vehicleType: trip.vehicleType,
          vehicleSubType: trip.vehicleSubType,
          fareEstimate: trip.fareEstimate,
          distanceKm: trip.distanceKm || 0,
          status: trip.status,
          createdAt: trip.createdAt,
          // Service-specific fields
          ...(tripType === 'parcel' && {
            package: trip.package,
            receiverName: trip.receiverName,
            receiverContact: trip.receiverContact
          }),
          ...(tripType === 'packers' && {
            selectedItems: trip.selectedItems,
            receiverName: trip.receiverName,
            receiverContact: trip.receiverContact,
            receiverAddress: trip.receiverAddress
          }),
          ...(tripType === 'transport' && {
            // Transport-specific fields if any
          })
        }))
        .filter(trip => canHandleService(
          tripType === 'parcel' ? 'local_parcel' : 
          tripType === 'packers' ? 'packers_movers' :
          tripType === 'transport' ? (
            trip.vehicleType === 'bike' ? 'bike_ride' : 
            trip.vehicleType === 'cab' ? 'cab_booking' : 
            trip.vehicleType === 'truck' ? 'intra_truck' : ''
          ) : '',
          trip.vehicleType,
          trip.vehicleSubType
        ));
    };

    // Search across all models
    const [transportTrips, parcelTrips, packersTrips] = await Promise.all([
      Transport.find({ status: 'pending' }).limit(50),
      Parcel.find({ status: 'pending' }).limit(50),
      PackersMove.find({ status: 'pending' }).limit(50)
    ]);

    console.log(`[CaptainTrips] Found ${transportTrips.length} transport, ${parcelTrips.length} parcel, ${packersTrips.length} packers trips`);

    // Filter and format all trips
    const allTrips = [
      ...filterAndFormatTrips(transportTrips, 'transport'),
      ...filterAndFormatTrips(parcelTrips, 'parcel'),
      ...filterAndFormatTrips(packersTrips, 'packers')
    ];

    // Sort by distance and limit results
    const nearbyTrips = allTrips
      .sort((a, b) => {
        const distanceA = calculateDistance(latitude, longitude, a.pickup.lat, a.pickup.lng);
        const distanceB = calculateDistance(latitude, longitude, b.pickup.lat, b.pickup.lng);
        return distanceA - distanceB;
      })
      .slice(0, 20);

    console.log(`[CaptainTrips] Returning ${nearbyTrips.length} nearby trips for captain`);

    res.json({ 
      success: true,
      trips: nearbyTrips,
      total: nearbyTrips.length,
      captain: {
        id: captain._id,
        vehicleType: captain.vehicleType,
        vehicleSubType: captain.vehicleSubType,
        servicesOffered: captain.servicesOffered
      }
    });
  } catch (error) {
    console.error('List nearby trips error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const acceptTrip = async (req, res) => {
  try {
    const { id, type } = req.params; // type: 'transport', 'parcel', 'packers'
    const captain = req.captain;

    console.log(`[CaptainTrips] Captain ${captain._id} accepting ${type} trip ${id}`);

    let result;
    let updateData = {
      status: 'accepted',
      captainRef: captain._id,
      accepted: true
    };

    // Handle different model types
    switch (type) {
      case 'transport':
        result = await Transport.findOneAndUpdate(
          { 
            _id: id, 
            status: 'pending',
            captainRef: null 
          },
          updateData,
          { new: true }
        );
        break;
      
      case 'parcel':
        result = await Parcel.findOneAndUpdate(
          { 
            _id: id, 
            status: 'pending',
            captainRef: null 
          },
          updateData,
          { new: true }
        );
        break;
      
      case 'packers':
        result = await PackersMove.findOneAndUpdate(
          { 
            _id: id, 
            status: 'pending',
            captainRef: null 
          },
          updateData,
          { new: true }
        );
        break;
      
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Invalid trip type. Must be transport, parcel, or packers' 
        });
    }

    if (!result) {
      return res.status(400).json({ 
        success: false,
        message: 'Trip not available or already accepted' 
      });
    }

    // Generate OTPs for pickup and drop
    const pickupOtp = generateOtp();
    const dropOtp = generateOtp();
    
    const pickupOtpHash = hashOtp(pickupOtp);
    const dropOtpHash = hashOtp(dropOtp);

    // Update trip with OTP hashes (if the model supports it)
    const otpUpdateData = {
      otpPickupHash: pickupOtpHash,
      otpDropHash: dropOtpHash
    };

    switch (type) {
      case 'transport':
        await Transport.findByIdAndUpdate(id, otpUpdateData);
        break;
      case 'parcel':
        await Parcel.findByIdAndUpdate(id, otpUpdateData);
        break;
      case 'packers':
        await PackersMove.findByIdAndUpdate(id, otpUpdateData);
        break;
    }

    console.log(`[CaptainTrips] Trip ${id} accepted by captain ${captain._id}`);
    // Increment active trips counter for captain
    let updatedCaptain;
    try {
      const { Captain } = require('../models/Captain.model');
      updatedCaptain = await Captain.findByIdAndUpdate(captain._id, { $inc: { activeTrips: 1 } }, { new: true });
      
      // Emit stats update to captain via socket
      const { getIO } = require('../../utils/socket');
      const io = getIO();
      if (io && updatedCaptain?.socketId) {
        io.of('/captain').to(updatedCaptain.socketId).emit('stats:updated', {
          activeTrips: updatedCaptain.activeTrips
        });
      }
    } catch (e) {
      console.warn('Could not increment activeTrips for captain', e.message);
    }

    res.json({
      success: true,
      message: 'Trip accepted successfully',
      trip: {
        id: result._id,
        type: type,
        pickup: result.pickup,
        delivery: result.destination || result.delivery,
        vehicleType: result.vehicleType,
        vehicleSubType: result.vehicleSubType,
        fareEstimate: result.fareEstimate,
        status: result.status,
        captainRef: result.captainRef
      },
      otps: {
        pickup: pickupOtp,
        drop: dropOtp
      }
    });
  } catch (error) {
    console.error('Accept trip error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const reachedPickup = async (req, res) => {
  try {
    const { id, type } = req.params;
    const captain = req.captain;

    console.log(`[CaptainTrips] Captain ${captain._id} reached pickup for ${type} trip ${id}`);

    let trip;
    const updateData = { status: 'in_transit' };

    // Handle different model types
    switch (type) {
      case 'transport':
        trip = await Transport.findOneAndUpdate(
          { 
            _id: id, 
            captainRef: captain._id,
            status: 'accepted'
          },
          updateData,
          { new: true }
        );
        break;
      
      case 'parcel':
        trip = await Parcel.findOneAndUpdate(
          { 
            _id: id, 
            captainRef: captain._id,
            status: 'accepted'
          },
          updateData,
          { new: true }
        );
        break;
      
      case 'packers':
        trip = await PackersMove.findOneAndUpdate(
          { 
            _id: id, 
            captainRef: captain._id,
            status: 'accepted'
          },
          updateData,
          { new: true }
        );
        break;
      
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Invalid trip type. Must be transport, parcel, or packers' 
        });
    }

    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found or invalid status' 
      });
    }

    res.json({ 
      success: true,
      message: 'Status updated successfully', 
      trip: {
        id: trip._id,
        type: type,
        status: trip.status,
        pickup: trip.pickup,
        delivery: trip.destination || trip.delivery
      }
    });
  } catch (error) {
    console.error('Reached pickup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const verifyTripOtp = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { otp, phase } = req.body;
    const captain = req.captain;

    if (!otp || !phase) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP and phase are required' 
      });
    }

    console.log(`[CaptainTrips] Verifying OTP for ${type} trip ${id}, phase: ${phase}`);

    let trip;
    let Model;

    // Get the appropriate model
    switch (type) {
      case 'transport':
        Model = Transport;
        break;
      case 'parcel':
        Model = Parcel;
        break;
      case 'packers':
        Model = PackersMove;
        break;
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Invalid trip type. Must be transport, parcel, or packers' 
        });
    }

    trip = await Model.findOne({ 
      _id: id, 
      captainRef: captain._id 
    });

    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found' 
      });
    }

    let isValidOtp = false;
    let newStatus = '';

    if (phase === 'pickup') {
      isValidOtp = verifyOtp(otp, trip.otpPickupHash);
      newStatus = 'in_transit';
    } else if (phase === 'drop') {
      isValidOtp = verifyOtp(otp, trip.otpDropHash);
      newStatus = 'delivered';
    }

    if (!isValidOtp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP' 
      });
    }

    // Update trip status
    await Model.findByIdAndUpdate(id, { status: newStatus });

    console.log(`[CaptainTrips] OTP verified for ${type} trip ${id}, new status: ${newStatus}`);

    res.json({ 
      success: true,
      message: 'OTP verified successfully',
      status: newStatus,
      trip: {
        id: trip._id,
        type: type,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const reachedDestination = async (req, res) => {
  try {
    const { id, type } = req.params;
    const captain = req.captain;

    console.log(`[CaptainTrips] Captain ${captain._id} reached destination for ${type} trip ${id}`);

    let trip;
    let Model;

    // Get the appropriate model
    switch (type) {
      case 'transport':
        Model = Transport;
        break;
      case 'parcel':
        Model = Parcel;
        break;
      case 'packers':
        Model = PackersMove;
        break;
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Invalid trip type. Must be transport, parcel, or packers' 
        });
    }

    trip = await Model.findOneAndUpdate(
      { 
        _id: id, 
        captainRef: captain._id,
        status: 'in_transit'
      },
      { status: 'delivered' },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found or invalid status' 
      });
    }

    console.log(`[CaptainTrips] Trip ${id} completed by captain ${captain._id}`);
    // Update captain counters: decrement activeTrips, increment todayTrips and todayEarnings (70% of fare)
    let updatedCaptain;
    try {
      const { Captain } = require('../models/Captain.model');
      const fare = Number(trip.fareEstimate || trip.fare || 0);
      const takeHome = Math.round(fare * 0.7);
      updatedCaptain = await Captain.findByIdAndUpdate(captain._id, {
        $inc: { activeTrips: -1, todayTrips: 1, todayEarnings: takeHome }
      }, { new: true });
      
      // Emit stats update to captain via socket
      const { getIO } = require('../../utils/socket');
      const io = getIO();
      if (io && updatedCaptain?.socketId) {
        io.of('/captain').to(updatedCaptain.socketId).emit('stats:updated', {
          todayTrips: updatedCaptain.todayTrips,
          todayEarnings: updatedCaptain.todayEarnings,
          activeTrips: updatedCaptain.activeTrips
        });
      }
    } catch (e) {
      console.warn('Could not update captain earnings/trips', e.message);
    }

    // Return payment QR info (mock data)
    res.json({ 
      success: true,
      message: 'Status updated successfully', 
      trip: {
        id: trip._id,
        type: type,
        status: trip.status,
        pickup: trip.pickup,
        delivery: trip.destination || trip.delivery,
        fareEstimate: trip.fareEstimate
      },
      paymentUrl: `https://payment.example.com/trip/${id}`
    });
  } catch (error) {
    console.error('Reached destination error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { phase } = req.body;
    const captain = req.captain;

    if (!phase) {
      return res.status(400).json({ 
        success: false,
        message: 'Phase is required' 
      });
    }

    console.log(`[CaptainTrips] Resending OTP for ${type} trip ${id}, phase: ${phase}`);

    let trip;
    let Model;

    // Get the appropriate model
    switch (type) {
      case 'transport':
        Model = Transport;
        break;
      case 'parcel':
        Model = Parcel;
        break;
      case 'packers':
        Model = PackersMove;
        break;
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Invalid trip type. Must be transport, parcel, or packers' 
        });
    }

    trip = await Model.findOne({ 
      _id: id, 
      captainRef: captain._id 
    });

    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found' 
      });
    }

    // Generate new OTP
    const newOtp = generateOtp();
    const newOtpHash = hashOtp(newOtp);

    // Update trip with new OTP hash
    const updateField = phase === 'pickup' ? 'otpPickupHash' : 'otpDropHash';
    await Model.findByIdAndUpdate(id, { [updateField]: newOtpHash });

    console.log(`[CaptainTrips] OTP resent for ${type} trip ${id}, phase: ${phase}`);

    res.json({ 
      success: true,
      message: 'OTP resent successfully',
      otp: newOtp,
      phase: phase
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
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
