const express = require("express");
const router = express.Router();

const {CaptainLogin,CaptainSignup,CaptainProfile}=require('../controllers/authController')
// Public routes
router.post('/captainsignup',CaptainSignup);
router.post('/captainlogin',CaptainLogin);
router.post('/profile',CaptainProfile);
module.exports = router;