import bcrypt from 'bcryptjs';
import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import Message from './models/Message.js';
import Team from './models/Team.js';
import TeamInvite from './models/TeamInvite.js'; // Update path as needed
import User from './models/User.js'; // Update path as needed

const router = express.Router();

// List all teams
router.get('/all', async (req, res) => {
  try {
    const teams = await Team.find();
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Create a new team
router.post('/create-team', async (req, res) => {
  const { name, adminId } = req.body;
  if (!name || !adminId) return res.status(400).json({ error: 'Name and adminId required.' });
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.userType !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can create teams.' });
    }
    const team = new Team({ name, admins: [adminId], members: [adminId] });
    await team.save();
    // Add team to admin's teams array
    admin.teams.push({ _id: team._id, name: team.name });
    await admin.save();
    res.json({ message: 'Team created', team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a team
router.post('/join-team', async (req, res) => {
  const { userId, teamId } = req.body;
  if (!userId || !teamId) return res.status(400).json({ error: 'userId and teamId required.' });
  // Use imported mongoose
  let userObjectId, teamObjectId;
  try {
    userObjectId = mongoose.Types.ObjectId(userId);
    teamObjectId = mongoose.Types.ObjectId(teamId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid userId or teamId format. Must be MongoDB ObjectId.' });
  }
  try {
    const team = await Team.findById(teamObjectId);
    const user = await User.findById(userObjectId);
    if (!team || !user) return res.status(404).json({ error: 'Team or user not found.' });
    // Add user to team members if not already
    if (!team.members.map(id => id.toString()).includes(userObjectId.toString())) {
      team.members.push(userObjectId);
      await team.save();
    }
    // Add team to user's teams array if not already
    if (!user.teams.some(t => t._id.toString() === teamObjectId.toString())) {
      user.teams.push({ _id: team._id, name: team.name });
      await user.save();
    }
    res.json({ message: 'Joined team', team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List team members
router.get('/', async (req, res) => {
  try {
    const members = await User.find({ role: { $in: ['admin', 'super_admin', 'support_agent', 'mediator'] } });
    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send team invite
router.post('/invite', async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role required.' });
  }
  try {
    const code = uuidv4();
    const invite = new TeamInvite({ email, role, code, used: false, createdAt: new Date() });
    await invite.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@yourapp.com',
      to: email,
      subject: 'Team Invite',
      text: `You have been invited as a ${role}.\n\nYour invite code: ${code}\n\nGo to the app and use this code to sign up as a team member.`,
    });

    res.json({ message: 'Invite created.', code });
  } catch (err) {
    console.error('[InviteTeamMember] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Team signup
// Send a message (user-to-user or team)
router.post('/message', async (req, res) => {
  const { senderId, recipientId, teamId, content } = req.body;
  if (!senderId || !content || (!recipientId && !teamId)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    const message = new Message({ sender: senderId, recipient: recipientId, team: teamId, content });
    await message.save();
    res.json({ message: 'Message sent!', data: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a user (direct and team)
router.get('/messages', async (req, res) => {
  const { userId, teamId } = req.query;
  if (!userId && !teamId) {
    return res.status(400).json({ error: 'userId or teamId required.' });
  }
  try {
    let messages = [];
    if (userId) {
      messages = await Message.find({ $or: [ { sender: userId }, { recipient: userId } ] }).sort({ timestamp: 1 });
    }
    if (teamId) {
      const teamMessages = await Message.find({ team: teamId }).sort({ timestamp: 1 });
      messages = messages.concat(teamMessages);
    }
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/signup', async (req, res) => {
  const { inviteCode, name, email, password } = req.body;
  if (!inviteCode || !name || !email || !password) {
    return res.status(400).json({ error: 'All fields required.' });
  }
  try {
    const invite = await TeamInvite.findOne({ code: inviteCode, used: false });
    if (!invite) {
      return res.status(400).json({ error: 'Invalid or used invite code.' });
    }
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hash, role: invite.role });
  await user.save();
    invite.used = true;
    await invite.save();
    res.json({ message: 'Team signup successful!' });
  } catch (err) {
    console.error('[TeamSignup] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
