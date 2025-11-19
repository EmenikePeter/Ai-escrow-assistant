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
  freelancerStripeAccountId: { type: String },
  clientStripeCustomerId: { type: String },
  escrowStatus: {
    type: String,
    enum: ['not_funded', 'pending_funding', 'funded', 'partially_released', 'released', 'payout_requested', 'completed', 'local_review'],
    default: 'not_funded'
  },
  escrowedAmount: { type: Number, default: 0 },
  releasedAmount: { type: Number, default: 0 },
  lastPaymentIntentId: { type: String },
  lastEscrowActivityAt: { type: Date },
  localPaymentReference: { type: String },
  escrowHistory: [
    {
      type: { type: String },
      status: { type: String },
      amount: { type: Number },
      currency: { type: String },
      paymentIntentId: { type: String },
      reference: { type: String },
      actor: { type: String },
      note: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  riskFlags: [{ type: String }],
  riskSummary: { type: String },
}, { timestamps: true });

export default mongoose.model('Contract', ContractSchema);
