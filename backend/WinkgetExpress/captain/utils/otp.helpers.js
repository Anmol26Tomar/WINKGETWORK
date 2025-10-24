const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP using SHA-256
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify an OTP against its hash
 */
function verifyOtp(otp, hash) {
  const hashedOtp = hashOtp(otp);
  return crypto.timingSafeEqual(Buffer.from(hashedOtp), Buffer.from(hash));
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp
};

