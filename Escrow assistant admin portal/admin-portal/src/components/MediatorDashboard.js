
export default function MediatorDashboard({ user }) {
  return (
    <div style={{ padding: 32 }}>
      <h2>Welcome, {user.name} (Mediator)</h2>
      <h3>Disputes Pending Review</h3>
      {/* TODO: List dispute tickets */}
      <h3>Evidence Viewer</h3>
      {/* TODO: Show files, chats, contract links */}
      <h3>Decision Panel</h3>
      {/* TODO: Release funds, refund, split, escalate */}
    </div>
  );
}
