import express from 'express';
import auth from '../middleware/auth.js';
import Contract from '../models/Contract.js';
const router = express.Router();

// Get all contracts for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    let contracts;
    if (req.user && req.user.email) {
      // Dashboard contracts logic
      let dashboardQuery;
      if (req.query.email) {
        const { email } = req.query;
        dashboardQuery = {
          $or: [
            { 'originator.email': { $regex: `^${email}$`, $options: 'i' } },
            { 'recipient.email': { $regex: `^${email}$`, $options: 'i' } },
            { 'signatures.email': email }
          ]
        };
      } else {
        dashboardQuery = {
          $or: [
            { 'originator.email': { $regex: new RegExp(`^${req.user.email}$`, 'i') } },
            { 'recipient.email': { $regex: new RegExp(`^${req.user.email}$`, 'i') } },
            { 'signatures.email': req.user.email }
          ]
        };
      }
      contracts = await Contract.find(dashboardQuery);
      if (contracts.length === 0) {
      }
      contracts.forEach(c => {
        const matchesRecipientObj = c.recipient?.email && req.user.email && c.recipient.email.toLowerCase() === req.user.email.toLowerCase();
        const matchesOriginator = c.originator?.email && req.user.email && c.originator.email.toLowerCase() === req.user.email.toLowerCase();
        const isSigned = c.status === 'signed';
        const isPending = c.status === 'pending';
        const isSent = c.status === 'sent';
        if (matchesRecipientObj) {
        }
        if (!matchesRecipientObj) {
        }
        if (matchesOriginator) {
          console.log(`[DashboardContracts] User email matches originator for contract _id=${c._id}`);
        } else {
          console.log(`[DashboardContracts] User email does NOT match originator for contract _id=${c._id}`);
        }
        if (isSigned) {
          console.log(`[DashboardContracts] Contract _id=${c._id} is signed.`);
        } else if (isPending) {
          console.log(`[DashboardContracts] Contract _id=${c._id} is pending.`);
        } else if (isSent) {
          console.log(`[DashboardContracts] Contract _id=${c._id} is sent.`);
        } else {
          console.log(`[DashboardContracts] Contract _id=${c._id} has unknown status: ${c.status}`);
        }
        // Granular diagnostics for recipient visibility
        if ((matchesRecipientObj) && (isSigned || isPending || isSent)) {
          console.log(`[DashboardContracts] Recipient should see contract _id=${c._id} in dashboard.`);
        } else if (matchesRecipientObj) {
          console.log(`[DashboardContracts] Recipient matches but contract status (${c.status}) may prevent visibility.`);
        } else {
          console.log(`[DashboardContracts] Recipient does not match for contract _id=${c._id}.`);
        }
      });
    }
    res.json({ contracts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contracts.' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json({ message: 'Contract updated', contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contract', details: err?.message || err });
  }
});

// Update contract by id (PATCH)
router.patch('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json({ message: 'Contract updated', contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contract', details: err?.message || err });
  }
});
// Save contract as draft
router.post('/draft', auth, async (req, res) => {
  try {
    const contractData = req.body;
  console.log('[Draft] Incoming contract data:', contractData);
  console.log('[Draft] Penalties:', contractData.penalties);
  console.log('[Draft] Milestones:', contractData.milestones);
  console.log('[Draft] Inspection Requirements:', contractData.inspectionRequirements);
    // Ensure originator is set from logged-in user
    contractData.originator = {
      name: req.user.name,
      email: req.user.email,
      uuid: req.user.uuid,
      role: contractData.originatorRole || 'originator'
    };
    // Use existing recipient object if present and valid, otherwise build from fields
    if (
      contractData.recipient &&
      typeof contractData.recipient === 'object' &&
      contractData.recipient.name &&
      contractData.recipient.email
    ) {
      // Use as is, but trim
      contractData.recipient.name = contractData.recipient.name.trim();
      contractData.recipient.email = contractData.recipient.email.trim();
    } else {
      contractData.recipient = {
        name: contractData.recipientName?.trim() || '',
        email: contractData.recipientEmail?.trim() || '',
        uuid: contractData.recipientUuid || '',
        role: contractData.recipientRole || 'recipient'
      };
    }
    contractData.status = 'draft';
    // Check for missing required fields
    const requiredFields = ['originator', 'recipient', 'title', 'description', 'amount', 'deadline'];
    const missingFields = requiredFields.filter(f => {
      if (f === 'originator' || f === 'recipient') {
        return !contractData[f] || !contractData[f].name || !contractData[f].email;
      }
      return !contractData[f];
    });
    if (missingFields.length > 0) {
      console.error('[Draft] Missing required fields:', missingFields);
      return res.status(400).json({ error: 'Missing required fields', missingFields });
    }
    try {
      const contract = new Contract(contractData);
      await contract.save();
      res.json({ message: 'Contract saved as draft.', contract });
    } catch (validationErr) {
      console.error('[Draft] Validation error:', validationErr);
      return res.status(400).json({ error: 'Validation error', details: validationErr?.message || validationErr });
    }
  } catch (err) {
    console.error('[Draft] Error saving contract:', err);
    res.status(500).json({ error: 'Failed to save draft contract.', details: err?.message || err });
  }
});
// Send contract (sign & send by originator)
router.post('/send', auth, async (req, res) => {
  try {
    const contractData = req.body;
    // Ensure originator is set from logged-in user
    contractData.originator = {
      name: req.user.name,
      email: req.user.email,
      uuid: req.user.uuid,
      role: contractData.originatorRole || 'originator'
    };
    // Recipient info from selection
    contractData.recipient = {
      name: contractData.recipientName,
      email: contractData.recipientEmail,
      uuid: contractData.recipientUuid,
      role: contractData.recipientRole || 'recipient'
    };
    // Add originator signature
    const signatureEntry = {
      name: req.user.name,
      email: req.user.email,
      uuid: req.user.uuid,
      role: contractData.selectedRole || contractData.originatorRole || 'originator',
      signature: contractData.signature,
      date: new Date()
    };
    contractData.signatures = [signatureEntry];
    contractData.status = 'sent';
    const contract = new Contract(contractData);
    await contract.save();
    res.json({ message: 'Contract sent.', contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send contract.' });
  }
});

// Get contracts received by the logged-in user (as freelancer)
router.get('/received', auth, async (req, res) => {
  try {
    let contracts;
    if (req.user && req.user.email) {
      const receivedQuery = {
        $and: [
          {
            $or: [
              { 'recipient.email': req.user.email },
              {
                $and: [
                  { 'originator.email': req.user.email },
                  { status: 'signed' }
                ]
              }
            ]
          },
          { status: { $in: ['sent', 'signed'] } }
        ]
      };
      console.log('[ReceivedContracts] Query:', JSON.stringify(receivedQuery, null, 2));
      contracts = await Contract.find(receivedQuery);
      console.log('[ReceivedContracts] User:', req.user.email, 'Returned contracts:', contracts.map(c => ({ _id: c._id, title: c.title, originatorEmail: c.originator?.email, recipientEmail: c.recipient?.email, status: c.status }))); 
    } else {
      // If no user, return all contracts (for admin/testing)
      contracts = await Contract.find({});
    }
  console.log('[ReceivedContracts] Returning:', contracts);
    res.json({ contracts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch received contracts.' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const requesterEmail = req.user?.email?.toLowerCase();
    const originatorEmail = contract.originator?.email?.toLowerCase();
    const recipientEmail = contract.recipient?.email?.toLowerCase();
    if (!requesterEmail || (requesterEmail !== originatorEmail && requesterEmail !== recipientEmail)) {
      return res.status(403).json({ error: 'Not authorized to view this contract.' });
    }

    res.json({ contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contract.', details: err?.message || err });
  }
});

export default router;

// Sign a contract
// Sign contract (by recipient)
router.post('/sign', auth, async (req, res) => {
  try {
    const { contractId, selectedRole, signature } = req.body;
    console.log('[ContractSign] Incoming:', { contractId, selectedRole, signature, user: req.user });
    const contract = await Contract.findById(contractId);
    if (!contract) {
      console.log('[ContractSign] Contract not found:', contractId);
      return res.status(404).json({ error: 'Contract not found.' });
    }
    // Add originator or recipient signature
    const isOriginator = req.user.email === contract.originator.email;
    const isRecipient = req.user.email === contract.recipient.email;
    const signatureEntry = {
      name: req.user.name,
      email: req.user.email,
      uuid: req.user.uuid,
         role: selectedRole || (isOriginator ? 'originator' : 'recipient'), // Save selected role
      signature,
      date: new Date()
    };
    console.log('[ContractSign] Signature entry:', signatureEntry);
    // Prevent duplicate signatures
    if (contract.signatures.some(s => s.email === signatureEntry.email && s.role === signatureEntry.role)) {
      console.log('[ContractSign] Already signed:', signatureEntry);
      return res.status(400).json({ error: 'Already signed.' });
    }
    contract.signatures.push(signatureEntry);
    // Update role in contract if originator is signing
       if (isOriginator && selectedRole) {
         contract.originator.role = selectedRole; // Save selected role
         console.log('[ContractSign] Updated originator role:', selectedRole); // Log updated role
    }
    // Check if both originator and recipient have signed
    const hasOriginator = contract.signatures.some(s => s.email === contract.originator.email);
    const hasRecipient = contract.signatures.some(s => s.email === contract.recipient.email);
    if (hasOriginator && hasRecipient) {
      contract.status = 'signed';
    } else {
      contract.status = 'sent';
    }
    await contract.save();
    console.log('[ContractSign] Contract after save:', contract);
    res.json({ message: 'Contract signed.', contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sign contract.' });
  }
});

// Get signed contracts for the logged-in user
router.get('/signed', auth, async (req, res) => {
  try {
    let contracts;
    if (req.user && req.user.email) {
        const signedQuery = {
          status: 'signed',
          $or: [
            { 'originator.email': { $regex: new RegExp(`^${req.user.email}$`, 'i') } },
            { 'recipient.email': { $regex: new RegExp(`^${req.user.email}$`, 'i') } },
            { 'signatures.email': req.user.email }
          ]
        };
        console.log('[SignedContracts] Query:', JSON.stringify(signedQuery, null, 2));
        contracts = await Contract.find(signedQuery);
        console.log('[SignedContracts] User:', req.user.email, 'Returned contracts:', contracts.map(c => ({ _id: c._id, title: c.title, originatorEmail: c.originator?.email, recipientEmail: c.recipient?.email, status: c.status }))); 
    } else {
      // If no user, return all contracts (for admin/testing)
      contracts = await Contract.find({});
    }
    res.json({ contracts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch signed contracts.' });
  }
});
