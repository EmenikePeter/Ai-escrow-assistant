/**
 * Add a reaction to a message
 */
export async function addReaction(messageId, emoji, user) {
  // Remove previous reaction by this user (for this emoji)
  await Message.updateOne(
    { _id: messageId },
    { $pull: { reactions: { user } } }
  );
  // Add new reaction
  return Message.findByIdAndUpdate(
    messageId,
    { $push: { reactions: { emoji, user } } },
    { new: true }
  );
}

/**
 * Edit a message's text
 */
export async function editMessage(messageId, newText, user) {
  // Only allow if user is sender
  return Message.findOneAndUpdate(
    { _id: messageId, sender: user },
    { text: newText },
    { new: true }
  );
}

/**
 * Delete a message (soft delete: blank text and mark as deleted)
 */
export async function deleteMessage(messageId, user) {
  // Only allow if user is sender
  return Message.findOneAndUpdate(
    { _id: messageId, sender: user },
    { text: '', fileUrl: '', fileType: '', deleted: true },
    { new: true }
  );
}
import ChatSession from './models/ChatSession.js';
import Message from './models/Message.js';

// This file contains helper functions for chat session and message management

/**
 * Find or create an open chat session for a user.
 * If no open session exists, create a new one.
 */
export async function getOrCreateOpenSession(userEmail) {
  let session = await ChatSession.findOne({ userEmail, status: 'open' });
  if (!session) {
    session = await ChatSession.create({ userEmail });
  }
  return session;
}

/**
 * Assign an agent to a session (if not already assigned)
 */
export async function assignAgentToSession(sessionId, agentEmail) {
  return ChatSession.findOneAndUpdate(
    { _id: sessionId, agentEmail: null, status: 'open' },
    { agentEmail },
    { new: true }
  );
}

/**
 * Close a session
 */
export async function closeSession(sessionId) {
  return ChatSession.findByIdAndUpdate(
    sessionId,
    { status: 'closed', closedAt: new Date() },
    { new: true }
  );
}

/**
 * Save a message to a session
 */
export async function saveMessage(sessionId, sender, from, text, clientId, fileUrl, fileType, status = 'sent') {
  return Message.create({ sessionId, sender, from, text, clientId, fileUrl, fileType, status });
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(sessionId) {
  return Message.find({ sessionId }).sort({ time: 1 });
}
