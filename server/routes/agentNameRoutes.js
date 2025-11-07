import express from 'express';
import User from '../models/User.js';
const router = express.Router();

// GET /api/support/agent-name/:email
router.get('/agent-name/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: 'Missing agent email.' });
    const agent = await User.findOne({ email });
    if (!agent) return res.status(404).json({ message: 'Agent not found.' });
    res.json({ name: agent.name, email: agent.email });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching agent name.', error: err.message });
  }
});

export default router;
