import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { getSocket } from '../utils/socket';

const socket = getSocket();

export default function ChatUserList({ onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agentEmail, setAgentEmail] = useState(() => localStorage.getItem('agentEmail') || '');

  useEffect(() => {
    fetchSessions();
    if (!socket.connected) socket.connect();

    let email = agentEmail;
    if (!email) {
      email = prompt('Enter your agent email:');
      if (!email) return;
      setAgentEmail(email);
      localStorage.setItem('agentEmail', email);
    }

    socket.emit('joinAgentRoom', { agentEmail: email });
    socket.on('supportMessage', fetchSessions);
    socket.on('sessionAssigned', fetchSessions);
    socket.on('supportChatClosed', fetchSessions);

    return () => {
      socket.off('supportMessage', fetchSessions);
      socket.off('sessionAssigned', fetchSessions);
      socket.off('supportChatClosed', fetchSessions);
    };
    // eslint-disable-next-line
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions?status=open`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      setError('Failed to fetch sessions.');
    }
    setLoading(false);
  };

  const handleAssign = async (sessionId) => {
    let email = agentEmail;
    if (!email) {
      email = prompt('Enter your agent email:');
      if (!email) return;
      setAgentEmail(email);
      localStorage.setItem('agentEmail', email);
    }
    try {
      await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentEmail: email })
      });
      fetchSessions();
    } catch (err) {
      alert('Failed to assign agent.');
    }
  };

  return (
    <div style={{
      minWidth: 300,
      background: '#f8fafc',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <h3 style={{
        padding: '16px 20px',
        margin: 0,
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        fontSize: 18,
        fontWeight: 600,
        color: '#1e293b'
      }}>
        Chat Sessions
      </h3>
      {loading && <div style={{ padding: 20 }}>Loading sessions...</div>}
      {error && <div style={{ padding: 20, color: 'red' }}>{error}</div>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, overflowY: 'auto' }}>
        {sessions.map(session => {
          return (
            <li
              key={session._id}
              onClick={() => {
                if (!socket.connected) socket.connect();
                socket.emit('joinRoom', { sessionId: session._id, email: agentEmail });
                onSelectSession(session);
              }}
              style={{
                cursor: 'pointer',
                background: session.status === 'closed' ? '#f3f4f6' : '#fff',
                borderBottom: '1px solid #e5e7eb',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'background 0.2s',
                ...(session.status === 'closed' && { opacity: 0.6 })
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>
                {session.userEmail}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                Status: <b>{session.status.toUpperCase()}</b>
                {session.status === 'closed' && (
                  <span style={{ color: '#e57373', marginLeft: 8 }}>(Closed)</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {new Date(session.createdAt).toLocaleString()}
              </div>
              <div style={{ marginTop: 6 }}>
                {session.agentEmail ? (
                  <span style={{
                    fontSize: 12,
                    color: '#0369a1',
                    fontWeight: 600,
                    background: '#e0f2fe',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    Agent: {session.agentEmail}
                  </span>
                ) : (
                  <button
                    style={{
                      fontSize: 12,
                      background: '#0ea5e9',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '3px 8px',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => { e.stopPropagation(); handleAssign(session._id); }}
                  >
                    Assign Me
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}