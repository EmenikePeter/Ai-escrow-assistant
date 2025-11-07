import './Sidebar.css';

export default function Sidebar({ onSelect, links = [] }) {
  console.log('Sidebar received links:', links);
  return (
    <div className="sidebar">
      <h2>Admin Portal</h2>
      <ul>
        {links.length === 0 && <li style={{ color: 'red', fontWeight: 'bold' }}>No links to display</li>}
        {links.map(link => (
          <li key={link.key} onClick={() => onSelect(link.key)}>{link.label}</li>
        ))}
      </ul>
    </div>
  );
}
