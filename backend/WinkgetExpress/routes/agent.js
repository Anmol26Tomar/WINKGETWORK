const express = require("express");
const router = express.Router();

const {CaptainLogin,CaptainSignup}=require('../controllers/authController')
// Public routes
router.post('/captainsignup',CaptainSignup);
router.post('/captainlogin',CaptainLogin);

module.exports = router;