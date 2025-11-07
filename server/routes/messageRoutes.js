import express from 'express';
import ChatMessage from '../models/ChatMessage.js';
import Message from '../models/Message.js';

const router = express.Router();

// Send a direct message
router.post('/send', async (req, res) => {
  try {
    const { senderId, recipientId, content } = req.body;
    if (!senderId || !recipientId || !content) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const message = new Message({ sender: senderId, recipient: recipientId, content });
    await message.save();
    res.status(201).json({ message: 'Message sent.', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error sending message.', error: err.message });
  }
});

// Get inbox messages for a user
// Get all chat messages for a contract (for contract chat)
router.get('/contract/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const messages = await ChatMessage.find({ contractId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contract chat.', error: err.message });
  }
});
router.get('/inbox/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({ recipient: userId }).populate('sender', 'name email');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching inbox.', error: err.message });
  }
});

// Reply to a message (just send another message)
router.post('/reply', async (req, res) => {
  try {
    const { senderId, recipientId, content } = req.body;
    if (!senderId || !recipientId || !content) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const message = new Message({ sender: senderId, recipient: recipientId, content });
    await message.save();
    res.status(201).json({ message: 'Reply sent.', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error sending reply.', error: err.message });
  }
});

export default router;
