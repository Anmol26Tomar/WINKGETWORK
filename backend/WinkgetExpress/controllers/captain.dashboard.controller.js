const { Trip } = require('../models/Trip.model');

const startOfToday = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d;
};
const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0,0,0,0); return d;
};
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; };

async function computeRange(agentId, from) {
  // Support both agentId and captainId for backward compatibility
  const match = { 
    $or: [{ agentId }, { captainId: agentId }],
    createdAt: { $gte: from } 
  };
  const trips = await Trip.find(match).select('fare status paymentStatus');
  const completed = trips.filter(t => t.status === 'completed');
  const earnings = completed
    .filter(t => t.paymentStatus === 'success')
    .reduce((sum, t) => sum + (t.fare || 0) * 0.7, 0);
  return { tripsCompleted: completed.length, earnings };
}

exports.getStats = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const today = await computeRange(agentId, startOfToday());
    const week = await computeRange(agentId, startOfWeek());
    const month = await computeRange(agentId, startOfMonth());

    // Prefer counters on agent if available for "today" (fast, immediate),
    // fall back to computed if not present
    res.json({
      earnings: typeof req.agent.todayEarnings === 'number' ? req.agent.todayEarnings : today.earnings,
      todayTrips: typeof req.agent.todayTrips === 'number' ? req.agent.todayTrips : today.tripsCompleted,
      rating: req.agent.rating || 0,
      weekEarnings: week.earnings,
      monthEarnings: month.earnings,
      activeTrips: req.agent.activeTrips || 0,
    });
  } catch (e) {
    console.error('getStats error', e);
    res.json({ earnings: 0, todayTrips: 0, rating: req.agent?.rating || 0 });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const today = await computeRange(agentId, startOfToday());
    const week = await computeRange(agentId, startOfWeek());
    const month = await computeRange(agentId, startOfMonth());
    // Support both agentId and captainId for backward compatibility
    const totalTrips = await Trip.find({ 
      $or: [{ agentId }, { captainId: agentId }],
      status: 'completed', 
      paymentStatus: 'success' 
    }).select('fare');
    const total = totalTrips.reduce((s, t) => s + (t.fare || 0) * 0.7, 0);
    res.json({ today: today.earnings, week: week.earnings, month: month.earnings, total });
  } catch (e) {
    console.error('getEarnings error', e);
    res.json({ today: 0, week: 0, month: 0, total: 0 });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const agentId = req.agent._id;
    // Support both agentId and captainId for backward compatibility
    const trips = await Trip.find({ 
      $or: [{ agentId }, { captainId: agentId }],
      status: 'completed', 
      paymentStatus: 'success' 
    })
      .sort({ createdAt: -1 }).limit(50).select('_id fare createdAt');
    const txns = trips.map(t => ({ tripId: String(t._id).slice(-6), amount: Math.round((t.fare || 0) * 0.7), date: t.createdAt }));
    res.json(txns);
  } catch (e) {
    console.error('getTransactions error', e);
    res.json([]);
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const agentId = req.agent._id;
    // Support both agentId and captainId for backward compatibility
    const trips = await Trip.find({ 
      $or: [{ agentId }, { captainId: agentId }],
      status: 'completed', 
      paymentStatus: 'success' 
    }).select('fare');
    const balance = trips.reduce((s, t) => s + (t.fare || 0) * 0.7, 0);
    res.json({ balance, transfersLeft: 3 });
  } catch (e) {
    console.error('getWalletBalance error', e);
    res.json({ balance: 0, transfersLeft: 3 });
  }
};

exports.getAllTrips = async (req, res) => {
  try {
    const agentId = req.agent._id;
    // Support both agentId and captainId for backward compatibility
    const trips = await Trip.find({ 
      $or: [{ agentId }, { captainId: agentId }],
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .select('_id fare createdAt pickup drop status paymentStatus');
    
    // Format trips for frontend
    const formattedTrips = trips.map(trip => ({
      _id: trip._id,
      fare: trip.fare || 0,
      createdAt: trip.createdAt,
      status: trip.status === 'completed' ? 'COMPLETED' : trip.status,
      pickupLocation: {
        address: trip.pickup?.address || 'Unknown pickup location',
        lat: trip.pickup?.coords?.lat,
        lng: trip.pickup?.coords?.lng
      },
      dropoffLocation: {
        address: trip.drop?.address || 'Unknown dropoff location',
        lat: trip.drop?.coords?.lat,
        lng: trip.drop?.coords?.lng
      }
    }));
    
    res.json({ 
      success: true,
      data: formattedTrips,
      total: formattedTrips.length
    });
  } catch (e) {
    console.error('getAllTrips error', e);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching trips',
      data: []
    });
  }
};



