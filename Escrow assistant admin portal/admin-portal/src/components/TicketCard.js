
export default function TicketCard({ ticket, onClick }) {
  return (
    <div className="ticket-card" onClick={onClick} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12, cursor: 'pointer' }}>
      <h4>{ticket.subject}</h4>
      <p>Status: <b>{ticket.status}</b></p>
      <p>Assigned: {ticket.assignedTo?.name || 'Unassigned'}</p>
      <p>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
    </div>
  );
}
