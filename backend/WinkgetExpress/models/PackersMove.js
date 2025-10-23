const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const itemsSchema = new mongoose.Schema(
  {
    // key: itemId, value: quantity
  },
  { _id: false, strict: false }
);

const packersMoveSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickup: { type: pointSchema, required: true },
    delivery: { type: pointSchema, required: true },
    receiverName: { type: String, required: true, trim: true },
    receiverContact: { type: String, required: true, trim: true },
    receiverAddress: { type: String, trim: true },
    additionalNotes: { type: String, trim: true },
    selectedItems: { type: itemsSchema, default: () => ({}) },
    fareEstimate: { type: Number, required: true },
    distanceKm: { type: Number, default: 0 },
    serviceType: { type: String, default: 'Packers & Movers' },
    status: { type: String, enum: ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'], default: 'pending' },
    accepted: { type: Boolean, default: false },
    captainRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('PackersMove', packersMoveSchema);


