import bcrypt from 'bcryptjs';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';

const router = express.Router();

// Admin: Add user and assign role
router.post('/add-user', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }
    const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hash, role, uuid: uuidv4() });
    await user.save();
    res.json({ message: 'User created successfully.', user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[Add User] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
