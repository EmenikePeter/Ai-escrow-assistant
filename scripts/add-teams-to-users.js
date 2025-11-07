// Usage: node scripts/add-teams-to-users.js
// This script adds example teams to all users in the database.

import mongoose from 'mongoose';
import User from '../server/models/User.js';

const MONGO_URI = 'mongodb://localhost:27017/your-db-name'; // Change to your DB name

const teams = [
  { _id: new mongoose.Types.ObjectId(), name: 'Team Alpha' },
  { _id: new mongoose.Types.ObjectId(), name: 'Team Beta' }
];

async function addTeamsToUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find();
  for (const user of users) {
    user.teams = teams;
    await user.save();
    console.log(`Updated user: ${user.email}`);
  }
  await mongoose.disconnect();
  console.log('All users updated with teams.');
}

addTeamsToUsers().catch(console.error);
