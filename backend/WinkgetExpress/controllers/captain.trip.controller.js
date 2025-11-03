const Transport = require('../models/Transport');
const Parcel = require('../models/Parcel');
const PackersMove = require('../models/PackersMove');
const { Trip } = require('../models/Trip.model');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp.helpers');

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
    // *** THIS FUNCTION HAS BEEN CORRECTED ***
    const canHandleService = (serviceType, vehicleType, vehicleSubType) => {
      // 1. Check if agent offers this service
      if (!agent.servicesOffered || !agent.servicesOffered.includes(serviceType)) {
        console.log(`[agentTrips] Agent does not offer service "${serviceType}". Agent services:`, agent.servicesOffered);
        return false;
      }

      const agentVehicleType = (agent.vehicleType || '').toLowerCase();

      // 2. (FIX) Allow truck agents to handle packers/movers regardless of trip's vehicleType
      if (serviceType === 'packers_movers' && agentVehicleType === 'truck') {
        console.log(`[agentTrips] Truck agent handling 'packers_movers' trip. Skipping vehicle type check.`);
        return true;
      }

      // 3. Check if agent's vehicle type matches trip's vehicle type
      const tripVehicleType = (vehicleType || '').toLowerCase();
      if (agentVehicleType !== tripVehicleType) {
        // Only log mismatches for truck agents to reduce noise
        if (agentVehicleType === 'truck') {
          console.log(`[agentTrips] Vehicle type mismatch: agent has "${agent.vehicleType}", trip requires "${vehicleType}"`);
        }
        return false;
      }
      
      // 4. Check vehicle subtype (optional)
      if (vehicleSubType && agent.vehicleSubType && agent.vehicleSubType !== vehicleSubType) {
        console.log(`[agentTrips] Vehicle subtype mismatch: agent has "${agent.vehicleSubType}", trip requires "${vehicleSubType}"`);
        // Don't return false - allow matching if vehicle type matches
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
          // First filter: Only process trips that match agent's vehicle type OR trips that might be relevant
          // For truck agents, also allow packers trips (packers can be trucks)
          const tripVehicleType = (trip.vehicleType || '').toLowerCase();
          
          // Debug logging for truck trips
          const isTruckTripRaw = tripVehicleType === 'truck';
          if (isTruckTripRaw && agentVehicleType === 'truck') {
            truckTripsProcessed++;
            const counter = totalTruckTripsInType > 0 ? `[${truckTripsProcessed}/${totalTruckTripsInType}]` : `[${truckTripsProcessed}]`;
            console.log(`[agentTrips] PRE-FILTER ${counter}: Truck trip ${trip._id?.toString() || 'unknown'}: vehicleType="${trip.vehicleType}", type="${tripType}"`);
          }
          
          // Skip trips with invalid/unknown vehicle types
          if (!tripVehicleType || tripVehicleType === 'undefined' || tripVehicleType === 'admin' || tripVehicleType === 'auto') {
            if (isTruckTripRaw && agentVehicleType === 'truck') {
              console.log(`[agentTrips] PRE-FILTER: Truck trip ${trip._id} rejected - invalid vehicleType: "${trip.vehicleType}"`);
            }
            return false;
          }
          
          // For truck agents: process truck trips and packers trips
          // For other agents: process matching vehicle types
          if (agentVehicleType === 'truck') {
            if (tripVehicleType !== 'truck' && tripType !== 'packers') {
              return false; // Skip non-truck trips for truck agents (except packers)
            }
          } else {
            if (tripVehicleType !== agentVehicleType) {
              return false; // Skip non-matching vehicle types
            }
          }
          
          // Second filter: Distance check
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
          // Service-specific fields
          ...(tripType === 'parcel' && {
            package: trip.package,
            receiverName: trip.receiverName,
            receiverContact: trip.receiverContact,
            typeOfDelivery: trip.typeOfDelivery // Include this for service type mapping
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
        .filter(trip => {
          // Determine service type based on trip type and vehicle type
          let serviceType = '';
          const tripVehicleType = (trip.vehicleType || '').toLowerCase();
          
          // Detailed logging for truck trips
          const isTruckTrip = tripVehicleType === 'truck';
          if (isTruckTrip) {
            console.log(`[agentTrips] Processing truck trip ${trip.id}: type=${tripType}, vehicleType="${trip.vehicleType}", vehicleSubType="${trip.vehicleSubType}", typeOfDelivery="${trip.typeOfDelivery}"`);
          }
          
          if (tripType === 'parcel') {
            // For parcel trips, service type depends on vehicle type and delivery type
            if (tripVehicleType === 'truck') {
              // Truck parcels: 'intra_truck' for standard, 'all_india_parcel' for express
              // Handle undefined/null typeOfDelivery - default to 'standard'
              const deliveryType = (trip.typeOfDelivery || 'standard').toLowerCase();
              serviceType = deliveryType === 'express' ? 'all_india_parcel' : 'intra_truck';
              if (isTruckTrip) {
                console.log(`[agentTrips] Truck parcel ${trip.id}: typeOfDelivery="${trip.typeOfDelivery}" -> "${deliveryType}" -> serviceType="${serviceType}"`);
              }
            } else {
              // Bike/cab parcels are local_parcel or all_india_parcel
              const deliveryType = (trip.typeOfDelivery || 'standard').toLowerCase();
              serviceType = deliveryType === 'express' ? 'all_india_parcel' : 'local_parcel';
            }
          } else if (tripType === 'packers') {
            serviceType = 'packers_movers';
          } else if (tripType === 'transport') {
            // For transport trips, map vehicle type to service type
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
          if (isTruckTrip || tripType === 'packers') { // Log for trucks AND packers
            console.log(`[agentTrips] Trip ${trip.id} (type: ${tripType}) ${canHandle ? 'PASSED' : 'FILTERED OUT'}: serviceType="${serviceType}", agentVehicleType="${agent.vehicleType}", agentServices=${JSON.stringify(agent.servicesOffered)}`);
          }
          
          return canHandle;
        });
    };


  
    // Build database queries based on agent's vehicle type
    const agentVehicleType = (agent.vehicleType || '').toLowerCase(); // 'truck'

    let transportQuery = { status: 'pending' };
    let parcelQuery = { status: 'pending' };
    let packersQuery = { status: 'pending' };

    if (agentVehicleType === 'truck') {
      // Truck agents see 'truck' transport, 'truck' parcels, and ALL packers
      transportQuery.vehicleType = 'truck';
      parcelQuery.vehicleType = 'truck';
      // packersQuery remains { status: 'pending' }
    } else {
      // Other agents only see trips matching their vehicle type
      transportQuery.vehicleType = agentVehicleType;
      parcelQuery.vehicleType = agentVehicleType;
      packersQuery.vehicleType = agentVehicleType;
    }

    console.log(`[agentTrips] DB Query: Transport=${JSON.stringify(transportQuery)}, Parcel=${JSON.stringify(parcelQuery)}, Packers=${JSON.stringify(packersQuery)}`);

    // Search across all models using the new queries
    const [transportTrips, parcelTrips, packersTrips] = await Promise.all([
      Transport.find(transportQuery).limit(50),
      Parcel.find(parcelQuery).limit(50),
      PackersMove.find(packersQuery).limit(50)
    ]);
    console.log(`[agentTrips] Found ${transportTrips.length} transport, ${parcelTrips.length} parcel, ${packersTrips.length} packers trips`);
    console.log(`[agentTrips] Agent vehicleType: "${agent.vehicleType}", servicesOffered:`, agent.servicesOffered);

    // Log truck trips specifically for debugging
    // We can remove this block since the query does the filtering, but it's good for logging
    const truckTransportTrips = transportTrips.filter(t => (t.vehicleType || '').toLowerCase() === 'truck');
    const truckParcelTrips = parcelTrips.filter(t => (t.vehicleType || '').toLowerCase() === 'truck');
    console.log(`[agentTrips] Found ${truckTransportTrips.length} truck transport trips and ${truckParcelTrips.length} truck parcel trips`);
    
    // Debug: Log details of truck parcel trips
    if (truckParcelTrips.length > 0 && (agent.vehicleType || '').toLowerCase() === 'truck') {
      console.log(`[agentTrips] Truck parcel trips details:`);
      truckParcelTrips.forEach((trip, idx) => {
        const distance = trip.pickup ? calculateDistance(latitude, longitude, trip.pickup.lat, trip.pickup.lng) : null;
        console.log(`[agentTrips]   Trip ${idx + 1}: id=${trip._id}, vehicleType="${trip.vehicleType}", vehicleSubType="${trip.vehicleSubType}", typeOfDelivery="${trip.typeOfDelivery}", distance=${distance ? distance.toFixed(2) + 'km' : 'N/A'}, hasPickup=${!!trip.pickup}`);
     });
    }

    // Filter and format all trips (pass total truck trips count for better logging)
    const transportFormatted = filterAndFormatTrips(transportTrips, 'transport', truckTransportTrips.length);
    const parcelFormatted = filterAndFormatTrips(parcelTrips, 'parcel', truckParcelTrips.length);
    const packersFormatted = filterAndFormatTrips(packersTrips, 'packers', 0); // Packers count is less critical here
    
    const allTrips = [
      ...transportFormatted,
      ...parcelFormatted,
      ...packersFormatted
    ];

    console.log(`[agentTrips] After filtering: ${transportFormatted.length} transport, ${parcelFormatted.length} parcel, ${packersFormatted.length} packers trips`);

    // Sort by distance and limit results
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
    const { id, type } = req.params; // type: 'transport', 'parcel', 'packers'
    const agent = req.agent;

    console.log(`[agentTrips] agent ${agent._id} accepting ${type} trip ${id}`);

    let result;
    let updateData = {
      status: 'accepted',
      agentRef: agent._id,
      captainRef: agent._id, // Set both for backward compatibility during migration
      accepted: true
    };

    // Handle different model types - check both agentRef and captainRef for null
    switch (type) {
      case 'transport':
        result = await Transport.findOneAndUpdate(
          { 
            _id: id, 
            status: 'pending',
            $or: [{ agentRef: null }, { captainRef: null }, { agentRef: { $exists: false } }, { captainRef: { $exists: false } }]
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
            $or: [{ agentRef: null }, { captainRef: null }, { agentRef: { $exists: false } }, { captainRef: { $exists: false } }]
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
            $or: [{ agentRef: null }, { captainRef: null }, { agentRef: { $exists: false } }, { captainRef: { $exists: false } }]
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

    // Generate OTP for pickup only (trip completes when pickup OTP is verified)
    const pickupOtp = generateOtp();
    const pickupOtpHash = hashOtp(pickupOtp);

    // Update trip with OTP hash (if the model supports it)
    const otpUpdateData = {
      otpPickupHash: pickupOtpHash
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

    console.log(`[agentTrips] Trip ${id} accepted by agent ${agent._id}`);
    // Increment active trips counter for agent
    let updatedAgent;
    try {
      const { Agent } = require('../models/Agent');
      updatedAgent = await Agent.findByIdAndUpdate(agent._id, { $inc: { activeTrips: 1 } }, { new: true });
      
      // Emit stats update to agent via socket
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

    let trip;
    // Don't change status - just confirm agent reached pickup
    // Status will change to 'in_transit' when OTP is verified

    // Handle different model types
    switch (type) {
      case 'transport':
        trip = await Transport.findOne({
          _id: id, 
          $or: [{ agentRef: agent._id }, { captainRef: agent._id }], // Support both for migration
          status: 'accepted'
        });
        break;
      
      case 'parcel':
        trip = await Parcel.findOne({
          _id: id, 
          $or: [{ agentRef: agent._id }, { captainRef: agent._id }], // Support both for migration
          status: 'accepted'
        });
        break;
      
      case 'packers':
        trip = await PackersMove.findOne({
          _id: id, 
          $or: [{ agentRef: agent._id }, { captainRef: agent._id }], // Support both for migration
        status: 'accepted'
        });
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
      message: 'Reached pickup location. Please verify OTP to start trip.', 
      trip: {
        id: trip._id,
        type: type,
        status: trip.status, // Keep status as 'accepted'
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
    const agent = req.agent;

    if (!otp || !phase) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP and phase are required' 
      });
    }

    console.log(`[AgentTrips] Verifying OTP for ${type} trip ${id}, phase: ${phase}`);

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
      $or: [{ agentRef: agent._id }, { captainRef: agent._id }] // Support both for migration
    });

    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found' 
      });
    }

    // Only pickup OTP verification is supported (trip completes when OTP is verified)
    if (phase !== 'pickup') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pickup OTP verification is supported. Trip completes when pickup OTP is verified.' 
      });
    }

    // Verify pickup OTP - trip should be in 'accepted' status
    if (trip.status !== 'accepted') {
      return res.status(400).json({ 
        success: false,
        message: `Invalid trip status. Expected 'accepted', got '${trip.status}'` 
      });
    }

    // DEV MODE: Allow OTP verification without checking hash
    const isValidOtp = verifyOtp(otp, trip.otpPickupHash);

    if (!isValidOtp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please enter a 4-digit number.' 
      });
    }

    // *** NOTE ON LOGIC ***
    // You are moving the status from 'accepted' directly to 'delivered'.
    // This skips the 'in_transit' status, which your `reachedDestination`
    // function below seems to expect. Please review if this is your intended flow.
    const newStatus = 'delivered'; 
    await Model.findByIdAndUpdate(id, { status: newStatus });

    // Create Trip record and update earnings when pickup OTP is verified (trip completes)
    try {
      // Map service type based on trip type
      let serviceType = 'local_parcel';
      if (type === 'transport') {
        if (trip.vehicleType === 'bike') serviceType = 'bike_ride';
        else if (trip.vehicleType === 'cab') serviceType = 'cab_booking';
        else if (trip.vehicleType === 'truck') serviceType = 'intra_truck';
      } else if (type === 'parcel') {
        serviceType = trip.typeOfDelivery === 'express' ? 'all_india_parcel' : 'local_parcel';
      } else if (type === 'packers') {
        serviceType = 'packers_movers';
      }

      // Create Trip record for earnings calculation
      const tripRecord = new Trip({
        userId: trip.userRef?.toString() || 'unknown',
        agentId: agent._id,
        captainId: agent._id, // For backward compatibility
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
        paymentStatus: 'success', // Assume payment is successful when trip is completed
      });

      await tripRecord.save();
      console.log(`[AgentTrips] Trip record created for earnings: ${tripRecord._id}`);

      // Update agent counters: decrement activeTrips, increment todayTrips and todayEarnings (70% of fare)
      const { Agent } = require('../models/Agent');
      const fare = Number(trip.fareEstimate || trip.fare || 0);
      const takeHome = Math.round(fare * 0.7);
      const updatedAgent = await Agent.findByIdAndUpdate(agent._id, {
        $inc: { activeTrips: -1, todayTrips: 1, todayEarnings: takeHome }
      }, { new: true });
      
      console.log(`[AgentTrips] Agent earnings updated: +₹${takeHome}, total trips: ${updatedAgent.todayTrips}`);
      
      // Emit stats update to agent via socket
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
      // Don't fail the request if Trip record creation fails
    }

    console.log(`[AgentTrips] Pickup OTP verified and trip completed for ${type} trip ${id}`);

    res.json({ 
      success: true,
      message: 'Trip completed successfully! Earnings updated.',
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
    const agent = req.agent;

    console.log(`[AgentTrips] agent ${agent._id} reached destination for ${type} trip ${id}`);

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

    // *** NOTE ON LOGIC ***
    // This query looks for 'in_transit' status, but your verifyTripOtp
    // function seems to skip 'in_transit' and go directly to 'delivered'.
    // This function may fail to find trips as a result.
    trip = await Model.findOneAndUpdate(
      { 
        _id: id, 
        $or: [{ agentRef: agent._id }, { captainRef: agent._id }], // Support both for migration
        status: 'in_transit'
      },
      { status: 'delivered' },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found or invalid status (expected in_transit)' 
      });
    }

    console.log(`[AgentTrips] Trip ${id} reached destination by agent ${agent._id}`);
    
    // Create Trip record and update earnings (same as drop OTP verification)
    try {
      // Map service type based on trip type
      let serviceType = 'local_parcel';
      if (type === 'transport') {
        if (trip.vehicleType === 'bike') serviceType = 'bike_ride';
        else if (trip.vehicleType === 'cab') serviceType = 'cab_booking';
        else if (trip.vehicleType === 'truck') serviceType = 'intra_truck';
      } else if (type === 'parcel') {
        serviceType = trip.typeOfDelivery === 'express' ? 'all_india_parcel' : 'local_parcel';
      } else if (type === 'packers') {
        serviceType = 'packers_movers';
      }

      // Create Trip record for earnings calculation
      const tripRecord = new Trip({
         userId: trip.userRef?.toString() || 'unknown',
        agentId: agent._id,
        captainId: agent._id, // For backward compatibility
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

      // Update agent counters: decrement activeTrips, increment todayTrips and todayEarnings (70% of fare)
      const { Agent } = require('../models/Agent');
      const fare = Number(trip.fareEstimate || trip.fare || 0);
      const takeHome = Math.round(fare * 0.7);
      const updatedAgent = await Agent.findByIdAndUpdate(agent._id, {
        $inc: { activeTrips: -1, todayTrips: 1, todayEarnings: takeHome }
      }, { new: true });
      
      console.log(`[AgentTrips] Agent earnings updated: +₹${takeHome}, total trips: ${updatedAgent.todayTrips}`);
      
      // Emit stats update to agent via socket
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
A     // Don't fail the request if Trip record creation fails
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
    const agent = req.agent;

    if (!phase) {
      return res.status(400).json({ 
        success: false,
         message: 'Phase is required' 
      });
    }

    console.log(`[AgentTrips] Resending OTP for ${type} trip ${id}, phase: ${phase}`);

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
      $or: [{ agentRef: agent._id }, { captainRef: agent._id }] // Support both for migration
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

    // Only pickup OTP is supported
    if (phase !== 'pickup') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pickup OTP resend is supported.' 
      });
    }

    // Update trip with new OTP hash
    await Model.findByIdAndUpdate(id, { otpPickupHash: newOtpHash });

    console.log(`[AgentTrips] OTP resent for ${type} trip ${id}, phase: ${phase}`);
img
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