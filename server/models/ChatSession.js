import mongoose from "mongoose";


const chatSessionSchema = new mongoose.Schema({
  participants: {
    type: [String], // array of user emails or IDs
    required: true,
    validate: [arr => arr.length === 2, 'A session must have exactly 2 participants']
  },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
});

// Prevent duplicate sessions between the same two users (regardless of order)
chatSessionSchema.index({ participants: 1 }, { unique: true });

chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

chatSessionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.model("ChatSession", chatSessionSchema);
