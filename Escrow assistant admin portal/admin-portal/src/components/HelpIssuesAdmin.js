
import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

export default function HelpIssuesAdmin() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyStatus, setReplyStatus] = useState({});

  useEffect(() => {
    fetchHelpIssues();
  }, []);

  const fetchHelpIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/help/issues`);
      setIssues(res.data);
    } catch (err) {
      setError('Failed to fetch help issues.');
    }
    setLoading(false);
  };

  const handleReplyChange = (id, value) => {
    setReplyText(prev => ({ ...prev, [id]: value }));
  };

  const handleSendReply = async (issue) => {
    setReplyStatus(prev => ({ ...prev, [issue._id]: 'Sending...' }));
    try {
      await axios.post(`${API_BASE_URL}/api/help/reply`, {
        email: issue.email,
        message: replyText[issue._id],
        issueId: issue._id,
      });
      setReplyStatus(prev => ({ ...prev, [issue._id]: 'Reply sent!' }));
      setReplyText(prev => ({ ...prev, [issue._id]: '' }));
      alert('Reply sent successfully!');
    } catch (err) {
      setReplyStatus(prev => ({ ...prev, [issue._id]: 'Failed to send reply.' }));
    }
  };

  return (
    <div>
      <h2>User Help Issues</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      <ul>
        {issues.map(issue => (
          <li key={issue._id} style={{marginBottom: '1em'}}>
            <strong>Email:</strong> {issue.email}<br/>
            <strong>Category:</strong> {issue.category}<br/>
            <strong>Message:</strong> {issue.message}<br/>
            <strong>Created:</strong> {new Date(issue.createdAt).toLocaleString()}<br/>
            <textarea
              placeholder="Type your reply..."
              value={replyText[issue._id] || ''}
              onChange={e => handleReplyChange(issue._id, e.target.value)}
              style={{width: '100%', minHeight: 40, marginTop: 8}}
            />
            <button onClick={() => handleSendReply(issue)} disabled={!replyText[issue._id] || replyStatus[issue._id]==='Sending...'}>
              {replyStatus[issue._id]==='Sending...' ? 'Sending...' : 'Send Reply'}
            </button>
            {replyStatus[issue._id] && <span style={{marginLeft: 8}}>{replyStatus[issue._id]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
