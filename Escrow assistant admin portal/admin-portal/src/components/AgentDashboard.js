import { useEffect, useState } from 'react';
import api from '../utils/api';
import ActionButtons from './ActionButtons';
import ChatThread from './ChatThread';
import EvidenceViewer from './EvidenceViewer';
import TicketCard from './TicketCard';

export default function AgentDashboard({ user }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    api.get('/support/tickets')
      .then(res => setTickets(res.data.filter(t => t.assignedTo?.email === user.email)))
      .catch(() => setTickets([]));
  }, [user.email]);

  // Removed unused messages state

  return (
    <div style={{ padding: 32 }}>
      <h2>Welcome, {user.name} (Support Agent)</h2>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        {/* ...analytics widgets, etc... */}
      </div>
      <h3>Your Tickets</h3>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          {tickets.map(ticket => (
            <div key={ticket._id} onClick={() => setSelectedTicket(ticket)} style={{ cursor: 'pointer' }}>
              <TicketCard ticket={ticket} selected={selectedTicket && selectedTicket._id === ticket._id} />
            </div>
          ))}
        </div>
        <div style={{ flex: 2, marginLeft: 32 }}>
          {selectedTicket ? (
            <>
              <h4>Ticket Details</h4>
              <EvidenceViewer evidence={selectedTicket.evidence} />
              <ChatThread ticketId={selectedTicket._id} />
              <ActionButtons actions={[
                { label: 'Reply', onClick: () => alert('Reply') },
                { label: 'Close', onClick: () => alert('Close') },
                { label: 'Escalate', onClick: () => alert('Escalate') }
              ]} />
            </>
          ) : (
            <div>Select a ticket to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
