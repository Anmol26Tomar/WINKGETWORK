const express = require('express');
const {
  signup,
  signupAdmin,
  signupVendor,
  login,
  logout,
  getCurrentUser
} = require('../controllers/authController');
const upload = require('../middleware/upload');
const { verifyToken } = require('../middleware/auth');
const { debugVendorSignup } = require('../utils/debugVendor');

const router = express.Router();

router.post('/signup', signup);

// Dedicated admin signup endpoint (first admin only)
router.post('/signup/admin', signupAdmin);

// Dedicated vendor signup endpoint (multipart for media)
router.post(
  '/signup/vendor',
  upload.fields([
    { name: 'ownerPic', maxCount: 1 },
    { name: 'profileBanner', maxCount: 1 },
    { name: 'gstinDoc', maxCount: 1 },
  ]),
  signupVendor
);

// Debug endpoint for vendor signup issues
router.post('/debug/vendor', async (req, res) => {
  try {
    const { email, shopName } = req.body;
    const debugResult = await debugVendorSignup(email, shopName);
    res.json(debugResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication endpoints
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;


