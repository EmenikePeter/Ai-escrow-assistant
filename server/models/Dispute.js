import mongoose from "mongoose";

const DisputeSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
  status: { type: String, default: "open" },
  reason: String,
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  // Add other fields as needed
});

const Dispute = mongoose.model("Dispute", DisputeSchema);
export default Dispute;
