import mongoose from 'mongoose';

const SupportChatSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // email or 'SupportAgent'
  text: { type: String, required: true },
  room: { type: String, default: 'support' }, // for future multi-room support
  agent: { type: String }, // assigned support agent email or name
  role: { type: String, enum: ['user', 'agent'], required: true },
  repliedAt: { type: Date },
  time: { type: Date, default: Date.now },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
});

const SupportChat = mongoose.model('SupportChat', SupportChatSchema);
export default SupportChat;
