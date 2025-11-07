import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['support_agent', 'mediator', 'admin', 'super_admin', 'user'],
    default: 'user',
  },
  userType: String,
  uuid: { type: String, unique: true },
  phone: String,
  country: String,
  stateProvince: String,
  address: String,
  paymentMethod: String,
  dob: String,
  skills: String,
  business: String,
  teams: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      name: String
    }
  ],
  pushToken: { type: String }, // Expo push notification token
});

const User = mongoose.model('User', userSchema);
export default User;
