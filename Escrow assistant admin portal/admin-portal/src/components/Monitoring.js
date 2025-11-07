import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function Monitoring() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    api.get('/monitoring/flagged')
      .then(res => setFlagged(res.data))
      .catch(() => setError('Failed to fetch flagged items.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      await api.post(`/monitoring/action`, { id, action });
      setFlagged(items => items.filter(item => item._id !== id));
    } catch {
      setError('Failed to perform action.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Monitoring & Safety</h2>
      {loading && <p>Loading flagged items...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#f0f4fa' }}>
              <th>Type</th>
              <th>Item</th>
              <th>Reason</th>
              <th>Reported By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flagged.map(item => (
              <tr key={item._id}>
                <td>{item.type}</td>
                <td>{item.summary}</td>
                <td>{item.reason}</td>
                <td>{item.reportedBy}</td>
                <td>
                  <button disabled={actionLoading === item._id} onClick={() => handleAction(item._id, 'approve')}>Approve</button>
                  <button disabled={actionLoading === item._id} onClick={() => handleAction(item._id, 'suspend')}>Suspend</button>
                  <button disabled={actionLoading === item._id} onClick={() => handleAction(item._id, 'freeze')}>Freeze</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
