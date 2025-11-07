
export default function AnalyticsWidget({ title, value, children }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, minWidth: 180 }}>
      <h4>{title}</h4>
      <div style={{ fontSize: 28, fontWeight: 'bold', margin: '8px 0' }}>{value}</div>
      {children}
    </div>
  );
}
