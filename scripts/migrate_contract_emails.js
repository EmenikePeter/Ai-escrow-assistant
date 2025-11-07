// Migration script to clean up legacy recipientEmail and originatorEmail fields
// Run with: node scripts/migrate_contract_emails.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Contract from '../server/models/Contract.js';
dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/escrow', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  const contracts = await Contract.find({ $or: [
    { recipientEmail: { $exists: true } },
    { originatorEmail: { $exists: true } }
  ] });
  console.log(`Found ${contracts.length} contracts to migrate.`);

  for (const contract of contracts) {
    let updated = false;
    // Migrate recipientEmail to recipient.email
    if (contract.recipientEmail) {
      if (!contract.recipient) contract.recipient = {};
      contract.recipient.email = contract.recipientEmail;
      delete contract.recipientEmail;
      updated = true;
    }
    // Migrate originatorEmail to originator.email
    if (contract.originatorEmail) {
      if (!contract.originator) contract.originator = {};
      contract.originator.email = contract.originatorEmail;
      delete contract.originatorEmail;
      updated = true;
    }
    if (updated) {
      await contract.save();
      console.log(`Migrated contract _id=${contract._id}`);
    }
  }
  console.log('Migration complete.');
  mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  mongoose.disconnect();
});
