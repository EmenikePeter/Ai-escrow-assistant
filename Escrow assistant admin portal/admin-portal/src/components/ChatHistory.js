import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

export default function ChatHistory({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/history/agent/${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(setSessions)
      .catch(() => setError('Failed to fetch chat history.'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Past Chat Sessions</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && sessions.length === 0 && <div>No past chat sessions found.</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sessions.map((s, idx) => (
          <li key={s.session?._id || idx} style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fafbfc', cursor: 'pointer' }} onClick={() => setSelectedSession(s)}>
            <div><b>Session ID:</b> {s.session?._id}</div>
            <div><b>User:</b> {s.session?.userEmail}</div>
            <div><b>Closed:</b> {s.session?.updatedAt ? new Date(s.session.updatedAt).toLocaleString() : ''}</div>
            <div><b>Messages:</b> {s.messages?.length || 0}</div>
          </li>
        ))}
      </ul>
      {selectedSession && (
        <div style={{ marginTop: 32, border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fff' }}>
          <button onClick={() => setSelectedSession(null)} style={{ marginBottom: 12 }}>Back to list</button>
          <h3>Session Details</h3>
          <div><b>Session ID:</b> {selectedSession.session?._id}</div>
          <div><b>User:</b> {selectedSession.session?.userEmail}</div>
          <div><b>Agent:</b> {selectedSession.session?.agentEmail}</div>
          <div><b>Closed:</b> {selectedSession.session?.updatedAt ? new Date(selectedSession.session.updatedAt).toLocaleString() : ''}</div>
          <h4 style={{ marginTop: 16 }}>Messages</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {selectedSession.messages.map((msg, i) => (
              <li key={msg._id || i} style={{ marginBottom: 10, padding: 8, borderRadius: 6, background: msg.sender === 'user' ? '#e3f2fd' : '#fce4ec' }}>
                <div><b>{msg.sender === 'user' ? 'User' : 'Agent'}:</b> {msg.text}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{msg.time ? new Date(msg.time).toLocaleString() : ''}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
