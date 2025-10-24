const mongoose = require('mongoose');
const { Schema } = mongoose;

const tripSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  captainId: {
    type: Schema.Types.ObjectId,
    ref: 'Captain',
  },
  serviceType: {
    type: String,
    required: true,
    enum: [
      'local_parcel',
      'intra_truck',
      'all_india_parcel', 
      'cab_booking',
      'bike_ride',
      'packers_movers'
    ],
  },
  vehicleSubType: {
    type: String,
  },
  pickup: {
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    address: { type: String, required: true },
  },
  drop: {
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    address: { type: String, required: true },
  },
  status: {
    type: String,
    enum: [
      'pending_assignment',
      'assigned', 
      'accepted',
      'payment_confirmed',
      'enroute_pickup',
      'at_pickup',
      'enroute_drop',
      'at_destination',
      'completed',
      'cancelled'
    ],
    default: 'pending_assignment',
  },
  otpPickupHash: {
    type: String,
  },
  otpDropHash: {
    type: String,
  },
  sessionId: {
    type: String,
  },
  fare: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = { Trip };

