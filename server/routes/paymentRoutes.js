import express from 'express';
import Stripe from 'stripe';
import auth from '../middleware/auth.js';
import Contract from '../models/Contract.js';
import PaymentMethod from '../models/PaymentMethod.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';

const router = express.Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const ensureStripeConfigured = () => {
  if (!stripe) {
    const error = new Error('Stripe secret key not configured');
    error.statusCode = 500;
    throw error;
  }
};

const appendEscrowHistory = (contractDoc, entry) => {
  if (!contractDoc) return;
  if (!Array.isArray(contractDoc.escrowHistory)) {
    contractDoc.escrowHistory = [];
  }
  contractDoc.escrowHistory.push({ ...entry, createdAt: entry?.createdAt || new Date() });
};

router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    ensureStripeConfigured();
    const { contractId, amount, currency = 'usd', recipientUuid, fee } = req.body;
    if (!contractId) {
      return res.status(400).json({ message: 'contractId is required.' });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found.' });
    }

    const finalAmount = typeof amount === 'number' ? amount : contract.amount;
    if (!finalAmount) {
      return res.status(400).json({ message: 'A valid amount is required.' });
    }

    let recipient = null;
    if (recipientUuid) {
      recipient = await User.findOne({ uuid: recipientUuid });
    }
    if (!recipient && contract.recipient?.email) {
      recipient = await User.findOne({ email: contract.recipient.email });
    }

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }

    if (!recipient.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: recipient.email,
        capabilities: { transfers: { requested: true } },
      });
      recipient.stripeAccountId = account.id;
      await recipient.save();
    }

    const paymentIntentParams = {
      amount: Math.round(finalAmount * 100),
      currency,
      transfer_data: {
        destination: recipient.stripeAccountId,
      },
    };

    if (typeof fee === 'number' && !Number.isNaN(fee)) {
      paymentIntentParams.application_fee_amount = Math.round(Math.max(fee, 0) * 100);
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    contract.freelancerStripeAccountId = recipient.stripeAccountId;
    contract.escrowStatus = 'pending_funding';
    contract.lastPaymentIntentId = paymentIntent.id;
    contract.escrowedAmount = finalAmount;
    contract.lastEscrowActivityAt = new Date();
    appendEscrowHistory(contract, {
      type: 'payment_intent',
      status: 'created',
      amount: finalAmount,
      currency,
      paymentIntentId: paymentIntent.id,
      actor: req.user.email,
    });
    await contract.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      recipient: recipient.email,
      contract,
    });
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    console.error('[PaymentRoutes] Failed to create payment intent:', error);
    res.status(status).json({ message: 'Failed to create payment intent.', error: error?.message || error });
  }
});

router.post('/contracts/:contractId/escrow/confirm', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { paymentIntentId, amount, currency = 'usd', methodType = 'card' } = req.body;
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found.' });
    }

    const finalAmount = typeof amount === 'number' ? amount : contract.escrowedAmount || contract.amount;
    if (!finalAmount) {
      return res.status(400).json({ message: 'A valid amount is required to confirm escrow funding.' });
    }

    contract.escrowStatus = 'funded';
    contract.escrowedAmount = finalAmount;
    contract.lastPaymentIntentId = paymentIntentId || contract.lastPaymentIntentId;
    contract.lastEscrowActivityAt = new Date();
    appendEscrowHistory(contract, {
      type: 'deposit',
      status: 'succeeded',
      amount: finalAmount,
      currency,
      paymentIntentId,
      actor: req.user.email,
      note: methodType === 'local' ? 'Local payment recorded.' : 'Card payment confirmed.',
    });
    await contract.save();

    const payerEmail = contract.originator?.email;
    const payer = payerEmail ? await User.findOne({ email: payerEmail }) : null;
    if (payer) {
      await WalletTransaction.findOneAndUpdate(
        {
          user: payer._id,
          contractId,
          type: 'deposit',
          paymentIntentId: paymentIntentId || undefined,
        },
        {
          $set: {
            status: 'succeeded',
            amount: finalAmount,
            currency,
            description: `Escrow deposit for ${contract.title || contractId}`,
            metadata: {
              methodType,
              confirmedBy: req.user.email,
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ contract });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to confirm escrow funding:', error);
    res.status(500).json({ message: 'Failed to confirm escrow funding.', error: error?.message || error });
  }
});

router.post('/release-funds', auth, async (req, res) => {
  try {
    const { contractId, amount, paymentIntentId, currency = 'usd' } = req.body;
    if (!contractId) {
      return res.status(400).json({ message: 'contractId is required to release funds.' });
    }
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found.' });
    }

    const releaseAmount = typeof amount === 'number' ? amount : contract.escrowedAmount;
    if (!releaseAmount) {
      return res.status(400).json({ message: 'A valid amount is required to release funds.' });
    }

    contract.releasedAmount = (contract.releasedAmount || 0) + releaseAmount;
    const remainingEscrow = Math.max((contract.escrowedAmount || 0) - (contract.releasedAmount || 0), 0);
    contract.escrowStatus = remainingEscrow > 0 ? 'partially_released' : 'released';
    contract.lastEscrowActivityAt = new Date();
    appendEscrowHistory(contract, {
      type: 'release',
      status: 'succeeded',
      amount: releaseAmount,
      currency,
      paymentIntentId: paymentIntentId || contract.lastPaymentIntentId,
      actor: req.user.email,
    });
    await contract.save();

    const recipientEmail = contract.recipient?.email;
    const recipient = recipientEmail ? await User.findOne({ email: recipientEmail }) : null;
    if (recipient) {
      await WalletTransaction.create({
        user: recipient._id,
        contractId,
        type: 'payout',
        status: 'available',
        amount: releaseAmount,
        currency,
        paymentIntentId: paymentIntentId || contract.lastPaymentIntentId,
        description: `Escrow release for ${contract.title || contractId}`,
        metadata: {
          releasedBy: req.user.email,
        },
      });
    }

    res.json({ contract, remainingEscrow });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to release funds:', error);
    res.status(500).json({ message: 'Failed to release funds.', error: error?.message || error });
  }
});

router.post('/create-stripe-account', auth, async (req, res) => {
  try {
    ensureStripeConfigured();
    const targetEmail = req.body?.email || req.user.email;
    if (!targetEmail) {
      return res.status(400).json({ message: 'Email is required to create a Stripe account.' });
    }

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        business_type: 'individual',
        capabilities: { transfers: { requested: true } },
      });
      user.stripeAccountId = account.id;
      await user.save();
    }

    const refreshUrl = process.env.STRIPE_ONBOARD_REFRESH_URL || process.env.FRONTEND_URL || 'https://ai-escrowassistant.com';
    const returnUrl = process.env.STRIPE_ONBOARD_RETURN_URL || process.env.FRONTEND_URL || 'https://ai-escrowassistant.com';

    const link = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    res.json({ accountId: user.stripeAccountId, onboardingUrl: link.url });
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    console.error('[PaymentRoutes] Failed to create Stripe account link:', error);
    res.status(status).json({ message: 'Failed to create Stripe onboarding link.', error: error?.message || error });
  }
});

router.get('/wallet/summary', auth, async (req, res) => {
  try {
    const [transactions, contracts] = await Promise.all([
      WalletTransaction.find({ user: req.user._id }).lean(),
      Contract.find({
        $or: [
          { 'originator.email': { $regex: new RegExp(`^${req.user.email}$`, 'i') } },
          { 'recipient.email': { $regex: new RegExp(`^${req.user.email}$`, 'i') } },
        ],
      }).lean(),
    ]);

    const summary = {
      available: 0,
      pending: 0,
      escrowed: 0,
      inReview: 0,
      lastUpdated: new Date().toISOString(),
    };

    transactions.forEach((tx) => {
      const amount = typeof tx.amount === 'number' ? tx.amount : 0;
      if (!amount) return;
      if (tx.type === 'payout' && tx.status === 'available') {
        summary.available += amount;
      }
      if (tx.type === 'withdrawal' && tx.status === 'pending') {
        summary.pending += Math.abs(amount);
      }
      if (tx.type === 'local_payment' && tx.status === 'submitted') {
        summary.inReview += amount;
      }
    });

    const normalize = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0);
    contracts.forEach((contract) => {
      const escrowed = Math.max(normalize(contract.escrowedAmount) - normalize(contract.releasedAmount), 0);
      if (!escrowed) return;
      const originatorEmail = contract.originator?.email?.toLowerCase();
      const recipientEmail = contract.recipient?.email?.toLowerCase();
      const requester = req.user.email?.toLowerCase();
      if (originatorEmail === requester || recipientEmail === requester) {
        summary.escrowed += escrowed;
      }
    });

    res.json({ summary });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to build wallet summary:', error);
    res.status(500).json({ message: 'Failed to build wallet summary.', error: error?.message || error });
  }
});

router.get('/contracts/:contractId/risk', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found.' });
    }

    const flags = [];
    if ((contract.amount || 0) >= 10000) {
      flags.push('High-value contract. Extra verification recommended.');
    }
    if (!Array.isArray(contract.signatures) || contract.signatures.length < 2) {
      flags.push('Awaiting required signatures.');
    }
    if (contract.escrowStatus !== 'funded' && contract.escrowStatus !== 'partially_released') {
      flags.push('Escrow not fully funded.');
    }
    if (contract.localPaymentReference && contract.escrowStatus === 'local_review') {
      flags.push('Local payment waiting for manual review.');
    }
    if (contract.deadline) {
      const deadline = new Date(contract.deadline);
      if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) {
        flags.push('Contract deadline has passed.');
      }
    }

    const summary = flags.length
      ? 'Review the highlighted risk signals before proceeding.'
      : 'No elevated risk detected for this contract.';

    contract.riskFlags = flags;
    contract.riskSummary = summary;
    await contract.save();

    res.json({ flags, summary });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to compute risk signals:', error);
    res.status(500).json({ message: 'Failed to compute risk signals.', error: error?.message || error });
  }
});

const serializePaymentMethod = (methodDoc) => {
  if (!methodDoc) return null;
  const method = methodDoc.toObject ? methodDoc.toObject() : methodDoc;
  const fallbackLabel = (() => {
    if (method.type === 'card') {
      const brand = method.brand || 'Card';
      return method.last4 ? `${brand} ending ${method.last4}` : brand;
    }
    if (method.type === 'local') {
      return method.reference ? `Local reference ${method.reference}` : 'Local payment method';
    }
    return method.type;
  })();
  return {
    id: method._id?.toString() || method.id,
    type: method.type,
    label: method.label || fallbackLabel,
    brand: method.brand,
    last4: method.last4,
    reference: method.reference,
    createdAt: method.createdAt,
    updatedAt: method.updatedAt,
  };
};

const serializeTransaction = (transactionDoc) => {
  if (!transactionDoc) return null;
  const tx = transactionDoc.toObject ? transactionDoc.toObject() : transactionDoc;
  return {
    id: tx._id?.toString() || tx.id,
    type: tx.type,
    status: tx.status,
    amount: typeof tx.amount === 'number' ? tx.amount : 0,
    currency: tx.currency || 'usd',
    contractId: tx.contractId || null,
    reference: tx.reference || null,
    description: tx.description || null,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
};

router.get('/payment-methods', auth, async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ methods: methods.map(serializePaymentMethod).filter(Boolean) });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to fetch payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods.', error: error?.message || error });
  }
});

router.post('/payment-methods', auth, async (req, res) => {
  try {
    const { type, reference, cardSummary = {}, label, metadata = {} } = req.body;
    const allowedTypes = ['card', 'local', 'applepay', 'googlepay'];
    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid or missing payment method type.' });
    }

    if (type === 'card' && (!cardSummary.brand || !cardSummary.last4)) {
      return res.status(400).json({ message: 'Card summary with brand and last4 is required for card methods.' });
    }

    if (type === 'local' && !reference) {
      return res.status(400).json({ message: 'Reference is required for local payment methods.' });
    }

    const computedLabel = label
      || (type === 'card'
        ? `${cardSummary.brand || 'Card'}${cardSummary.last4 ? ` ending ${cardSummary.last4}` : ''}`
        : type === 'local'
        ? `Local reference ${reference}`
        : type);

    const update = {
      type,
      label: computedLabel,
      brand: type === 'card' ? cardSummary.brand : undefined,
      last4: type === 'card' ? cardSummary.last4 : undefined,
      reference: type === 'local' ? reference : undefined,
      metadata,
      updatedAt: new Date(),
    };

    await PaymentMethod.findOneAndUpdate(
      { user: req.user._id, type },
      { $set: update, $setOnInsert: { user: req.user._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const methods = await PaymentMethod.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ message: 'Payment method saved.', methods: methods.map(serializePaymentMethod).filter(Boolean) });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to save payment method:', error);
    res.status(500).json({ message: 'Failed to save payment method.', error: error?.message || error });
  }
});

router.post('/payments/local', auth, async (req, res) => {
  try {
    const { contractId, reference, amount, currency = 'usd' } = req.body;
    if (!contractId) {
      return res.status(400).json({ message: 'Contract ID is required to record a local payment.' });
    }
    if (!reference) {
      return res.status(400).json({ message: 'Reference is required to record a local payment.' });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found.' });
    }

    const transactionAmount = typeof amount === 'number' ? amount : contract.amount || 0;

    const transaction = await WalletTransaction.create({
      user: req.user._id,
      contractId,
      amount: transactionAmount,
      currency,
      type: 'local_payment',
      status: 'submitted',
      reference,
      description: `Local payment submitted for contract ${contract.title || contractId}.`,
      metadata: {
        contractTitle: contract.title || '',
        submittedBy: req.user.email,
      },
    });

    contract.localPaymentReference = reference;
    contract.escrowStatus = 'local_review';
    contract.escrowedAmount = transactionAmount;
    contract.lastEscrowActivityAt = new Date();
    appendEscrowHistory(contract, {
      type: 'local_payment',
      status: 'submitted',
      amount: transactionAmount,
      currency,
      reference,
      actor: req.user.email,
      note: 'Local payment submitted for manual review.',
    });
    await contract.save();

    res.json({
      message: 'Local payment submitted for review.',
      transaction: serializeTransaction(transaction),
      contract,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to record local payment:', error);
    res.status(500).json({ message: 'Failed to record local payment.', error: error?.message || error });
  }
});

router.get('/wallet/history', auth, async (req, res) => {
  try {
    const { contractId, limit } = req.query;
    const query = { user: req.user._id };
    if (contractId) {
      query.contractId = contractId;
    }
    const historyLimit = Math.min(Number(limit) || 50, 100);
    const history = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(historyLimit)
      .lean();
    res.json({ history: history.map(serializeTransaction).filter(Boolean) });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to fetch wallet history:', error);
    res.status(500).json({ message: 'Failed to fetch wallet history.', error: error?.message || error });
  }
});

router.post('/wallet/withdraw', auth, async (req, res) => {
  try {
    const { bankName, accountNumber, iban, accountHolder, amount, currency = 'usd' } = req.body;
    if (!bankName || !accountNumber || !iban || !accountHolder) {
      return res.status(400).json({ message: 'All bank details are required.' });
    }

    const maskedAccount = accountNumber.slice(-4);

    const transaction = await WalletTransaction.create({
      user: req.user._id,
      type: 'withdrawal',
      status: 'pending',
      amount: typeof amount === 'number' ? amount : 0,
      currency,
      reference: maskedAccount ? `****${maskedAccount}` : undefined,
      description: `Withdrawal to ${bankName}`,
      metadata: {
        bankName,
        iban,
        accountHolder,
        maskedAccount,
      },
    });

    res.json({
      message: 'Withdrawal request received. We will process it shortly.',
      transaction: serializeTransaction(transaction),
    });
  } catch (error) {
    console.error('[PaymentRoutes] Failed to process withdrawal:', error);
    res.status(500).json({ message: 'Failed to process withdrawal.', error: error?.message || error });
  }
});

export default router;
