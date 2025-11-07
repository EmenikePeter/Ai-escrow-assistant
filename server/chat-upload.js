import express from 'express';
import multer from 'multer';

const router = express.Router();
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Upload file endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;

    const msg = new ChatMessage({
      roomId: req.body.roomId,
      senderId: req.body.senderId,
      fileUrl,
      fileType: req.file.mimetype,
    });

    await msg.save();

    // emit via socket.io to room
    if (req.io) {
      req.io.to(req.body.roomId).emit('newMessage', msg);
    }

    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Chat history endpoint
router.get('/history/:roomId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.roomId })
      .populate('senderId', 'username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get contract-related chats
router.get('/contract/:contractId', async (req, res) => {
  try {
    const chats = await ChatMessage.find({ contractId: req.params.contractId })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load contract chats' });
  }
});

// Get dispute-related chats
router.get('/dispute/:disputeId', async (req, res) => {
  try {
    const chats = await ChatMessage.find({ disputeId: req.params.disputeId })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dispute chats' });
  }
});

export default router;
