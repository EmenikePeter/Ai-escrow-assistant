import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contractId: { type: String },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'local_payment', 'payout', 'adjustment'],
      required: true,
    },
    status: { type: String, default: 'pending' },
    reference: { type: String },
    paymentIntentId: { type: String },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;
