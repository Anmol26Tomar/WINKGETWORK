const express = require('express');
const router = express.Router();
const { getAgentById } = require('../controllers/agentController');

// Public read-only endpoint for fetching agent profile by id
router.get('/:id', getAgentById);

module.exports = router;


