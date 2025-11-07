import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  fileUrl: { type: String },
  fileType: { type: String }, // "image", "pdf", "docx", etc
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ChatMessage', ChatMessageSchema);
