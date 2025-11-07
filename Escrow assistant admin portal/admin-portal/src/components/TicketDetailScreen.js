
export default function TicketDetailScreen({ ticket }) {
  return (
    <div style={{ display: 'flex', padding: 32 }}>
      {/* Left panel: Ticket info */}
      <div style={{ width: 250, marginRight: 24 }}>
        <h3>Ticket Info</h3>
        {/* TODO: Subject, user, type, status */}
      </div>
      {/* Center panel: Chat history */}
      <div style={{ flex: 1, marginRight: 24 }}>
        <h3>Chat History</h3>
        {/* TODO: Chat thread */}
      </div>
      {/* Right panel: Actions */}
      <div style={{ width: 250 }}>
        <h3>Actions</h3>
        {/* TODO: Assign, change status, escalate, close */}
        <h4>Attachments</h4>
        {/* TODO: Uploaded files/evidence */}
      </div>
    </div>
  );
}
