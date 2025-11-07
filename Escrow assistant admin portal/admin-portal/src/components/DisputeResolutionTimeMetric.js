import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function DisputeResolutionTimeMetric() {
  const [avgDays, setAvgDays] = useState(null);
  useEffect(() => {
    api.get('/support/analytics/dispute-resolution-time').then(res => setAvgDays(res.data.avgDays));
  }, []);
  if (!avgDays || avgDays === 'N/A') return null;
  return (
    <div style={{ margin: '32px 0' }}>
      <h3>Average Dispute Resolution Time</h3>
      <p style={{ fontSize: 20, fontWeight: 'bold', color: '#4B7BEC' }}>{avgDays} days</p>
    </div>
  );
}
