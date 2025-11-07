import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null until assigned
  isOpen: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

export default mongoose.model("ChatRoom", chatRoomSchema);
