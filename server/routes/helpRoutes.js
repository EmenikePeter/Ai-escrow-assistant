import express from 'express';
import nodemailer from 'nodemailer';
import HelpIssue from '../models/HelpIssue.js';

const router = express.Router();

// GET /api/help/issues
router.get('/issues', async (req, res) => {
  try {
    const issues = await HelpIssue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch help issues.', error: err.message });
  }
});

// POST /api/help/reply
router.post('/reply', async (req, res) => {
  const { email, message, issueId } = req.body;
  if (!email || !message) {
    return res.status(400).json({ message: 'Missing email or message.' });
  }
  try {
    // Optionally update the HelpIssue with the reply
    if (issueId) {
      await HelpIssue.findByIdAndUpdate(issueId, { $set: { adminReply: message, repliedAt: new Date() } });
    }
    // Send email to user
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Support Reply',
      text: message,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Reply sent successfully.' });
  } catch (err) {
    console.error('[Help Reply] Error:', err);
    res.status(500).json({ message: 'Failed to send reply.', error: err.message });
  }
});

// POST /api/help/issue
router.post('/issue', async (req, res) => {
  try {
    const { email, category, message } = req.body;
    if (!email || !category || !message) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    // Store issue in MongoDB
    const issue = new HelpIssue({ email, category, message });
    await issue.save();
    res.status(201).json({ message: 'Issue submitted successfully.', data: issue });
  } catch (err) {
    console.error('[Help Issue] Error:', err);
    res.status(500).json({ message: 'Error submitting issue.', error: err.message });
  }
});

export default router;
