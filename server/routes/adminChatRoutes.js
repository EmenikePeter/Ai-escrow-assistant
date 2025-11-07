import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import ChatMessage from "../models/ChatMessage.js";
import Dispute from "../models/Dispute.js";

const router = express.Router();

// List disputes with active chats
router.get("/disputes", isAdmin, async (req, res) => {
  try {
    const disputes = await Dispute.find({ status: { $in: ["open", "pending"] } });
    const disputeIds = disputes.map(d => d._id);
    const chats = await ChatMessage.find({ disputeId: { $in: disputeIds } })
      .populate("senderId", "name email")
      .sort({ createdAt: 1 });
    res.json({ disputes, chats });
  } catch (err) {
    res.status(500).json({ error: "Failed to load disputes" });
  }
});

// Get all messages for a specific dispute
router.get("/chat/dispute/:disputeId", isAdmin, async (req, res) => {
  try {
    const chats = await ChatMessage.find({ disputeId: req.params.disputeId })
      .populate("senderId", "name email")
      .sort({ createdAt: 1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to load dispute chat" });
  }
});

router.get('/:disputeId', isAdmin, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ disputeId: req.params.disputeId })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

export default router;
