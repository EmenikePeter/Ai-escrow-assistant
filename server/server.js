// server.js
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import path from 'path';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import chatUploadRoutes from './chat-upload.js';
import setupChatSocket from './initChatSocket.js';
import User from './models/User.js';
import { aiChat, buildClausePrompt, generateDisputeClause, legalReview, query, summarizeContract } from './openai-api.js';
import adminChatRoutesModule from './routes/adminChatRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import agentNameRoutes from './routes/agentNameRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import chatSessionRoutes from './routes/chatSessionRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import helpRoutes from './routes/helpRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import pushTokenRoutes from './routes/pushTokenRoutes.js';
import supportUserRoutes from './routes/supportUserRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import setupSocket from './socket.js';
import teamRoutes from './team.js';
// Define payoutSchema and Payout model immediately after mongoose import
const payoutSchema = new mongoose.Schema({
  userUuid: { type: String, required: true },
  stripeAccountId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true },
  payoutId: { type: String, required: true },
  contractId: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const Payout = mongoose.model('Payout', payoutSchema);
console.log('Starting server.js...');
dotenv.config();
const app = express();

// Log all responses and errors globally
app.use((req, res, next) => {
  const oldSend = res.send;
  res.send = function (data) {
    console.log(`[GLOBAL RESPONSE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    return oldSend.apply(res, arguments);
  };
  next();
});

app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  res.status(500).json({ error: 'Internal server error', details: err?.message || err });
});

// Global request logger for debugging
app.use((req, res, next) => {
  console.log(`[GLOBAL] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.json());
app.use(cookieParser());

// CORS configuration to allow requests from Vercel and other trusted origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:19006',
  'https://ai-escrowassistant.com',
  'https://www.ai-escrowassistant.com',
  'https://ai-escroassistant.com',
  'https://www.ai-escroassistant.com',
  'https://escroassistant.com',
  'https://www.escroassistant.com',
  'https://ai-escrow-assistant.vercel.app',
  process.env.FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL,
  process.env.EXTRA_FRONTEND_URL,
].filter(Boolean); // Remove undefined values

const dynamicOriginPatterns = [
  /^https:\/\/ai-escrow-assistant-[\w-]+\.anekwe-emenike-peter-s-projects\.vercel\.app$/,
];

if (process.env.EXTRA_ORIGIN_REGEX) {
  try {
    dynamicOriginPatterns.push(new RegExp(process.env.EXTRA_ORIGIN_REGEX));
  } catch (error) {
    console.error('[CORS] Failed to compile EXTRA_ORIGIN_REGEX:', error?.message || error);
  }
}

const matchesDynamicOrigin = (origin) => dynamicOriginPatterns.some((pattern) => pattern.test(origin));

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (matchesDynamicOrigin(origin)) {
    return true;
  }

  try {
    const normalizedOrigin = new URL(origin).origin;
    if (allowedOrigins.includes(normalizedOrigin)) {
      return true;
    }
    return matchesDynamicOrigin(normalizedOrigin);
  } catch (_error) {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Admin/Team Login Route (for admin portal)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.error('[Login] Missing email or password');
      return res.status(400).json({ message: 'Email and password required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`[Login] User not found: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.error(`[Login] Invalid password for user: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Only allow admin, support_agent, mediator, super_admin
    if (!['admin', 'support_agent', 'mediator', 'super_admin'].includes(user.role)) {
      console.error(`[Login] Unauthorized role: ${user.role} for user: ${email}`);
      return res.status(403).json({ message: 'Not authorized for admin portal' });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    // Send token as cookie and user info in response
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ name: user.name, role: user.role, email: user.email, token });
  } catch (err) {
    console.error('[Login] Internal error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Search users by uuid, email, or name
app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing query parameter.' });
    // Search by uuid, email, or name (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: query },
        { name: { $regex: query, $options: 'i' } }
      ]
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search user.', details: err?.message || err });
  }
});

// Endpoint to fetch user _id by uuid or email
app.get('/api/user/id', async (req, res) => {
  try {
    const { uuid, email } = req.query;
    let user;
    if (uuid) {
      user = await User.findOne({ uuid });
    } else if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ _id: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user id.', details: err?.message || err });
  }
});

// Endpoint to fetch all contracts for dashboard (by user uuid)
app.get('/api/contracts/dashboard', async (req, res) => {
  try {
    const { email } = req.query;
    console.log('[Dashboard] Incoming email:', email);
    const contracts = await Contract.find({
      $or: [
        { 'originator.email': { $regex: `^${email}$`, $options: 'i' } },
        { 'recipient.email': { $regex: `^${email}$`, $options: 'i' } }
      ]
    });
    console.log('[Dashboard] All contracts found for user:', email);
    contracts.forEach(c => {
      console.log(`[Dashboard] _id=${c._id}, status=${c.status}, originatorEmail=${c.originator?.email}, recipientEmail=${c.recipient?.email}, title=${c.title}`);
    });
    res.json({ contracts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contracts', details: err.message });
  }
});
const adminChatRoutes = adminChatRoutesModule.default || adminChatRoutesModule;

dotenv.config();

// Define User schema and model

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/escrow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/team', teamRoutes);
app.use('/api/chat', chatUploadRoutes);
app.use('/upload', uploadRoutes);
app.use('/api/admin', adminChatRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/support', supportUserRoutes);
app.use('/api/push-token', pushTokenRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/chats', messageRoutes); // For contract chat REST endpoint
app.use('/api/help', helpRoutes);
app.use('/api/support', (await import('./routes/supportRoutes.js')).default);
app.use('/api/contracts', contractRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/support', agentNameRoutes);
app.use('/api/chat', chatSessionRoutes); // <-- new REST endpoints for chat sessions
// Archived chat history endpoints
app.use('/api/history', historyRoutes);
// Serve uploads folder statically for file/image previews
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Socket.io server setup (single instance)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      console.warn(`[Socket.IO] Blocked request from origin: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setupSocket(io);
setupChatSocket(io);
// Optionally, make io available to routes (for emitting events)
app.set('io', io);

// Route definitions start here
import nodemailer from 'nodemailer';
// In-memory contracts store for demo (replace with DB in production)

import Contract from './models/Contract.js';

// Save contract to store when signed

// Endpoint to send a reminder email to the contract recipient
app.post('/api/contracts/:id/send-reminder', async (req, res) => {
  try {
    const contractId = req.params.id;
    const { senderId } = req.body;
    const contract = await Contract.findById(contractId).populate('client freelancer', 'name email');
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });

    // Determine recipient: if sender is client, recipient is freelancer; if sender is freelancer, recipient is client
    let recipient;
    if (contract.client._id.toString() === senderId) {
      recipient = contract.freelancer;
    } else if (contract.freelancer._id.toString() === senderId) {
      recipient = contract.client;
    } else {
      return res.status(403).json({ error: 'Sender is not a party to this contract.' });
    }

    // Send email using nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient.email,
      subject: `Reminder for contract: ${contract.title}`,
      text: `Hello ${recipient.name || recipient.email},\n\nYou have a pending action for contract: ${contract.title}. Please review and respond.\n\nThank you!`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Reminder sent to recipient.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reminder.', details: err.message });
  }
});

// Endpoint to create/send a contract (before signing)
app.post('/api/contracts/send', async (req, res) => {
  console.log('[Contract Send] --- API HIT ---');
  console.log('[Contract Send] Incoming request body:', req.body);
  try {
    const contract = new Contract({ ...req.body, status: 'sent' });
    console.log('[Contract Send] Parsed contract data:', contract);
    await contract.save();
    res.json({ message: 'Contract sent.', contract });
  } catch (err) {
    console.error('[Contract Send] Error:', err);
    if (err?.errors) {
      Object.keys(err.errors).forEach(key => {
        console.error(`[Contract Send] Validation error for ${key}:`, err.errors[key].message);
      });
    }
    res.status(500).json({ error: 'Failed to send contract', details: err.message });
  }
});

// Endpoint to update contract status/details by _id
app.patch('/api/contracts/:id', async (req, res) => {
  try {
    const contractId = req.params.id;
    const updateData = { ...req.body };
    // Ensure originator and recipient use email
    if (updateData.originator && updateData.originator.email) {
      updateData.originatorEmail = updateData.originator.email;
    }
    if (updateData.recipient && updateData.recipient.email) {
      updateData.recipientEmail = updateData.recipient.email;
    }
    console.log('[SignSendContract] Updating contract:', {
      contractId,
      originatorEmail: updateData.originatorEmail,
      recipientEmail: updateData.recipientEmail,
      title: updateData.title
    });
    const updated = await Contract.findByIdAndUpdate(contractId, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Contract not found.' });
    }
    res.json({ message: 'Contract updated.', contract: updated });
  } catch (err) {
    console.error('[Contract Update] Error:', err);
    res.status(500).json({ error: 'Failed to update contract', details: err.message });
  }
});

// Endpoint to fetch contracts received by UUID

app.get('/api/contracts/received', async (req, res) => {
  console.log('[ReceivedContracts] --- Endpoint HIT ---');
  try {
    const { email } = req.query;
    console.log('[ReceivedContracts] Incoming email:', email);
    const allReceived = await Contract.find({ status: { $in: ['sent', 'pending'] } });
    const filtered = allReceived.filter(c => String(c.recipientEmail) === String(email));
    filtered.forEach(c => {
      console.log(`[ReceivedContracts] Returned contract: _id=${c._id}, recipientEmail=${c.recipient?.email}, originatorEmail=${c.originator?.email}, title=${c.title}`);
    });
    res.json({ contracts: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch received contracts', details: err.message });
  }
});
app.post('/summarize-contract', async (req, res) => {
  try {
    console.log('[summarize-contract] Request:', req.body);
    const { contractText, model } = req.body;
    if (!contractText) {
      return res.status(400).json({ error: 'Missing contractText in request body.' });
    }
    const summary = await summarizeContract(contractText, { model: model || 'gpt-3.5-turbo' });
    console.log('[summarize-contract] Response:', summary);
    res.json({ summary });
  } catch (err) {
    console.error('[summarize-contract] Error:', err);
    res.status(500).json({ error: 'Failed to summarize contract', details: err?.message || err });
  }
});

app.post('/review-legal', async (req, res) => {
  try {
    console.log('[review-legal] Request:', req.body);
    const { contractText, model } = req.body;
    if (!contractText) {
      return res.status(400).json({ error: 'Missing contractText in request body.' });
    }
    const review = await legalReview(contractText, { model: model || 'gpt-3.5-turbo' });
    console.log('[review-legal] Response:', review);
    res.json({ review });
  } catch (err) {
    console.error('[review-legal] Error:', err);
    res.status(500).json({ error: 'Failed to review contract', details: err?.message || err });
  }
});

app.post('/generate-clause', async (req, res) => {
  try {
    console.log('[generate-clause] Request:', req.body);
    const clauses = await query(req.body);
    console.log('[generate-clause] Response:', clauses);
    res.json({ output: clauses });
  } catch (err) {
    console.error('[generate-clause] Error:', err);
    res.status(500).json({ error: 'Failed to generate clause', details: err?.message || err });
  }
});

app.post('/generate-dispute-clause', async (req, res) => {
  try {
    console.log('[generate-dispute-clause] Request:', req.body);
    const { contractText, model = 'gpt-3.5-turbo', language = 'English' } = req.body;
    if (!contractText) {
      return res.status(400).json({ error: 'Missing contractText in request body.' });
    }
    const clause = await generateDisputeClause(contractText, { model, language });
    console.log('[generate-dispute-clause] Response:', clause);
    res.json({ clause });
  } catch (err) {
    console.error('[generate-dispute-clause] Error:', err);
    res.status(500).json({ error: 'Failed to generate dispute clause', details: err?.message || err });
  }
});

app.post('/ai-chat', async (req, res) => {
  try {
    console.log('[ai-chat] Request:', req.body);
    const { messages, model = 'gpt-3.5-turbo' } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages in request body.' });
    }
    const reply = await aiChat(messages, { model });
    console.log('[ai-chat] Response:', reply);
    res.json({ reply });
  } catch (err) {
    console.error('[ai-chat] Error:', err);
    res.status(500).json({ error: 'Failed to get AI chat response', details: err?.message || err });
  }
});

// Legal Review Mode endpoint
app.post('/review-legal', async (req, res) => {
  try {
    const { contractText, model } = req.body;
    if (!contractText) {
      return res.status(400).json({ error: 'Missing contractText in request body.' });
    }
    const review = await legalReview(contractText, { model });
    res.json({ review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to review contract', details: err?.message || err });
  }
});
// Signup route
app.post('/api/signup', async (req, res) => {
  try {
  const { name, email, password, phone, country, stateProvince, address, paymentMethod, dob, userType, skills, business } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = uuidv4();
    const user = new User({
  name,
  email,
  password: hashedPassword,
  phone,
  country,
  stateProvince,
  address,
  paymentMethod,
  dob,
  uuid,
    });
    await user.save();
    res.json({ message: 'User registered successfully.', uuid });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    console.log('[LOGIN] Request body:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password:', { email, password });
      return res.status(400).json({ message: 'Email and password required.' });
    }
    const user = await User.findOne({ email });
    console.log('[LOGIN] User lookup result:', user);
    if (!user) {
      console.log('[LOGIN] User not found for email:', email);
      return res.status(404).json({ message: 'User not found.' });
    } else {
      console.log('[LOGIN] User found:', { email: user.email, _id: user._id, userType: user.userType, password: user.password });
    }
    console.log('[LOGIN] Comparing password for user:', email, 'Input password:', password, 'Hashed password:', user.password);
    const valid = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password comparison result:', valid);
    if (!valid) {
      console.log('[LOGIN] Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid password.' });
    } else {
      console.log('[LOGIN] Password valid for user:', email);
    }
    // Create JWT token
    const token = jwt.sign({ email: user.email }, 'secretkey', { expiresIn: '1d' });
    console.log('[LOGIN] Login successful for:', email, 'Token:', token);
    res.json({ token });
  } catch (err) {
    console.error('[LOGIN] Login error:', err);
    res.status(500).json({ message: 'Server error.', details: err.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const { email } = req.query;
    console.log('[PROFILE] Incoming email:', email);
    if (!email) {
      console.log('[PROFILE] No email provided');
      return res.status(400).json({ message: 'Email required.' });
    }
    const user = await User.findOne({ email });
    console.log('[PROFILE] Fetched user:', user);
    if (!user) {
      console.log('[PROFILE] User not found for email:', email);
      return res.status(404).json({ message: 'User not found.' });
    }
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || user.userType || '',
      country: user.country,
      phone: user.phone,
      stateProvince: user.stateProvince,
      address: user.address,
      paymentMethod: user.paymentMethod,
      dob: user.dob,
      skills: user.skills,
      business: user.business,
      uuid: user.uuid,
      teams: user.teams || [],
    };
    console.log('[PROFILE] Response:', userResponse);
    res.json(userResponse);
  } catch (_err) {
    res.status(500).json({ message: 'Server error.' });
  }
});


// Draft contract endpoint
app.post('/api/contracts/draft', async (req, res) => {
  try {
    const draftData = { ...req.body, status: 'draft' };
    // Ensure originator and recipient use email
    if (draftData.originator && draftData.originator.email) {
      draftData.originatorEmail = draftData.originator.email;
    }
    if (draftData.recipientEmail) {
      draftData.recipientEmail = draftData.recipientEmail;
    }
    console.log('[DraftContract] Saving draft:', {
      originatorEmail: draftData.originatorEmail,
      recipientEmail: draftData.recipientEmail,
      title: draftData.title
    });
    const contract = new Contract(draftData);
    await contract.save();
    res.json({ message: 'Draft saved.', contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save draft', details: err.message });
  }
});

app.use('/api', connectionRoutes);


server.listen(4000,'0.0.0.0',() => {
  console.log('Server is running on port 4000 (with socket.io)');
});


// Example: Write to a file asynchronously
// async function writeLocalFile(filePath, content) {
//   try {
//     await fs.writeFile(filePath, content, 'utf8');
//     return true;
//   } catch (error) {
//     throw new Error(`Failed to write file: ${error.message}`);
//   }
// }


// Create payout and store in DB
app.post('/api/payout', async (req, res) => {
  try {
    const { uuid, amount, currency = 'usd', contractId } = req.body;
    const user = await User.findOne({ uuid });
    if (!user || !user.stripeAccountId) {
      return res.status(404).json({ error: 'User or Stripe account not found.' });
    }
    // Create Stripe payout
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100),
      currency,
    }, {
      stripeAccount: user.stripeAccountId,
    });
    // Save payout to DB
    const payoutRecord = new Payout({
      userUuid: uuid,
      stripeAccountId: user.stripeAccountId,
      amount,
      currency,
      status: payout.status,
      payoutId: payout.id,
      contractId: contractId || null,
    });
    await payoutRecord.save();
    res.json({ payout, contractId: contractId || null });
  } catch (err) {
    console.error('[Payout] Error:', err);
    res.status(500).json({ error: 'Failed to create payout', details: err?.message || err });
  }
});

// Get payout history for a user
app.get('/api/payouts', async (req, res) => {
  try {
    const { uuid } = req.query;
    if (!uuid) return res.status(400).json({ error: 'Missing uuid parameter.' });
    const payouts = await Payout.find({ userUuid: uuid }).sort({ createdAt: -1 });
    // Add contractId to each payout in response
    res.json({ payouts: payouts.map(p => ({
      ...p.toObject(),
      contractId: p.contractId || '-',
    })) });
  } catch (err) {
    console.error('[Payouts] Error:', err);
    res.status(500).json({ error: 'Failed to fetch payout history', details: err?.message || err });
  }
});

// Admin: get all payouts
app.get('/api/admin/payouts', async (req, res) => {
  try {
    // TODO: Add admin authentication/authorization
    const payouts = await Payout.find({}).sort({ createdAt: -1 });
    res.json({ payouts });
  } catch (err) {
    console.error('[Admin Payouts] Error:', err);
    res.status(500).json({ error: 'Failed to fetch all payouts', details: err?.message || err });
  }
});

// Admin: update payout status
app.post('/api/admin/payouts/update', async (req, res) => {
  try {
    // TODO: Add admin authentication/authorization
    const { payoutId, status } = req.body;
    const payout = await Payout.findOneAndUpdate({ payoutId }, { status }, { new: true });
    if (!payout) return res.status(404).json({ error: 'Payout not found.' });
    res.json({ payout });
  } catch (err) {
    console.error('[Admin Update Payout] Error:', err);
    res.status(500).json({ error: 'Failed to update payout', details: err?.message || err });
  }
});
// Route: Payment intent creation (uses recipientUuid)
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', fee, recipientUuid } = req.body;
    // Look up recipient by UUID
    let recipient = recipientUuid ? await User.findOne({ uuid: recipientUuid }) : null;
    if (!recipient) return res.status(404).json({ error: 'Recipient not found.' });

    // Automatically create Stripe account if not present
    if (!recipient.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: recipient.email,
        capabilities: { transfers: { requested: true } },
      });
      recipient.stripeAccountId = account.id;
      await recipient.save();
    }

    // Create payment intent (demo: not actually transferring funds)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      transfer_data: {
        destination: recipient.stripeAccountId,
      },
      // Add fee logic if needed
    });
    res.json({ clientSecret: paymentIntent.client_secret, recipient: recipient.email });
  } catch (err) {
    console.error('[Payment Intent] Error:', err);
    res.status(500).json({ error: 'Failed to create payment intent', details: err?.message || err });
  }
});
// Apple Pay payment intent endpoint
app.post('/api/create-applepay-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', recipientUuid } = req.body;
    let recipient = recipientUuid ? await User.findOne({ uuid: recipientUuid }) : null;
    if (!recipient) return res.status(404).json({ error: 'Recipient not found.' });
    // Auto-create Stripe account if needed
    if (!recipient.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: recipient.email,
        capabilities: { transfers: { requested: true } },
      });
      recipient.stripeAccountId = account.id;
      await recipient.save();
    }
    // Create payment intent for Apple Pay
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method_types: ['card', 'apple_pay'],
      transfer_data: { destination: recipient.stripeAccountId },
    });
    res.json({ clientSecret: paymentIntent.client_secret, recipient: recipient.email });
  } catch (err) {
    console.error('[Apple Pay Intent] Error:', err);
    res.status(500).json({ error: 'Failed to create Apple Pay payment intent', details: err?.message || err });
  }
});

// Google Pay payment intent endpoint
app.post('/api/create-googlepay-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', recipientUuid } = req.body;
    let recipient = recipientUuid ? await User.findOne({ uuid: recipientUuid }) : null;
    if (!recipient) return res.status(404).json({ error: 'Recipient not found.' });
    // Auto-create Stripe account if needed
    if (!recipient.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: recipient.email,
        capabilities: { transfers: { requested: true } },
      });
      recipient.stripeAccountId = account.id;
      await recipient.save();
    }
    // Create payment intent for Google Pay
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method_types: ['card', 'google_pay'],
      transfer_data: { destination: recipient.stripeAccountId },
    });
    res.json({ clientSecret: paymentIntent.client_secret, recipient: recipient.email });
  } catch (err) {
    console.error('[Google Pay Intent] Error:', err);
    res.status(500).json({ error: 'Failed to create Google Pay payment intent', details: err?.message || err });
  }
});

// Local payment endpoint
app.post('/api/create-local-payment', async (req, res) => {
  try {
    const { amount, currency = 'usd', recipientUuid, reference } = req.body;
    let recipient = recipientUuid ? await User.findOne({ uuid: recipientUuid }) : null;
    if (!recipient) return res.status(404).json({ error: 'Recipient not found.' });
    // Simulate local payment processing
    // You can add custom logic here for local payment verification
    res.json({ success: true, message: 'Local payment submitted.', reference, recipient: recipient.email });
  } catch (err) {
    console.error('[Local Payment] Error:', err);
    res.status(500).json({ error: 'Failed to process local payment', details: err?.message || err });
  }
});
app.post('/read-file', async (req, res) => {
  const { filePath } = req.body;
  try {
    const data = await readLocalFile(filePath);
    res.json({ content: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/write-file', async (req, res) => {
  const { filePath, content } = req.body;
  try {
    await writeLocalFile(filePath, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-clause', async (req, res) => {
  console.log('[generate-clause] req.body:', req.body); // Debug log to inspect incoming payload
  try {
    const { title, description, amount, deadline, requirements = '', tone = 'formal', language = 'English', includeDispute = false, numClauses = 1 } = req.body;
    if (!title || !description || !amount || !deadline) {
      console.error('[generate-clause] 400: Missing required fields', req.body);
      return res.status(400).json({ error: "Missing required fields in request body.", details: req.body });
    }
    const clauses = [];
    for (let i = 0; i < numClauses; i++) {
      const prompt = buildClausePrompt({ title, description, amount, deadline, requirements, tone, language, includeDispute });
      // Use OpenAI (opai) for clause generation
      const clause = await query({ prompt, model: 'gpt-3.5-turbo', stream: false });
      if (clause && typeof clause === 'string') {
        clauses.push(clause);
      } else if (clause && clause.output) {
        clauses.push(clause.output);
      } else {
        clauses.push(JSON.stringify(clause));
      }
    }
    console.log('[generate-clause] clauses:', clauses);
    res.json({ output: clauses });
  } catch (err) {
    console.error('[generate-clause] OpenAI error:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate clause', details: err?.response?.data || err?.message || err });
  }
});
//# sourceMappingURL=index.js.map
app.post('/api/contracts/sign', async (req, res) => {
  try {
    console.log('[SignContract] Incoming request body:', req.body);
    const { contractId, signature } = req.body;
    const contract = await Contract.findById(contractId);
    if (!contract) {
      console.log('[SignContract] Contract not found for ID:', contractId);
      return res.status(404).json({ error: 'Contract not found.' });
    }
    console.log('[SignContract] Existing signatures before:', contract.signatures);
    contract.signatures.push(signature);
    console.log('[SignContract] Added signature:', signature);
    // Check if both originator and recipient have signed
    const hasOriginatorSignature = contract.signatures.some(sig => sig.role === 'originator');
    const hasRecipientSignature = contract.signatures.some(sig => sig.role === 'recipient');
    console.log('[SignContract] hasOriginatorSignature:', hasOriginatorSignature, 'hasRecipientSignature:', hasRecipientSignature);
    if (hasOriginatorSignature && hasRecipientSignature) {
      contract.status = 'signed';
      console.log('[SignContract] Status set to signed');
    } else {
      contract.status = 'pending';
      console.log('[SignContract] Status set to pending');
    }
    await contract.save();
    console.log('[SignContract] Contract saved:', contract._id, 'Status:', contract.status);
    res.json({ message: 'Contract signed.', contract });
  } catch (err) {
    console.error('[SignContract] Error:', err);
    res.status(500).json({ error: 'Failed to sign contract', details: err.message });
  }
});

