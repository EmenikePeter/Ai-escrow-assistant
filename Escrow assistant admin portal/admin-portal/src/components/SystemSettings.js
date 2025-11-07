import { useEffect, useState } from 'react';
import api from '../utils/api';

const roles = ['Admin', 'Support', 'Mediator', 'Viewer'];

export default function SystemSettings() {
  const [permissions, setPermissions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const [permRes, policyRes, auditRes] = await Promise.all([
          api.get('/settings/permissions'),
          api.get('/settings/policies'),
          api.get('/settings/audit-logs'),
        ]);
        setPermissions(permRes.data);
        setPolicies(policyRes.data);
        setAuditLogs(auditRes.data);
      } catch {
        setError('Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h2>System Settings</h2>
      {loading && <p>Loading settings...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          <h3>Role/Permission Matrix</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f0f4fa' }}>
                <th>Role</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm, idx) => (
                <tr key={idx}>
                  <td>{perm.role}</td>
                  <td>{perm.permissions.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Policy Configuration</h3>
          <ul>
            {policies.map((policy, idx) => (
              <li key={idx}><strong>{policy.name}:</strong> {policy.value}</li>
            ))}
          </ul>
          <h3>Audit Logs</h3>
          <ul>
            {auditLogs.map((log, idx) => (
              <li key={idx}>{log.timestamp}: {log.action} by {log.user}</li>
            ))}
          </ul>
          <h3>Available Roles</h3>
          <ul>
            {roles.map((role, idx) => (
              <li key={idx}>{role}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
