import express from "express";
import ChatRoom from "../models/ChatRoom.js";
import Message from "../models/Message.js";

const router = express.Router();

/**
 * USER: Start a new chat room
 */
router.post("/create-room", async (req, res) => {
  try {
    const { userId, initialMessage } = req.body;

    // Create a new chat room
    const room = new ChatRoom({
      userId,
      agentId: null,
      isOpen: true,
    });
    await room.save();

    // Save initial user message
    if (initialMessage) {
      const message = new Message({
        roomId: room._id,
        senderId: userId,
        senderRole: "user",
        text: initialMessage,
      });
      await message.save();
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * USER/AGENT: Send a message
 */
router.post("/send-message", async (req, res) => {
  try {
    const { roomId, senderId, senderRole, text } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room || !room.isOpen) {
      return res.status(400).json({ error: "Room is closed or does not exist" });
    }

    const message = new Message({
      roomId,
      senderId,
      senderRole, // "user" or "agent"
      text,
    });
    await message.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AGENT: Claim/assign a chat room
 */
router.post("/assign-room", async (req, res) => {
  try {
    const { roomId, agentId } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room || !room.isOpen) {
      return res.status(400).json({ error: "Room is closed or does not exist" });
    }
    if (room.agentId) {
      return res.status(400).json({ error: "Room already assigned" });
    }

    room.agentId = agentId;
    await room.save();

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AGENT: Close a chat room after issue is resolved
 */
router.post("/close-room", async (req, res) => {
  try {
    const { roomId, agentId } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.agentId.toString() !== agentId) {
      return res.status(403).json({ error: "You are not assigned to this room" });
    }

    room.isOpen = false;
    await room.save();

    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * USER: Get all messages for a room
 */
router.get("/messages/:roomId", async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({
      createdAt: 1,
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AGENT: Get all open, unassigned chat rooms
 */
router.get("/open-rooms", async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ isOpen: true, agentId: null }).populate(
      "userId"
    );
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AGENT: Get all rooms assigned to a specific agent
 */
router.get("/agent-rooms/:agentId", async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      isOpen: true,
      agentId: req.params.agentId,
    }).populate("userId");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;