import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';
import { API_BASE_URL } from '../config';
import api from '../utils/api';
import AgentTicketLoadChart from './AgentTicketLoadChart';
import DisputeResolutionTimeMetric from './DisputeResolutionTimeMetric';

function Analytics() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const [metricsRes, trendsRes, agentRes] = await Promise.all([
          api.get('/support/analytics/metrics'),
          api.get('/support/analytics/trends'),
          api.get('/support/analytics/agents'),
        ]);
        setStats(metricsRes.data);
        setTrends(trendsRes.data);
        setAgentPerf(agentRes.data);
      } catch {
        setError('Failed to fetch analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h2>Analytics</h2>
      {loading && <p>Loading analytics...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && stats && (
        <div style={{ marginTop: 24 }}>
          <h3>Key Metrics</h3>
          <p><strong>Average Response Time:</strong> {stats.avgResponseTimeMs ? (stats.avgResponseTimeMs / 60000).toFixed(2) + ' min' : 'N/A'}</p>
          <p><strong>Closed Sessions:</strong> {stats.closedSessions}</p>
          <p><strong>Open Tickets:</strong> {stats.openTickets}</p>
          <p><strong>Resolved Tickets:</strong> {stats.resolvedTickets}</p>

          <h3 style={{ marginTop: 32 }}>Ticket/Dispute/Resolution Trends (14 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tickets" stroke="#4B7BEC" name="Tickets" />
              <Line type="monotone" dataKey="disputes" stroke="#e57373" name="Disputes" />
              <Line type="monotone" dataKey="resolutions" stroke="#43a047" name="Resolutions" />
            </LineChart>
          </ResponsiveContainer>

          <h3 style={{ marginTop: 32 }}>Agent Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerf} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ticketsHandled" fill="#4B7BEC" name="Tickets Handled" />
              <Bar dataKey="avgResponseTime" fill="#43a047" name="Avg. Response Time (min)" />
            </BarChart>
          </ResponsiveContainer>

          {/* Export Chat Logs Button */}
          <div style={{ margin: '32px 0' }}>
            <a
              href={`${API_BASE_URL}/api/support/export/chat-logs`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#4B7BEC',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 'bold',
                marginBottom: 16
              }}
            >
              Export Chat Logs (CSV)
            </a>
          </div>

          {/* Export Chat Logs PDF Button */}
          <div style={{ margin: '16px 0' }}>
            <a
              href={`${API_BASE_URL}/api/support/export/chat-logs-pdf`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#43a047',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 'bold',
                marginBottom: 16
              }}
            >
              Export Chat Logs (PDF)
            </a>
          </div>

          {/* Per-Agent Ticket Load Chart */}
          <AgentTicketLoadChart />
          {/* Dispute Resolution Time Metric */}
          <DisputeResolutionTimeMetric />
        </div>
      )}
    </div>
  );
}

export default Analytics;
