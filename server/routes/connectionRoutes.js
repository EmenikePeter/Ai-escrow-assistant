import express from 'express';
import Connection from '../models/Connection.js';

const router = express.Router();

// Log every request to this router
router.use((req, res, next) => {
  next();
});

// Check if two users are allowed to chat (connection status: accepted)
router.post('/connections/can-chat', async (req, res) => {
  try {
    const { currentEmail, otherEmail } = req.body;
    if (!currentEmail || !otherEmail || currentEmail === otherEmail) {
      return res.status(400).json({ allowed: false, message: 'Invalid users.' });
    }
    const users = [currentEmail, otherEmail].sort();
    console.log('[can-chat] Query users:', users);
    const conn = await Connection.findOne({ users, status: 'accepted' });
    console.log('[can-chat] Found connection:', conn);
    res.json({ allowed: !!conn });
  } catch (err) {
    console.log('[can-chat] Error:', err);
    res.status(500).json({ allowed: false, message: 'Error checking chat permission.', error: err.message });
  }
});

// Send a connection invite
router.post('/connections/invite', async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to || from === to) return res.status(400).json({ message: 'Invalid users.' });
    const users = [from, to].sort();
    let conn = await Connection.findOne({ users });
    if (conn) return res.status(400).json({ message: 'Connection already exists.', status: conn.status });
    conn = await Connection.create({ users, requestedBy: from, status: 'pending' });
    res.json(conn);
  } catch (err) {
    res.status(500).json({ message: 'Error sending invite.', error: err.message });
  }
});

// Get connection statuses for a list of users relative to currentEmail
router.post('/connections/statuses', async (req, res) => {
  try {
    const { currentEmail, userEmails } = req.body;
    if (!currentEmail || !Array.isArray(userEmails)) {
      return res.status(400).json({ message: 'Missing currentEmail or userEmails.' });
    }
    // Find all connections involving currentEmail and any of the userEmails
    const conns = await Connection.find({
      users: { $in: [currentEmail] },
      $or: userEmails.map(email => ({ users: { $in: [email] } }))
    });
    // Build status map
    const statusMap = {};
    for (const email of userEmails) {
      const users = [currentEmail, email].sort();
      const conn = conns.find(c => Array.isArray(c.users) && c.users.length === 2 && c.users[0] === users[0] && c.users[1] === users[1]);
      if (!conn) {
        statusMap[email] = { status: 'none', direction: null };
      } else if (conn.status === 'pending') {
        statusMap[email] = {
          status: 'pending',
          direction: conn.requestedBy === currentEmail ? 'sent' : 'received',
        };
      } else {
        statusMap[email] = { status: conn.status, direction: null };
      }
    }
    res.json(statusMap);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching statuses.', error: err.message });
  }
});

// Accept a connection invite
router.post('/connections/accept', async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ message: 'Invalid users.' });
    const users = [from, to].sort();
    const conn = await Connection.findOneAndUpdate(
      { users, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!conn) return res.status(404).json({ message: 'Invite not found.' });
    res.json(conn);
  } catch (err) {
    res.status(500).json({ message: 'Error accepting invite.', error: err.message });
  }
});

// Reject a connection invite
router.post('/connections/reject', async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ message: 'Invalid users.' });
    const users = [from, to].sort();
    const conn = await Connection.findOneAndUpdate(
      { users, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    );
    if (!conn) return res.status(404).json({ message: 'Invite not found.' });
    res.json(conn);
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting invite.', error: err.message });
  }
});

// List all connections for a user
router.get('/connections/:user', async (req, res) => {
  try {
    const user = req.params.user;
    const conns = await Connection.find({ users: user });
    res.json(conns);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching connections.', error: err.message });
  }
});

export default router;
