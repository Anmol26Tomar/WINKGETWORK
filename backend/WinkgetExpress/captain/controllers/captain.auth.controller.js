const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Captain } = require('../models/Captain.model');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp.helpers');
const { getValidServicesForVehicle, validateServicesForVehicle } = require('../utils/captain.validators');

const signupCaptain = async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    const { fullName, phone, password, vehicleType, vehicleSubType, servicesOffered, city } = req.body;
    // Validate required fields
    if (!fullName || !phone || !password || !vehicleType || !servicesOffered || !city) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate services based on vehicle type
    if (!validateServicesForVehicle(vehicleType, servicesOffered)) {
      return res.status(400).json({ 
        message: 'Invalid services for vehicle type',
        validServices: getValidServicesForVehicle(vehicleType)
      });
    }

    // Check if captain already exists
    const existingCaptain = await Captain.findOne({ phone });
    if (existingCaptain) {
      return res.status(400).json({ message: 'Captain with this phone number already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique email from phone to avoid null email conflicts
    const email = `captain_${phone}@winkget.com`;
    const licenseNumber = `LIC${phone}`;
    const vehicleNumber = `VH${phone}`;

    // Create captain
    const captain = new Captain({
      name:fullName,
      email,
      licenseNumber,
      vehicleNumber,
      phone,
      city,
      passwordHash,
      vehicleType,
      vehicleSubType,
      servicesOffered,
      location: {
        type: 'Point',
        coordinates: [0, 0] // Default location, will be updated when captain goes online
      }
    });

    await captain.save();

    // Generate JWT token
    const token = jwt.sign(
      { captainId: captain._id, role: 'captain' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Captain registered successfully',
      token,
      captain: {
        id: captain._id,
        name: captain.name,
        city: captain.city,
        phone: captain.phone,
        vehicleType: captain.vehicleType,
        vehicleSubType: captain.vehicleSubType,
        servicesOffered: captain.servicesOffered,
        isApproved: captain.isApproved
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const captain = await Captain.findOne({ phone });
    if (!captain) {
      return res.status(404).json({ message: 'Captain not found' });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    // Store OTP hash in captain document (you might want to add an otpHash field)
    // For now, we'll simulate sending the OTP
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyOtpAndLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const captain = await Captain.findOne({ phone });
    if (!captain) {
      return res.status(404).json({ message: 'Captain not found' });
    }

    // For now, we'll simulate OTP verification
    // In a real implementation, you'd verify against stored hash
    if (otp.length !== 6) {
      return res.status(400).json({ message: 'Invalid OTP format' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { captainId: captain._id, role: 'captain' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      captain: {
        id: captain._id,
        name: captain.name,
        city: captain.city,
        phone: captain.phone,
        vehicleType: captain.vehicleType,
        vehicleSubType: captain.vehicleSubType,
        servicesOffered: captain.servicesOffered,
        isActive: captain.isActive
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const loginWithPassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const captain = await Captain.findOne({ phone });
    if (!captain) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, captain.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { captainId: captain._id, role: 'captain' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      captain: {
        id: captain._id,
        name: captain.name,
        city: captain.city,
        phone: captain.phone,
        vehicleType: captain.vehicleType,
        vehicleSubType: captain.vehicleSubType,
        servicesOffered: captain.servicesOffered,
        isActive: captain.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const captain = req.captain;
    
    res.json({
      id: captain._id,
      name: captain.name,
      city: captain.city,
      phone: captain.phone,
      vehicleType: captain.vehicleType,
      vehicleSubType: captain.vehicleSubType,
      servicesOffered: captain.servicesOffered,
      isActive: captain.isActive,
      isApproved: captain.isApproved,
      rating: captain.rating,
      totalTrips: captain.totalTrips,
      // document URLs
      drivingLicenseUrl: captain.drivingLicenseUrl || null,
      aadharCardUrl: captain.aadharCardUrl || null,
      vehicleRegistrationUrl: captain.vehicleRegistrationUrl || null,
      insuranceUrl: captain.insuranceUrl || null,
      driverVehiclePhotoUrl: captain.driverVehiclePhotoUrl || null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  signupCaptain,
  requestOtp,
  verifyOtpAndLogin,
  loginWithPassword,
  getProfile
};

