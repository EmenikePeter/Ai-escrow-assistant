import express from 'express';
import ArchivedMessage from '../models/ArchivedMessage.js';
import ChatSession from '../models/ChatSession.js';
import Connection from '../models/Connection.js';
import Contract from '../models/Contract.js';
import Message from '../models/Message.js';
import Team from '../models/Team.js';

const router = express.Router();

// Log every request to this router
router.use((req, res, next) => {
  next();
});

// 5. Clear a chat session: archive messages, close session, create new session
router.post('/sessions/:id/clear', async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    // Archive all messages
    const messages = await Message.find({ sessionId: session._id });
    if (messages.length > 0) {
      const archived = messages.map(m => ({ ...m.toObject(), archivedAt: new Date() }));
      await ArchivedMessage.insertMany(archived);
      await Message.deleteMany({ sessionId: session._id });
    }
    // Close the old session
    session.status = 'closed';
    session.closedAt = new Date();
    await session.save();
    // Create a new session for the user
    const newSession = new ChatSession({ userEmail: session.userEmail, status: 'open' });
    await newSession.save();
    res.json({ newSessionId: newSession._id });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing chat session.', error: err?.message || err });
  }
});

// 1. List all open/unassigned sessions
router.get('/sessions', async (req, res) => {
  try {
    const { status = 'open', unassigned } = req.query;
    const query = { status };
    if (unassigned === 'true') query.agentEmail = null;
    // Sort by most recent activity
    const sessions = await ChatSession.find(query).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sessions.', error: err?.message || err });
  }
});

// 0. Create a new chat session (user-to-user or user-to-agent)
router.post('/sessions', async (req, res) => {
  try {
    // Accept either participants (array) or legacy userEmail/agentEmail
    let { participants, userEmail, agentEmail } = req.body;
    if (!participants) {
      // Fallback for legacy: build participants array
      if (userEmail && agentEmail) {
        participants = [userEmail, agentEmail];
      } else if (userEmail) {
        participants = [userEmail];
      } else {
        return res.status(400).json({ message: 'Missing participants or userEmail.' });
      }
    }
    // Remove duplicates and sort for consistent session matching
    participants = Array.from(new Set(participants)).sort();
    if (participants.length < 2) {
      return res.status(400).json({ message: 'A session must have two participants.' });
    }
    // Check if there's already an open session for these participants
    let session = await ChatSession.findOne({ participants, status: 'open' });
    if (session) {
      return res.json(session);
    }

    // --- Privacy/permission check ---
    const [userA, userB] = participants;
    let allowed = false;
    // 1. Check for accepted connection
    const conn = await Connection.findOne({ users: { $all: [userA, userB] }, status: 'accepted' });
    if (conn) allowed = true;
    // 2. Check for shared team
    if (!allowed) {
      const teams = await Team.find({ members: { $all: [userA, userB] } });
      if (teams.length > 0) allowed = true;
    }
    // 3. Check for shared contract
    if (!allowed) {
      const contract = await Contract.findOne({
        $or: [
          { 'originator.email': userA, 'recipient.email': userB },
          { 'originator.email': userB, 'recipient.email': userA }
        ]
      });
      if (contract) allowed = true;
    }
    if (!allowed) {
      return res.status(403).json({ message: 'You are not allowed to chat with this user.' });
    }

    // Create new session
    session = new ChatSession({ participants, status: 'open' });
    await session.save();
    res.json(session);
  } catch (err) {
    console.error('[POST /api/chat/sessions] Error:', err);
    res.status(500).json({ message: 'Error creating session.', error: err?.message || err });
  }
});

// 2. Assign agent to a session
router.post('/sessions/:id/assign', async (req, res) => {
  try {
    const { agentEmail } = req.body;
    if (!agentEmail) return res.status(400).json({ message: 'Missing agentEmail.' });
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, agentEmail: null, status: 'open' },
      { agentEmail },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found or already assigned.' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error assigning agent.', error: err?.message || err });
  }
});

// 3. Close a session
router.post('/sessions/:id/close', async (req, res) => {
  try {
    const session = await ChatSession.findByIdAndUpdate(
      req.params.id,
      { status: 'closed', closedAt: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error closing session.', error: err?.message || err });
  }
});

// 4. Get all messages for a session
router.get('/sessions/:id/messages', async (req, res) => {
  try {
    const messages = await Message.find({ sessionId: req.params.id }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages.', error: err?.message || err });
  }
});

export default router;
