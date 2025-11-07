import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Save Expo push token for a user
router.post('/push-token', async (req, res) => {
  const { email, pushToken } = req.body;
  if (!email || !pushToken) return res.status(400).json({ error: 'Missing email or pushToken' });
  try {
    await User.findOneAndUpdate({ email }, { pushToken }, { new: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
