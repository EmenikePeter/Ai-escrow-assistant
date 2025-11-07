import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../utils/api';

export default function AgentTicketLoadChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.get('/support/analytics/agent-ticket-load').then(res => setData(res.data));
  }, []);
  if (!data.length) return null;
  return (
    <div style={{ margin: '32px 0' }}>
      <h3>Per-Agent Ticket Load</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="open" fill="#e57373" name="Open Tickets" />
          <Bar dataKey="resolved" fill="#43a047" name="Resolved Tickets" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
