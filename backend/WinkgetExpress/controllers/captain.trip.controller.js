const Transport = require('../models/Transport');
const Parcel = require('../models/Parcel');
const PackersMove = require('../models/PackersMove');
const { Trip } = require('../models/Trip.model');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp.helpers');

// ... (Your listNearbyTrips, acceptTrip, and reachedPickup functions are OK) ...
// ... (Paste your existing listNearbyTrips, acceptTrip, and reachedPickup here) ...

const listNearbyTrips = async (req, res) => {
  try {
    const agent = req.agent;
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    console.log(`[agentTrips] Searching for trips near agent ${agent._id} at (${latitude}, ${longitude}) within ${radiusKm}km`);
    console.log(`[agentTrips] agent vehicle: ${agent.vehicleType}, subtype: ${agent.vehicleSubType}, services: ${JSON.stringify(agent.servicesOffered)}`);
    
    // Verify agent has servicesOffered array
    if (!agent.servicesOffered || !Array.isArray(agent.servicesOffered) || agent.servicesOffered.length === 0) {
      console.error(`[agentTrips] WARNING: Agent ${agent._id} has no servicesOffered! This will prevent trip matching.`);
      return res.json({
        success: true,
        trips: [],
        total: 0,
        message: 'Agent has no services configured. Please update your profile.',
        agent: {
          id: agent._id,
          vehicleType: agent.vehicleType,
          servicesOffered: agent.servicesOffered
        }
      });
    }

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

    // Helper function to check if agent can handle this service
    const canHandleService = (serviceType, vehicleType, vehicleSubType) => {
      if (!agent.servicesOffered || !agent.servicesOffered.includes(serviceType)) {
        console.log(`[agentTrips] Agent does not offer service "${serviceType}". Agent services:`, agent.servicesOffered);
        return false;
      }
      const agentVehicleType = (agent.vehicleType || '').toLowerCase();
      if (serviceType === 'packers_movers' && agentVehicleType === 'truck') {
        console.log(`[agentTrips] Truck agent handling 'packers_movers' trip. Skipping vehicle type check.`);
        return true;
      }
      const tripVehicleType = (vehicleType || '').toLowerCase();
      if (agentVehicleType !== tripVehicleType) {
        if (agentVehicleType === 'truck') {
          console.log(`[agentTrips] Vehicle type mismatch: agent has "${agent.vehicleType}", trip requires "${vehicleType}"`);
        }
        return false;
      }
      if (vehicleSubType && agent.vehicleSubType && agent.vehicleSubType !== vehicleSubType) {
        console.log(`[agentTrips] Vehicle subtype mismatch: agent has "${agent.vehicleSubType}", trip requires "${vehicleSubType}"`);
      }
      return true;
    };

    // Helper function to filter and format trips
    const filterAndFormatTrips = (trips, tripType, totalTruckTripsInType = 0) => {
      const agentVehicleType = (agent.vehicleType || '').toLowerCase();
      let truckTripsProcessed = 0;
      let truckTripsPassedPreFilter = 0;
      
      return trips
        .filter(trip => {
          const tripVehicleType = (trip.vehicleType || '').toLowerCase();
          const isTruckTripRaw = tripVehicleType === 'truck';
          if (isTruckTripRaw && agentVehicleType === 'truck') {
            truckTripsProcessed++;
            const counter = totalTruckTripsInType > 0 ? `[${truckTripsProcessed}/${totalTruckTripsInType}]` : `[${truckTripsProcessed}]`;
            console.log(`[agentTrips] PRE-FILTER ${counter}: Truck trip ${trip._id?.toString() || 'unknown'}: vehicleType="${trip.vehicleType}", type="${tripType}"`);
          }
          if (!tripVehicleType || tripVehicleType === 'undefined' || tripVehicleType === 'admin' || tripVehicleType === 'auto') {
            if (isTruckTripRaw && agentVehicleType === 'truck') {
              console.log(`[agentTrips] PRE-FILTER: Truck trip ${trip._id} rejected - invalid vehicleType: "${trip.vehicleType}"`);
            }
            return false;
          }
          if (agentVehicleType === 'truck') {
            if (tripVehicleType !== 'truck' && tripType !== 'packers') {
              return false;
            }
          } else {
            if (tripVehicleType !== agentVehicleType) {
              return false;
            }
          }
          if (!trip.pickup || trip.pickup.lat === undefined || trip.pickup.lat === null || trip.pickup.lng === undefined || trip.pickup.lng === null) {
            if (isTruckTripRaw && agentVehicleType === 'truck') {
              console.log(`[agentTrips] PRE-FILTER: Truck trip ${trip._id} rejected - missing pickup coordinates. pickup=`, trip.pickup);
            }
            return false;
          }
          const distance = calculateDistance(latitude, longitude, trip.pickup.lat, trip.pickup.lng);
          if (distance > radiusKm) {
            if (isTruckTripRaw && agentVehicleType === 'truck') {
              console.log(`[agentTrips] PRE-FILTER: Truck trip ${trip._id} rejected - distance ${distance.toFixed(2)}km > ${radiusKm}km`);
            }
            return false;
          }
          if (isTruckTripRaw && agentVehicleType === 'truck') {
            truckTripsPassedPreFilter++;
            console.log(`[agentTrips] PRE-FILTER: Truck trip ${trip._id} PASSED pre-filter (distance: ${distance.toFixed(2)}km) [${truckTripsPassedPreFilter} passed so far]`);
          }
          return true;
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
          ...(tripType === 'parcel' && {
            package: trip.package,
            receiverName: trip.receiverName,
            receiverContact: trip.receiverContact,
            typeOfDelivery: trip.typeOfDelivery
          }),
          ...(tripType === 'packers' && {
            selectedItems: trip.selectedItems,
            receiverName: trip.receiverName,
            receiverContact: trip.receiverContact,
            receiverAddress: trip.receiverAddress
          }),
          ...(tripType === 'transport' && {})
        }))
        .filter(trip => {
          let serviceType = '';
          const tripVehicleType = (trip.vehicleType || '').toLowerCase();
          const isTruckTrip = tripVehicleType === 'truck';
          if (isTruckTrip) {
            console.log(`[agentTrips] Processing truck trip ${trip.id}: type=${tripType}, vehicleType="${trip.vehicleType}", vehicleSubType="${trip.vehicleSubType}", typeOfDelivery="${trip.typeOfDelivery}"`);
B       }
          if (tripType === 'parcel') {
            if (tripVehicleType === 'truck') {
              const deliveryType = (trip.typeOfDelivery || 'standard').toLowerCase();
              serviceType = (deliveryType === 'express' || deliveryType === 'all_india') ? 'all_india_parcel' : 'intra_truck';
              if (isTruckTrip) {
                console.log(`[agentTrips] Truck parcel ${trip.id}: typeOfDelivery="${trip.typeOfDelivery}" -> "${deliveryType}" -> serviceType="${serviceType}"`);
              }
            } else {
              const deliveryType = (trip.typeOfDelivery || 'standard').toLowerCase();
              serviceType = (deliveryType === 'express' || deliveryType === 'all_india') ? 'all_india_parcel' : 'local_parcel';
            }
          } else if (tripType === 'packers') {
            serviceType = 'packers_movers';
          } else if (tripType === 'transport') {
            if (tripVehicleType === 'bike') {
              serviceType = 'bike_ride';
            } else if (tripVehicleType === 'cab') {
              serviceType = 'cab_booking';
            } else if (tripVehicleType === 'truck') {
              serviceType = 'intra_truck';
              if (isTruckTrip) {
                console.log(`[agentTrips] Truck transport ${trip.id}: serviceType="${serviceType}"`);
              }
            }
          }
          if (!serviceType) {
            console.log(`[agentTrips] Could not determine service type for trip ${trip.id}, type: ${tripType}, vehicleType: ${trip.vehicleType}`);
            return false;
          }
          const canHandle = canHandleService(serviceType, trip.vehicleType, trip.vehicleSubType);
          if (isTruckTrip || tripType === 'packers') {
            console.log(`[agentTrips] Trip ${trip.id} (type: ${tripType}) ${canHandle ? 'PASSED' : 'FILTERED OUT'}: serviceType="${serviceType}", agentVehicleType="${agent.vehicleType}", agentServices=${JSON.stringify(agent.servicesOffered)}`);
          }
          return canHandle;
        });
    };
  
    const agentVehicleType = (agent.vehicleType || '').toLowerCase();
    let transportQuery = { status: 'pending' };
    let parcelQuery = { status: 'pending' };
    let packersQuery = { status: 'pending' };

    if (agentVehicleType === 'truck') {
      transportQuery.vehicleType = 'truck';
      parcelQuery.vehicleType = 'truck';
    } else {
      transportQuery.vehicleType = agentVehicleType;
      parcelQuery.vehicleType = agentVehicleType;
      packersQuery.vehicleType = agentVehicleType;
    }

    console.log(`[agentTrips] DB Query: Transport=${JSON.stringify(transportQuery)}, Parcel=${JSON.stringify(parcelQuery)}, Packers=${JSON.stringify(packersQuery)}`);

    const [transportTrips, parcelTrips, packersTrips] = await Promise.all([
      Transport.find(transportQuery).limit(50),
      Parcel.find(parcelQuery).limit(50),
      PackersMove.find(packersQuery).limit(50)
    ]);
    console.log(`[agentTrips] Found ${transportTrips.length} transport, ${parcelTrips.length} parcel, ${packersTrips.length} packers trips`);
    console.log(`[agentTrips] Agent vehicleType: "${agent.vehicleType}", servicesOffered:`, agent.servicesOffered);

    const truckTransportTrips = transportTrips.filter(t => (t.vehicleType || '').toLowerCase() === 'truck');
    const truckParcelTrips = parcelTrips.filter(t => (t.vehicleType || '').toLowerCase() === 'truck');
    console.log(`[agentTrips] Found ${truckTransportTrips.length} truck transport trips and ${truckParcelTrips.length} truck parcel trips`);
    
    if (truckParcelTrips.length > 0 && (agent.vehicleType || '').toLowerCase() === 'truck') {
      console.log(`[agentTrips] Truck parcel trips details:`);
      truckParcelTrips.forEach((trip, idx) => {
        const distance = trip.pickup ? calculateDistance(latitude, longitude, trip.pickup.lat, trip.pickup.lng) : null;
        console.log(`[agentTrips]   Trip ${idx + 1}: id=${trip._id}, vehicleType="${trip.vehicleType}", vehicleSubType="${trip.vehicleSubType}", typeOfDelivery="${trip.typeOfDelivery}", distance=${distance ? distance.toFixed(2) + 'km' : 'N/A'}, hasPickup=${!!trip.pickup}`);
      });
    }

    const transportFormatted = filterAndFormatTrips(transportTrips, 'transport', truckTransportTrips.length);
    const parcelFormatted = filterAndFormatTrips(parcelTrips, 'parcel', truckParcelTrips.length);
    const packersFormatted = filterAndFormatTrips(packersTrips, 'packers', 0);
    
    const allTrips = [
      ...transportFormatted,
      ...parcelFormatted,
      ...packersFormatted
    ];

    console.log(`[agentTrips] After filtering: ${transportFormatted.length} transport, ${parcelFormatted.length} parcel, ${packersFormatted.length} packers trips`);

    const nearbyTrips = allTrips
      .sort((a, b) => {
        const distanceA = calculateDistance(latitude, longitude, a.pickup.lat, a.pickup.lng);
        const distanceB = calculateDistance(latitude, longitude, b.pickup.lat, b.pickup.lng);
        return distanceA - distanceB;
      })
      .slice(0, 20);

    console.log(`[agentTrips] Returning ${nearbyTrips.length} nearby trips for agent`);

    res.json({ 
      success: true,
      trips: nearbyTrips,
      total: nearbyTrips.length,
      agent: {
        id: agent._id,
        vehicleType: agent.vehicleType,
        vehicleSubType: agent.vehicleSubType,
        servicesOffered: agent.servicesOffered
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
    const { id, type } = req.params;
    const agent = req.agent;
    console.log(`[agentTrips] agent ${agent._id} accepting ${type} trip ${id}`);

    let result;
    let updateData = {
      status: 'accepted',
      agentRef: agent._id,
      captainRef: agent._id,
      accepted: true
    };

    let Model;
    switch (type) {
      case 'transport': Model = Transport; break;
      case 'parcel': Model = Parcel; break;
      case 'packers': Model = PackersMove; break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid trip type' });
    }

    result = await Model.findOneAndUpdate(
      { 
        _id: id, 
        status: 'pending',
        $or: [{ agentRef: null }, { captainRef: null }, { agentRef: { $exists: false } }, { captainRef: { $exists: false } }]
      },
      updateData,
      { new: true }
    );

    if (!result) {
      return res.status(400).json({ 
        success: false,
        message: 'Trip not available or already accepted' 
      });
    }

    const pickupOtp = generateOtp();
    const pickupOtpHash = hashOtp(pickupOtp);

    await Model.findByIdAndUpdate(id, { otpPickupHash: pickupOtpHash });

    console.log(`[agentTrips] Trip ${id} accepted by agent ${agent._id}`);
    
    let updatedAgent;
    try {
      const { Agent } = require('../models/Agent');
      updatedAgent = await Agent.findByIdAndUpdate(agent._id, { $inc: { activeTrips: 1 } }, { new: true });
      
      const { getIO } = require('../../utils/socket');
      const io = getIO();
      if (io && updatedAgent?.socketId) {
        io.of('/agent').to(updatedAgent.socketId).emit('stats:updated', {
          activeTrips: updatedAgent.activeTrips
        });
      }
    } catch (e) {
      console.warn('Could not increment activeTrips for agent', e.message);
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
        agentRef: result.agentRef || result.captainRef
     },
      otp: pickupOtp
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
    const agent = req.agent;
    console.log(`[AgentTrips] agent ${agent._id} reached pickup for ${type} trip ${id}`);

    let Model;
    switch (type) {
      case 'transport': Model = Transport; break;
      case 'parcel': Model = Parcel; break;
      case 'packers': Model = PackersMove; break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid trip type' });
    }

    const trip = await Model.findOne({
      _id: id, 
      $or: [{ agentRef: agent._id }, { captainRef: agent._id }],
      status: 'accepted'
    });
    
    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found or invalid status' 
      });
    }

    res.json({ 
      success: true,
      message: 'Reached pickup location. Please verify OTP to start trip.', 
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

// =================================================================
// === CORRECTED FUNCTION: verifyTripOtp ===
// =================================================================
const verifyTripOtp = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { otp, phase } = req.body; // 'otp' will be undefined for 'drop' phase
    const agent = req.agent;

    if (!phase) {
      return res.status(400).json({ 
        success: false,
        message: 'Phase (pickup/drop) is required' 
      });
    }

    console.log(`[AgentTrips] Verifying OTP for ${type} trip ${id}, phase: ${phase}`);

    let Model;
    switch (type) {
      case 'transport': Model = Transport; break;
      case 'parcel': Model = Parcel; break;
      case 'packers': Model = PackersMove; break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid trip type' });
    }

    const trip = await Model.findOne({ 
      _id: id, 
      $or: [{ agentRef: agent._id }, { captainRef: agent._id }]
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // --- PHASE 1: PICKUP (START TRIP) ---
    if (phase === 'pickup') {
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required for pickup' });
      }
      if (trip.status !== 'accepted') {
        return res.status(400).json({ 
          success: false,
          message: `Invalid trip status. Expected 'accepted', got '${trip.status}'` 
        });
      }

      const isValidOtp = verifyOtp(otp, trip.otpPickupHash);
      if (!isValidOtp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      // **THE FIX**: Set status to 'in_transit' and DO NOT calculate earnings.
      const newStatus = 'in_transit'; 
      await Model.findByIdAndUpdate(id, { status: newStatus });

      console.log(`[AgentTrips] Pickup OTP verified. Trip ${id} is now ${newStatus}.`);

      // Respond with success, indicating the trip has started.
      return res.json({ 
        success: true,
        message: 'Trip started successfully!',
        status: newStatus,
        trip: {
          id: trip._id,
          type: type,
          status: newStatus
        }
      });
    }

    // --- PHASE 2: DROP (COMPLETE TRIP) ---
    // This block is run when your app calls with phase: 'drop' (Complete Trip button)
    else if (phase === 'drop') {
      
      // Check if trip is in the correct state to be completed
      if (trip.status !== 'in_transit') {
        if (trip.status === 'delivered' || trip.status === 'completed') {
          console.warn(`[AgentTrips] Trip ${id} is already completed. Sending success.`);
          return res.json({ success: true, message: 'Trip already completed.' });
        }
        // Graceful fallback if agent skipped 'start trip'
        console.warn(`[AgentTrips] Warning: Trip ${id} status was '${trip.status}', expected 'in_transit'. Completing anyway.`);
      }

      // **THE FIX**: Set status to 'delivered' (or 'completed')
      const newStatus = 'delivered'; // Use 'delivered' or 'completed'
      await Model.findByIdAndUpdate(id, { status: newStatus });

      // **THE FIX**: All earnings and Trip record logic is MOVED HERE
      try {
        let serviceType = 'local_parcel';
        if (type === 'transport') {
          if (trip.vehicleType === 'bike') serviceType = 'bike_ride';
          else if (trip.vehicleType === 'cab') serviceType = 'cab_booking';
          else if (trip.vehicleType === 'truck') serviceType = 'intra_truck';
        } else if (type === 'parcel') {
          serviceType = (trip.typeOfDelivery === 'express' || trip.typeOfDelivery === 'all_india') ? 'all_india_parcel' : 'local_parcel';
          if (trip.vehicleType === 'truck') {
            serviceType = (trip.typeOfDelivery === 'express' || trip.typeOfDelivery === 'all_india') ? 'all_india_parcel' : 'intra_truck';
          }
        } else if (type === 'packers') {
          serviceType = 'packers_movers';
        }

        const tripRecord = new Trip({
          userId: trip.userRef?.toString() || 'unknown',
          agentId: agent._id,
          captainId: agent._id,
          serviceType: serviceType,
          vehicleSubType: trip.vehicleSubType,
          pickup: {
            coords: {
              lat: trip.pickup?.lat || trip.pickup?.coords?.lat || 0,
              lng: trip.pickup?.lng || trip.pickup?.coords?.lng || 0,
            },
            address: trip.pickup?.address || 'Unknown pickup address',
          },
          drop: {
            coords: {
              lat: (trip.delivery?.lat || trip.destination?.lat || trip.delivery?.coords?.lat || trip.destination?.coords?.lat || 0),
              lng: (trip.delivery?.lng || trip.destination?.lng || trip.delivery?.coords?.lng || trip.destination?.coords?.lng || 0),
            },
            address: (trip.delivery?.address || trip.destination?.address || 'Unknown delivery address'),
          },
          status: 'completed',
          fare: trip.fareEstimate || trip.fare || 0,
          paymentStatus: 'success', 
        });

        await tripRecord.save();
        console.log(`[AgentTrips] Trip record created for earnings: ${tripRecord._id}`);

        const { Agent } = require('../models/Agent');
        const fare = Number(trip.fareEstimate || trip.fare || 0);
        // Using the 70% cut from your reachedDestination function
        const takeHome = Math.round(fare * 0.7); 
        const updatedAgent = await Agent.findByIdAndUpdate(agent._id, {
          $inc: { activeTrips: -1, todayTrips: 1, todayEarnings: takeHome }
        }, { new: true });
        
        console.log(`[AgentTrips] Agent earnings updated: +₹${takeHome}, total trips: ${updatedAgent.todayTrips}`);
        
        const { getIO } = require('../../utils/socket');
        const io = getIO();
        if (io && updatedAgent?.socketId) {
          io.of('/agent').to(updatedAgent.socketId).emit('stats:updated', {
            todayTrips: updatedAgent.todayTrips,
          todayEarnings: updatedAgent.todayEarnings,
            activeTrips: updatedAgent.activeTrips
          });
        }
      } catch (e) {
        console.warn('Could not create Trip record or update agent earnings/trips', e.message);
      }

      console.log(`[AgentTrips] Drop phase completed for ${type} trip ${id}`);

      return res.json({ 
        success: true,
        message: 'Trip completed successfully! Earnings updated.',
        status: newStatus,
        trip: {
          id: trip._id,
          type: type,
          status: newStatus
        }
      });
    } 
    // --- CATCH INVALID PHASE ---
   else {
      return res.status(400).json({ 
        success: false,
        message: `Invalid phase specified: '${phase}'` 
      });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};


// =================================================================
// === DEPRECATED FUNCTION: reachedDestination ===
// =================================================================
const reachedDestination = async (req, res) => {
s   // This function is no longer called by your frontend.
  // The logic has been moved to verifyTripOtp({ phase: 'drop' })
  console.warn(`[AgentTrips] DEPRECATED: reachedDestination was called for trip ${req.params.id}. This logic is now in verifyOtp(phase: 'drop').`);
  
  return res.status(410).json({ // 410 Gone
    success: false,
    message: 'This endpoint is deprecated. The client app should call verifyOtp with phase: "drop" to complete the trip.'
  });
};

const resendOtp = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { phase } = req.body;
    const agent = req.agent;

    if (!phase) {
      return res.status(400).json({ success: false, message: 'Phase is required' });
    }
    console.log(`[AgentTrips] Resending OTP for ${type} trip ${id}, phase: ${phase}`);

    let Model;
    switch (type) {
      case 'transport': Model = Transport; break;
      case 'parcel': Model = Parcel; break;
      case 'packers': Model = PackersMove; break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid trip type' });
    }

    const trip = await Model.findOne({ 
      _id: id, 
      $or: [{ agentRef: agent._id }, { captainRef: agent._id }]
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const newOtp = generateOtp();
    const newOtpHash = hashOtp(newOtp);

    if (phase !== 'pickup') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pickup OTP resend is supported.' 
      });
    }

    await Model.findByIdAndUpdate(id, { otpPickupHash: newOtpHash });
    console.log(`[AgentTrips] OTP resent for ${type} trip ${id}, phase: ${phase}`);
  
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
  verifyOtp: verifyTripOtp, // This is the main function your app uses
  reachedDestination,   // This is now deprecated
  resendOtp
};