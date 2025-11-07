
export default function EvidenceViewer({ evidence = [] }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h4>Evidence</h4>
      <ul>
        {evidence.map((item, idx) => (
          <li key={idx}>
            {item.type === 'file' ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>
            ) : (
              <span>{item.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
