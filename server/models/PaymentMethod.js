import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['card', 'local', 'applepay', 'googlepay'],
      required: true,
    },
    label: { type: String },
    brand: { type: String },
    last4: { type: String },
    reference: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ user: 1, type: 1 }, { unique: true });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
export default PaymentMethod;
