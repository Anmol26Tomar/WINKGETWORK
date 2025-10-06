const Agent = require('../models/Agent');

async function getAgentById(req, res) {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: 'Agent id is required' });
		const agent = await Agent.findById(id).select('-password');
		if (!agent) return res.status(404).json({ message: 'Agent not found' });
		return res.json({ agent });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { getAgentById };


