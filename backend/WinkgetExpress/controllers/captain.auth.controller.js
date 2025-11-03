const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Agent } = require('../models/Agent.js');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp.helpers');
const { getValidServicesForVehicle, validateServicesForVehicle } = require('../utils/captain.validators');

const signupCaptain = async (req, res) => {
  let agentId = null; // Track if agent was saved to rollback on error
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

    // Check if agent already exists
    const existingAgent = await Agent.findOne({ phone });
    if (existingAgent) {
      return res.status(400).json({ message: 'Agent with this phone number already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique email from phone to avoid null email conflicts
    const email = `agent_${phone}@winkget.com`;
    const licenseNumber = `LIC${phone}`;
    const vehicleNumber = `VH${phone}`;

    // Create agent
    const agent = new Agent({
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
        coordinates: [0, 0] // Default location, will be updated when agent goes online
      }
    });

    await agent.save();
    agentId = agent._id; // Mark that agent was saved

    // Generate JWT token
    const token = jwt.sign(
      { agentId: agent._id, role: 'agent' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Agent registered successfully',
      token,
      agent: {
        id: agent._id,
        name: agent.name,
        city: agent.city,
        phone: agent.phone,
        vehicleType: agent.vehicleType,
        vehicleSubType: agent.vehicleSubType,
        servicesOffered: agent.servicesOffered,
        isApproved: agent.isApproved
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Rollback: Delete agent if it was created
    if (agentId) {
      try {
        await Agent.findByIdAndDelete(agentId);
        console.log(`[ROLLBACK] Deleted agent ${agentId} due to signup error`);
      } catch (deleteError) {
        console.error('[ROLLBACK] Failed to delete agent after signup error:', deleteError);
      }
    }
    
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const agent = await Agent.findOne({ phone });
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    // Store OTP hash in agent document (you might want to add an otpHash field)
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

    const agent = await Agent.findOne({ phone });
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // For now, we'll simulate OTP verification
    // In a real implementation, you'd verify against stored hash
    if (otp.length !== 6) {
      return res.status(400).json({ message: 'Invalid OTP format' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { agentId: agent._id, role: 'agent' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      agent: {
        id: agent._id,
        name: agent.name,
        city: agent.city,
        phone: agent.phone,
        vehicleType: agent.vehicleType,
        vehicleSubType: agent.vehicleSubType,
        servicesOffered: agent.servicesOffered,
        isActive: agent.isActive
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

    const agent = await Agent.findOne({ phone });
    if (!agent) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, agent.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { agentId:agent._id, role: 'agent' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      agent: {
        id: agent._id,
        name: agent.name,
        city: agent.city,
        phone: agent.phone,
        vehicleType: agent.vehicleType,
        vehicleSubType: agent.vehicleSubType,
        servicesOffered: agent.servicesOffered,
        isActive: agent.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const agent = req.agent;
    
    res.json({
      id:agent._id,
      name:agent.name,
      city:agent.city,
      phone:agent.phone,
      vehicleType:agent.vehicleType,
      vehicleSubType:agent.vehicleSubType,
      servicesOffered:agent.servicesOffered,
      isActive:agent.isActive,
      isApproved:agent.isApproved,
      rating:agent.rating,
      totalTrips:agent.totalTrips,
      // document URLs
      drivingLicenseUrl:agent.drivingLicenseUrl || null,
      aadharCardUrl:agent.aadharCardUrl || null,
      vehicleRegistrationUrl:agent.vehicleRegistrationUrl || null,
      insuranceUrl:agent.insuranceUrl || null,
      driverVehiclePhotoUrl:agent.driverVehiclePhotoUrl || null
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

