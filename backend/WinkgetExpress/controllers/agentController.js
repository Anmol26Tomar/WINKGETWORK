const Agent = require("../models/Agent");

async function getAgentById(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Agent id is required" });
    const agent = await Agent.findById(id).select("-password");
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    return res.json({ agent });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
async function getCaptainOrders(req, res) {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: 'Agent id is required' });
		const agent = await Agent.findById(id).select('-password').populate('orders');
		if (!agent) return res.status(404).json({ message: 'Agent not found' });
		return res.json({ orders: agent.orders });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function getAgents(req, res) {
  try {
    const { approved } = req.query;
    const filter = {};
    if (approved === "true") filter.approved = true;
    if (approved === "false") filter.approved = false;
    const agents = await Agent.find(filter).select("-password");
    return res.json({ agents });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveAgent(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Agent id is required" });
    const agent = await Agent.findById(id).select("_id approved");
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    if (agent.approved) {
      return res.json({
        message: "Already approved",
        agent: { _id: agent._id, approved: true },
      });
    }
    const updated = await Agent.findByIdAndUpdate(
      id,
      { $set: { approved: true } },
      { new: true, runValidators: false, select: "_id approved" }
    );
    return res.json({
      message: "Agent approved",
      agent: { _id: updated._id, approved: updated.approved },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getAgentById, getAgents, approveAgent };
