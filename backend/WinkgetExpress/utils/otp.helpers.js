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
 * DEV MODE: Accept any 4-digit number for development/testing
 */
function verifyOtp(otp, hash) {
  // DEV MODE: Accept any 4-digit number (for development/testing)
  if (otp && /^\d{4}$/.test(otp.toString())) {
    console.log('[DEV MODE] OTP verification bypassed - accepting any 4-digit number:', otp);
    return true;
  }
  
  // Original verification logic (commented out for dev mode)
  // Check if hash exists and is valid
  // if (!hash || !otp) {
  //   return false;
  // }
  
  // try {
  //   const hashedOtp = hashOtp(otp);
  //   // Ensure hash is a string before creating Buffer
  //   if (typeof hash !== 'string') {
  //     return false;
  //   }
  //   return crypto.timingSafeEqual(Buffer.from(hashedOtp), Buffer.from(hash));
  // } catch (error) {
  //   console.error('Error verifying OTP:', error);
  //   return false;
  // }
  
  return false;
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp
};

