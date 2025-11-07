// Script to update existing contracts with client and freelancer name/email
// Usage: node scripts/add-user-info-to-contracts.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Contract from '../server/models/Contract.js';
import User from '../server/models/User.js';
dotenv.config();

async function updateContracts() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/escrow', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const contracts = await Contract.find({});
  for (const contract of contracts) {
    let clientInfo = null;
    let freelancerInfo = null;
    if (contract.client) {
      const client = await User.findById(contract.client);
      if (client) {
        clientInfo = {
          id: client._id,
          name: client.name || '',
          email: client.email || '',
        };
      }
    }
    if (contract.freelancer) {
      const freelancer = await User.findById(contract.freelancer);
      if (freelancer) {
        freelancerInfo = {
          id: freelancer._id,
          name: freelancer.name || '',
          email: freelancer.email || '',
        };
      }
    }
    contract.client = clientInfo || contract.client;
    contract.freelancer = freelancerInfo || contract.freelancer;
    await contract.save();
    console.log(`Updated contract ${contract._id}`);
  }
  mongoose.disconnect();
  console.log('All contracts updated.');
}

updateContracts().catch(err => {
  console.error('Error updating contracts:', err);
  mongoose.disconnect();
});
