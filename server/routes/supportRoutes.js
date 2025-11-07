import express from 'express';
import { Parser as Json2csvParser } from 'json2csv';
import PDFDocument from 'pdfkit';
import SupportChat from '../models/SupportChat.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

const router = express.Router();
// Export chat logs as CSV
router.get('/export/chat-logs', async (req, res) => {
  try {
    const SupportChat = (await import('../models/SupportChat.js')).default;
    const logs = await SupportChat.find().lean();
    const fields = ['_id', 'sender', 'text', 'room', 'agent', 'role', 'repliedAt', 'time', 'status'];
    const parser = new Json2csvParser({ fields });
    const csv = parser.parse(logs);
    res.header('Content-Type', 'text/csv');
    res.attachment('chat_logs.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting chat logs.', error: err.message });
  }
});
// Analytics trends endpoint (tickets/disputes/resolutions per day for last 14 days)
router.get('/analytics/trends', async (req, res) => {
  try {
    const Ticket = (await import('../models/Ticket.js')).default;
    const Dispute = (await import('../models/Dispute.js')).default;
    const days = 14;
    const today = new Date();
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      const tickets = await Ticket.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const disputes = await Dispute.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const resolutions = await Ticket.countDocuments({ status: 'resolved', updatedAt: { $gte: start, $lte: end } });
      trends.push({ date: start.toISOString().slice(0, 10), tickets, disputes, resolutions });
    }
    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trends.', error: err.message });
  }
});

// Export chat logs as PDF
router.get('/export/chat-logs-pdf', async (req, res) => {
  try {
    const SupportChat = (await import('../models/SupportChat.js')).default;
    const logs = await SupportChat.find().lean();
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=chat_logs.pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Chat Logs', { align: 'center' });
    doc.moveDown();
    logs.forEach(log => {
      doc.fontSize(12).text(`Time: ${log.time}`);
      doc.text(`Sender: ${log.sender} (${log.role})`);
      doc.text(`Agent: ${log.agent || ''}`);
      doc.text(`Room: ${log.room}`);
      doc.text(`Status: ${log.status}`);
      doc.text(`Text: ${log.text}`);
      doc.moveDown();
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Error exporting chat logs PDF.', error: err.message });
  }
});

// Per-agent ticket load
router.get('/analytics/agent-ticket-load', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Ticket = (await import('../models/Ticket.js')).default;
    const agents = await User.find({ role: { $in: ['support_agent', 'admin', 'super_admin'] } });
    const data = [];
    for (const agent of agents) {
      const open = await Ticket.countDocuments({ assignedTo: agent._id, status: 'open' });
      const resolved = await Ticket.countDocuments({ assignedTo: agent._id, status: 'resolved' });
      data.push({ name: agent.name, open, resolved });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching agent ticket load.', error: err.message });
  }
});

// Dispute resolution time (average in days)
router.get('/analytics/dispute-resolution-time', async (req, res) => {
  try {
    const Dispute = (await import('../models/Dispute.js')).default;
    const disputes = await Dispute.find({ status: 'resolved', createdAt: { $exists: true }, resolvedAt: { $exists: true } });
    let total = 0, count = 0;
    for (const d of disputes) {
      if (d.createdAt && d.resolvedAt) {
        total += (d.resolvedAt.getTime() - d.createdAt.getTime());
        count++;
      }
    }
    const avgDays = count ? (total / count / 86400000).toFixed(2) : 'N/A';
    res.json({ avgDays });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dispute resolution time.', error: err.message });
  }
});

// Analytics agent performance endpoint
router.get('/analytics/agents', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Ticket = (await import('../models/Ticket.js')).default;
    const SupportChat = (await import('../models/SupportChat.js')).default;
    const agents = await User.find({ role: { $in: ['support_agent', 'admin', 'super_admin'] } });
    const perf = [];
    for (const agent of agents) {
      const ticketsHandled = await Ticket.countDocuments({ assignedTo: agent._id });
      const disputesHandled = 0; // Add logic if Dispute model supports agent assignment
      // Avg. response time (in minutes)
      const chats = await SupportChat.find({ agent: agent.email, role: 'agent', repliedAt: { $exists: true } });
      let totalResponse = 0, count = 0;
      for (const chat of chats) {
        if (chat.repliedAt && chat.time) {
          totalResponse += (chat.repliedAt.getTime() - chat.time.getTime());
          count++;
        }
      }
      perf.push({
        name: agent.name,
        ticketsHandled,
        disputesHandled,
        avgResponseTime: count ? (totalResponse / count / 60000).toFixed(2) : 'N/A',
      });
    }
    res.json(perf);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching agent performance.', error: err.message });
  }
});
// Analytics dashboard metrics endpoint
router.get('/analytics/metrics', async (req, res) => {
  try {
    // Average response time (SupportChat)
    const chats = await (await import('../models/SupportChat.js')).default.find({ role: 'agent', repliedAt: { $exists: true } });
    let totalResponseTime = 0, responseCount = 0;
    for (const chat of chats) {
      if (chat.repliedAt && chat.time) {
        totalResponseTime += (chat.repliedAt.getTime() - chat.time.getTime());
        responseCount++;
      }
    }
    const avgResponseTimeMs = responseCount ? totalResponseTime / responseCount : 0;

    // Closed sessions (SupportChat)
    const closedSessions = await (await import('../models/SupportChat.js')).default.countDocuments({ status: 'closed' });

    // Ticket stats
    const Ticket = (await import('../models/Ticket.js')).default;
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });

    res.json({
      avgResponseTimeMs,
      closedSessions,
      openTickets,
      resolvedTickets
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytics metrics.', error: err.message });
  }
});

// Assign agent to all unassigned support chat messages for a user
// POST /api/support/assign-agent-to-user
router.post('/assign-agent-to-user', async (req, res) => {
  try {
    const { sender, agent } = req.body;
    if (!sender || !agent) return res.status(400).json({ message: 'Missing required fields.' });
    // Update all messages from this sender that do not have an agent assigned
    const result = await SupportChat.updateMany(
      { sender, $or: [{ agent: { $exists: false } }, { agent: null }, { agent: '' }] },
      { $set: { agent } }
    );
    // Optionally, fetch updated messages to return
    const updatedMessages = await SupportChat.find({ sender });
    // Emit real-time update to all admins/agents (if needed)
    const io = req.app.get('io');
    if (io) {
      io.emit('supportAgentAssignment', { sender, agent });
    }
    res.json({ updated: result.modifiedCount, updatedMessages });
  } catch (err) {
    res.status(500).json({ message: 'Error assigning agent to user messages.', error: err.message });
  }
});

// Search users by name, email, or uuid
router.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: regex },
          { email: regex },
          { uuid: regex }
        ]
      };
    }
    const users = await User.find(query).select('name email uuid');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users.', error: err.message });
  }
});

// Assign a ticket to an agent
router.post('/tickets/:id/assign', async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ message: 'Missing agentId.' });
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo: agentId },
      { new: true }
    ).populate('userId assignedTo');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Error assigning ticket.', error: err.message });
  }
});

// Get tickets assigned to a specific agent
router.get('/tickets/assigned/:agentId', async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.params.agentId }).populate('userId assignedTo');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assigned tickets.', error: err.message });
  }
});
// List all team members (support agents, mediators, admins, super admins)
router.get('/team', async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['support_agent', 'mediator', 'admin', 'super_admin'] } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching team members.', error: err.message });
  }
});

// Update user role
router.post('/update-role', async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ message: 'Missing required fields.' });
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user role.', error: err.message });
  }
});
// User creates ticket
router.post('/tickets', async (req, res) => {
  try {
    const ticket = new Ticket({ userId: req.body.userId, ...req.body });
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Error creating ticket.', error: err.message });
  }
});

// Support agents list tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('userId assignedTo');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tickets.', error: err.message });
  }
});

// Add message to ticket
router.post('/tickets/:id/message', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    ticket.messages.push({ sender: req.body.senderId, text: req.body.text });
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Error adding message.', error: err.message });
  }
});

// GET /api/support/chat - fetch all support chat messages
router.get('/chat', async (req, res) => {
  try {
    const messages = await SupportChat.find({ room: 'support' }).sort({ time: 1 });
    if (messages.length > 0) {
      messages.forEach((msg, idx) => {
      });
    } else {
    }
    res.json(messages);
  } catch (err) {
    console.error('[GET /support/chat] Error:', err);
    res.status(500).json({ message: 'Error fetching support chat.', error: err.message });
  }
});

// POST /api/support/assign-agent
router.post('/assign-agent', async (req, res) => {
  try {
    const { messageId, agent } = req.body;
    if (!messageId || !agent) return res.status(400).json({ message: 'Missing required fields.' });
    const msg = await SupportChat.findByIdAndUpdate(messageId, { agent }, { new: true });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Error assigning agent.', error: err.message });
  }
});

// POST /api/support/reply
router.post('/reply', async (req, res) => {
  try {
    const { messageId, reply, agent } = req.body;
    if (!messageId || !reply || !agent) return res.status(400).json({ message: 'Missing required fields.' });
    // Fetch the message to check assignment
    const msgDoc = await SupportChat.findById(messageId);
    if (!msgDoc) return res.status(404).json({ message: 'Message not found.' });
    // Only allow reply if agent matches assigned agent for this user (sender)
    if (msgDoc.agent && msgDoc.agent !== agent) {
      return res.status(403).json({ message: 'You are not assigned to this chat.' });
    }
    // Update the message with reply and agent
    msgDoc.reply = reply;
    msgDoc.agent = agent;
    msgDoc.repliedAt = new Date();
    await msgDoc.save();
    // Emit real-time update only to the user (sender) involved in the chat
    const io = req.app.get('io');
    if (io && msgDoc && msgDoc.sender) {
      io.to(msgDoc.sender).emit('supportMessage', {
        _id: msgDoc._id,
        sender: msgDoc.sender,
        text: msgDoc.text,
        reply: msgDoc.reply,
        agent: msgDoc.agent,
        time: msgDoc.time,
        repliedAt: msgDoc.repliedAt,
      });
    }
    res.json(msgDoc);
  } catch (err) {
    res.status(500).json({ message: 'Error replying to message.', error: err.message });
  }
});
// Analytics placeholder endpoints
router.get('/analytics', (req, res) => {
  res.json({ message: 'Analytics overview placeholder.' });
});

router.get('/analytics/trends', (req, res) => {
  res.json({ message: 'Analytics trends placeholder.' });
});

router.get('/analytics/agents', (req, res) => {
  res.json({ message: 'Analytics agents placeholder.' });
});

export default router;
