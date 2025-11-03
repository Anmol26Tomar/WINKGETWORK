const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Agent = require("../models/Agent");
const Superadmin = require("../models/Superadmin");
const ExpressAdmin = require("../models/ExpressAdmin");

async function register(req, res) {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      address,
      role: "user",
      lastLogin: new Date(),
      loginCount: 1,
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    // Send success response with token and user data
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    console.log(email);
    console.log(password);

    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const user = await User.findOne({ email });
    console.log(user);

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // Update login tracking
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      $inc: { loginCount: 1 },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        businessAccess: user.businessAccess,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function profile(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate(
        "businessAccess.businessId",
        "name slug category logo primaryColor"
      );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update user profile
async function updateProfile(req, res) {
  try {
    const { name, phone, address, preferences } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (preferences)
      updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
// captain controller

// Signup
// Signup
async function CaptainSignup(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      city,
      vehicleType,
      serviceType,
      password,
      confirmPassword,
      vehicleSubType,
    } = req.body;

    // Check required fields
    if (
      !fullName ||
      !email ||
      !phone ||
      !city ||
      !vehicleType ||
      !serviceType ||
      !password ||
      !confirmPassword
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res
        .status(400)
        .json({ success: false, message: "Agent already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await Agent.create({
      fullName,
      email,
      phone,
      city,
      vehicleType,
      serviceType,
      password: hashedPassword,
      vehicleSubType,
      approved: false, // Default to false, requires admin approval
    });

    const agentData = agent.toObject();
    delete agentData.password;

    return res.status(201).json({
      success: true,
      message:
        "Registration successful! Your account is pending admin approval. You will be notified once approved.",
      agent: agentData,
      approved: false,
      requiresApproval: true,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// Login
async function CaptainLogin(req, res) {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required." });
    }

    const agent = await Agent.findOne({ email });
    if (!agent) {
      return res
        .status(401)
        .json({ success: false, message: "Agent not found." });
    }

    const match = await bcrypt.compare(password, agent.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password." });
    }

    // Check if agent is approved
    if (!agent.approved) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending approval. Please wait for admin approval.",
        approved: false,
        agent: {
          id: agent._id,
          fullName: agent.fullName,
          email: agent.email,
          phone: agent.phone,
          city: agent.city,
          vehicleType: agent.vehicleType,
          serviceType: agent.serviceType,
          vehicleSubType: agent.vehicleSubType,
          approved: agent.approved,
        },
      });
    }

    // Generate JWT only for approved agents
    const token = jwt.sign(
      { id: agent._id, email: agent.email },
      process.env.JWT_SECRET || "dev_secret",
      {
        expiresIn: "2h",
      }
    );

    // Hide password in response
    const agentData = agent.toObject();
    delete agentData.password;

    return res.status(200).json({
      success: true,
      token,
      agent: agentData,
      approved: true,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// prateek

function signToken(user) {
  const payload = {
    id: user._id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  const secret = process.env.JWT_SECRET || "dev_secret";
  const expiresIn = "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

// Create superadmin manually via Postman
async function createSuperadmin(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const exists = await Superadmin.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already in use" });
    const hash = await bcrypt.hash(password, 10);
    console.log("hii");
    const sa = await Superadmin.create({
      name,
      email,
      password: hash,
      role: "superadmin",
    });
    console.log("hii");
    return res.status(201).json({ id: sa._id, email: sa.email, role: sa.role });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Superadmin creates admins
async function createAdmin(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already in use" });
    const hash = await bcrypt.hash(password, 10);
    const admin = await ExpressAdmin.create({
      name,
      email,
      password: hash,
      role: "admin",
      createdBy: req.user.id,
    });
    return res
      .status(201)
      .json({ id: admin._id, email: admin.email, role: admin.role });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listAdmins(req, res) {
  try {
    const admins = await ExpressAdmin.find().select("-password");
    return res.json(admins);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const user = await ExpressAdmin.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = signToken(user);
    return res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function loginSuperAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const user = await Superadmin.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = signToken(user);
    return res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function CaptainProfile(req, res) {
  try {
    const captain = await Agent.findById(req.captain.id).select("-password");
    if (!captain) return res.status(404).json({ message: "Captain not found" });
    return res.json(captain);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  register,
  login,
  profile,
  CaptainLogin,
  CaptainSignup,
  createSuperadmin,
  createAdmin,
  listAdmins,
  loginAdmin,
  loginSuperAdmin,
  updateProfile,
  CaptainProfile,
};
