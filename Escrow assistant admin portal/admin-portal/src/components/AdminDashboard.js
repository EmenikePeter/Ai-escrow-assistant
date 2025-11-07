
import { useEffect, useState } from 'react';
import api from '../utils/api';
import AnalyticsWidget from './AnalyticsWidget';
import SearchBar from './SearchBar';
import StaffLeaderboard from './StaffLeaderboard';
import TicketCard from './TicketCard';

export default function AdminDashboard({ user }) {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/support/tickets').then(res => {
      setTickets(res.data);
      setOpenCount(res.data.filter(t => t.status === 'open').length);
      setResolvedCount(res.data.filter(t => t.status === 'resolved').length);
    });
    api.get('/support/team').then(res => setStaff(res.data));
  }, []);

  // Filter tickets by search
  const filteredTickets = tickets.filter(ticket => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      ticket.subject?.toLowerCase().includes(s) ||
      ticket.status?.toLowerCase().includes(s) ||
      ticket.assignedTo?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ padding: 32 }}>
      <h2>Welcome, {user.name} (Admin)</h2>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <AnalyticsWidget title="Open Tickets" value={openCount} />
        <AnalyticsWidget title="Resolved Tickets" value={resolvedCount} />
      </div>
      <StaffLeaderboard staff={staff} />
      <h3>All Tickets Overview</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search tickets..." />
      {filteredTickets.map(ticket => (
        <TicketCard key={ticket._id} ticket={ticket} />
      ))}
    </div>
  );
}
