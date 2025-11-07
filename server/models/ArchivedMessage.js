import mongoose from "mongoose";
const archivedMessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true },
  sender: { type: String, required: true },
  from: { type: String, enum: ["user", "agent"], required: true },
  text: { type: String, required: false },
  time: { type: Date, default: Date.now },
  clientId: { type: String },
  fileUrl: { type: String },
  fileType: { type: String },
  read: { type: Boolean, default: false },
  archivedAt: { type: Date, default: Date.now }
});

export default mongoose.model("ArchivedMessage", archivedMessageSchema);
