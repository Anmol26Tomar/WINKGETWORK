// Admin Auth Routes
// superadmin routes

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/ExpressAdminMiddleware");
const {
  createSuperadmin,
  createAdmin,
  listAdmins,
  loginSuperAdmin,
} = require("../controllers/authController");
const { loginAdmin } = require("../controllers/authController");

// Create superadmin manually (no auth)
router.post("/superadmin", createSuperadmin);

// Login shared by superadmin and admin
router.post("/login", loginAdmin);
router.post("/login/superadmin", loginSuperAdmin);

// Superadmin protected routes
router.post("/admins", authenticate, authorize("superadmin"), createAdmin);
router.get("/admins", authenticate, authorize("superadmin"), listAdmins);

module.exports = router;

