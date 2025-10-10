// For now, store contact messages in-memory or log; could extend to email service
const messages = [];

// Create contact message
const createContactMessage = async (req, res) => {
  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ message: 'Missing subject or message' });
  const entry = { id: String(messages.length + 1), subject, message, createdAt: new Date().toISOString() };
  messages.push(entry);
  res.status(201).json({ success: true });
};

module.exports = {
  createContactMessage
};
