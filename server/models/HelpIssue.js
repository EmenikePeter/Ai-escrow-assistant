import mongoose from 'mongoose';

const HelpIssueSchema = new mongoose.Schema({
  email: { type: String, required: true },
  category: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const HelpIssue = mongoose.model('HelpIssue', HelpIssueSchema);
export default HelpIssue;
