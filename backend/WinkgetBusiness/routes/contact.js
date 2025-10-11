const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { createContactMessage } = require('../controllers/contactController');

const router = express.Router();

router.post('/', verifyToken, requireRole('admin'), createContactMessage);

module.exports = router;


