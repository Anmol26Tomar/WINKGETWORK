const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Vendor = require("../models/Vendor");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Set secure HTTP-only cookie
function setAuthCookie(res, token) {
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

// Clear auth cookie
function clearAuthCookie(res) {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

// General signup
const signup = async (req, res) => {
  try {
    const { role, name, email, password, storeName, websiteUrl } = req.body;
    if (!role || !name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const passwordHash = await bcrypt.hash(password, 10);
    if (role === "admin") {
      // Allow creating first admin only
      const adminCount = await Admin.countDocuments();
      if (adminCount > 0)
        return res.status(409).json({
          message: "Admin account already exists. Please log in instead.",
        });
      const exists = await Admin.findOne({ email });
      if (exists)
        return res.status(409).json({ message: "Email already in use" });
      const admin = await Admin.create({
        name,
        email,
        passwordHash,
        role: "admin",
      });
      const token = signToken(admin);
      return res.json({
        token,
        user: {
          id: admin._id,
          role: "admin",
          name: admin.name,
          email: admin.email,
        },
      });
    }
    if (role === "vendor") {
      if (!storeName)
        return res.status(400).json({ message: "storeName required" });
      const exists = await Vendor.findOne({ $or: [{ email }, { storeName }] });
      if (exists)
        return res.status(409).json({ message: "Email already in use" });
      const vendor = await Vendor.create({
        name,
        email,
        passwordHash,
        role: "vendor",
        storeName,
        websiteUrl,
      });
      const token = signToken(vendor);
      return res.json({
        token,
        user: {
          id: vendor._id,
          role: "vendor",
          name: vendor.name,
          email: vendor.email,
          approved: vendor.approved,
        },
      });
    }
    return res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin signup (first admin only)
const signupAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    // Check if admin already exists
    const adminCount = await Admin.countDocuments();
    console.log(adminCount);
    // if (adminCount > 0) return res.status(409).json({ message: 'Admin account already exists. Please log in instead.' });

    // Check for existing email
    const exists = await Admin.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already in use" });

    // Hash password properly
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin with only hashed password (no plain text)
    const admin = await Admin.create({
      name,
      email,
      passwordHash, // Only store hashed password
      role: "admin",
    });

    // Generate token and set cookie
    const token = signToken(admin);
    setAuthCookie(res, token);

    return res.status(201).json({
      token,
      user: {
        id: admin._id,
        role: "admin",
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error("Admin signup error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Vendor signup
const signupVendor = async (req, res) => {
  try {
    const {
      ownerName,
      shopName,
      aboutBusiness,
      ownerEmail,
      businessEmail,
      businessContact,
      registeredContact,
      password,
      dob,
      gender,
      businessAddress,
      ownerAddress,
      category,
      websiteLink,
      socialLinks,
    } = req.body || {};

    console.log("🔍 Vendor signup attempt:", {
      ownerName,
      ownerEmail,
      shopName,
    });
    console.log("📝 Full request body:", JSON.stringify(req.body, null, 2));

    if (!ownerName || !ownerEmail || !password || !shopName) {
      return res.status(400).json({
        message:
          "Missing required fields: ownerName, ownerEmail, password, shopName",
      });
    }

    // Check for existing vendor
    console.log("🔍 Checking for existing email:", ownerEmail);
    const existingEmail = await Vendor.findOne({
      $or: [
        { ownerEmail },
        { email: ownerEmail }, // Backward compatibility
      ],
    });

    console.log("🔍 Checking for existing shop name:", shopName);
    const existingShopName = await Vendor.findOne({
      $or: [
        { shopName },
        { storeName: shopName }, // Backward compatibility
      ],
    });

    console.log(
      "📧 Existing email result:",
      existingEmail ? "FOUND" : "NOT FOUND"
    );
    console.log(
      "🏪 Existing shop name result:",
      existingShopName ? "FOUND" : "NOT FOUND"
    );

    if (existingEmail) {
      console.log("❌ Email conflict detected:", existingEmail._id);
      return res.status(409).json({
        message: "Email already in use",
        field: "ownerEmail",
        value: ownerEmail,
      });
    }

    if (existingShopName) {
      console.log("❌ Shop name conflict detected:", existingShopName._id);
      return res.status(409).json({
        message: "Shop name already in use",
        field: "shopName",
        value: shopName,
      });
    }

    // Hash password with higher salt rounds for security
    const passwordHash = await bcrypt.hash(password, 12);

    const vendorData = {
      // New schema fields
      ownerName,
      shopName,
      aboutBusiness,
      ownerEmail,
      businessEmail,
      businessContact,
      registeredContact,
      passwordHash, // Only store hashed password, NO plain text
      dob: dob ? new Date(dob) : undefined,
      gender: gender && gender.trim() ? gender : undefined, // Only set if not empty
      businessAddress,
      ownerAddress,
      category,
      websiteLink,
      socialLinks,
      role: "vendor",
      isApproved: false,

      // Backward compatibility fields
      name: ownerName,
      email: ownerEmail,
      storeName: shopName,
      websiteUrl: websiteLink,
      approved: false,
      briefInfo: aboutBusiness,
    };

    console.log(
      "✅ Creating vendor with data:",
      JSON.stringify(vendorData, null, 2)
    );
    const vendor = await Vendor.create(vendorData);
    console.log("✅ Vendor created successfully:", vendor._id);

    // Generate token and set secure cookie
    const token = signToken(vendor);
    setAuthCookie(res, token);
    console.log("✅ Token generated and cookie set for vendor:", vendor._id);

    return res.status(201).json({
      token,
      user: {
        id: vendor._id,
        role: "vendor",
        ownerName: vendor.ownerName,
        shopName: vendor.shopName,
        ownerEmail: vendor.ownerEmail,
        isApproved: vendor.isApproved,
        category: vendor.category,
      },
    });
  } catch (err) {
    console.error("Vendor signup error:", err);
    if (err.code === 11000) {
      // MongoDB duplicate key error
      const field = err.keyPattern?.ownerEmail
        ? "ownerEmail"
        : err.keyPattern?.shopName
        ? "shopName"
        : err.keyPattern?.email
        ? "ownerEmail"
        : err.keyPattern?.storeName
        ? "shopName"
        : "unknown";

      return res.status(409).json({
        message: `${
          field === "ownerEmail" ? "Email" : "Shop name"
        } already exists`,
        field,
        duplicateValue:
          err.keyValue?.[field] ||
          err.keyValue?.ownerEmail ||
          err.keyValue?.shopName,
      });
    }
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", errors: err.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Missing credentials or role" });
    }

    console.log("🔐 Login attempt:", { email, role });

    // Find user based on role and email
    const Model = role === "admin" ? Admin : Vendor;
    const user = await Model.findOne({
      $or: [
        { email },
        { ownerEmail: email }, // Support new schema field
      ],
    }).select("+passwordHash"); // Explicitly select passwordHash

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token and set secure cookie
    const token = signToken(user);
    setAuthCookie(res, token);

    console.log("✅ Login successful for user:", email);

    // Return appropriate user data based on role
    let userData;
    if (role === "admin") {
      userData = {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
      };
    } else {
      userData = {
        id: user._id,
        role: user.role,
        ownerName: user.ownerName || user.name,
        shopName: user.shopName || user.storeName,
        ownerEmail: user.ownerEmail || user.email,
        isApproved: user.isApproved || user.approved,
        category: user.category,
      };
    }

    res.json({
      token,
      user: userData,
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    clearAuthCookie(res);
    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify token and get current user
const getCurrentUser = async (req, res) => {
  try {
    // This should be called after verifyToken middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Return appropriate user data based on role
    let userData;
    if (user.role === "admin") {
      const admin = await Admin.findById(user.id).select("-passwordHash");
      userData = {
        id: admin._id,
        role: admin.role,
        name: admin.name,
        email: admin.email,
      };
    } else {
      const vendor = await Vendor.findById(user.id).select("-passwordHash");
      userData = {
        id: vendor._id,
        role: vendor.role,
        ownerName: vendor.ownerName || vendor.name,
        shopName: vendor.shopName || vendor.storeName,
        ownerEmail: vendor.ownerEmail || vendor.email,
        isApproved: vendor.isApproved || vendor.approved,
        category: vendor.category,
      };
    }

    res.json({ user: userData });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  signup,
  signupAdmin,
  signupVendor,
  login,
  logout,
  getCurrentUser,
};
