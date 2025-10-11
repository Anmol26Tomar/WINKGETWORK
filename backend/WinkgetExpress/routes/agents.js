const express = require("express");
const router = express.Router();
const {
  getAgentById,
  getAgents,
  approveAgent,
} = require("../controllers/agentController");

// Public read-only endpoint for fetching agent profile by id
router.get("/:id", getAgentById);
router.get("/", getAgents);

// Approve agent
router.patch("/:id/approve", approveAgent);

module.exports = router;
