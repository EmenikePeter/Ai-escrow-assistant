import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

export default function Tickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  const [assignAgent, setAssignAgent] = useState({});
  const [replyText, setReplyText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  const fetchAgents = useCallback(() => {
    api.get('/support/team')
      .then(res => setAgents(res.data))
      .catch(() => setAgents([]));
  }, []);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    if (user && user.role === 'support_agent') {
      if (user._id) {
        api.get(`/support/tickets/assigned/${user._id}`)
          .then(res => setTickets(res.data))
          .catch(() => setError('Failed to fetch tickets.'))
          .finally(() => setLoading(false));
      } else {
        setError('Agent ID is missing.');
        setLoading(false);
      }
    } else {
      api.get('/support/tickets')
        .then(res => setTickets(res.data))
        .catch(() => setError('Failed to fetch tickets.'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    fetchAgents();
    fetchTickets();
  }, [fetchAgents, fetchTickets]);

  const handleAssign = async (ticketId) => {
    const agentId = assignAgent[ticketId];
    if (!agentId) {
      setError('Please select an agent before assigning.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      await api.post(`/support/tickets/${ticketId}/assign`, { agentId });
      setAssignAgent(a => ({ ...a, [ticketId]: '' }));
      fetchTickets();
    } catch (err) {
      setError('Failed to assign agent.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    await api.put(`/support/tickets/${ticketId}`, { status });
    setStatusUpdate('');
    fetchTickets();
  };

  const handleReply = async (ticketId) => {
    if (!replyText) return;
    await api.post(`/support/tickets/${ticketId}/reply`, { text: replyText });
    setReplyText('');
    fetchTickets();
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Ticket Management</h2>
      {loading && <p>Loading tickets...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#f0f4fa' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Subject</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>User</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Assigned To</th>
              {user && (user.role === 'admin' || user.role === 'super_admin') && <th>Assign</th>}
              <th>Status</th>
              <th>Reply</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket._id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.subject}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.status}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.userId?.email || 'N/A'}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.assignedTo?.email || 'Unassigned'}</td>
                {user && (user.role === 'admin' || user.role === 'super_admin') && (
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <select
                      value={assignAgent[ticket._id] || ''}
                      onChange={e => setAssignAgent(a => ({ ...a, [ticket._id]: e.target.value }))}
                    >
                      <option value=''>Select agent</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent._id}>{agent.name} ({agent.email})</option>
                      ))}
                    </select>
                    <button onClick={() => handleAssign(ticket._id)} disabled={!assignAgent[ticket._id]}>Assign</button>
                  </td>
                )}
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
                    <option value="">Update Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button onClick={() => handleStatusUpdate(ticket._id, statusUpdate)}>Update</button>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <input
                    type="text"
                    placeholder="Type reply"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  <button onClick={() => handleReply(ticket._id)}>Reply</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
