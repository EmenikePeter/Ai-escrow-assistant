import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  users: [{ type: String, required: true }], // array of two user emails or IDs
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  requestedBy: { type: String, required: true }, // email or ID of user who sent the invite
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

connectionSchema.index({ users: 1 }, { unique: true }); // Only one connection per user pair

connectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Connection', connectionSchema);
