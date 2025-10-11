const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const Agent = require("../models/Agent");
const Superadmin = require("../models/Superadmin");
const ExpressAdmin = require("../models/ExpressAdmin");
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "user",
    });
    return res
      .status(201)
      .json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function profile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

// captain controller

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

    // Password match check
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    // Check if agent already exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res
        .status(400)
        .json({ success: false, message: "Agent already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create agent
    const agent = await Agent.create({
      fullName,
      email,
      phone,
      city,
      vehicleType,
      serviceType,
      password: hashedPassword,
      vehicleSubType,
    });

    return res.status(201).json({
      success: true,
      message: "Agent created successfully.",
      data: agent,
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

    // Generate JWT
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

    return res.status(200).json({ success: true, token, agent: agentData });
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
};
