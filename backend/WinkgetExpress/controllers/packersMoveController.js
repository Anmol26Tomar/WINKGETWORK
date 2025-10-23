const mongoose = require('mongoose');
const PackersMove = require('../models/PackersMove');

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function estimateFare(distanceKm, selectedItems = {}) {
  const base = 2000;
  const itemCount = Object.values(selectedItems || {}).reduce((s, n) => s + Number(n || 0), 0);
  const itemFare = itemCount * 150;
  const distanceFare = (distanceKm || 0) * 25;
  return Math.round((base + itemFare + distanceFare) * 100) / 100;
}

async function estimate(req, res) {
  try {
    const { pickup, delivery, selectedItems } = req.body;
    if (!pickup?.lat || !pickup?.lng || !delivery?.lat || !delivery?.lng) {
      return res.status(400).json({ message: 'Missing coordinates' });
    }
    const km = haversineKm(pickup, delivery);
    const fare = estimateFare(km, selectedItems);
    return res.json({ distanceKm: km, fare });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function create(req, res) {
  try {
    const { pickup, delivery, receiverName, receiverContact, receiverAddress, additionalNotes, selectedItems, fareEstimate } = req.body;
    if (!pickup || !delivery || !receiverName || !receiverContact || fareEstimate == null) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const distanceKm = haversineKm(pickup, delivery);
    const doc = await PackersMove.create({
      userRef: req.user.id,
      pickup,
      delivery,
      receiverName,
      receiverContact,
      receiverAddress,
      additionalNotes,
      selectedItems: selectedItems || {},
      fareEstimate,
      distanceKm,
      status: 'pending',
      accepted: false,
    });
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getById(req, res) {
  try {
    const booking = await PackersMove.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Not found' });
    if (booking.userRef.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getHistory(req, res) {
  try {
    const bookings = await PackersMove.find({ userRef: req.user.id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const booking = await PackersMove.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Not found' });
    if (booking.userRef.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    booking.status = status;
    if (status === 'accepted') booking.accepted = true;
    await booking.save();
    return res.json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { estimate, create, getById, getHistory, updateStatus };


