import mongoose from 'mongoose';

const teamInviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const TeamInvite = mongoose.model('TeamInvite', teamInviteSchema);
export default TeamInvite;
