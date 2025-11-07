
export default function StaffLeaderboard({ staff = [] }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h4>Top Performing Staff</h4>
      <ol>
        {staff.map((member, idx) => (
          <li key={member._id || idx}>
            {member.name} — {member.resolvedCount} resolved
          </li>
        ))}
      </ol>
    </div>
  );
}
