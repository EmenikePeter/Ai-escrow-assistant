import { useEffect, useState } from 'react';
import api from '../utils/api';
import './Dashboard.css';

const DisputeRoom = ({ disputeId }) => {
  const [dispute, setDispute] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [newEvidence, setNewEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDispute = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/disputes/${disputeId}`);
        setDispute(res.data);
        setTimeline(res.data.timeline || []);
        setChat(res.data.chat || []);
        setEvidence(res.data.evidence || []);
      } catch (err) {
        setError('Failed to load dispute');
      } finally {
        setLoading(false);
      }
    };
    fetchDispute();
  }, [disputeId]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      await api.post(`/disputes/${disputeId}/chat`, { message });
      setChat([...chat, { sender: 'You', message, timestamp: new Date() }]);
      setMessage('');
    } catch {
      setError('Failed to send message');
    }
  };

  const handleEvidenceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/disputes/${disputeId}/evidence`, formData);
      setEvidence([...evidence, { name: file.name, url: 'Uploaded' }]);
      setNewEvidence(file); // Set the last uploaded file
    } catch {
      setError('Failed to upload evidence');
    }
  };

  // Settlement, resolution, mediator assignment actions would go here

  if (loading) return <div>Loading dispute...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="dashboard-container">
      <h2>Dispute Room</h2>
      <div>
        <strong>Status:</strong> {dispute.status}
      </div>
      <div>
        <h3>Timeline</h3>
        <ul>
          {timeline.map((event, idx) => (
            <li key={idx}>{event.timestamp}: {event.description}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Chat</h3>
        <div className="chat-box">
          {chat.map((msg, idx) => (
            <div key={idx}><strong>{msg.sender}:</strong> {msg.message} <span style={{fontSize:'0.8em'}}>{msg.timestamp}</span></div>
          ))}
        </div>
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div>
        <h3>Evidence</h3>
        <ul>
          {evidence.map((ev, idx) => (
            <li key={idx}><a href={ev.url} target="_blank" rel="noopener noreferrer">{ev.name}</a></li>
          ))}
        </ul>
        <input type="file" onChange={handleEvidenceUpload} />
        {/* Show last uploaded evidence file */}
        {newEvidence && (
          <div style={{ marginTop: 8, color: '#4B7BEC' }}>
            Last uploaded: {newEvidence.name}
          </div>
        )}
      </div>
      {/* Settlement, resolution, mediator assignment UI goes here */}
    </div>
  );
};

export default DisputeRoom;
