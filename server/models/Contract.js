import mongoose from 'mongoose';

const PartySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  uuid: { type: String },
  role: { type: String, required: false }
}, { _id: false });

const SignatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  uuid: { type: String },
  role: { type: String, required: true },
  signature: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { _id: false });

const ContractSchema = new mongoose.Schema({
  originator: { type: PartySchema, required: true },
  recipient: { type: PartySchema, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  deadline: { type: String, required: true },
  clauses: [{ type: String }],
  disputeClause: { type: String },
  status: { type: String, enum: ['draft', 'sent', 'signed'], default: 'draft' },
  signatures: [SignatureSchema],
  penalties: [{ type: String }],
  milestones: [{ type: String }],
  inspectionRequirements: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Contract', ContractSchema);
