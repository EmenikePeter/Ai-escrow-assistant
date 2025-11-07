
export default function ActionButtons({ actions = [] }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
      {actions.map((action, idx) => (
        <button key={idx} onClick={action.onClick} style={{ padding: '6px 16px' }}>
          {action.label}
        </button>
      ))}
    </div>
  );
}
