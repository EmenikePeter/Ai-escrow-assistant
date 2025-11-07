
import { useState } from 'react';

export default function TeamManagementScreen() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'support_agent' });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      // Replace URL with your backend endpoint
      const res = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage('User added successfully!');
        setForm({ name: '', email: '', password: '', role: 'support_agent' });
        setShowForm(false);
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
      {/* TODO: List staff, assign tickets, monitor logs, suspend/promote staff */}
    </div>
  );
}
