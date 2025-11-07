import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true },
  sender: { type: String, required: true }, // user or agent email
  from: { type: String, enum: ["user", "agent"], required: true },
  text: { type: String, required: false },
  time: { type: Date, default: Date.now },
  clientId: { type: String },
  fileUrl: { type: String },
  fileType: { type: String },
  read: { type: Boolean, default: false },
  status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  reactions: [
    {
      emoji: { type: String },
      user: { type: String }, // user email/id
    },
  ],
  deleted: { type: Boolean, default: false }, // Soft delete flag
});

export default mongoose.model("Message", messageSchema);
