import ChatSession from '../models/ChatSession.js';
import Message from '../models/Message.js';

// Get or create a chat session between two users (by email)
export async function getOrCreateSession(emailA, emailB) {
  const participants = [emailA, emailB].sort();
  let session = await ChatSession.findOne({ participants });
  if (!session) {
    session = await ChatSession.create({ participants });
  }
  return session;
}

// Get the last message for a session
export async function getLastMessage(sessionId) {
  return await Message.findOne({ sessionId }).sort({ time: -1 });
}

// Get unread message count for a session for a user
export async function getUnreadCount(sessionId, userEmail) {
  return await Message.countDocuments({ sessionId, sender: { $ne: userEmail }, read: false });
}
