import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Update with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  userType: String,
  uuid: { type: String, unique: true }
});
const User = mongoose.model('User', userSchema);

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);
  const password = 'Emenike14@'; // Use your desired password
  const hash = await bcrypt.hash(password, 10);

  const admin = new User({
    name: 'Anekwe peter',
    email: 'anekwep35@gmail.com',
    password: hash, // Store the hashed password
    role: 'admin',
    userType: 'Admin',
    uuid: uuidv4()
  });

  await admin.save();
  console.log('Admin user created!');
  mongoose.disconnect();
}

createAdmin();
