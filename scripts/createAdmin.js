import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../server/models/User.js';
dotenv.config();

const email = 'anekwep35@gmail.com'; // Change as needed
const password = 'Emenike14@'; // Change as needed
const name = 'Admin User';
const role = 'admin';

async function createOrUpdateAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/escrow');
  let user = await User.findOne({ email });
  const hash = await bcrypt.hash(password, 10);
  if (user) {
    user.password = hash;
    user.name = name;
    user.role = role;
    await user.save();
    console.log('User password updated:', email);
  } else {
    user = new User({ email, password: hash, name, role });
    await user.save();
    console.log('Admin user created:', email);
  }
  process.exit(0);
}

createOrUpdateAdmin();
