
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const email = 'anekwep35@gmail.com';
const password = 'Emenike14@'; // Replace with your desired password
const name = 'Admin User';

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    role: 'admin'
  });

  await user.save();
  console.log('Admin user created!');
  await mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});