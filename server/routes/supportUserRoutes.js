import express from 'express';
import User from '../models/User.js';
import { getLastMessage, getOrCreateSession, getUnreadCount } from '../utils/chat.js';

const router = express.Router();

// Bulk fetch user details by email
router.post('/users/bulk', async (req, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.json([]);
    }
    // Fetch users by email
    const users = await User.find({ email: { $in: emails } });
    // For each user, fetch last message and unread count with the requesting user
    const requestingUser = req.user?.email || req.body.requestingUser || null;
    // If not provided, just use the first email in the list (fallback)
    const baseUser = requestingUser || emails[0];
    const details = await Promise.all(emails.map(async email => {
      const user = users.find(u => u.email === email);
      let lastMessage = null;
      let unreadCount = 0;
      if (baseUser && email !== baseUser) {
        const session = await getOrCreateSession(baseUser, email);
        if (session) {
          const msg = await getLastMessage(session._id);
          lastMessage = msg ? msg.text : null;
          unreadCount = await getUnreadCount(session._id, baseUser);
        }
      }
      return {
        email,
        name: user ? user.name : email,
        avatar: user ? user.avatar || null : null,
        online: user ? user.online || false : false,
        lastMessage,
        unreadCount,
      };
    }));
    res.json(details);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
});

export default router;
