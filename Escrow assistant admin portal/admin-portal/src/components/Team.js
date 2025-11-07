import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'support_agent' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/team')
      .then(res => setTeam(res.data.members || res.data))
      .catch(() => setError('Failed to fetch team members.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id, newRole) => {
    setUpdating(id);
    try {
      await api.put(`/team/${id}/role`, { role: newRole });
      setTeam(team => team.map(m => m._id === id ? { ...m, role: newRole } : m));
    } catch {
      setError('Failed to update role.');
    } finally {
      setUpdating('');
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await api.post('/admin/add-user', form);
      if (res.ok) {
        setMessage('User added successfully!');
        setForm({ name: '', email: '', password: '', role: 'support_agent' });
        setShowForm(false);
        // Optionally refresh team list
        api.get('/team')
          .then(res => setTeam(res.data.members || res.data))
          .catch(() => setError('Failed to fetch team members.'));
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to add user.');
      }
    } catch (err) {
      setMessage('Network error.');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <button
        onClick={() => window.history.back()}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 24,
          marginBottom: 16,
        }}
        title="Go Back"
      >
        ←
      </button>
      <h2>Team Management</h2>
      <button
        onClick={() => setShowForm(v => !v)}
        style={{ marginBottom: 20, padding: '8px 16px', fontSize: 16 }}
      >
        {showForm ? 'Cancel' : 'Add User'}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20, background: '#f9f9f9', padding: 20, borderRadius: 8, maxWidth: 400 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Name:<br />
              <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%' }} />
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Email:<br />
              <input name="email" type="email" value={form.email} onChange={handleChange} required style={{ width: '100%' }} />
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Password:<br />
              <input name="password" type="password" value={form.password} onChange={handleChange} required style={{ width: '100%' }} />
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Role:<br />
              <select name="role" value={form.role} onChange={handleChange} style={{ width: '100%' }}>
                <option value="admin">Admin</option>
                <option value="support_agent">Support Agent</option>
                <option value="mediator">Mediator</option>
              </select>
            </label>
          </div>
          <button type="submit" style={{ padding: '8px 16px', fontSize: 16 }}>Register User</button>
        </form>
      )}
      {message && <div style={{ color: message.includes('success') ? 'green' : 'red', marginBottom: 16 }}>{message}</div>}
      {loading && <p>Loading team members...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#f0f4fa' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Role</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Performance</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Workload</th>
            </tr>
          </thead>
          <tbody>
            {team.map(member => (
              <tr key={member._id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{member.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{member.email}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <select
                    value={member.role}
                    disabled={updating === member._id}
                    onChange={e => handleRoleChange(member._id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="support_agent">Support Agent</option>
                    <option value="mediator">Mediator</option>
                  </select>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {member.performance ? (
                    <span>
                      Tickets: {member.performance.ticketsHandled} | Avg. Response: {member.performance.avgResponseTime} min
                    </span>
                  ) : 'N/A'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {member.workload ? (
                    <span>
                      Tickets: {member.workload.tickets} | Disputes: {member.workload.disputes}
                    </span>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
