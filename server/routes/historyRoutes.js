
import express from 'express';
import ArchivedMessage from '../models/ArchivedMessage.js';
import ChatSession from '../models/ChatSession.js';
const router = express.Router();

// Get archived sessions for a user (by email)
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    // Find all sessions for this user
    const sessions = await ChatSession.find({ userEmail: email, status: 'closed' }).sort({ updatedAt: -1 });
    // For each session, get its archived messages
    const sessionsWithMessages = await Promise.all(sessions.map(async (session) => {
      const messages = await ArchivedMessage.find({ sessionId: session._id }).sort({ time: 1 });
      return { session, messages };
    }));
    res.json(sessionsWithMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get archived sessions for an agent (by agent email)
router.get('/agent/:email', async (req, res) => {
  try {
    const email = req.params.email;
    // Find all sessions assigned to this agent
    const sessions = await ChatSession.find({ agentEmail: email, status: 'closed' }).sort({ updatedAt: -1 });
    const sessionsWithMessages = await Promise.all(sessions.map(async (session) => {
      const messages = await ArchivedMessage.find({ sessionId: session._id }).sort({ time: 1 });
      return { session, messages };
    }));
    res.json(sessionsWithMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single archived session by sessionId
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await ChatSession.findById(sessionId);
    const messages = await ArchivedMessage.find({ sessionId }).sort({ time: 1 });
    res.json({ session, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
